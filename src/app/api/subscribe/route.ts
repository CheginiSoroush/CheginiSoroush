import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Public: how many people are subscribed (used for the subtle counter)
export async function GET() {
  try {
    const count = await store.countSubscribers();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

// Public: join the newsletter (idempotent)
export async function POST(request: Request) {
  // Anti-abuse: 5 subscribe attempts per 10 minutes per IP.
  const rl = await checkRateLimit(request, "subscribe", 5, 600);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  try {
    const body = (await request.json().catch(() => null)) as { email?: string } | null;
    const email = (body?.email ?? "").trim().toLowerCase();

    if (!EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json(
        { ok: false, error: "invalid" },
        { status: 400 }
      );
    }

    const exists = await store.subscriberExists(email);
    if (exists) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    await store.addSubscriber(email);
    return NextResponse.json({ ok: true, duplicate: false });
  } catch (error) {
    console.error("POST /api/subscribe error:", error);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
