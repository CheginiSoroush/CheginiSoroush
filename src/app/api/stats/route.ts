import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  try {
    return NextResponse.json(await store.readStats());
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "خطا در دریافت آمار" }, { status: 500 });
  }
}

// Increment site visits (called once per session from the client)
export async function POST() {
  try {
    await store.incrVisits();
    return NextResponse.json(await store.readStats());
  } catch (error) {
    console.error("POST /api/stats error:", error);
    return NextResponse.json({ error: "خطا در ثبت بازدید" }, { status: 500 });
  }
}
