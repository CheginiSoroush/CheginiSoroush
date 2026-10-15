import { NextResponse, type NextRequest } from "next/server";

/**
 * Canonical host enforcement — www.imsoroush.ir → imsoroush.ir (308).
 *
 * The apex is the canonical host (metadataBase, JSON-LD and canonical
 * links all point at https://imsoroush.ir). Once `www` is attached on the
 * Cloudflare zone, this keeps every www URL answering with one permanent
 * redirect to the same path on the apex — single host, no duplicate content.
 *
 * Note: Next.js 16 renamed middleware.ts → proxy.ts; this runs inside the
 * OpenNext Cloudflare Worker. The primary www redirect lives at the edge
 * (zone-level Redirect Rule), this is belt-and-braces so the behaviour
 * survives even if www is ever routed to the Worker itself.
 */
const APEX_HOST = "imsoroush.ir";
const WWW_HOST = `www.${APEX_HOST}`;

export default function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "")
    .toLowerCase()
    .split(":")[0];

  if (host !== WWW_HOST) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = APEX_HOST;
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Everything except Next.js internals and host-agnostic static assets —
  // redirecting immutable files would only add a pointless round-trip.
  matcher: [
    "/((?!_next/static|_next/image|photos/|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
