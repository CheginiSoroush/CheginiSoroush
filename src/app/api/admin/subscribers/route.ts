import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, store } from "@/lib/store";

// Admin: list newsletter subscribers (used for CSV export)
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
