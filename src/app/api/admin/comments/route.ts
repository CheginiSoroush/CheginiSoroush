import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, store } from "@/lib/store";

/**
 * Admin comment moderation.
 *
 *  GET    → { comments: AdminCommentRow[], total }  (newest first, joined with article meta)
 *  DELETE { id }                                    → { ok } | 404
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const comments = await store.listAllComments();
    return NextResponse.json({ comments, total: comments.length });
  } catch (error) {
    console.error("GET /api/admin/comments error:", error);
    return NextResponse.json({ error: "خطا در دریافت دیدگاه‌ها" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "id الزامی است" }, { status: 400 });
    }

    const deleted = await store.deleteComment(body.id);
    if (!deleted) {
      return NextResponse.json({ error: "دیدگاه یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/comments error:", error);
    return NextResponse.json({ error: "خطا در حذف دیدگاه" }, { status: 500 });
  }
}
