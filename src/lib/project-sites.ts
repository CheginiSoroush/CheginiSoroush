/**
 * Curated per-project site links beyond the primary live URL stored in the
 * Projects catalog (`demoUrl`).
 *
 * GitHub Pages sites are invisible to the catalog (it keeps a single
 * demoUrl), so every verified Pages URL lives here — each one probed
 * HTTP 200 with real content on 2026-02-14. A full audit of all repos
 * (github.io probe + GitHub `homepage` field) found exactly these six.
 *
 * One map serves every surface: keys are the catalog slug (which for these
 * repos equals the bare GitHub repo name), so `projectSites()` accepts a
 * slug, a bare repo name, or an "owner/repo" string and normalizes it.
 */

export type ProjectSite = {
  /** i18n suffix under the "site." prefix in the projects dict. */
  id: string;
  href: string;
};

export const PROJECT_SITES: Readonly<Record<string, readonly ProjectSite[]>> = {
  "ubuntu-optimizer": [
    { id: "pages", href: "https://cheginisoroush.github.io/ubuntu-optimizer/" },
  ],
  projdump: [{ id: "pages", href: "https://cheginisoroush.github.io/projdump/" }],
  "obsidian-sync-scripts": [
    { id: "pages", href: "https://cheginisoroush.github.io/obsidian-sync-scripts/" },
  ],
  "obsidian-project-quest": [
    { id: "pages", href: "https://cheginisoroush.github.io/obsidian-project-quest/" },
  ],
  "flash-panel": [{ id: "pages", href: "https://cheginisoroush.github.io/flash-panel/" }],
  "flash-wizard": [{ id: "pages", href: "https://cheginisoroush.github.io/flash-wizard/" }],
};

/** Extra sites for a project — matches slug, bare repo name, or owner/repo. */
export function projectSites(slugOrRepo: string): readonly ProjectSite[] {
  const key = slugOrRepo.includes("/")
    ? slugOrRepo.split("/").pop()!.toLowerCase()
    : slugOrRepo.toLowerCase();
  return PROJECT_SITES[key] ?? [];
}
