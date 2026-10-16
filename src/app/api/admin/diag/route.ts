import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/store";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Admin-only D1 health probe.
 *
 * Runs a battery of tiny queries against the production D1 binding and
 * reports the RAW error for every step, so storage outages can be
 * diagnosed from outside the Cloudflare dashboard (no `wrangler tail`
 * required). Also introspects the actual sqlite_master schema of the
 * tables the site depends on, catching drifted/missing constraints.
 *
 * Always safe: read-only statements plus a temporary `__diag__` upsert row
 * that is deleted again in the same request.
 */

interface StmtLike {
  bind(...v: unknown[]): StmtLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

function binding(): { ok: true; db: { prepare(sql: string): StmtLike } } | { ok: false; error: string } {
  try {
    const ctx = getCloudflareContext() as unknown as { env?: { DB?: { prepare(sql: string): StmtLike } } };
    const db = ctx?.env?.DB;
    if (!db) return { ok: false, error: "D1 binding `DB` is not available in this environment" };
    return { ok: true, db };
  } catch (error) {
    return { ok: false, error: describe(error) };
  }
}

function describe(error: unknown): string {
  if (error instanceof Error) {
    const cause = error.cause ? ` | cause: ${String(error.cause).slice(0, 300)}` : "";
    return `${error.name}: ${error.message}${cause}`;
  }
  return String(error).slice(0, 400);
}

type Probe = { name: string; run: (db: { prepare(sql: string): StmtLike }) => Promise<unknown> };

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const b = binding();
  if (!b.ok) {
    return NextResponse.json({ binding: b.error, probedAt: new Date().toISOString() }, { status: 200 });
  }
  const db = b.db;

  const probes: Probe[] = [
    { name: "select1", run: async (db) => (await db.prepare(`SELECT 1 AS one`).first<{ one: number }>())?.one },
    {
      name: "tables",
      run: async (db) =>
        (
          await db
            .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
            .all<{ name: string }>()
        ).results.map((r) => r.name),
    },
    {
      name: "schema:SiteStat",
      run: async (db) =>
        (await db.prepare(`SELECT sql FROM sqlite_master WHERE name = 'SiteStat'`).first<{ sql: string }>())?.sql,
    },
    {
      name: "schema:Project",
      run: async (db) =>
        (await db.prepare(`SELECT sql FROM sqlite_master WHERE name = 'Project'`).first<{ sql: string }>())?.sql,
    },
    {
      name: "schema:Article",
      run: async (db) =>
        (await db.prepare(`SELECT sql FROM sqlite_master WHERE name = 'Article'`).first<{ sql: string }>())?.sql,
    },
    {
      name: "read:visits",
      run: async (db) =>
        (await db.prepare(`SELECT value FROM "SiteStat" WHERE key = 'visits'`).first<{ value: number }>())?.value,
    },
    {
      name: "read:projectCount",
      run: async (db) => (await db.prepare(`SELECT COUNT(*) AS c FROM "Project"`).first<{ c: number }>())?.c,
    },
    {
      name: "read:articleCount",
      run: async (db) => (await db.prepare(`SELECT COUNT(*) AS c FROM "Article"`).first<{ c: number }>())?.c,
    },
    {
      name: "write:upsert-diag-row",
      run: async (db) => {
        const key = `__diag__${Date.now()}`;
        await db
          .prepare(
            `INSERT INTO "SiteStat" ("key", "value", "updatedAt") VALUES (?, 1, ?)
             ON CONFLICT("key") DO UPDATE SET "value" = "SiteStat"."value" + 1, "updatedAt" = excluded."updatedAt"`
          )
          .bind(key, new Date().toISOString())
          .run();
        const row = await db.prepare(`SELECT value FROM "SiteStat" WHERE key = ?`).bind(key).first<{ value: number }>();
        await db.prepare(`DELETE FROM "SiteStat" WHERE key = ?`).bind(key).run();
        return { key, valueAfterUpsert: row ? Number(row.value) : null, cleaned: true };
      },
    },
  ];

  const results: Record<string, unknown> = {};
  await Promise.all(
    probes.map(async (p) => {
      try {
        results[p.name] = { ok: true, data: await p.run(db) };
      } catch (error) {
        results[p.name] = { ok: false, error: describe(error) };
      }
    })
  );

  const failed = Object.values(results).filter((r) => !(r as { ok: boolean }).ok).length;

  return NextResponse.json(
    {
      binding: "ok",
      failedProbes: failed,
      probedAt: new Date().toISOString(),
      results,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
