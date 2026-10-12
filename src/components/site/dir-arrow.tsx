"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

/**
 * Direction-aware forward arrow: points left in RTL (fa) and right in LTR (en).
 * Pair with the `.dir-slide` class for a hover slide that flips with direction.
 */
export function DirArrow({ className }: { className?: string }) {
  const { isRtl } = useT();
  const Icon = isRtl ? ArrowLeft : ArrowRight;
  return <Icon className={cn(className)} aria-hidden />;
}
