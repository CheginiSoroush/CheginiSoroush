import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, store } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "8") || 8));
    const filter = searchParams.get("filter") === "unread" ? "unread" : "all";

    const { messages, total, unread } = await store.listMessages({
      page,
      pageSize,
      unreadOnly: filter === "unread",
    });

    return NextResponse.json({
      messages,
      total,
      unread,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    console.error("GET /api/admin/messages error:", error);
    return NextResponse.json({ error: "خطا در دریافت پیام‌ها" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const body = (await request.json()) as { id?: string; read?: boolean };
    if (!body.id || typeof body.read !== "boolean") {
      return NextResponse.json({ error: "id و read الزامی هستند" }, { status: 400 });
    }

    const updated = await store.setMessageRead(body.id, body.read);
    if (!updated) {
      return NextResponse.json({ error: "پیام یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: updated });
  } catch (error) {
    console.error("PATCH /api/admin/messages error:", error);
    return NextResponse.json({ error: "خطا در به‌روزرسانی پیام" }, { status: 500 });
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

    await store.deleteMessage(body.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/messages error:", error);
    return NextResponse.json({ error: "خطا در حذف پیام" }, { status: 500 });
  }
}
