import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, store } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const { totals, topProjects, topArticles } = await store.adminStats();

    return NextResponse.json({
      totals,
      topProjects,
      topArticles,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "خطا در دریافت آمار" }, { status: 500 });
  }
}
