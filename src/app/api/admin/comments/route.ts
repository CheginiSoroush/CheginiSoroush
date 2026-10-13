import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("pageSize") ?? "10") || 10));

  try {
    const { comments, total } = await store.listAllComments(page, pageSize);

    return NextResponse.json({
      comments,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    console.error("GET /api/admin/comments error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) return NextResponse.json({ error: "id الزامی است" }, { status: 400 });

    await store.deleteComment(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/comments error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
