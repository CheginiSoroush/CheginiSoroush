/**
 * AuroraBackground — the turquoise glows from the hero, extended across the
 * whole page so every view (projects, writing, contact, about…) sits on the
 * same atmospheric backdrop. Purely decorative: fixed blobs of the brand
 * color, blurred, drifting very slowly, behind all content.
 */
export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Top cluster — greets every view (sits behind the header/hero area) */}
      <div className="aurora aurora-drift w-[420px] h-[420px] -top-40 -right-32" />
      <div className="aurora aurora-drift-slow w-[360px] h-[360px] top-16 -left-32" />
      {/* Mid-page accents */}
      <div className="aurora aurora-drift-slow w-[300px] h-[300px] top-[34%] -right-28 opacity-80" />
      <div className="aurora aurora-drift w-[340px] h-[340px] top-[58%] -left-28" />
      {/* Bottom accent — anchors long pages near the footer */}
      <div className="aurora aurora-drift-slow w-[400px] h-[400px] top-[88%] -right-36 opacity-75" />
    </div>
  );
}
