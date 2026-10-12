import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function isAdminRequest(request: NextRequest): boolean {
  const expected = process.env.ADMIN_KEY || "imsoroush-admin";
  const provided = request.headers.get("x-admin-key") ?? "";
  return provided.length > 0 && provided === expected;
}

// Admin: list newsletter subscribers (used for CSV export)
export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const subscribers = await db.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      select: { email: true, createdAt: true },
    });

    return NextResponse.json({ subscribers });
  } catch (error) {
    console.error("GET /api/admin/subscribers error:", error);
    return NextResponse.json({ error: "خطا در دریافت اعضا" }, { status: 500 });
  }
}
