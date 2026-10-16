import { store } from "@/lib/store";

/**
 * Fixed-window per-IP rate limiter for the public POST endpoints
 * (contact / subscribe / comments).
 *
 * Counters live in the datastore — D1 on Workers, SQLite in dev — so limits
 * hold across Worker isolates and deploys. Windows are fixed buckets: the
 * window start is `floor(now / windowSec) * windowSec`, which keeps the math
 * cheap and makes Retry-After exact.
 *
 * Design notes:
 *  - Fails OPEN: if the datastore is unreachable the request passes through.
 *    Anti-abuse must never break a legitimate contact form.
 *  - Counts attempts before validation, so invalid-payload floods are
 *    throttled too (a real user very rarely fails validation `limit` times).
 *  - Client IP prefers Cloudflare's verified header and falls back to the
 *    first X-Forwarded-For hop (dev).
 */

export type RateLimitResult = {
  ok: boolean;
  /** How many requests are still allowed in this window (when ok). */
  remaining: number;
  /** Seconds until the current window ends (only meaningful when blocked). */
  retryAfterSec: number;
};

/** Stale counter rows older than this are pruned lazily. */
const CLEANUP_HORIZON_SEC = 86_400;

export async function checkRateLimit(
  request: Request,
  bucket: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSec) * windowSec;
  const key = `${bucket}:${ip}`;

  try {
    const count = await store.incrementRateLimit(key, windowStart, now - CLEANUP_HORIZON_SEC);
    if (count <= limit) {
      return { ok: true, remaining: limit - count, retryAfterSec: 0 };
    }
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, windowStart + windowSec - now),
    };
  } catch (error) {
    console.error(`rate-limit(${bucket}) store error — failing open:`, error);
    return { ok: true, remaining: limit, retryAfterSec: 0 };
  }
}

/** Shared JSON response for a blocked request (429 + Persian message). */
export function rateLimitResponse(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error: "درخواست‌های زیادی ارسال شد؛ لطفاً چند دقیقه بعد دوباره تلاش کن.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Retry-After": String(retryAfterSec),
        "Cache-Control": "no-store",
      },
    }
  );
}
