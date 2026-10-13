import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

// Basic per-IP posting throttle (in-memory)
const postHits = new Map<string, number[]>();
const POST_WINDOW_MS = 60 * 1000;
const POST_MAX = 3;

function tooManyPosts(ip: string) {
  const now = Date.now();
  const hits = (postHits.get(ip) ?? []).filter((t) => now - t < POST_WINDOW_MS);
  if (hits.length >= POST_MAX) {
    postHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  postHits.set(ip, hits);
  return false;
}

// Persian-friendly normalization
function normalizeFa(s: string) {
  return s
    .replace(/[يﻱﻲ]/g, "ی")
    .replace(/[كﮐﮑ]/g, "ک")
    .replace(/[\u200c\s]+/g, " ")
    .trim();
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1") || 1);

  if (!slug) return badRequest("slug الزامی است.");

  try {
    const { comments, total } = await store.listComments(slug, page, PAGE_SIZE);

    return NextResponse.json({
      comments,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    console.error("GET /api/comments error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (tooManyPosts(ip)) {
    return NextResponse.json(
      { error: "پیام‌ها زیاد است؛ کمی صبر کنید و دوباره تلاش کنید." },
      { status: 429 }
    );
  }

  let payload: { slug?: string; name?: string; body?: string };
  try {
    payload = (await req.json()) as { slug?: string; name?: string; body?: string };
  } catch {
    return badRequest("بدنه درخواست معتبر نیست.");
  }

  const slug = payload.slug?.trim() ?? "";
  const name = normalizeFa(payload.name ?? "").slice(0, 40);
  const body = normalizeFa(payload.body ?? "").slice(0, 1000);

  if (!slug) return badRequest("slug الزامی است.");
  if (name.length < 2) return badRequest("نام باید حداقل ۲ حرف باشد.");
  if (body.length < 3) return badRequest("متن دیدگاه باید حداقل ۳ حرف باشد.");

  // Reject obviously spammy content
  if (/(https?:\/\/|t\.me\/|@admin|winmoney|bet|کازینو)/i.test(body)) {
    return badRequest("ارسال لینک و تبلیغ در دیدگاه‌ها مجاز نیست.");
  }

  try {
    const exists = await store.articleExists(slug);
    if (!exists) return badRequest("نوشته پیدا نشد.");

    const created = await store.createComment({ articleSlug: slug, name, body });
    const total = await store.countComments(slug);

    return NextResponse.json({ comment: created, total }, { status: 201 });
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
