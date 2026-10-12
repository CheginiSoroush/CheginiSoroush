import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? "all";
    const slug = searchParams.get("slug");

    if (slug) {
      const article = await db.article.findUnique({ where: { slug } });
      if (!article) {
        return NextResponse.json({ error: "مقاله یافت نشد" }, { status: 404 });
      }
      return NextResponse.json({ article });
    }

    const where: { category?: string } = {};
    if (category && category !== "all") where.category = category;

    const articles = await db.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("GET /api/articles error:", error);
    return NextResponse.json({ error: "خطا در دریافت مقالات" }, { status: 500 });
  }
}

// Increment article views
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { slug?: string };
    if (!body.slug) {
      return NextResponse.json({ error: "slug الزامی است" }, { status: 400 });
    }
    const article = await db.article.update({
      where: { slug: body.slug },
      data: { views: { increment: 1 } },
    });
    return NextResponse.json({ views: article.views });
  } catch (error) {
    console.error("POST /api/articles error:", error);
    return NextResponse.json({ error: "خطا در ثبت بازدید" }, { status: 500 });
  }
}
