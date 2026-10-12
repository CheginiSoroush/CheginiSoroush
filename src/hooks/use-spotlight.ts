"use client";

import type { MouseEvent } from "react";

/**
 * Returns an onMouseMove handler that feeds --mx/--my CSS vars
 * used by the `.spotlight` utility for a cursor-following glow.
 */
export function useSpotlight() {
  return (e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };
}
