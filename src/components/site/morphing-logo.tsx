"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

/**
 * MorphingLogo — the hero logo "flies" into the header on scroll.
 *
 * A fixed clone of the hero logo (wordmark + conic ring + glow) starts
 * perfectly overlaid on the hero logo (#hero-logo-anchor). As the user
 * scrolls, it interpolates toward the header brand slot
 * (#header-logo-slot) and stays docked there until scrolled back up.
 * On non-home views (no hero) it is simply docked.
 *
 * Pure DOM writes on rAF (no per-frame React state) for 60fps.
 */
export function MorphingLogo() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = false;

    const update = () => {
      raf = 0;
      const slot = document.getElementById("header-logo-slot");
      const hero = document.getElementById("hero-logo-anchor");
      if (!slot) return;

      const slotRect = slot.getBoundingClientRect();
      const dockCX = slotRect.left + slotRect.width / 2;
      const dockCY = slotRect.top + slotRect.height / 2;

      if (!hero) {
        // No hero (non-home view): permanently docked
        dock(slotRect);
        return;
      }

      const heroRect = hero.getBoundingClientRect();
      const scrollY = window.scrollY;
      const t = reduced
        ? scrollY > 80
          ? 1
          : 0
        : Math.min(Math.max((scrollY - 24) / 260, 0), 1);

      const heroCX = heroRect.left + heroRect.width / 2;
      const heroCY = heroRect.top + heroRect.height / 2;

      // Dock: fit the (portrait) wordmark inside the 64px header.
      // On narrow screens keep it tighter so the ring never crowds the nav.
      const compact = window.innerWidth < 640;
      const dockScale = compact
        ? Math.min(46 / Math.max(heroRect.height, 1), 46 / Math.max(heroRect.width, 1), 0.42)
        : Math.min(52 / Math.max(heroRect.height, 1), 92 / Math.max(heroRect.width, 1), 0.42);
      const scale = 1 + (dockScale - 1) * t;
      const cx = heroCX + (dockCX - heroCX) * t;
      const cy = heroCY + (dockCY - heroCY) * t;

      // Stage intrinsic size follows the live hero box (responsive widths)
      if (Math.abs(stage.offsetWidth - heroRect.width) > 1) {
        stage.style.width = `${heroRect.width}px`;
      }
      if (Math.abs(stage.offsetHeight - heroRect.height) > 1) {
        stage.style.height = `${heroRect.height}px`;
      }

      stage.style.transformOrigin = "50% 50%";
      stage.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) scale(${scale})`;

      // Crossfade between the real hero logo and the clone
      const showClone = t > 0.015;
      if (showClone !== visible) {
        visible = showClone;
        stage.style.opacity = visible ? "1" : "0";
        hero.style.opacity = visible ? "0" : "1";
        window.dispatchEvent(new CustomEvent("imsoroush-logo-docked", { detail: visible }));
      }
    };

    const dock = (slotRect: DOMRect) => {
      const hero = document.getElementById("hero-logo-anchor");
      const heroRect = hero?.getBoundingClientRect();
      const w = heroRect?.width ?? 288;
      const h = heroRect?.height ?? 100;
      if (Math.abs(stage.offsetWidth - w) > 1) stage.style.width = `${w}px`;
      if (Math.abs(stage.offsetHeight - h) > 1) stage.style.height = `${h}px`;
      const compact = window.innerWidth < 640;
      const dockScale = compact
        ? Math.min(46 / Math.max(h, 1), 46 / Math.max(w, 1), 0.42)
        : Math.min(52 / Math.max(h, 1), 92 / Math.max(w, 1), 0.42);
      stage.style.transformOrigin = "50% 50%";
      stage.style.transform = `translate(${slotRect.left + slotRect.width / 2}px, ${
        slotRect.top + slotRect.height / 2
      }px) translate(-50%, -50%) scale(${dockScale})`;
      if (!visible) {
        visible = true;
        stage.style.opacity = "1";
        window.dispatchEvent(new CustomEvent("imsoroush-logo-docked", { detail: true }));
      }
      if (hero) hero.style.opacity = "1"; // hero not on screen anyway
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    // Settle loop: the header slides in (y:-70 -> 0) and images/fonts shift
    // layout during the first second — track the target continuously, then
    // hand over to scroll/resize listeners.
    let settleStart = 0;
    let settleRaf = 0;
    const settle = (ts: number) => {
      if (!settleStart) settleStart = ts;
      update();
      if (ts - settleStart < 1600) {
        settleRaf = requestAnimationFrame(settle);
      } else {
        settleRaf = 0;
      }
    };
    const startSettle = () => {
      if (settleRaf) cancelAnimationFrame(settleRaf);
      settleStart = 0;
      settleRaf = requestAnimationFrame(settle);
    };
    const onViewChange = () => startSettle();
    const onLangChange = () => startSettle();

    startSettle();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("hashchange", onViewChange);
    window.addEventListener("imsoroush-lang-changed", onLangChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("hashchange", onViewChange);
      window.removeEventListener("imsoroush-lang-changed", onLangChange);
      if (raf) cancelAnimationFrame(raf);
      if (settleRaf) cancelAnimationFrame(settleRaf);
    };
  }, []);

  return (
    <div
      ref={stageRef}
      aria-hidden
      className="fixed top-0 left-0 z-[55] pointer-events-none opacity-0 transition-opacity duration-200 will-change-transform"
    >
      <div className="relative w-full h-full">
        <div
          className="absolute inset-0 blur-2xl opacity-40"
          style={{ background: "var(--brand)" }}
        />
        <div className="conic-ring" />
        <Image
          src="/photos/logo_dark.png"
          alt=""
          width={280}
          height={100}
          className="absolute inset-0 dark:block hidden w-full h-full object-contain select-none drop-shadow-2xl"
          draggable={false}
        />
        <Image
          src="/photos/logo_light.png"
          alt=""
          width={280}
          height={100}
          className="absolute inset-0 dark:hidden w-full h-full object-contain select-none drop-shadow-xl"
          draggable={false}
        />
      </div>
    </div>
  );
}
