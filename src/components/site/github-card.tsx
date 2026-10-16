"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Star, Users, GitFork, FolderGit2, RefreshCw, ExternalLink } from "lucide-react";
import { ContributionHeatmap } from "@/components/site/contribution-heatmap";
import { useT } from "@/lib/i18n";

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
  calendar?: {
    totalContributions: number;
    days: { date: string; count: number }[];
  } | null;
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

export function GitHubCard() {
  const { t, num } = useT();
  const [stats, setStats] = useState<GitHubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async (showSpinner: boolean) => {
    // Cancel any in-flight request; only the newest response may touch state.
    controllerRef.current?.abort();
    const ac = new AbortController();
    controllerRef.current = ac;
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/github", { signal: ac.signal });
      if (!res.ok) throw new Error("github fetch failed");
      const data = (await res.json()) as GitHubStats;
      if (ac.signal.aborted) return;
      setStats(data);
      setFailed(false);
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return;
      setFailed(true);
    } finally {
      if (!ac.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    load(false);
    return () => controllerRef.current?.abort();
  }, [load]);

  const statItems = stats
    ? [
        { icon: <FolderGit2 className="w-4 h-4" />, label: t("home", "github.stat.repos"), value: stats.publicRepos },
        { icon: <Star className="w-4 h-4" />, label: t("home", "github.stat.stars"), value: stats.totalStars },
        { icon: <GitFork className="w-4 h-4" />, label: t("home", "github.stat.forks"), value: stats.totalForks },
        { icon: <Users className="w-4 h-4" />, label: t("home", "github.stat.followers"), value: stats.followers },
      ]
    : [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55 }}
      aria-label={t("home", "github.aria")}
      className="rounded-3xl border border-border bg-card/70 backdrop-blur p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {stats?.avatarUrl && (
            <img
              src={stats.avatarUrl}
              alt={t("home", "github.avatarAlt", { name: stats.name })}
              width={44}
              height={44}
              loading="lazy"
              className="w-11 h-11 rounded-full object-cover ring-2 ring-brand/40 ring-offset-2 ring-offset-[var(--card)] transition-transform hover:scale-105"
            />
          )}
          <div>
            <h3 className="font-extrabold text-lg leading-6">{t("home", "github.title")}</h3>
            <p className="text-xs text-muted-foreground">
              {stats ? (
                <>
                  <span dir="ltr" className="font-mono">@{stats.username}</span>
                  {stats.name !== stats.username && ` · ${stats.name}`}
                </>
              ) : (
                t("home", "github.loading")
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          aria-label={t("home", "github.refresh")}
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
          <p className="text-sm">{t("home", "github.error")}</p>
          <button
            onClick={() => load(true)}
            className="mt-3 text-sm font-bold text-brand hover:underline"
          >
            {t("home", "github.retry")}
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
                  <span className="block text-lg font-black tabular-nums leading-5">{num(s.value)}</span>
                  <span className="block text-[11px] text-muted-foreground">{s.label}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Contribution heatmap */}
          {stats.calendar && stats.calendar.days.length > 0 && (
            <ContributionHeatmap
              days={stats.calendar.days}
              totalContributions={stats.calendar.totalContributions}
            />
          )}

          {/* Top repos */}
          {stats.topRepos.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h4 className="text-sm font-extrabold">{t("home", "github.topRepos")}</h4>
                <a
                  href="#repos"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.hash = "#repos";
                  }}
                  className="text-xs font-bold text-brand hover:underline shrink-0"
                >
                  {t("home", "github.viewAllRepos")}
                </a>
              </div>
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
                        {num(r.stars)}
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
