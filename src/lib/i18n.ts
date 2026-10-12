"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Dict } from "./i18n/dict-type";

/**
 * Bilingual (fa/en) infrastructure for the whole site.
 * - Language is persisted in localStorage ("imsoroush-lang"), default fa (RTL).
 * - Server snapshot is always "fa" so SSR/hydration never mismatch; after
 *   mount React re-renders with the stored choice (documented
 *   useSyncExternalStore pattern — same as the codebase's other stores).
 * - document.documentElement lang/dir is kept in sync (pre-hydration flash
 *   is prevented by the inline script in app/layout.tsx).
 */

export type Lang = "fa" | "en";

const LANG_KEY = "imsoroush-lang";

let clientLang: Lang | null = null;
const langListeners = new Set<() => void>();

function detectLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === "en" || v === "fa") return v;
  } catch {
    // private mode etc.
  }
  return "fa";
}

export function getLang(): Lang {
  if (typeof window === "undefined") return "fa";
  if (clientLang === null) clientLang = detectLang();
  return clientLang;
}

export function applyDocumentLang(lang: Lang) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang === "fa" ? "fa" : "en";
  document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
}

export function setLang(next: Lang) {
  clientLang = next;
  try {
    localStorage.setItem(LANG_KEY, next);
  } catch {
    // ignore
  }
  applyDocumentLang(next);
  langListeners.forEach((fn) => fn());
  // window-level signal for non-React listeners after the dir flip
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("imsoroush-lang-changed"));
  }
}

export function toggleLang() {
  setLang(getLang() === "fa" ? "en" : "fa");
}

function subscribeLang(onChange: () => void) {
  langListeners.add(onChange);
  return () => {
    langListeners.delete(onChange);
  };
}

const SERVER_LANG: Lang = "fa";
function getServerLang(): Lang {
  return SERVER_LANG;
}

/** Reactive language for components. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, getLang, getServerLang);
}

/* ------------------------------------------------------------------ */
/* Dictionaries                                                        */
/* ------------------------------------------------------------------ */

import { coreDict } from "./i18n/dicts/core";
import { homeDict } from "./i18n/dicts/home";
import { projectsDict } from "./i18n/dicts/projects";
import { articlesDict } from "./i18n/dicts/articles";
import { contactDict } from "./i18n/dicts/contact";
import { adminDict } from "./i18n/dicts/admin";
import { miscDict } from "./i18n/dicts/misc";

export const DICTS: Record<string, Dict> = {
  core: coreDict,
  home: homeDict,
  projects: projectsDict,
  articles: articlesDict,
  contact: contactDict,
  admin: adminDict,
  misc: miscDict,
};

export type TranslateFn = (
  ns: string,
  key: string,
  vars?: Record<string, string | number>
) => string;

export function translate(
  lang: Lang,
  ns: string,
  key: string,
  vars?: Record<string, string | number>
): string {
  const d = DICTS[ns];
  let s: string | undefined;
  if (d) {
    s = d[lang]?.[key] ?? d.fa[key];
  }
  if (s === undefined) return key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}

/* ------------------------------------------------------------------ */
/* Component-facing hook                                               */
/* ------------------------------------------------------------------ */

export type LocaleHelpers = {
  lang: Lang;
  isRtl: boolean;
  dir: "rtl" | "ltr";
  t: TranslateFn;
  /** Locale-aware number formatting (fa-IR digits vs Latin). */
  num: (n: number, opts?: Intl.NumberFormatOptions) => string;
  /** Locale-aware date formatting from an ISO string. */
  date: (iso: string, opts?: Intl.DateTimeFormatOptions) => string;
};

export function useT(): LocaleHelpers {
  const lang = useLang();
  return useMemo<LocaleHelpers>(() => {
    const locale = lang === "fa" ? "fa-IR" : "en-US";
    return {
      lang,
      isRtl: lang === "fa",
      dir: lang === "fa" ? "rtl" : "ltr",
      t: (ns, key, vars) => translate(lang, ns, key, vars),
      num: (n, opts) => n.toLocaleString(locale, opts),
      date: (iso, opts) => new Date(iso).toLocaleDateString(locale, opts),
    };
  }, [lang]);
}

/** Relative "x minutes ago" style text, locale-aware (used by reader/history). */
export function relativeTime(iso: string, lang: Lang): string {
  const rtf = new Intl.RelativeTimeFormat(lang === "fa" ? "fa" : "en", {
    numeric: "auto",
  });
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (Math.abs(minutes) < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(-days, "day");
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return rtf.format(-months, "month");
  return rtf.format(-Math.round(months / 12), "year");
}

/** Pick the localized variant of a data field with fa fallback. */
export function pickEn(lang: Lang, en: string | null | undefined, fa: string): string {
  return lang === "en" && en ? en : fa;
}

// re-export for convenience
export type { Dict };
