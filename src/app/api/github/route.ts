import { NextResponse } from "next/server";

const GITHUB_USER = "CheginiSoroush";
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
      return cache.data; // serve stale on failure
    }

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
      fetchedAt: Date.now(),
    };
  } catch (error) {
    console.error("fetchGitHubStats error:", error);
    return cache.data; // serve stale on failure
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
    cache.inflight = fetchGitHubStats().then((data) => {
      if (data) {
        cache.data = data;
        cache.fetchedAt = Date.now();
      }
      cache.inflight = null;
      return data;
    });
  }

  const data = await cache.inflight;
  if (!data) {
    return NextResponse.json({ error: "خطا در دریافت اطلاعات گیت‌هاب" }, { status: 502 });
  }

  return NextResponse.json({ ...data, cached: false });
}
