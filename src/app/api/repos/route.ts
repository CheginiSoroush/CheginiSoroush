import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { GitHubRepo } from "@/lib/types";

/**
 * /api/repos — Soroush's public GitHub repositories.
 *
 * GitHub's REST API is aggressively rate-limited (60 req/h per IP, often
 * exhausted on shared hosting IPs → 403). Strategy, in order:
 *   1. In-memory cache, fresh for 10 minutes.
 *   2. Live GitHub fetch (with optional GITHUB_TOKEN) → persisted to the
 *      RepoSnapshot table so the data survives server restarts.
 *   3. DB snapshot (stale, flagged) → 4. built-in seed list (last resort).
 */

const GITHUB_USER = "CheginiSoroush";
const MEMORY_TTL_MS = 10 * 60 * 1000;

type ReposPayload = {
  repos: GitHubRepo[];
  source: "live" | "db" | "seed";
  fetchedAt: number;
};

type Cache = {
  data: ReposPayload | null;
  inflight: Promise<ReposPayload> | null;
};

const globalForRepos = globalThis as unknown as { reposCache?: Cache };
const cache: Cache = (globalForRepos.reposCache ??= { data: null, inflight: null });

function mapRepo(r: {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  archived: boolean;
  topics?: string[];
  homepage: string | null;
  pushed_at: string;
  updated_at: string;
}): GitHubRepo {
  return {
    name: r.name,
    url: r.html_url,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count ?? 0,
    forks: r.forks_count ?? 0,
    isFork: Boolean(r.fork),
    archived: Boolean(r.archived),
    topics: Array.isArray(r.topics) ? r.topics.slice(0, 6) : [],
    homepage: r.homepage || null,
    pushedAt: r.pushed_at,
    updatedAt: r.updated_at,
  };
}

async function fetchFromGitHub(): Promise<GitHubRepo[] | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "imsoroush-portfolio",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed&type=owner`,
      { headers, cache: "no-store" }
    );
    if (!res.ok) {
      console.error("/api/repos GitHub failed:", res.status);
      return null;
    }
    const list = (await res.json()) as Parameters<typeof mapRepo>[0][];
    if (!Array.isArray(list)) return null;
    return list.map(mapRepo);
  } catch (error) {
    console.error("/api/repos fetch error:", error);
    return null;
  }
}

async function readDbSnapshot(): Promise<ReposPayload | null> {
  try {
    const row = await db.repoSnapshot.findUnique({ where: { id: 1 } });
    if (!row) return null;
    const repos = JSON.parse(row.payloadJson) as GitHubRepo[];
    if (!Array.isArray(repos) || repos.length === 0) return null;
    return { repos, source: "db", fetchedAt: new Date(row.updatedAt).getTime() };
  } catch {
    return null;
  }
}

async function writeDbSnapshot(repos: GitHubRepo[]): Promise<void> {
  try {
    await db.repoSnapshot.upsert({
      where: { id: 1 },
      create: { id: 1, payloadJson: JSON.stringify(repos) },
      update: { payloadJson: JSON.stringify(repos) },
    });
  } catch (error) {
    console.error("/api/repos snapshot write failed:", error);
  }
}

/** Built-in fallback matching Soroush's public repos (scraped 2025-11). */
const SEED_PAYLOAD: ReposPayload = {
  source: "seed",
  fetchedAt: 0,
  repos: [
    {
      name: "obsidian-sync-scripts",
      url: "https://github.com/CheginiSoroush/obsidian-sync-scripts",
      description:
        "⚡ One Bash script. Three platforms. Battle-hardened Obsidian ↔ GitHub sync — verified backups, atomic repair, self-healing git. Termux · Linux · macOS",
      language: "Shell",
      stars: 0,
      forks: 0,
      isFork: false,
      archived: false,
      topics: ["obsidian", "bash", "sync", "backup", "termux"],
      homepage: null,
      pushedAt: "2025-11-01T00:00:00Z",
      updatedAt: "2025-11-01T00:00:00Z",
    },
    {
      name: "obsidian-project-quest",
      url: "https://github.com/CheginiSoroush/obsidian-project-quest",
      description:
        "🦉 Turn your projects into a game! A bilingual (EN/FA) Duolingo-style Obsidian vault template — XP, streaks, levels, badges & live dashboards.",
      language: "TypeScript",
      stars: 0,
      forks: 0,
      isFork: false,
      archived: false,
      topics: ["obsidian", "gamification", "template", "productivity"],
      homepage: null,
      pushedAt: "2025-10-01T00:00:00Z",
      updatedAt: "2025-10-01T00:00:00Z",
    },
    {
      name: "ubuntu-optimizer",
      url: "https://github.com/CheginiSoroush/ubuntu-optimizer",
      description: null,
      language: "Shell",
      stars: 0,
      forks: 0,
      isFork: false,
      archived: false,
      topics: ["ubuntu", "linux", "optimization"],
      homepage: null,
      pushedAt: "2025-09-01T00:00:00Z",
      updatedAt: "2025-09-01T00:00:00Z",
    },
    {
      name: "projdump",
      url: "https://github.com/CheginiSoroush/projdump",
      description: null,
      language: "Shell",
      stars: 0,
      forks: 0,
      isFork: false,
      archived: false,
      topics: ["cli", "shell"],
      homepage: null,
      pushedAt: "2025-08-01T00:00:00Z",
      updatedAt: "2025-08-01T00:00:00Z",
    },
    {
      name: "flash-panel",
      url: "https://github.com/CheginiSoroush/flash-panel",
      description: null,
      language: "JavaScript",
      stars: 0,
      forks: 0,
      isFork: false,
      archived: false,
      topics: [],
      homepage: null,
      pushedAt: "2025-07-01T00:00:00Z",
      updatedAt: "2025-07-01T00:00:00Z",
    },
    {
      name: "flash-wizard",
      url: "https://github.com/CheginiSoroush/flash-wizard",
      description: null,
      language: "C++",
      stars: 0,
      forks: 0,
      isFork: false,
      archived: false,
      topics: [],
      homepage: null,
      pushedAt: "2025-06-01T00:00:00Z",
      updatedAt: "2025-06-01T00:00:00Z",
    },
    {
      name: "cpp-calculator",
      url: "https://github.com/CheginiSoroush/cpp-calculator",
      description: null,
      language: "JavaScript",
      stars: 0,
      forks: 0,
      isFork: false,
      archived: false,
      topics: ["cpp", "calculator"],
      homepage: null,
      pushedAt: "2025-05-01T00:00:00Z",
      updatedAt: "2025-05-01T00:00:00Z",
    },
    {
      name: "KV-Dumper",
      url: "https://github.com/CheginiSoroush/KV-Dumper",
      description: null,
      language: "JavaScript",
      stars: 0,
      forks: 0,
      isFork: false,
      archived: false,
      topics: ["cloudflare", "kv"],
      homepage: null,
      pushedAt: "2025-04-01T00:00:00Z",
      updatedAt: "2025-04-01T00:00:00Z",
    },
  ],
};

async function load(): Promise<ReposPayload> {
  // 1. fresh memory cache
  if (cache.data && Date.now() - cache.data.fetchedAt < MEMORY_TTL_MS) {
    return cache.data;
  }
  // 2. live fetch (dedup concurrent)
  if (!cache.inflight) {
    cache.inflight = (async () => {
      let payload: ReposPayload;
      const live = await fetchFromGitHub();
      if (live) {
        await writeDbSnapshot(live);
        payload = { repos: live, source: "live", fetchedAt: Date.now() };
      } else {
        payload = (await readDbSnapshot()) ?? SEED_PAYLOAD;
      }
      cache.data = payload;
      cache.inflight = null;
      return payload;
    })();
  }
  return cache.inflight;
}

export async function GET(request: Request) {
  const refresh = new URL(request.url).searchParams.get("refresh") === "1";
  if (refresh) {
    cache.data = null; // bypass fresh memory cache
  }
  const payload = await load();
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store" },
  });
}
