import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

/**
 * Public per-article comments.
 *
 *  GET  /api/comments?slug=<articleSlug> → { comments: CommentRow[] }
 *  POST { articleSlug, name, body }       → { ok, comment }
 *
 * Validation mirrors /api/contact (plain string checks — no deps). The
 * articleSlug is verified against the Article table so comments can only be
 * attached to real articles. Content is rendered as plain text by React
 * (auto-escaping), so no HTML sanitization is needed.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = (searchParams.get("slug") ?? "").trim();
    if (!slug) {
      return NextResponse.json({ error: "slug الزامی است" }, { status: 400 });
    }

    const comments = await store.listComments(slug);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("GET /api/comments error:", error);
    return NextResponse.json({ error: "خطا در دریافت دیدگاه‌ها" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      articleSlug?: string;
      name?: string;
      body?: string;
    };

    const articleSlug = body.articleSlug?.trim() ?? "";
    const name = body.name?.trim() ?? "";
    const text = body.body?.trim() ?? "";

    const errors: Record<string, string> = {};
    if (!articleSlug) errors.articleSlug = "slug الزامی است";
    if (name.length < 2) errors.name = "نام باید حداقل ۲ حرف باشد";
    if (name.length > 60) errors.name = "نام حداکثر ۶۰ حرف است";
    if (text.length < 2) errors.body = "متن دیدگاه خیلی کوتاه است";
    if (text.length > 1000) errors.body = "دیدگاه حداکثر ۱۰۰۰ حرف است";

    if (Object.keys(errors).length === 0) {
      // Attach only to real articles — blocks junk rows for random slugs.
      const article = await store.getArticle(articleSlug);
      if (!article) errors.articleSlug = "مقاله یافت نشد";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "اطلاعات دیدگاه معتبر نیست", errors },
        { status: 400 }
      );
    }

    const comment = await store.createComment({ articleSlug, name, body: text });

    return NextResponse.json({
      ok: true,
      comment,
      message: "دیدگاه شما ثبت شد. ممنون!",
    });
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json({ error: "خطای سرور در ثبت دیدگاه" }, { status: 500 });
  }
}
