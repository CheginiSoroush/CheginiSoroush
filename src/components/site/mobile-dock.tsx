"use client";

import { motion } from "framer-motion";
import type { ViewName } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { NAV_ITEMS } from "./site-header";

/**
 * MobileDock — floating bottom navigation for small screens.
 * The top header stays minimal (brand + actions); primary navigation
 * lives here, thumb-reachable, glassy, with an animated active pill.
 */
export function MobileDock({
  view,
  onNavigate,
}: {
  view: ViewName;
  onNavigate: (v: ViewName) => void;
}) {
  const { t } = useT();

  return (
    <motion.nav
      aria-label={t("core", "aria.mainNav")}
      initial={{ y: 96, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 px-3 pointer-events-none"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.875rem)" }}
    >
      <div className="pointer-events-auto mx-auto max-w-sm rounded-2xl border border-border/70 bg-card/85 backdrop-blur-xl shadow-[0_18px_50px_-16px_rgba(0,0,0,0.65)]">
        <div className="grid grid-cols-4 gap-1 p-1.5">
          {NAV_ITEMS.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 rounded-xl py-2 min-h-[52px] transition-colors",
                  active ? "text-brand" : "text-muted-foreground active:bg-secondary"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="dock-pill"
                    className="absolute inset-0 rounded-xl bg-brand/10 border border-brand/20"
                    transition={{ type: "spring", bounce: 0.22, duration: 0.5 }}
                  />
                )}
                <item.icon className="relative z-10 w-5 h-5" aria-hidden />
                <span className="relative z-10 text-[10px] font-bold leading-none">
                  {t("core", item.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
