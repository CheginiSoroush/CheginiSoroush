"use client";

import type { ViewName } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { NAV_ITEMS } from "./site-header";

/**
 * MobileDock — floating bottom navigation for small screens.
 *
 * IMPORTANT: visibility is CSS-only. No JS-gated opacity/transform — the dock
 * is rendered in its final position from the first paint (SSR HTML), with a
 * pure-CSS entrance animation (animation-fill-mode: backwards). On slow real
 * devices it never depends on hydration timing.
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
    <nav
      aria-label={t("core", "aria.dockNav")}
      className="sm:hidden fixed bottom-0 inset-x-0 z-50 px-3 pointer-events-none dock-in modal-hide"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.875rem)" }}
    >
      <div className="pointer-events-auto mx-auto max-w-sm rounded-2xl border border-border/70 bg-card/85 backdrop-blur-xl shadow-[0_18px_50px_-16px_rgba(0,0,0,0.65)]">
        <div className="grid grid-cols-5 gap-0.5 p-1.5">
          {NAV_ITEMS.map((item, i) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={active ? "page" : undefined}
                style={{ animationDelay: `${0.25 + i * 0.06}s` }}
                className={cn(
                  "dock-item-in relative flex flex-col items-center justify-center gap-1 rounded-xl py-2 min-h-[52px] transition-colors",
                  active
                    ? "text-brand bg-brand/10 border border-brand/20"
                    : "text-muted-foreground border border-transparent active:bg-secondary"
                )}
              >
                <item.icon className="relative z-10 w-5 h-5" aria-hidden />
                <span className="relative z-10 text-[10px] font-bold leading-none">
                  {t("core", item.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
