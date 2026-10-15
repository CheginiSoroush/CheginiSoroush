/**
 * Curated live-demo URLs.
 *
 * Soroush hosts playable/live demos for many repos as Cloudflare Workers
 * custom domains on *.imsoroush.ir. GitHub's `homepage` field is usually
 * empty for them, so the mapping lives here — verified against the Cloudflare
 * Workers custom-domains API + HTTP 200 on 2026-10-14.
 *
 * Two consumers:
 *  - CURATED_DEMOS: keyed by lowercased GitHub repo name → /api/repos fills
 *    `homepage` for repos where GitHub itself has none.
 *  - PROJECT_DEMO_URLS: keyed by Projects-catalog slug → seeds demoUrl in the
 *    Project table (scripts/seed.ts, scripts/apply-demo-urls.ts, d1-seed).
 */

export const CURATED_DEMOS: Record<string, string> = {
  "3d-cosmic-earth": "https://3d-cosmic-earth.imsoroush.ir/",
  "aiflash-showcase-web": "https://aiflash-showcase.imsoroush.ir/",
  "aramia-cbt-app": "https://aramia-cbt-app.imsoroush.ir/",
  "argus-vpn-landing": "https://argus-vpn.imsoroush.ir/",
  "atomic-habits-interactive": "https://atomic-habits-interactive.imsoroush.ir/",
  "aurora-vpn-landing": "https://aurora-vpn.imsoroush.ir/",
  "cinematic-solar-system-3d": "https://cinematic-solar-system.imsoroush.ir/",
  "dev-portfolio-3d": "https://dev-portfolio-3d.imsoroush.ir/",
  "fashion-everyday": "https://fashion-everyday.imsoroush.ir/",
  "fashionable-3d-experience": "https://fashionable-3d-experience.imsoroush.ir/",
  "gitpedia-interactive": "https://gitpedia-interactive.imsoroush.ir/",
  "linux-cheat-sheet": "https://linux-cheat-sheet.imsoroush.ir/",
  luxe: "https://luxe.imsoroush.ir/",
  "microservices-vs-monolith": "https://microservices-vs-monolith.imsoroush.ir/",
  my_valentine_site: "https://my-valentine-site.imsoroush.ir/",
  "overcoming-laziness-roadmap": "https://overcoming-laziness-roadmap.imsoroush.ir/",
  "portfolio-nebula-theme": "https://portfolio-nebula.imsoroush.ir/",
  "realistic-earth-webgl": "https://realistic-earth-webgl.imsoroush.ir/",
  "smart-fitness-planner": "https://smart-fitness-planner.imsoroush.ir/",
  stepstyle: "https://stepstyle.imsoroush.ir/",
  "style-plus-ecommerce-ui": "https://style-plus-ecommerce.imsoroush.ir/",
  "threejs-solar-system": "https://threejs-solar-system.imsoroush.ir/",
  "vampsole-website": "https://vampsole.imsoroush.ir/",
  "willpower-science-amcc": "https://willpower-science-amcc.imsoroush.ir/",
};

export const PROJECT_DEMO_URLS: Record<string, string> = {
  "aiflash": "https://aiflash-showcase.imsoroush.ir/",
  "aramia-cbt": "https://aramia-cbt-app.imsoroush.ir/",
  "argus-vpn": "https://argus-vpn.imsoroush.ir/",
  "aurora-vpn": "https://aurora-vpn.imsoroush.ir/",
  "cinematic-solar-system": "https://cinematic-solar-system.imsoroush.ir/",
  "cosmic-earth": "https://3d-cosmic-earth.imsoroush.ir/",
  "dev-portfolio-3d": "https://dev-portfolio-3d.imsoroush.ir/",
  "fashion-everyday": "https://fashion-everyday.imsoroush.ir/",
  "fashionable-3d": "https://fashionable-3d-experience.imsoroush.ir/",
  gitpedia: "https://gitpedia-interactive.imsoroush.ir/",
  "linux-cheat-sheet": "https://linux-cheat-sheet.imsoroush.ir/",
  "luxe-ecommerce": "https://luxe.imsoroush.ir/",
  "microservices-vs-monolith": "https://microservices-vs-monolith.imsoroush.ir/",
  "portfolio-nebula": "https://portfolio-nebula.imsoroush.ir/",
  "realistic-earth": "https://realistic-earth-webgl.imsoroush.ir/",
  stepstyle: "https://stepstyle.imsoroush.ir/",
  "style-plus": "https://style-plus-ecommerce.imsoroush.ir/",
  "threejs-solar-system": "https://threejs-solar-system.imsoroush.ir/",
  "valentine-game": "https://my-valentine-site.imsoroush.ir/",
  "vamp-sole": "https://vampsole.imsoroush.ir/",
};

/** Hostname of a demo URL (or null when unparsable) — shown on cards. */
export function demoHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}
