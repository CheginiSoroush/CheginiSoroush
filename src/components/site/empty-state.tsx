"use client";

import { SearchX, RotateCcw } from "lucide-react";
import { useT } from "@/lib/i18n";

export function EmptyState({
  title,
  description,
  emoji = "🔍",
  onReset,
  resetLabel,
}: {
  title: string;
  description: string;
  emoji?: string;
  onReset?: () => void;
  resetLabel?: string;
}) {
  const { t } = useT();
  return (
    <div className="empty-state text-center py-14 px-6" role="status">
      <div className="empty-orb mx-auto mb-5" aria-hidden>
        <span className="empty-emoji text-4xl">{emoji}</span>
        <SearchX className="empty-badge w-5 h-5" aria-hidden />
      </div>
      <p className="font-extrabold mb-1.5">{title}</p>
      <p className="text-sm text-muted-foreground leading-7 max-w-sm mx-auto">{description}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand rounded-full border border-brand/30 bg-brand/10 px-5 py-2.5 hover:bg-brand/20 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[40px]"
        >
          <RotateCcw className="w-4 h-4" />
          {resetLabel ?? t("misc", "empty.reset")}
        </button>
      )}
    </div>
  );
}
