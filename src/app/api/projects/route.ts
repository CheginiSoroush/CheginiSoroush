import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

// Normalize Persian/Arabic chars so "گیمینی" style queries match consistently
function normalize(s: string) {
  return s.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/‌/g, " ").trim();
}

const safeHost = (url: string): string | null => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? "all";
    const q = normalize(searchParams.get("q") ?? "");
    const featured = searchParams.get("featured");
    const sort = searchParams.get("sort") === "views" ? "views" : "default";

    const projects = await store.listProjects({
      category,
      q,
      featured: featured === "true",
      sort,
    });

    const parsed = projects.map((p) => ({
      ...p,
      tags: JSON.parse(p.tags) as string[],
    }));

    // Auto-sync enrichment: latest release + commit activity per repo,
    // demo-host health (uptime dot) and the global "trending" flag
    // (top-3 most-viewed rows of the whole catalog, not per-filter).
    let metaByRepo = new Map<
      string,
      { latestTag: string | null; latestTagAt: string | null; commitActivity: string }
    >();
    let healthByHost = new Map<string, boolean>();
    try {
      const [metaRows, healthRows] = await Promise.all([
        store.listRepoMeta(),
        store.listDemoHealth(),
      ]);
      metaByRepo = new Map(
        metaRows.map((m) => [
          m.repo,
          { latestTag: m.latestTag, latestTagAt: m.latestTagAt, commitActivity: m.commitActivity },
        ])
      );
      healthByHost = new Map(healthRows.map((h) => [h.host, h.ok]));
    } catch (error) {
      // Tables may not exist yet right after a fresh deploy — degrade quietly.
      console.error("/api/projects auto-sync tables unavailable:", error);
    }

    const trendingSlugs = new Set(
      [...projects]
        .filter((p) => p.views > 0)
        .sort((a, b) => b.views - a.views)
        .slice(0, 3)
        .map((p) => p.slug)
    );

    const enriched = parsed.map((p) => {
      const name = p.repo.includes("/") ? p.repo.split("/").pop()! : p.repo;
      const meta = metaByRepo.get(name);
      const host = p.demoUrl ? safeHost(p.demoUrl) : null;
      let activity: number[] = [];
      if (meta) {
        try {
          activity = JSON.parse(meta.commitActivity) as number[];
        } catch {
          activity = [];
        }
      }
      return {
        ...p,
        latestTag: meta?.latestTag ?? null,
        latestTagAt: meta?.latestTagAt ?? null,
        commitActivity: activity,
        demoOk: host ? (healthByHost.has(host) ? healthByHost.get(host)! : null) : null,
        trending: trendingSlugs.has(p.slug),
      };
    });

    return NextResponse.json({ projects: enriched });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: "خطا در دریافت پروژه‌ها" }, { status: 500 });
  }
}

// Increment project view counter (also bumps global projectViews stat)
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { slug?: string };
    if (!body.slug) {
      return NextResponse.json({ error: "slug الزامی است" }, { status: 400 });
    }

    const views = await store.incrProjectViews(body.slug);
    if (views === null) {
      return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });
    }

    await store.bumpProjectViewsStat();

    return NextResponse.json({ views });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: "خطا در ثبت بازدید" }, { status: 500 });
  }
}
