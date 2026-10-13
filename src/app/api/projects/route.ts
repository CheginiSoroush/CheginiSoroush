import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

// Normalize Persian/Arabic chars so "گیمینی" style queries match consistently
function normalize(s: string) {
  return s.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/‌/g, " ").trim();
}

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

    return NextResponse.json({ projects: parsed });
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
