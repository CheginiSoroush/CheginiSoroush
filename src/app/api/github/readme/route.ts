import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/github/readme?repo=owner/name
 *
 * Server-side README proxy for the project detail dialog. Fetches the raw
 * README from GitHub (authenticated with GITHUB_TOKEN when present, so
 * private repos work too) and returns plain markdown. The client renders it
 * with react-markdown — raw HTML is never executed.
 *
 * In-memory cache (30 min) keeps repeated dialog opens free of GitHub calls.
 */

const MEMORY_TTL_MS = 30 * 60 * 1000;

const globalForReadme = globalThis as unknown as {
  readmeCache?: Map<string, { content: string | null; at: number }>;
};
const cache = (globalForReadme.readmeCache ??= new Map());

const EXTERNAL_PREFIX = /^(https?:)?\/\//i;

/**
 * GitHub READMEs use repo-relative image/link URLs which would resolve
 * against imsoroush.ir and 404. Rewrite them to raw.githubusercontent.com
 * (HEAD = default branch). External, anchor, mailto and data URLs pass
 * through untouched. Handles both HTML (src=/href=) and markdown ](..) forms.
 */
function absolutize(markdown: string, repo: string): string {
  const base = `https://raw.githubusercontent.com/${repo}/HEAD/`;
  const ok = (url: string) =>
    !EXTERNAL_PREFIX.test(url) &&
    !url.startsWith("#") &&
    !url.startsWith("mailto:") &&
    !url.startsWith("data:") &&
    !url.includes("{{") &&
    !url.startsWith("$");

  const withBase = (url: string) =>
    `${base}${url.replace(/^\.\//, "").replace(/^\//, "")}`;

  return markdown
    .replace(/(src|href)=(["'])([^"']+)\2/g, (m, attr, quote, url) =>
      ok(url) ? `${attr}=${quote}${withBase(url)}${quote}` : m
    )
    .replace(/\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (m, url, title = "") =>
      ok(url) ? `](${withBase(url)})${title}` : m
    );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repo = (searchParams.get("repo") ?? "").trim();

  // Strict allowlist: only "owner/name" with safe chars — this endpoint must
  // never become an open proxy to arbitrary URLs.
  if (!/^[A-Za-z0-9_.-]{1,60}\/[A-Za-z0-9_.-]{1,60}$/.test(repo)) {
    return NextResponse.json({ error: "invalid repo" }, { status: 400 });
  }

  const cached = cache.get(repo);
  if (cached && Date.now() - cached.at < MEMORY_TTL_MS) {
    return NextResponse.json(
      { content: cached.content, source: "cache" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.raw+json",
      "User-Agent": "imsoroush-portfolio",
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`https://api.github.com/repos/${repo}/readme`, {
      headers,
      cache: "no-store",
    });

    const raw = res.ok ? await res.text() : null;
    // Rewrite repo-relative asset URLs before handing markdown to the client.
    const content = raw ? absolutize(raw, repo) : null;
    cache.set(repo, { content, at: Date.now() });

    return NextResponse.json(
      { content, source: "live" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("/api/github/readme error:", error);
    return NextResponse.json(
      { content: null, source: "error" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
