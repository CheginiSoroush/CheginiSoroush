"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const { t } = useT();

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        setProgress(Number.isFinite(p) ? p : 0);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    /* Reading progress bar (back-to-top lives in back-to-top.tsx) */
    <div
      className="fixed top-0 inset-x-0 z-[60] h-[3px] pointer-events-none"
      role="progressbar"
      aria-label={t("misc", "scroll.progressLabel")}
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full origin-right transition-[width] duration-100 ease-out"
        style={{
          width: `${progress * 100}%`,
          background: "linear-gradient(270deg, var(--brand), #5eead4)",
          boxShadow: "0 0 12px var(--brand-glow)",
        }}
      />
    </div>
  );
}
