"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Search } from "lucide-react";
import { motion } from "framer-motion";
import type { ViewName } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { id: ViewName; label: string; icon: string }[] = [
  { id: "home", label: "خانه", icon: "🏠" },
  { id: "projects", label: "پروژه‌ها", icon: "💻" },
  { id: "writing", label: "نوشته‌ها", icon: "✍️" },
  { id: "contact", label: "تماس", icon: "📮" },
];

export function SiteHeader({
  view,
  onNavigate,
}: {
  view: ViewName;
  onNavigate: (v: ViewName) => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <button
          onClick={() => {
            onNavigate("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2.5 group min-w-0"
          aria-label="بازگشت به خانه"
        >
          <div className="w-9 h-9 rounded-xl bg-brand/15 border border-brand/30 grid place-items-center text-lg group-hover:scale-110 transition-transform shrink-0">
            <span aria-hidden>⚡</span>
          </div>
          <span className="font-extrabold text-lg group-hover:text-brand transition-colors truncate hidden min-[420px]:inline">
            سروش
          </span>
        </button>

        {/* Nav */}
        <nav aria-label="ناوبری اصلی" className="flex items-center gap-1 sm:gap-1.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={view === item.id ? "page" : undefined}
              className={cn(
                "relative px-2.5 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[36px]",
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
              <span className="relative z-10 whitespace-nowrap">
                <span className="hidden md:inline" aria-hidden>
                  {item.icon}{" "}
                </span>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Command palette trigger */}
        <button
          onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
          aria-label="جستجوی سراسری (Ctrl+K)"
          title="جستجوی سراسری (Ctrl+K)"
          className="palette-trigger hidden sm:inline-flex items-center gap-2 text-xs text-muted-foreground rounded-xl border border-border bg-card/60 pl-2 pr-3 py-2 hover:text-brand hover:border-brand/50 transition-all min-h-[38px]"
        >
          <Search className="w-3.5 h-3.5" />
          <span>جستجو...</span>
          <kbd className="kbd text-[10px]" dir="ltr">
            Ctrl K
          </kbd>
        </button>
        <button
          onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
          aria-label="جستجوی سراسری (Ctrl+K)"
          title="جستجوی سراسری (Ctrl+K)"
          className="sm:hidden w-10 h-10 rounded-full border border-border grid place-items-center text-muted-foreground hover:text-brand hover:border-brand/50 transition-all shrink-0"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>

        {/* Theme toggle — icons swap purely via CSS so SSR and client always match */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="تغییر تم روشن/تاریک"
          suppressHydrationWarning
          className="w-10 h-10 rounded-full border border-border grid place-items-center text-muted-foreground hover:text-brand hover:border-brand/50 hover:scale-105 transition-all shrink-0"
        >
          <Sun className="w-[18px] h-[18px] hidden dark:block" />
          <Moon className="w-[18px] h-[18px] dark:hidden" />
        </button>
      </div>
    </motion.header>
  );
}
