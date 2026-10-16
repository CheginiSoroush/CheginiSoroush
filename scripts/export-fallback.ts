/**
 * export-fallback.ts — assembles `src/lib/fallback-data.json`.
 *
 * That JSON is the LAST-RESORT dataset baked into the deployed Worker. It is
 * served by d1-store when D1 rejects every query (observed: account-wide D1
 * free-tier daily row-read limit) AND both cache layers (L1 per-isolate RAM,
 * L2 Workers Cache API) are cold — so visitors always see real content and
 * non-zero counters instead of an empty site.
 *
 * Usage:
 *   1. bun scripts/export-fallback.ts <input.json>
 *      Assembles from a hand/CI-prepared input file shaped as:
 *      {
 *        projects: D1-row[], articles: D1-row[],
 *        repoDemos: row[], repoMeta: row[], demoHealth: row[],
 *        siteStats: { visits?, projectViews?, messages? },
 *        snapshots: { RepoSnapshot?: object, GithubSnapshot?: object }
 *      }
 *   2. bun scripts/export-fallback.ts --from-d1
 *      (CI mode) queries the remote D1 database through `wrangler d1 execute
 *      --remote --json` (requires CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
 *      in the environment, as in the deploy workflow) and assembles directly.
 *
 * The output file is committed as the baseline and refreshed on every deploy
 * (ci-deploy.sh runs this in --from-d1 mode before `next build`, best-effort).
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

interface FallbackSnapshot {
  payloadJson: string;
  updatedAt: string;
}

interface FallbackData {
  generatedAt: string;
  projects: Record<string, unknown>[];
  articles: Record<string, unknown>[];
  repoDemos: { repo: string; url: string; source: string; updatedAt: string }[];
  repoMeta: {
    repo: string;
    latestTag: string | null;
    latestTagAt: string | null;
    commitActivity: string;
    openIssues: number;
    fetchedAt: string;
  }[];
  demoHealth: { host: string; ok: boolean; latencyMs: number; lastChecked: string }[];
  siteStats: { visits: number; projectViews: number; messages: number };
  snapshots: {
    RepoSnapshot: FallbackSnapshot | null;
    GithubSnapshot: FallbackSnapshot | null;
  };
}

const OUT = new URL("../src/lib/fallback-data.json", import.meta.url).pathname;

/* --------------------------- wrangler helper --------------------------- */

function d1Rows(database: string, sql: string): Record<string, unknown>[] {
  const proc = spawnSync(
    "bunx",
    ["wrangler", "d1", "execute", database, "--remote", "-y", "--json", "--command", sql],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 120_000 }
  );
  const stdout = proc.stdout ?? "";
  const jsonStart = stdout.indexOf("[");
  if (jsonStart === -1) {
    throw new Error(`wrangler returned no JSON for: ${sql}\n${(proc.stderr || stdout).slice(0, 500)}`);
  }
  const parsed = JSON.parse(stdout.slice(jsonStart)) as { results?: Record<string, unknown>[] }[];
  return parsed[0]?.results ?? [];
}

/* ------------------------------ assembly ------------------------------- */

function normalizeProject(r: Record<string, unknown>): Record<string, unknown> {
  const row = { ...r };
  if (Array.isArray(row.tags)) row.tags = JSON.stringify(row.tags); // API-shaped → D1-shaped
  return row;
}

function build(input: {
  projects: Record<string, unknown>[];
  articles: Record<string, unknown>[];
  repoDemos?: FallbackData["repoDemos"];
  repoMeta?: FallbackData["repoMeta"];
  demoHealth?: FallbackData["demoHealth"];
  siteStats?: Partial<FallbackData["siteStats"]>;
  snapshots?: {
    RepoSnapshot?: FallbackSnapshot | Record<string, unknown> | null;
    GithubSnapshot?: FallbackSnapshot | Record<string, unknown> | null;
  };
}): FallbackData {
  const generatedAt = new Date().toISOString();

  const toSnapshot = (
    value: FallbackSnapshot | Record<string, unknown> | null | undefined
  ): FallbackSnapshot | null => {
    if (!value) return null;
    // Already a {payloadJson, updatedAt} pair (D1 shape) → keep; otherwise wrap.
    if (typeof (value as FallbackSnapshot).payloadJson === "string") {
      return value as FallbackSnapshot;
    }
    return { payloadJson: JSON.stringify(value), updatedAt: generatedAt };
  };

  return {
    generatedAt,
    projects: (input.projects ?? []).map(normalizeProject),
    articles: input.articles ?? [],
    repoDemos: input.repoDemos ?? [],
    repoMeta: input.repoMeta ?? [],
    demoHealth: input.demoHealth ?? [],
    siteStats: {
      visits: Number(input.siteStats?.visits ?? 0),
      projectViews: Number(input.siteStats?.projectViews ?? 0),
      messages: Number(input.siteStats?.messages ?? 0),
    },
    snapshots: {
      RepoSnapshot: toSnapshot(input.snapshots?.RepoSnapshot),
      GithubSnapshot: toSnapshot(input.snapshots?.GithubSnapshot),
    },
  };
}

/* -------------------------------- modes -------------------------------- */

async function main() {
  const arg = process.argv[2];

  if (arg === "--from-d1") {
    const DB = "imsoroush-db";
    console.error("export-fallback: querying remote D1…");
    const [projects, articles, repoDemos, repoMeta, demoHealth, siteStatRows, messageCount] =
      await Promise.all([
        d1Rows(DB, `SELECT * FROM "Project"`),
        d1Rows(DB, `SELECT * FROM "Article" ORDER BY "publishedAt" DESC`),
        d1Rows(DB, `SELECT "repo", "url", "source", "updatedAt" FROM "RepoDemo"`),
        d1Rows(
          DB,
          `SELECT "repo", "latestTag", "latestTagAt", "commitActivity", "openIssues", "fetchedAt" FROM "RepoMeta"`
        ),
        d1Rows(DB, `SELECT "host", "ok", "latencyMs", "lastChecked" FROM "DemoHealth"`),
        d1Rows(DB, `SELECT "key", "value" FROM "SiteStat" WHERE "key" IN ('visits', 'projectViews')`),
        d1Rows(DB, `SELECT COUNT(*) AS c FROM "ContactMessage"`),
      ]);
    const stat = (key: string): number => {
      const row = siteStatRows.find((r) => r.key === key);
      return row ? Number(row.value ?? 0) : 0;
    };
    const snapshot = (table: string): FallbackSnapshot | null => {
      const rows = d1Rows(DB, `SELECT "payloadJson", "updatedAt" FROM "${table}" WHERE "id" = 1`);
      const row = rows[0];
      return row
        ? { payloadJson: String(row.payloadJson), updatedAt: String(row.updatedAt) }
        : null;
    };

    const data = build({
      projects,
      articles,
      repoDemos: repoDemos as unknown as FallbackData["repoDemos"],
      repoMeta: repoMeta as unknown as FallbackData["repoMeta"],
      demoHealth: demoHealth as unknown as FallbackData["demoHealth"],
      siteStats: { visits: stat("visits"), projectViews: stat("projectViews"), messages: Number(messageCount[0]?.c ?? 0) },
      snapshots: { RepoSnapshot: snapshot("RepoSnapshot"), GithubSnapshot: snapshot("GithubSnapshot") },
    });
    writeFileSync(OUT, JSON.stringify(data));
    console.error(
      `export-fallback: wrote ${OUT} (projects=${data.projects.length}, articles=${data.articles.length}, visits=${data.siteStats.visits})`
    );
    return;
  }

  const inputPath = arg ?? "/tmp/fb-input.json";
  const raw = JSON.parse(readFileSync(inputPath, "utf8")) as Parameters<typeof build>[0];
  const data = build(raw);
  writeFileSync(OUT, JSON.stringify(data));
  console.error(
    `export-fallback: wrote ${OUT} (projects=${data.projects.length}, articles=${data.articles.length}, visits=${data.siteStats.visits})`
  );
}

void main();
