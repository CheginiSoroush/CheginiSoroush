import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Public: how many people are subscribed (used for the subtle counter)
export async function GET() {
  try {
    const count = await db.subscriber.count();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

// Public: join the newsletter (idempotent)
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { email?: string } | null;
    const email = (body?.email ?? "").trim().toLowerCase();

    if (!EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json(
        { ok: false, error: "invalid" },
        { status: 400 }
      );
    }

    const existing = await db.subscriber.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    await db.subscriber.create({ data: { email } });
    return NextResponse.json({ ok: true, duplicate: false });
  } catch (error) {
    console.error("POST /api/subscribe error:", error);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}

// r10: force rebuild after prisma client regeneration
