/**
 * sync-engine.ts — pure planning logic for the auto-sync job.
 *
 * The engine takes plain data (repo metadata + Cloudflare Workers custom
 * domains + the existing project catalog) and produces the writes the sync
 * should perform. It never touches the network or a database, so the
 * matching heuristics can be exercised directly with fixtures.
 *
 * Consumers:
 *  - scripts/auto-sync.ts (local Prisma apply + CI SQL emission)
 */

import { classifyRepo, prettyTitle } from "./repo-classify";

/* ------------------------------ inputs ------------------------------ */

export type SyncRepo = {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  isFork: boolean;
  archived: boolean;
  isPrivate?: boolean;
  pushedAt?: string;
};

export type WorkerDomain = {
  /** Worker/script name, e.g. "cinematic-solar-system". */
  worker: string;
  /** Attached custom domain, e.g. "cinematic-solar-system.imsoroush.ir". */
  domain: string;
};

export type ExistingProject = {
  slug: string;
  repo: string; // "owner/name" — same shape as the DB column
  demoUrl: string | null;
};

/* ----------------------------- helpers ------------------------------ */

const APEX_HOSTS = new Set(["imsoroush.ir", "www.imsoroush.ir"]);

/** Lowercase and strip separators so "My_Valentine_site" == "myvalentinesite". */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[-_]/g, "");
}

/** The repo-name half of an "owner/name" string (falls back to the input). */
export function repoNameOf(full: string): string {
  const idx = full.indexOf("/");
  return idx >= 0 ? full.slice(idx + 1) : full;
}

export function isBrandDemoUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.endsWith(".imsoroush.ir") && !APEX_HOSTS.has(host);
  } catch {
    return false;
  }
}

/**
 * Explicit repo → worker-name aliases for pairs the heuristics cannot infer
 * (different words entirely). Values are worker names, not full domains.
 */
const REPO_WORKER_ALIASES: Record<string, string> = {
  // none needed today — kept as the extension point for future odd pairs
};

/* --------------------------- demo matching -------------------------- */

/**
 * Match Workers custom domains to repositories and return
 * lowercased-repo-name → demo URL. Matching passes, in order:
 *   1. normalized equality            ("Luxe"        ↔ "luxe")
 *   2. containment (min 4 chars)      ("argus-vpn"   ↔ "argus-vpn-landing")
 *   3. explicit alias table
 * The apex domain and non-brand domains (github.io) are ignored.
 */
export function matchDemos(
  repos: SyncRepo[],
  domains: WorkerDomain[]
): Record<string, string> {
  const brand = domains.filter(
    (d) =>
      !!d?.worker &&
      !!d?.domain &&
      d.domain.toLowerCase().endsWith(".imsoroush.ir") &&
      !APEX_HOSTS.has(d.domain.toLowerCase())
  );

  const result: Record<string, string> = {};
  const claimed = new Set<string>();

  // Pass 1 — exact normalized equality.
  for (const repo of repos) {
    const norm = normalizeName(repo.name);
    const hit = brand.find(
      (d) => !claimed.has(d.worker) && normalizeName(d.worker) === norm
    );
    if (hit) {
      result[repo.name.toLowerCase()] = `https://${hit.domain}/`;
      claimed.add(hit.worker);
    }
  }

  // Pass 2 — containment, biased to the LONGEST worker name so
  // "style-plus-ecommerce" beats a hypothetical "style-plus".
  const remainingRepos = repos.filter((r) => !result[r.name.toLowerCase()]);
  const freeWorkers = brand
    .filter((d) => !claimed.has(d.worker))
    .sort((a, b) => b.worker.length - a.worker.length);

  for (const repo of remainingRepos) {
    const norm = normalizeName(repo.name);
    if (norm.length < 4) continue;
    const hit = freeWorkers.find((d) => {
      const w = normalizeName(d.worker);
      return (
        !claimed.has(d.worker) &&
        w.length >= 4 &&
        (w.includes(norm) || norm.includes(w))
      );
    });
    if (hit) {
      result[repo.name.toLowerCase()] = `https://${hit.domain}/`;
      claimed.add(hit.worker);
    }
  }

  // Pass 3 — explicit aliases.
  for (const [repoName, worker] of Object.entries(REPO_WORKER_ALIASES)) {
    const hit = brand.find((d) => d.worker === worker);
    if (hit && !result[repoName.toLowerCase()]) {
      result[repoName.toLowerCase()] = `https://${hit.domain}/`;
      claimed.add(worker);
    }
  }

  return result;
}

/* ------------------------- project planning ------------------------- */

export type NewProjectDraft = {
  slug: string;
  title: string;
  titleEn: string;
  repo: string; // "owner/name"
  demoUrl: string | null;
  description: string;
  descriptionEn: string;
  category: string;
  tags: string; // JSON-encoded string[]
  icon: string;
  featured: boolean;
  order: number;
};

export type ProjectPlan = {
  /** Brand-new catalog cards (repos that have no Project row yet). */
  newProjects: NewProjectDraft[];
  /** demoUrl fills for EXISTING catalog rows that lack one (slug → url). */
  demoFills: { slug: string; url: string }[];
};

/**
 * Plan catalog writes:
 *  - every owner repo without a Project row becomes a draft card
 *    (forks skipped; archived kept but never featured),
 *  - existing rows with a null demoUrl get one when a demo was discovered
 *    for their repo (curated values are never overwritten).
 */
export function planProjectWrites(
  owner: string,
  repos: SyncRepo[],
  demos: Record<string, string>,
  existing: ExistingProject[]
): ProjectPlan {
  const existingSlugs = new Set(existing.map((p) => p.slug.toLowerCase()));
  const existingRepos = new Set(
    existing.map((p) => repoNameOf(p.repo).toLowerCase())
  );

  const newProjects: NewProjectDraft[] = [];
  let orderSeed = 1000; // auto cards sort below all curated ones

  for (const repo of repos) {
    if (repo.isFork) continue;
    const lower = repo.name.toLowerCase();
    if (existingRepos.has(lower) || existingSlugs.has(lower)) continue;

    const cls = classifyRepo({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      topics: repo.topics,
    });

    newProjects.push({
      slug: lower,
      title: cls.title,
      titleEn: cls.title,
      repo: `${owner}/${repo.name}`,
      demoUrl: demos[lower] ?? null,
      description:
        repo.description?.trim() ||
        `${cls.title} — open-source project by ${owner}.`,
      descriptionEn:
        repo.description?.trim() ||
        `${cls.title} — open-source project by ${owner}.`,
      category: cls.category,
      tags: JSON.stringify(cls.tags),
      icon: cls.icon,
      featured: false,
      order: orderSeed++,
    });
  }

  const demoFills: { slug: string; url: string }[] = [];
  for (const p of existing) {
    if (p.demoUrl && p.demoUrl.trim()) continue;
    const url = demos[repoNameOf(p.repo).toLowerCase()];
    if (url) demoFills.push({ slug: p.slug, url });
  }

  return { newProjects, demoFills };
}

/** Title helper re-export so the script does not import two modules. */
export { prettyTitle };
