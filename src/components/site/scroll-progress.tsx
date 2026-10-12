"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useT } from "@/lib/i18n";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
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
        setVisible(window.scrollY > 480);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      {/* Reading progress bar */}
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

      {/* Back to top */}
      <AnimatePresence>
        {visible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 16 }}
            transition={{ duration: 0.25 }}
            onClick={toTop}
            aria-label={t("misc", "btt.label")}
            className="fixed bottom-6 left-6 z-50 w-11 h-11 rounded-full bg-card/90 backdrop-blur border border-brand/40 text-brand grid place-items-center shadow-[0_10px_30px_-10px_var(--brand-glow)] hover:bg-brand hover:text-primary-foreground hover:-translate-y-1 active:scale-95 transition-all"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
