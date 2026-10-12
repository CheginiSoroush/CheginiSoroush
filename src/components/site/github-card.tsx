"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Users, GitFork, FolderGit2, RefreshCw, ExternalLink } from "lucide-react";

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
  cached?: boolean;
};

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  HTML: "#e34c26",
  CSS: "#563d7c",
  "C++": "#f34b7d",
  C: "#555555",
  Shell: "#89e051",
  Dart: "#00B4AB",
  Vue: "#41b883",
};

function fa(n: number) {
  return n.toLocaleString("fa-IR");
}

export function GitHubCard() {
  const [stats, setStats] = useState<GitHubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = async (showSpinner: boolean) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/github");
      if (!res.ok) throw new Error("github fetch failed");
      const data = (await res.json()) as GitHubStats;
      setStats(data);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load(false);
  }, []);

  const statItems = stats
    ? [
        { icon: <FolderGit2 className="w-4 h-4" />, label: "ریپوی عمومی", value: stats.publicRepos },
        { icon: <Star className="w-4 h-4" />, label: "ستاره", value: stats.totalStars },
        { icon: <GitFork className="w-4 h-4" />, label: "فورک", value: stats.totalForks },
        { icon: <Users className="w-4 h-4" />, label: "دنبال‌کننده", value: stats.followers },
      ]
    : [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55 }}
      aria-label="آمار زنده گیت‌هاب"
      className="rounded-3xl border border-border bg-card/70 backdrop-blur p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <svg className="w-6 h-6 text-brand" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="font-extrabold text-lg leading-6">گیت‌هاب زنده</h3>
            <p className="text-xs text-muted-foreground">
              {stats ? `آخرین به‌روزرسانی: ${new Date(stats.fetchedAt).toLocaleTimeString("fa-IR")}` : "در حال دریافت..."}
            </p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          aria-label="به‌روزرسانی آمار گیت‌هاب"
          disabled={refreshing}
          className="w-10 h-10 rounded-xl border border-border grid place-items-center text-muted-foreground hover:text-brand hover:border-brand/50 transition-all disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4.5 h-4.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : failed || !stats ? (
        <div className="text-center py-10 text-muted-foreground">
          <p className="text-sm">فعلاً نتونستم به گیت‌هاب وصل بشم 🛰️</p>
          <button
            onClick={() => load(true)}
            className="mt-3 text-sm font-bold text-brand hover:underline"
          >
            تلاش دوباره
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statItems.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-background/60 px-4 py-4 flex items-center gap-3 hover:border-brand/40 transition-colors"
              >
                <span className="w-9 h-9 rounded-xl bg-brand/10 text-brand grid place-items-center shrink-0">
                  {s.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-black tabular-nums leading-5">{fa(s.value)}</span>
                  <span className="block text-[11px] text-muted-foreground">{s.label}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Top repos */}
          {stats.topRepos.length > 0 && (
            <div>
              <h4 className="text-sm font-extrabold mb-3">پرستاره‌ترین ریپوها</h4>
              <ul className="space-y-2.5">
                {stats.topRepos.map((r) => (
                  <li key={r.name}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 rounded-2xl border border-border bg-background/60 px-4 py-3 hover:border-brand/40 hover:bg-card transition-all"
                    >
                      <div className="min-w-0 flex-grow">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span dir="ltr" className="font-mono text-sm font-bold text-brand">
                            {r.name}
                          </span>
                          {r.language && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <span
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ background: LANG_COLORS[r.language] ?? "#9aa3b2" }}
                              />
                              {r.language}
                            </span>
                          )}
                        </div>
                        {r.description && (
                          <p dir="ltr" className="text-[11px] text-muted-foreground truncate mt-1 text-left">
                            {r.description}
                          </p>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-500 shrink-0 tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {fa(r.stars)}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </motion.section>
  );
}
