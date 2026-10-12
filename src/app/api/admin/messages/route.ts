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

    const messages = await db.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ messages });
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
