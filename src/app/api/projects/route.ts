import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    const where: {
      category?: string;
      featured?: boolean;
      OR?: Array<
        | { title: { contains: string } }
        | { description: { contains: string } }
        | { repo: { contains: string } }
        | { tags: { contains: string } }
      >;
    } = {};

    if (category && category !== "all") where.category = category;
    if (featured === "true") where.featured = true;
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { repo: { contains: q } },
        { tags: { contains: q } },
      ];
    }

    const projects = await db.project.findMany({
      where,
      orderBy:
        sort === "views"
          ? [{ views: "desc" }, { featured: "desc" }, { order: "asc" }]
          : [{ featured: "desc" }, { order: "asc" }],
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

    const project = await db.project.update({
      where: { slug: body.slug },
      data: { views: { increment: 1 } },
    });

    await db.siteStat.upsert({
      where: { key: "projectViews" },
      update: { value: { increment: 1 } },
      create: { key: "projectViews", value: 1 },
    });

    return NextResponse.json({ views: project.views });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: "خطا در ثبت بازدید" }, { status: 500 });
  }
}
