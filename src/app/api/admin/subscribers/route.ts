import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, store } from "@/lib/store";

// Admin: list newsletter subscribers (used for CSV export + list management)
export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const subscribers = await store.listSubscribers();

    return NextResponse.json({ subscribers });
  } catch (error) {
    console.error("GET /api/admin/subscribers error:", error);
    return NextResponse.json({ error: "خطا در دریافت اعضا" }, { status: 500 });
  }
}

/**
 * Admin: remove one newsletter subscriber.
 * DELETE { email } → { ok: true } | 404 when the email is not subscribed.
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const body = (await request.json()) as { email?: string };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "email الزامی است" }, { status: 400 });
    }

    const deleted = await store.deleteSubscriber(email);
    if (!deleted) {
      return NextResponse.json({ error: "مشترک یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/subscribers error:", error);
    return NextResponse.json({ error: "خطا در حذف مشترک" }, { status: 500 });
  }
}
