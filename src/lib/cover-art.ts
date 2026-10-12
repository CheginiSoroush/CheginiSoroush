/**
 * Deterministic generative cover-art parameters for projects.
 * Every project gets a unique, stable visual identity derived from its slug —
 * no image assets required, rendered as pure SVG.
 *
 * All geometry is precomputed here as pure data so components stay
 * render-pure (React Compiler friendly).
 */

export type CoverPalette = {
  from: string;
  via: string;
  to: string;
  accent: string;
};

export type CoverPattern = "circuit" | "browser" | "orbit" | "terminal" | "mind" | "pulse";

const PALETTES: CoverPalette[] = [
  { from: "#0f766e", via: "#14d2b8", to: "#062e2a", accent: "#5eead4" }, // brand teal
  { from: "#155e75", via: "#22d3ee", to: "#082f49", accent: "#67e8f9" }, // cyan
  { from: "#5b21b6", via: "#8b5cf6", to: "#1e1042", accent: "#c4b5fd" }, // violet
  { from: "#b45309", via: "#f59e0b", to: "#3b1e04", accent: "#fcd34d" }, // amber
  { from: "#9d174d", via: "#ec4899", to: "#3f0d28", accent: "#f9a8d4" }, // rose
  { from: "#065f46", via: "#10b981", to: "#032e21", accent: "#6ee7b7" }, // emerald
  { from: "#075985", via: "#0ea5e9", to: "#041f30", accent: "#7dd3fc" }, // sky
  { from: "#701a75", via: "#d946ef", to: "#2e0a30", accent: "#f0abfc" }, // fuchsia
];

export const CATEGORY_PATTERN: Record<string, CoverPattern> = {
  bots: "circuit",
  web: "browser",
  "3d": "orbit",
  tools: "terminal",
  self: "mind",
  sports: "pulse",
};

/** xmur3 string hash → 32-bit seed */
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 PRNG */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Dot = { x: number; y: number; r: number; o: number };
export type Trace = { x1: number; y1: number; x2: number; y2: number };
export type WindowBox = { x: number; y: number; w: number; h: number; skew: number };
export type CodeLine = { x: number; y: number; w: number; o: number };
export type NeuronLink = { x1: number; y1: number; x2: number; y2: number };
export type PulseSegment = { d: string; o: number };
export type ActivityBar = { x: number; h: number };

export type CoverSpec = {
  palette: CoverPalette;
  pattern: CoverPattern;
  dots: Dot[];
  /** circuit traces (pattern: circuit) */
  traces: Trace[];
  /** browser windows (pattern: browser) */
  windows: WindowBox[];
  /** orbit geometry (pattern: orbit) */
  orbit: { cx: number; cy: number; radii: number[]; moons: Dot[]; tilt: number };
  /** terminal code lines (pattern: terminal) */
  lines: CodeLine[];
  /** neuron network (pattern: mind) */
  mind: { nodes: Dot[]; links: NeuronLink[]; rings: { cx: number; cy: number; r: number; o: number }[] };
  /** heartbeat pulse (pattern: pulse) */
  pulse: { segments: PulseSegment[]; bars: ActivityBar[] };
};

export function coverSpec(slug: string, category: string): CoverSpec {
  const rand = rng(hashSeed(slug));
  const palette = PALETTES[hashSeed(slug + ":pal") % PALETTES.length];
  const pattern = CATEGORY_PATTERN[category] ?? "terminal";

  // dot constellation
  const dots: Dot[] = Array.from({ length: 14 }, () => ({
    x: Math.round(rand() * 400),
    y: Math.round(rand() * 160),
    r: Math.round((rand() * 1.6 + 0.4) * 100) / 100,
    o: Math.round((rand() * 0.5 + 0.15) * 100) / 100,
  }));

  // circuit traces: right-angle paths with node dots
  const traces: Trace[] = Array.from({ length: 5 }, () => {
    const x = Math.round(rand() * 360) + 20;
    const y = Math.round(rand() * 120) + 20;
    return {
      x1: x,
      y1: y,
      x2: x + Math.round((rand() * 120 - 60) / 10) * 10,
      y2: y + Math.round((rand() * 80 - 40) / 10) * 10,
    };
  });

  // floating browser windows
  const windows: WindowBox[] = Array.from({ length: 3 }, () => ({
    x: Math.round(rand() * 280) + 30,
    y: Math.round(rand() * 80) + 18,
    w: Math.round(rand() * 70) + 60,
    h: Math.round(rand() * 30) + 38,
    skew: Math.round(rand() * 10 - 5),
  }));

  // planetary orbits
  const ocx = 200 + Math.round(rand() * 60 - 30);
  const ocy = 80 + Math.round(rand() * 30 - 15);
  const orbit = {
    cx: ocx,
    cy: ocy,
    radii: [44, 70, 96],
    moons: Array.from({ length: 3 }, (_, i) => {
      const angle = rand() * Math.PI * 2;
      const r = 44 + i * 26;
      return {
        x: Math.round((ocx + Math.cos(angle) * r) * 10) / 10,
        y: Math.round((ocy + Math.sin(angle) * r * 0.42) * 10) / 10,
        r: 3.2,
        o: 1,
      };
    }),
    tilt: Math.round((rand() * 40 - 20) * 10) / 10,
  };

  // terminal code lines
  const lines: CodeLine[] = Array.from({ length: 6 }, () => ({
    x: Math.round(rand() * 30) + 218,
    y: Math.round(rand() * 110) + 24,
    w: Math.round(rand() * 90) + 30,
    o: Math.round((rand() * 0.45 + 0.25) * 100) / 100,
  }));

  // neuron network (mind) — nodes linked to nearest neighbours + thought rings
  const nodeCount = 9;
  const nodes: Dot[] = Array.from({ length: nodeCount }, () => ({
    x: Math.round(rand() * 360) + 20,
    y: Math.round(rand() * 130) + 15,
    r: Math.round((rand() * 2.4 + 2) * 10) / 10,
    o: 1,
  }));
  const links: NeuronLink[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 105 && rand() < 0.75) {
        links.push({ x1: nodes[i].x, y1: nodes[i].y, x2: nodes[j].x, y2: nodes[j].y });
      }
    }
  }
  const mcx = 330;
  const mcy = 46;
  const mind = {
    nodes,
    links: links.slice(0, 14),
    rings: [
      { cx: mcx, cy: mcy, r: 26, o: 0.5 },
      { cx: mcx, cy: mcy, r: 44, o: 0.32 },
      { cx: mcx, cy: mcy, r: 64, o: 0.16 },
    ],
  };

  // heartbeat pulse (pulse) — EKG polyline across the strip + activity bars
  const beats = ["0,80 28,80 38,62 50,98 60,34 70,104 82,80", "120,80 148,80 158,58 170,100 180,28 190,110 202,80", "240,80 268,80 278,60 290,96 300,38 310,102 322,80", "350,80 374,80"];
  const pulse = {
    segments: beats.map((d, i) => ({ d, o: 0.9 - i * 0.15 })),
    bars: Array.from({ length: 7 }, (_, i) => ({
      x: 22 + i * 14,
      h: Math.round(rand() * 46) + 10,
    })),
  };

  return { palette, pattern, dots, traces, windows, orbit, lines, mind, pulse };
}
