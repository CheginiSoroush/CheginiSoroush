"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { Rocket, PenLine, Target, Eye } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { SiteStats } from "@/lib/types";

function useTypewriter(words: string[]) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIndex % words.length] ?? "";
    let delay = deleting ? 40 : 90;

    if (!deleting && text === word) {
      delay = 1800;
    } else if (deleting && text === "") {
      delay = 350;
    }

    const timer = setTimeout(() => {
      if (!deleting && text === word) {
        setDeleting(true);
      } else if (deleting && text === "") {
        setDeleting(false);
        setWordIndex((i) => (i + 1) % words.length);
      } else {
        setText(word.slice(0, text.length + (deleting ? -1 : 1)));
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [text, deleting, wordIndex, words]);

  return text;
}

function Counter({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return <span ref={ref}>{format(display)}</span>;
}

export function Hero({ stats, onExplore }: { stats: SiteStats | null; onExplore: () => void }) {
  const { t, num } = useT();
  const roles = useMemo(
    () => [0, 1, 2, 3].map((i) => t("core", `hero.role.${i}`)),
    [t]
  );
  const typed = useTypewriter(roles);

  const statItems = [
    { value: stats?.projects ?? 0, label: t("core", "hero.stats.projects"), icon: Rocket },
    { value: stats?.articles ?? 0, label: t("core", "hero.stats.articles"), icon: PenLine },
    { value: 4, label: t("core", "hero.stats.domains"), icon: Target },
    { value: stats?.visits ?? 0, label: t("core", "hero.stats.visits"), icon: Eye },
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid absolute inset-0" aria-hidden />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-16 sm:pt-36 sm:pb-20 text-center">
        {/* Logo — stays in the hero; the header shows its own quiet copy once this scrolls out of view */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center mb-8"
        >
          <div className="relative float-y" id="hero-logo-anchor">
            <div
              className="absolute inset-0 blur-2xl opacity-40"
              style={{ background: "var(--brand)" }}
              aria-hidden
            />
            <div className="conic-ring" aria-hidden />
            <Image
              src="/photos/logo_dark.png"
              alt={t("core", "hero.logoAlt")}
              width={280}
              height={100}
              priority
              className="relative dark:block hidden w-56 sm:w-72 h-auto select-none drop-shadow-2xl"
              draggable={false}
            />
            <Image
              src="/photos/logo_light.png"
              alt={t("core", "hero.logoAlt")}
              width={280}
              height={100}
              priority
              className="relative dark:hidden w-56 sm:w-72 h-auto select-none drop-shadow-xl"
              draggable={false}
            />
          </div>
        </motion.div>

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-5xl sm:text-7xl font-black tracking-tight mb-4"
        >
          <span className="brand-gradient-text">{t("core", "hero.name.first")}</span>{" "}
          {t("core", "hero.name.last")}
        </motion.h1>

        {/* Typing role */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg sm:text-2xl font-medium text-muted-foreground h-9 sm:h-10 typing-caret"
          aria-live="polite"
        >
          {typed}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42 }}
          className="mt-5 max-w-2xl mx-auto text-muted-foreground leading-8 text-sm sm:text-base"
        >
          {t("core", "hero.desc")}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {/* Real anchor — smooth-scrolls natively even before hydration */}
          <a
            href="#home-content"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              onExplore();
            }}
            className="px-7 py-3 rounded-2xl bg-brand text-primary-foreground font-bold text-sm sm:text-base shadow-[0_10px_30px_-10px_var(--brand-glow)] hover:shadow-[0_14px_38px_-10px_var(--brand-glow)] hover:-translate-y-0.5 active:scale-95 transition-all min-h-[46px] inline-flex items-center"
          >
            {t("core", "hero.cta.projects")}
          </a>
          <a
            href="https://github.com/CheginiSoroush"
            target="_blank"
            rel="noopener noreferrer"
            className="px-7 py-3 rounded-2xl border border-border bg-card/60 font-bold text-sm sm:text-base hover:border-brand/50 hover:text-brand hover:-translate-y-0.5 active:scale-95 transition-all min-h-[46px] inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            {t("core", "hero.cta.github")}
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto"
        >
          {statItems.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card/70 backdrop-blur px-4 py-5 hover:border-brand/40 transition-colors"
            >
              <s.icon className="w-5 h-5 text-brand mx-auto mb-2" aria-hidden />
              <div className="text-2xl sm:text-3xl font-black text-brand tabular-nums">
                <Counter value={s.value} format={num} />
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll hint — anchor-based, works pre-hydration */}
        <motion.a
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          href="#home-content"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            onExplore();
          }}
          aria-label={t("core", "aria.scrollToExplore")}
          className="mt-14 mx-auto flex flex-col items-center gap-1 text-muted-foreground bounce-soft"
        >
          <span className="text-[11px] tracking-wide">{t("core", "hero.scroll")}</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.a>
      </div>
    </section>
  );
}
