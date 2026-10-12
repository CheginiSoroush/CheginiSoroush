import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function isAdminRequest(request: NextRequest): boolean {
  const expected = process.env.ADMIN_KEY || "imsoroush-admin";
  const provided = request.headers.get("x-admin-key") ?? "";
  return provided.length > 0 && provided === expected;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "8") || 8));
    const filter = searchParams.get("filter") === "unread" ? "unread" : "all";

    const where = filter === "unread" ? { read: false } : {};

    const [messages, total, unread] = await Promise.all([
      db.contactMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.contactMessage.count({ where }),
      db.contactMessage.count({ where: { read: false } }),
    ]);

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

    const updated = await db.contactMessage.update({
      where: { id: body.id },
      data: { read: body.read },
    });

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

    await db.contactMessage.delete({ where: { id: body.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/messages error:", error);
    return NextResponse.json({ error: "خطا در حذف پیام" }, { status: 500 });
  }
}
