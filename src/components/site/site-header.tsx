"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Moon, Sun, Search, Home, FolderGit2, PenLine, Mail } from "lucide-react";
import { motion } from "framer-motion";
import type { ViewName } from "@/lib/types";
import { cn } from "@/lib/utils";
import { setLang, useLang, useT } from "@/lib/i18n";

export const NAV_ITEMS: { id: ViewName; labelKey: string; icon: typeof Home }[] = [
  { id: "home", labelKey: "nav.home", icon: Home },
  { id: "projects", labelKey: "nav.projects", icon: FolderGit2 },
  { id: "writing", labelKey: "nav.writing", icon: PenLine },
  { id: "contact", labelKey: "nav.contact", icon: Mail },
];

/**
 * Tracks the hero logo (#hero-logo-anchor): the header brand logo is only
 * shown once the hero logo has fully scrolled out of sight (or when there
 * is no hero at all — non-home views). No flying/morphing; a quiet fade.
 */
function useHeroLogoHidden(view: ViewName) {
  const [hidden, setHidden] = useState(view !== "home");

  useEffect(() => {
    let raf = 0;
    const evaluate = () => {
      raf = 0;
      const hero = document.getElementById("hero-logo-anchor");
      if (!hero) {
        // Hero not mounted yet (view transition) → nothing visible → show brand logo
        setHidden(true);
        return;
      }
      const rect = hero.getBoundingClientRect();
      setHidden(rect.height === 0 || rect.bottom <= 68);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(evaluate);
    };
    const onScroll = () => schedule();

    // Deferred first measurement (rAF callback, not a sync setState in the effect body)
    schedule();
    // The hero remounts after the AnimatePresence view transition — re-check
    const retries = [180, 400, 750, 1200].map((d) => window.setTimeout(schedule, d));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      retries.forEach((id) => window.clearTimeout(id));
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [view]);

  return hidden;
}

export function SiteHeader({
  view,
  onNavigate,
}: {
  view: ViewName;
  onNavigate: (v: ViewName) => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const { t } = useT();
  const lang = useLang();
  const heroLogoHidden = useHeroLogoHidden(view);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keyboard shortcut (T) dispatched from SiteShell
  useEffect(() => {
    const onToggle = () => setTheme(resolvedTheme === "light" ? "dark" : "light");
    window.addEventListener("toggle-site-theme", onToggle);
    return () => window.removeEventListener("toggle-site-theme", onToggle);
  }, [resolvedTheme, setTheme]);

  const isDark = resolvedTheme !== "light";

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "backdrop-blur-xl border-b border-border bg-background/80 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.4)]"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand — logo only, no text; appears quietly once the hero logo is out of view */}
        <button
          onClick={() => {
            onNavigate("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label={t("core", "aria.backHome")}
          aria-hidden={!heroLogoHidden}
          tabIndex={heroLogoHidden ? 0 : -1}
          className={cn(
            "flex items-center transition-all duration-300 ease-out",
            heroLogoHidden
              ? "w-10 h-10 opacity-100"
              : "w-0 h-10 opacity-0 pointer-events-none overflow-hidden"
          )}
        >
          <span
            id="header-logo-slot"
            aria-hidden
            className="relative w-10 h-10 shrink-0 grid place-items-center overflow-visible"
          >
            <span className="absolute inset-0 blur-lg opacity-40 rounded-full bg-brand" />
            <Image
              src="/photos/logo_dark.png"
              alt=""
              width={44}
              height={50}
              className="relative w-full h-full object-contain dark:block hidden select-none drop-shadow-md"
              draggable={false}
            />
            <Image
              src="/photos/logo_light.png"
              alt=""
              width={44}
              height={50}
              className="relative w-full h-full object-contain dark:hidden select-none drop-shadow-sm"
              draggable={false}
            />
          </span>
        </button>

        {/* Desktop nav */}
        <nav
          aria-label={t("core", "aria.mainNav")}
          className="hidden sm:flex items-center gap-1.5"
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={view === item.id ? "page" : undefined}
              className={cn(
                "relative px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[36px] inline-flex",
                view === item.id
                  ? "text-brand"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {view === item.id && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-brand/10 border border-brand/25"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 whitespace-nowrap inline-flex items-center gap-1.5">
                <item.icon className="w-4 h-4" aria-hidden />
                <span>{t("core", item.labelKey)}</span>
              </span>
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Command palette trigger */}
          <button
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            aria-label={t("core", "aria.search")}
            title={t("core", "aria.search")}
            className="palette-trigger hidden sm:inline-flex items-center gap-2 text-xs text-muted-foreground rounded-xl border border-border bg-card/60 ps-2 pe-3 py-2 hover:text-brand hover:border-brand/50 transition-all min-h-[38px]"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{t("core", "aria.searchShort")}</span>
            <kbd className="kbd text-[10px]" dir="ltr">
              Ctrl K
            </kbd>
          </button>
          <button
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            aria-label={t("core", "aria.search")}
            title={t("core", "aria.search")}
            className="sm:hidden w-10 h-10 rounded-full border border-border/80 bg-background/40 grid place-items-center text-muted-foreground hover:text-brand hover:border-brand/50 transition-all shrink-0"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          {/* Language toggle — shows the language you can switch TO */}
          <button
            onClick={() => setLang(lang === "fa" ? "en" : "fa")}
            aria-label={t("core", "aria.langToggle")}
            title={t("core", "aria.langToggle")}
            className="w-10 h-10 rounded-full border border-border/80 bg-background/40 grid place-items-center text-muted-foreground hover:text-brand hover:border-brand/50 hover:scale-105 active:scale-95 transition-all shrink-0 font-extrabold text-[11px] tracking-wide"
          >
            {lang === "fa" ? "EN" : "فا"}
          </button>

          {/* Theme toggle — icons swap purely via CSS so SSR and client always match */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={t("core", "aria.themeToggle")}
            suppressHydrationWarning
            className="w-10 h-10 rounded-full border border-border/80 bg-background/40 grid place-items-center text-muted-foreground hover:text-brand hover:border-brand/50 hover:scale-105 transition-all shrink-0"
          >
            <Sun className="w-[18px] h-[18px] hidden dark:block" />
            <Moon className="w-[18px] h-[18px] dark:hidden" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
