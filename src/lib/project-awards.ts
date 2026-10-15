/**
 * Curated third-party recognitions for specific projects.
 *
 * Config-driven on purpose (no DB migration): an award is attached to a
 * project slug in code, so it deploys together with the site and can never
 * drift from the live UI. Copy lives in the projects i18n dict under
 * `award.<id>.*` (label / short / desc / aria).
 *
 * When the exact XERJ Corpus Hub entry URL for the selected commit becomes
 * available, only `href` needs to change.
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
    // TODO: swap to the exact hub-entry URL once it is shared with us.
    href: "https://github.com/xerj-org/xerj",
  },
};

/** Award for a project slug, or null when the project has none. */
export function projectAward(slug: string): ProjectAward | null {
  return PROJECT_AWARDS[slug] ?? null;
}
