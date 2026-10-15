/// <reference types="bun-types" />
/**
 * auto-sync.ts — the site's self-updating pipeline. Runs unattended:
 *
 *   1. Fetch all owned GitHub repos (private included when GH_PAT exists).
 *   2. Discover live-demo URLs by matching Cloudflare Workers custom domains
 *      (*.imsoroush.ir) against repo names — no more manual demo-urls edits.
 *      Fallbacks (in order): --workers-file fixture → CF API → CURATED_DEMOS.
 *   3. Auto-create a Project card for every repo that does not have one yet
 *      (category/icon/tags derived from topics+language via repo-classify).
 *   4. Fill missing demoUrl on existing catalog rows (curated ones untouched).
 *   5. Fetch per-repo meta (latest release + 52-week commit activity).
 *   6. HEAD-ping every demo host → DemoHealth (uptime dot in the UI).
 *
 * Modes:
 *   bun scripts/auto-sync.ts                     → apply to the LOCAL SQLite (Prisma)
 *   bun scripts/auto-sync.ts --dry-run           → print the plan, write nothing
 *   bun scripts/auto-sync.ts --emit-sql out.sql  → write idempotent D1 SQL instead
 *   bun scripts/auto-sync.ts --apply-d1          → emit SQL + apply via wrangler (CI)
 *
 * CI env: GH_PAT, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, D1_DB_NAME.
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  matchDemos,
  planProjectWrites,
  isBrandDemoUrl,
  repoNameOf,
  type SyncRepo,
  type WorkerDomain,
  type ExistingProject,
} from "../src/lib/sync-engine";
import { CURATED_DEMOS } from "../src/lib/demo-urls";
import { GITHUB_HANDLE } from "../src/lib/site-config";

/* ----------------------------- cli args ----------------------------- */

const args = process.argv.slice(2);
const has = (flag: string) => args.includes(flag);
const flagValue = (flag: string): string | undefined => {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] : undefined;
};

const DRY_RUN = has("--dry-run");
const EMIT_SQL = flagValue("--emit-sql");
const APPLY_D1 = has("--apply-d1");
const WORKERS_FILE = flagValue("--workers-file");
const REPOS_FILE = flagValue("--repos-file");
const SKIP_PING = has("--skip-ping");
const SKIP_META = has("--skip-meta");

const GH_TOKEN = process.env.GH_PAT || process.env.GITHUB_TOKEN || "";
const CF_TOKEN =
  process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || "";
const CF_ACCOUNT =
  process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || "";
const D1_DB = process.env.D1_DB_NAME || "imsoroush-db";
const SITE_URL = (process.env.SITE_URL || "https://imsoroush.ir").replace(/\/$/, "");

const GH_API = "https://api.github.com";
const CF_API = "https://api.cloudflare.com/client/v4";

/* --------------------------- tiny utilities -------------------------- */

async function pMap<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

function ghHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "imsoroush-auto-sync",
  };
  if (GH_TOKEN) h.Authorization = `Bearer ${GH_TOKEN}`;
  return h;
}

async function ghJson<T>(path: string): Promise<{ status: number; data: T | null }> {
  const res = await fetch(`${GH_API}${path}`, {
    headers: ghHeaders(),
    cache: "no-store",
  });
  if (!res.ok && res.status !== 202) {
    return { status: res.status, data: null };
  }
  if (res.status === 202) {
    // GitHub computes stats on demand — one retry usually returns real data.
    await new Promise((r) => setTimeout(r, 1500));
    const retry = await fetch(`${GH_API}${path}`, {
      headers: ghHeaders(),
      cache: "no-store",
    });
    return { status: retry.status, data: retry.ok ? ((await retry.json()) as T) : null };
  }
  return { status: res.status, data: (await res.json()) as T };
}

/* ------------------------------ fetchers ----------------------------- */

type GhRepoRaw = {
  name: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  fork: boolean;
  archived: boolean;
  private?: boolean;
  pushed_at: string;
  open_issues_count?: number;
};

async function fetchRepos(): Promise<SyncRepo[]> {
  if (REPOS_FILE) {
    const raw = JSON.parse(readFileSync(REPOS_FILE, "utf8")) as SyncRepo[];
    console.log(`  repos source: fixture ${REPOS_FILE} (${raw.length} repos)`);
    return raw;
  }
  const endpoint = GH_TOKEN
    ? `${GH_API}/user/repos?visibility=all&affiliation=owner&sort=pushed&per_page=100`
    : `${GH_API}/users/${GITHUB_HANDLE}/repos?per_page=100&sort=pushed&type=owner`;
  const res = await fetch(endpoint, { headers: ghHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`GitHub repos fetch failed: ${res.status}`);
  const list = (await res.json()) as GhRepoRaw[];
  return list.map((r) => ({
    name: r.name,
    description: r.description,
    language: r.language,
    topics: Array.isArray(r.topics) ? r.topics : [],
    isFork: Boolean(r.fork),
    archived: Boolean(r.archived),
    isPrivate: Boolean(r.private),
    pushedAt: r.pushed_at,
  }));
}

async function fetchWorkerDomains(): Promise<WorkerDomain[]> {
  if (WORKERS_FILE) {
    const raw = JSON.parse(readFileSync(WORKERS_FILE, "utf8")) as {
      worker?: string;
      service?: string;
      domain?: string;
      hostname?: string;
    }[];
    // Accept both the engine shape ({worker, domain}) and the raw Cloudflare
    // API shape ({service, hostname}) so real API snapshots work as fixtures.
    const list = raw
      .map((d) => ({ worker: d.worker ?? d.service ?? "", domain: d.domain ?? d.hostname ?? "" }))
      .filter((d) => d.worker && d.domain);
    console.log(`  workers source: fixture ${WORKERS_FILE} (${list.length} domains)`);
    return list;
  }
  if (CF_TOKEN && CF_ACCOUNT) {
    const res = await fetch(
      `${CF_API}/accounts/${CF_ACCOUNT}/workers/domains?per_page=100`,
      { headers: { Authorization: `Bearer ${CF_TOKEN}` }, cache: "no-store" }
    );
    if (res.ok) {
      // Real API item shape: { id, zone_id, zone_name, hostname, service } —
      // the custom domain lives in `hostname` (NOT `domain`).
      const json = (await res.json()) as {
        result?: { hostname?: string; domain?: string; service?: string }[];
      };
      const list = (json.result ?? [])
        .map((d) => ({
          worker: d.service ?? "",
          domain: d.hostname ?? d.domain ?? "",
        }))
        .filter((d) => d.worker && d.domain);
      console.log(`  workers source: Cloudflare API (${list.length} domains)`);
      return list;
    }
    console.warn(`  Cloudflare domains API failed (${res.status}) — falling back to curated map`);
  }
  // Fallback: the curated map IS the verified 24-domain audit snapshot.
  const list = Object.values(CURATED_DEMOS).map((url) => {
    const host = new URL(url).hostname;
    return { worker: host.split(".")[0], domain: host };
  });
  console.log(`  workers source: curated fallback (${list.length} domains)`);
  return list;
}

async function fetchExistingProjects(): Promise<ExistingProject[]> {
  if (!APPLY_D1 && !process.env.SITE_URL) {
    const prisma = new PrismaClient();
    try {
      const rows = await prisma.project.findMany({
        select: { slug: true, repo: true, demoUrl: true },
      });
      console.log(`  existing projects source: local DB (${rows.length})`);
      return rows;
    } finally {
      await prisma.$disconnect();
    }
  }
  const res = await fetch(`${SITE_URL}/api/projects`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Cannot read existing projects from ${SITE_URL}`);
  const json = (await res.json()) as {
    projects: { slug: string; repo: string; demoUrl: string | null }[];
  };
  console.log(`  existing projects source: ${SITE_URL} (${json.projects.length})`);
  return json.projects;
}

type MetaRow = {
  repo: string;
  latestTag: string | null;
  latestTagAt: string | null;
  commitActivity: number[];
  openIssues: number;
};

async function fetchRepoMeta(repo: string): Promise<MetaRow> {
  const [release, activity] = await Promise.all([
    ghJson<{ tag_name?: string; published_at?: string }>(
      `/repos/${GITHUB_HANDLE}/${repo}/releases/latest`
    ),
    SKIP_META
      ? Promise.resolve({ status: 0, data: null })
      : ghJson<{ total?: number }[]>(`/repos/${GITHUB_HANDLE}/${repo}/stats/commit_activity`),
  ]);

  const weeks = Array.isArray(activity.data) ? activity.data : [];
  return {
    repo,
    latestTag: release.data?.tag_name ?? null,
    latestTagAt: release.data?.published_at ?? null,
    commitActivity: weeks.slice(-16).map((w) => w.total ?? 0),
    openIssues: 0,
  };
}

async function pingDemo(url: string): Promise<{ host: string; ok: boolean; latencyMs: number }> {
  const host = new URL(url).hostname;
  const started = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    return { host, ok: res.status < 500, latencyMs: Date.now() - started };
  } catch {
    return { host, ok: false, latencyMs: Date.now() - started };
  }
}

/* ------------------------------- main -------------------------------- */

type Plan = Awaited<ReturnType<typeof buildPlan>>;

async function buildPlan() {
  console.log("━━ 1/6 fetching GitHub repos");
  const repos = await fetchRepos();
  console.log(`  ${repos.length} owned repos (${repos.filter((r) => !r.isFork).length} non-fork)`);

  console.log("━━ 2/6 discovering demo domains");
  const domains = await fetchWorkerDomains();
  const demos = matchDemos(repos, domains);
  console.log(`  matched ${Object.keys(demos).length} demos:`);
  for (const [repo, url] of Object.entries(demos)) console.log(`    ${repo} → ${url}`);

  console.log("━━ 3/6 planning catalog writes");
  const existing = await fetchExistingProjects();
  const plan = planProjectWrites(GITHUB_HANDLE, repos, demos, existing);
  console.log(`  new cards: ${plan.newProjects.length}, demo fills: ${plan.demoFills.length}`);
  for (const p of plan.newProjects) {
    console.log(`    + ${p.slug} [${p.category}] ${p.icon} ${p.title} ${p.demoUrl ?? ""}`);
  }

  let meta: MetaRow[] = [];
  if (!SKIP_META) {
    console.log("━━ 4/6 fetching repo meta (releases + commit activity)");
    const targets = repos.filter((r) => !r.isFork);
    meta = await pMap(targets, 6, (r) => fetchRepoMeta(r.name));
    const withRelease = meta.filter((m) => m.latestTag).length;
    console.log(`  meta: ${meta.length} repos, ${withRelease} with a release`);
  }

  let health: { host: string; ok: boolean; latencyMs: number }[] = [];
  if (!SKIP_PING) {
    console.log("━━ 5/6 pinging demo hosts");
    const urls = new Set<string>([
      ...Object.values(demos),
      ...existing.map((p) => p.demoUrl).filter((u): u is string => !!u),
    ]);
    health = await pMap([...urls], 8, pingDemo);
    console.log(
      `  ${health.filter((h) => h.ok).length}/${health.length} hosts up`
    );
  }

  return { repos, demos, plan, meta, health };
}

/* ------------------------------ writers ------------------------------ */

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  return `'${String(v).replace(/'/g, "''")}'`;
};

function buildSql(plan: Plan): string {
  const now = new Date().toISOString();
  const lines: string[] = [
    "-- Generated by scripts/auto-sync.ts — idempotent, safe to re-run.",
  ];

  for (const [repo, url] of Object.entries(plan.demos)) {
    lines.push(
      `INSERT INTO "RepoDemo" ("repo", "url", "source", "updatedAt") VALUES (${q(repo)}, ${q(url)}, ${q(WORKERS_FILE ? "fixture" : "cloudflare")}, ${q(now)})\n` +
        `ON CONFLICT("repo") DO UPDATE SET "url" = excluded."url", "source" = excluded."source", "updatedAt" = excluded."updatedAt";`
    );
  }

  for (const m of plan.meta) {
    lines.push(
      `INSERT INTO "RepoMeta" ("repo", "latestTag", "latestTagAt", "commitActivity", "openIssues", "fetchedAt")\n` +
        `VALUES (${q(m.repo)}, ${q(m.latestTag)}, ${q(m.latestTagAt)}, ${q(JSON.stringify(m.commitActivity))}, ${m.openIssues}, ${q(now)})\n` +
        `ON CONFLICT("repo") DO UPDATE SET "latestTag" = excluded."latestTag", "latestTagAt" = excluded."latestTagAt",\n` +
        `  "commitActivity" = excluded."commitActivity", "openIssues" = excluded."openIssues", "fetchedAt" = excluded."fetchedAt";`
    );
  }

  for (const h of plan.health) {
    lines.push(
      `INSERT INTO "DemoHealth" ("host", "ok", "latencyMs", "lastChecked")\n` +
        `VALUES (${q(h.host)}, ${h.ok ? 1 : 0}, ${h.latencyMs}, ${q(now)})\n` +
        `ON CONFLICT("host") DO UPDATE SET "ok" = excluded."ok", "latencyMs" = excluded."latencyMs", "lastChecked" = excluded."lastChecked";`
    );
  }

  for (const p of plan.plan.newProjects) {
    lines.push(
      `INSERT INTO "Project" ("id", "slug", "title", "titleEn", "repo", "demoUrl", "description", "descriptionEn", "category", "tags", "icon", "featured", "views", "order", "createdAt")\n` +
        `VALUES (lower(hex(randomblob(16))), ${q(p.slug)}, ${q(p.title)}, ${q(p.titleEn)}, ${q(p.repo)}, ${q(p.demoUrl)}, ${q(p.description)}, ${q(p.descriptionEn)}, ${q(p.category)}, ${q(p.tags)}, ${q(p.icon)}, 0, 0, ${p.order}, ${q(now)})\n` +
        `ON CONFLICT("slug") DO NOTHING;`
    );
  }

  for (const f of plan.plan.demoFills) {
    lines.push(
      `UPDATE "Project" SET "demoUrl" = ${q(f.url)} WHERE "slug" = ${q(f.slug)} AND ("demoUrl" IS NULL OR "demoUrl" = '');`
    );
  }

  lines.push("");
  return lines.join("\n");
}

async function applyLocal(plan: Plan): Promise<void> {
  const prisma = new PrismaClient();
  try {
    for (const [repo, url] of Object.entries(plan.demos)) {
      await prisma.repoDemo.upsert({
        where: { repo },
        create: { repo, url, source: WORKERS_FILE ? "fixture" : "cloudflare" },
        update: { url, source: WORKERS_FILE ? "fixture" : "cloudflare" },
      });
    }
    for (const m of plan.meta) {
      await prisma.repoMeta.upsert({
        where: { repo: m.repo },
        create: {
          repo: m.repo,
          latestTag: m.latestTag,
          latestTagAt: m.latestTagAt ? new Date(m.latestTagAt) : null,
          commitActivity: JSON.stringify(m.commitActivity),
        },
        update: {
          latestTag: m.latestTag,
          latestTagAt: m.latestTagAt ? new Date(m.latestTagAt) : null,
          commitActivity: JSON.stringify(m.commitActivity),
        },
      });
    }
    for (const h of plan.health) {
      await prisma.demoHealth.upsert({
        where: { host: h.host },
        create: { host: h.host, ok: h.ok, latencyMs: h.latencyMs },
        update: { ok: h.ok, latencyMs: h.latencyMs },
      });
    }
    for (const p of plan.plan.newProjects) {
      await prisma.project.upsert({
        where: { slug: p.slug },
        create: { ...p },
        update: {}, // already exists → keep curated content
      });
    }
    for (const f of plan.plan.demoFills) {
      await prisma.project.updateMany({
        where: { slug: f.slug, OR: [{ demoUrl: null }, { demoUrl: "" }] },
        data: { demoUrl: f.url },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

/* ------------------------------ run ---------------------------------- */

const plan = await buildPlan();

if (DRY_RUN) {
  console.log("━━ DRY RUN — no writes performed");
  console.log(JSON.stringify({ demos: plan.demos, ...plan.plan }, null, 2));
  process.exit(0);
}

if (EMIT_SQL || APPLY_D1) {
  const sql = buildSql(plan);
  const outPath = EMIT_SQL ?? join(mkdtempSync(join(tmpdir(), "autosync-")), "sync.sql");
  writeFileSync(outPath, sql, "utf8");
  console.log(`━━ SQL written: ${outPath} (${sql.split("\n").length} lines)`);
  if (APPLY_D1) {
    const { execSync } = await import("node:child_process");
    execSync(
      `bunx wrangler d1 execute ${D1_DB} --remote -y --file=${JSON.stringify(outPath)}`,
      { stdio: "inherit", env: process.env }
    );
    console.log("━━ applied to remote D1");
  }
} else {
  console.log("━━ applying to local SQLite (Prisma)");
  await applyLocal(plan);
  console.log("━━ local DB updated");
}

console.log("✅ auto-sync finished");
