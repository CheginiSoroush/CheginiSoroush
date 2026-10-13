import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { GITHUB_HANDLE } from "@/lib/site-config";

const GITHUB_USER = GITHUB_HANDLE;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

type GitHubStats = {
  username: string;
  name: string;
  avatarUrl: string;
  bio: string;
  followers: number;
  publicRepos: number;
  totalStars: number;
  totalForks: number;
  topRepos: { name: string; description: string; stars: number; url: string; language: string | null }[];
  calendar: {
    totalContributions: number;
    days: { date: string; count: number }[];
  } | null;
  fetchedAt: number;
};

type GitHubCache = {
  data: GitHubStats | null;
  fetchedAt: number;
  inflight: Promise<GitHubStats | null> | null;
};

const globalForGithub = globalThis as unknown as {
  githubCache?: GitHubCache;
};

const cache: GitHubCache = (globalForGithub.githubCache ??= {
  data: null,
  fetchedAt: 0,
  inflight: null,
});

async function fetchContributionCalendar(headers: Record<string, string>): Promise<GitHubStats["calendar"]> {
  try {
    const query = `query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks { contributionDays { date contributionCount } }
          }
        }
      }
    }`;
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { login: GITHUB_USER } }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("GitHub GraphQL failed:", res.status);
      return null;
    }
    const json = (await res.json()) as {
      data?: {
        user?: {
          contributionsCollection?: {
            contributionCalendar?: {
              totalContributions: number;
              weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
            };
          };
        };
      };
    };
    const cal = json.data?.user?.contributionsCollection?.contributionCalendar;
    if (!cal) return null;
    return {
      totalContributions: cal.totalContributions,
      days: cal.weeks.flatMap((w) =>
        w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))
      ),
    };
  } catch (error) {
    console.error("fetchContributionCalendar error:", error);
    return null;
  }
}

async function fetchGitHubStats(): Promise<GitHubStats | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "imsoroush-portfolio",
    };
    // Optional token boost (rate limits) if provided via env
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USER}`, { headers, cache: "no-store" }),
      fetch(
        `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100&type=owner`,
        { headers, cache: "no-store" }
      ),
    ]);

    if (!userRes.ok || !reposRes.ok) {
      console.error("GitHub API failed:", userRes.status, reposRes.status);
      return null; // fall through to DB snapshot below
    }

    const calendarPromise = fetchContributionCalendar(headers);

    const user = (await userRes.json()) as {
      login: string;
      name: string | null;
      avatar_url: string;
      bio: string | null;
      followers: number;
      public_repos: number;
    };

    const repos = (await reposRes.json()) as Array<{
      name: string;
      description: string | null;
      stargazers_count: number;
      forks_count: number;
      html_url: string;
      language: string | null;
      fork: boolean;
    }>;

    const own = repos.filter((r) => !r.fork);
    const totalStars = own.reduce((s, r) => s + r.stargazers_count, 0);
    const totalForks = own.reduce((s, r) => s + r.forks_count, 0);

    const topRepos = [...own]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
      .map((r) => ({
        name: r.name,
        description: r.description ?? "",
        stars: r.stargazers_count,
        url: r.html_url,
        language: r.language,
      }));

    return {
      username: user.login,
      name: user.name ?? user.login,
      avatarUrl: user.avatar_url,
      bio: user.bio ?? "",
      followers: user.followers,
      publicRepos: user.public_repos,
      totalStars,
      totalForks,
      topRepos,
      calendar: await calendarPromise,
      fetchedAt: Date.now(),
    };
  } catch (error) {
    console.error("fetchGitHubStats error:", error);
    return null; // fall through to DB snapshot below
  }
}

async function readDbSnapshot(): Promise<GitHubStats | null> {
  try {
    const row = await store.getSnapshot("GithubSnapshot");
    if (!row) return null;
    const stats = JSON.parse(row.payloadJson) as GitHubStats;
    if (!stats || !stats.username) return null;
    return stats;
  } catch {
    return null;
  }
}

async function writeDbSnapshot(stats: GitHubStats): Promise<void> {
  try {
    await store.putSnapshot("GithubSnapshot", JSON.stringify(stats));
  } catch (error) {
    console.error("github snapshot write failed:", error);
  }
}

export async function GET() {
  const now = Date.now();

  // Fresh cache
  if (cache.data && now - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ ...cache.data, cached: true });
  }

  // Deduplicate concurrent requests
  if (!cache.inflight) {
    cache.inflight = (async () => {
      let data: GitHubStats | null = null;
      try {
        data = await fetchGitHubStats();
        if (data) {
          await writeDbSnapshot(data);
          cache.data = data;
          cache.fetchedAt = Date.now();
        }
      } finally {
        cache.inflight = null;
      }
      return data;
    })();
  }

  const data = await cache.inflight;
  if (!data) {
    // Live fetch failed → serve the last good snapshot from the DB, if any
    const stale = await readDbSnapshot();
    if (stale) {
      cache.data = stale;
      cache.fetchedAt = Date.now() - CACHE_TTL_MS / 2; // retry live in ~5 min
      return NextResponse.json({ ...stale, cached: true, stale: true });
    }
    return NextResponse.json({ error: "خطا در دریافت اطلاعات گیت‌هاب" }, { status: 502 });
  }

  return NextResponse.json({ ...data, cached: false });
}
