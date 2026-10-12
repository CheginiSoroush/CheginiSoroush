"use client";

import { useMemo } from "react";
import { coverSpec } from "@/lib/cover-art";
import { cn } from "@/lib/utils";

/**
 * Deterministic generative cover art for a project.
 * Pure SVG — unique per slug, stable across renders, zero assets.
 * All geometry is precomputed in lib/cover-art (render-pure).
 */
export function ProjectCover({
  slug,
  category,
  className,
  idPrefix = "cov",
}: {
  slug: string;
  category: string;
  className?: string;
  idPrefix?: string;
}) {
  const spec = useMemo(() => coverSpec(slug, category), [slug, category]);
  const { palette, pattern, dots, traces, windows, orbit, lines } = spec;
  const gid = `${idPrefix}-${slug.replace(/[^a-zA-Z0-9-]/g, "")}`;

  return (
    <svg
      viewBox="0 0 400 160"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className={cn("cover-art", className)}
    >
      <defs>
        <linearGradient id={`${gid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.from} />
          <stop offset="52%" stopColor={palette.via} />
          <stop offset="100%" stopColor={palette.to} />
        </linearGradient>
        <radialGradient id={`${gid}-glow`} cx="78%" cy="22%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${gid}-shine`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* base gradient + corner glow + shine */}
      <rect width="400" height="160" fill={`url(#${gid}-bg)`} />
      <rect width="400" height="160" fill={`url(#${gid}-glow)`} />

      {/* category pattern layer */}
      {pattern === "circuit" && (
        <g stroke={palette.accent} strokeWidth="1.1" opacity="0.4" fill="none">
          {traces.map((t, i) => (
            <g key={i}>
              <polyline
                points={`${t.x1},${t.y1} ${t.x2},${t.y1} ${t.x2},${t.y2}`}
                strokeLinecap="round"
              />
              <circle cx={t.x1} cy={t.y1} r="2.6" fill={palette.accent} stroke="none" opacity="0.8" />
              <circle cx={t.x2} cy={t.y2} r="2.2" fill="none" />
            </g>
          ))}
        </g>
      )}

      {pattern === "browser" && (
        <g opacity="0.42">
          {windows.map((w, i) => (
            <g key={i} transform={`translate(${w.x} ${w.y}) rotate(${w.skew})`}>
              <rect width={w.w} height={w.h} rx="5" fill="#0b0f14" opacity="0.55" stroke={palette.accent} strokeWidth="1" />
              <line x1="0" y1="11" x2={w.w} y2="11" stroke={palette.accent} strokeWidth="1" opacity="0.7" />
              <circle cx="7" cy="5.5" r="1.8" fill={palette.accent} />
              <circle cx="14" cy="5.5" r="1.8" fill={palette.accent} opacity="0.6" />
              <circle cx="21" cy="5.5" r="1.8" fill={palette.accent} opacity="0.35" />
              <rect x="7" y="18" width={w.w * 0.55} height="4" rx="2" fill={palette.accent} opacity="0.5" />
              <rect x="7" y="26" width={w.w * 0.75} height="4" rx="2" fill={palette.accent} opacity="0.3" />
            </g>
          ))}
        </g>
      )}

      {pattern === "orbit" && (
        <g opacity="0.5" transform={`rotate(${orbit.tilt} ${orbit.cx} ${orbit.cy})`}>
          {orbit.radii.map((r, i) => (
            <ellipse
              key={r}
              cx={orbit.cx}
              cy={orbit.cy}
              rx={r}
              ry={r * 0.42}
              fill="none"
              stroke={palette.accent}
              strokeWidth="1"
              opacity={0.75 - i * 0.18}
            />
          ))}
          <circle cx={orbit.cx} cy={orbit.cy} r="12" fill={palette.accent} opacity="0.85" />
          <circle cx={orbit.cx} cy={orbit.cy} r="19" fill="none" stroke={palette.accent} strokeWidth="1.4" opacity="0.5" />
          {orbit.moons.map((m, i) => (
            <circle key={i} cx={m.x} cy={m.y} r={m.r} fill={palette.accent} />
          ))}
        </g>
      )}

      {pattern === "terminal" && (
        <g opacity="0.55">
          <g transform="translate(30 96)">
            <path d="M0 0 L14 10 L0 20" fill="none" stroke={palette.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="22" y="7" width="34" height="6" rx="3" fill={palette.accent} opacity="0.75" />
          </g>
          {lines.map((l, i) => (
            <rect key={i} x={l.x} y={l.y} width={l.w} height="5" rx="2.5" fill={palette.accent} opacity={l.o} />
          ))}
        </g>
      )}

      {/* dot constellation */}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#ffffff" opacity={d.o} />
      ))}

      {/* diagonal shine sweep */}
      <rect width="400" height="160" fill={`url(#${gid}-shine)`} />
    </svg>
  );
}
