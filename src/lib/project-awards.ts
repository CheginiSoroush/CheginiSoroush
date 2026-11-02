/**
 * Curated third-party recognitions for specific projects.
 *
 * Config-driven on purpose (no DB migration): an award is attached to a
 * project slug in code, so it deploys together with the site and can never
 * drift from the live UI. Copy lives in the projects i18n dict under
 * `award.<id>.*` (label / short / desc / aria).
 *
 * The `href` points to the exact XERJ Corpus Hub entry for the selected
 * commit (pinned to commit 7d659410fc = v7.16, as described in the award
 * copy).
 */
export type ProjectAward = {
  /** i18n key suffix under the projects dict: `award.<id>.*` */
  id: string;
  /** Where the award points (public page describing the selection). */
  href: string;
};

export const PROJECT_AWARDS: Readonly<Record<string, ProjectAward>> = {
  "ubuntu-optimizer": {
    id: "xerj",
    // Exact hub entry for the selected commit (v7.16 / 7d659410fc).
    href: "https://hub.xerj.org/corpus/cheginisoroush--ubuntu-optimizer",
  },
};

/** Award for a project slug, or null when the project has none. */
export function projectAward(slug: string): ProjectAward | null {
  return PROJECT_AWARDS[slug] ?? null;
}
