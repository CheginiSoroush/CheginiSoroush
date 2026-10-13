import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? "all";
    const slug = searchParams.get("slug");

    if (slug) {
      const article = await store.getArticle(slug);
      if (!article) {
        return NextResponse.json({ error: "مقاله یافت نشد" }, { status: 404 });
      }
      return NextResponse.json({ article });
    }

    const articles = await store.listArticles(category);

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("GET /api/articles error:", error);
    return NextResponse.json({ error: "خطا در دریافت مقالات" }, { status: 500 });
  }
}

// Increment article views — or toggle likes via { action: "like" | "unlike" }
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { slug?: string; action?: "view" | "like" | "unlike" };
    if (!body.slug) {
      return NextResponse.json({ error: "slug الزامی است" }, { status: 400 });
    }

    if (body.action === "like" || body.action === "unlike") {
      const current = await store.getArticleLikes(body.slug);
      if (current === null) {
        return NextResponse.json({ error: "مقاله یافت نشد" }, { status: 404 });
      }
      const likes = body.action === "like" ? current + 1 : Math.max(0, current - 1);
      await store.setArticleLikes(body.slug, likes);
      return NextResponse.json({ likes });
    }

    const views = await store.incrArticleViews(body.slug);
    if (views === null) {
      return NextResponse.json({ error: "مقاله یافت نشد" }, { status: 404 });
    }
    return NextResponse.json({ views });
  } catch (error) {
    console.error("POST /api/articles error:", error);
    return NextResponse.json({ error: "خطا در ثبت بازدید" }, { status: 500 });
  }
}
