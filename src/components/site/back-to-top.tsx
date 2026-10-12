"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const R = 20;
const CIRC = 2 * Math.PI * R;

export function BackToTop() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const { t } = useT();

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0);
        setVisible(window.scrollY > 600);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const scrollTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label={t("misc", "btt.label")}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn("back-to-top", visible && "back-to-top-visible")}
    >
      <svg viewBox="0 0 48 48" aria-hidden className="back-to-top-ring">
        <circle className="ring-track" cx="24" cy="24" r={R} />
        <circle
          className="ring-fill"
          cx="24"
          cy="24"
          r={R}
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - progress)}
        />
      </svg>
      <ArrowUp className="w-4.5 h-4.5 relative" aria-hidden />
    </button>
  );
}
