import { NextResponse } from "next/server";

// Legacy URL — the OG image used to be rendered on-demand by
// src/app/opengraph-image.tsx (slow on Cloudflare, caused camo 502s).
// It is now a static file: src/app/opengraph-image.png. Keep this
// redirect so old shared links keep working.
export function GET(request: Request) {
  const url = new URL("/opengraph-image.png", request.url);
  return NextResponse.redirect(url, 308);
}
