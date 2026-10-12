"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInView, motion } from "framer-motion";
import { useT } from "@/lib/i18n";

type Axis = { label: string; value: number; icon: string };

export function RadarChart({ axes }: { axes: Axis[] }) {
  const { t, num, lang } = useT();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  // Animate progress (state updates happen inside rAF callback, not synchronously)
  useEffect(() => {
    if (!inView) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 1400, 1);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 68;
  const n = axes.length;

  const maxValue = useMemo(() => Math.max(...axes.map((a) => a.value)), [axes]);

  const point = (i: number, value: number): [number, number] => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const rings = [0.25, 0.5, 0.75, 1];

  const dataPoints = axes.map((a, i) => point(i, a.value * progress));
  const dataPath = dataPoints.map((p) => p.join(",")).join(" ");

  const labelPos = axes.map((_, i) => point(i, maxValue * 1.22));

  return (
    <div ref={ref} className="relative mx-auto" style={{ width: "100%", maxWidth: 460 }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-auto"
        role="img"
        aria-label={t("home", "radar.aria", {
          items: axes.map((a) => `${a.label} ${a.value}`).join(lang === "fa" ? "، " : ", "),
        })}
      >
        <defs>
          <radialGradient id="radar-fill" cx="50%" cy="50%" r="65%">
            <stop offset="0%" style={{ stopColor: "var(--brand)" }} stopOpacity={0.5} />
            <stop offset="100%" style={{ stopColor: "var(--brand)" }} stopOpacity={0.04} />
          </radialGradient>
        </defs>

        {/* Grid rings */}
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={axes
              .map((_, i) => {
                const [x, y] = point(i, maxValue * ring);
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            style={{ stroke: "var(--border)" }}
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {axes.map((_, i) => {
          const [x, y] = point(i, maxValue);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              style={{ stroke: "var(--border)" }}
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <motion.polygon
          points={dataPath}
          fill="url(#radar-fill)"
          style={{ stroke: "var(--brand)" }}
          strokeWidth={2.5}
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: inView ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        />

        {/* Data points */}
        {dataPoints.map(([x, y], i) => (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={hovered === i ? 8 : 5}
              style={{ fill: "var(--background)", stroke: "var(--brand)" }}
              strokeWidth={2.5}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            {/* Value bubble */}
            {progress > 0.95 && (
              <text
                x={x}
                y={y - 13}
                textAnchor="middle"
                fontSize={13}
                fontWeight={800}
                style={{ fill: "var(--brand)" }}
              >
                {num(axes[i].value)}
              </text>
            )}
          </g>
        ))}

        {/* Labels */}
        {labelPos.map(([lx, ly], i) => (
          <text
            key={i}
            x={lx}
            y={ly - 4}
            textAnchor="middle"
            fontSize={15}
            fontWeight={700}
            style={{ fill: "var(--foreground)" }}
          >
            {axes[i].icon} {axes[i].label}
          </text>
        ))}
      </svg>
    </div>
  );
}
