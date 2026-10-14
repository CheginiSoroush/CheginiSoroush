"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Star,
  GitFork,
  ExternalLink,
  Github,
  Copy,
  Clock3,
  Lock,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import type { GitHubRepo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { relativeTime, useT } from "@/lib/i18n";
import { GITHUB_PROFILE_URL } from "@/lib/site-config";
import { useToast } from "@/hooks/use-toast";
import { SearchInput } from "./search-input";
import { EmptyState } from "./empty-state";

/** Official-ish GitHub language colors. */
const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Shell: "#89e051",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Java: "#b07219",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Dart: "#00B4AB",
  Vue: "#41b883",
};

type SortKey = "recent" | "stars" | "name";
type VisFilter = "all" | "public" | "private";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[\u200c\s]+/g, " ")
    .trim();
}

export function ReposExplorer() {
  const { t, num, lang } = useT();
  const { toast } = useToast();
  const [repos, setRepos] = useState<GitHubRepo[] | null>(null);
  const [source, setSource] = useState<"live" | "db" | "seed" | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [langFilter, setLangFilter] = useState<string>("all");
  const [visFilter, setVisFilter] = useState<VisFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [includesPrivate, setIncludesPrivate] = useState(false);

  const apply = (data: {
    repos: GitHubRepo[];
    source: "live" | "db" | "seed";
    includesPrivate?: boolean;
  }) => {
    setRepos(data.repos);
    setSource(data.source);
    setIncludesPrivate(
      data.includesPrivate ?? data.repos.some((r) => r.isPrivate)
    );
    setLoading(false);
  };

  const load = (refresh = false) => {
    setLoading(true);
    setError(false);
    fetch(`/api/repos${refresh ? "?refresh=1" : ""}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(apply)
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    // Initial load — state defaults are already "loading"; all setState calls
    // happen in promise callbacks (no sync setState in the effect body).
    fetch("/api/repos")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(apply)
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const privateCount = useMemo(
    () => repos?.filter((r) => r.isPrivate).length ?? 0,
    [repos]
  );

  const languages = useMemo(() => {
    if (!repos) return [];
    const counts = new Map<string, number>();
    for (const r of repos) {
      if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [repos]);

  const shown = useMemo(() => {
    if (!repos) return [];
    const q = normalize(query);
    let list = repos.filter((r) => {
      if (langFilter !== "all" && r.language !== langFilter) return false;
      if (visFilter === "private" && !r.isPrivate) return false;
      if (visFilter === "public" && r.isPrivate) return false;
      if (!q) return true;
      const haystack = normalize(
        [
          r.name,
          r.description ?? "",
          r.descriptionFa ?? "",
          r.topics.join(" "),
          r.language ?? "",
          r.homepage ?? "",
        ].join(" ")
      );
      return haystack.includes(q);
    });
    list = [...list].sort((a, b) => {
      if (sort === "stars") return b.stars - a.stars || b.pushedAt.localeCompare(a.pushedAt);
      if (sort === "name") return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      return b.pushedAt.localeCompare(a.pushedAt);
    });
    return list;
  }, [repos, query, langFilter, visFilter, sort]);

  const copyClone = async (repo: GitHubRepo) => {
    const cmd = `git clone ${repo.url}.git`;
    try {
      await navigator.clipboard.writeText(cmd);
      toast({ title: t("repos", "toast.cloned") });
    } catch {
      toast({ title: t("repos", "toast.copyFailed"), variant: "destructive" });
    }
  };

  const totalStars = repos?.reduce((s, r) => s + r.stars, 0) ?? 0;
  const langCount = languages.length;

  return (
    <div
      aria-label={t("repos", "aria.section")}
      className="max-w-6xl mx-auto px-4 sm:px-6"
    >
      {/* Toolbar — same rhythm/padding as Projects & Articles */}
      <div className="mb-8 space-y-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t("repos", "search.placeholder")}
          ariaLabel={t("repos", "aria.search")}
          clearLabel={t("repos", "search.clear")}
        />

        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Visibility filter chips (all / public / private) */}
          <div
            role="group"
            aria-label={t("repos", "filter.visAria")}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            {(
              [
                ["all", t("repos", "filter.allVis"), null, repos?.length ?? 0],
                ["public", t("repos", "filter.public"), Globe, (repos?.length ?? 0) - privateCount],
                ["private", t("repos", "filter.private"), Lock, privateCount],
              ] as [VisFilter, string, typeof Lock | null, number][]
            )
              .filter(([key, , , count]) => key === "all" || count > 0)
              .map(([key, label, Icon, count]) => (
                <button
                  key={key}
                  onClick={() => setVisFilter(key)}
                  aria-pressed={visFilter === key}
                  title={key === "private" ? t("repos", "privateNote") : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all min-h-[36px]",
                    visFilter === key
                      ? key === "private"
                        ? "bg-amber-500/90 text-amber-950 border-amber-500"
                        : "bg-brand text-primary-foreground border-brand"
                      : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-brand/40"
                  )}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" aria-hidden />}
                  {label}
                  <span className="opacity-70">{num(count)}</span>
                </button>
              ))}
          </div>

          {/* Language filter chips */}
          <div
            role="group"
            aria-label={t("repos", "filter.langAria")}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            <button
              onClick={() => setLangFilter("all")}
              className={cn(
                "px-3.5 py-2 rounded-full text-xs font-bold border transition-all min-h-[36px]",
                langFilter === "all"
                  ? "bg-brand text-primary-foreground border-brand"
                  : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-brand/40"
              )}
            >
              {t("repos", "filter.allLangs")}
            </button>
            {languages.map(([l, count]) => (
              <button
                key={l}
                onClick={() => setLangFilter(l)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all min-h-[36px]",
                  langFilter === l
                    ? "bg-brand text-primary-foreground border-brand"
                    : "border-border bg-card/60 text-muted-foreground hover:text-foreground hover:border-brand/40"
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: LANG_COLORS[l] ?? "#8b949e" }}
                  aria-hidden
                />
                <span dir="ltr">{l}</span>
                <span className="opacity-60">{num(count)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sort + status row */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <div role="group" aria-label={t("repos", "sort.aria")} className="flex items-center gap-1">
            {(
              [
                ["recent", t("repos", "sort.recent")],
                ["stars", t("repos", "sort.stars")],
                ["name", t("repos", "sort.name")],
              ] as [SortKey, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={cn(
                  "px-3 py-1.5 rounded-full font-bold transition-colors min-h-[32px]",
                  sort === key
                    ? "text-brand bg-brand/10 border border-brand/25"
                    : "hover:text-foreground border border-transparent"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {!loading && !error && repos && (
            <span aria-live="polite" className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>
                {t("repos", "status.found", { n: num(shown.length) })}
                {" · "}
                {num(totalStars)} {t("repos", "summary.stars")}
              </span>
              {includesPrivate && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400/90"
                  title={t("repos", "privateNote")}
                >
                  <Lock className="w-3 h-3" aria-hidden />
                  {t("repos", "privateCount", { n: num(privateCount) })}
                </span>
              )}
            </span>
          )}
        </div>

        {(source === "db" || source === "seed") && !loading && !error && (
          <p className="text-center text-[11px] text-muted-foreground/80 flex items-center justify-center gap-1.5">
            <Clock3 className="w-3 h-3" aria-hidden />
            {t("repos", "staleNote")}
          </p>
        )}
      </div>

      {/* Content */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-border bg-card/40 animate-pulse"
              aria-hidden
            />
          ))}
          <span className="sr-only">{t("repos", "loading")}</span>
        </div>
      )}

      {error && !loading && (
        <EmptyState
          emoji="🛰️"
          title={t("repos", "error.title")}
          description={t("repos", "error.desc")}
          onReset={() => load(true)}
          resetLabel={t("repos", "retry")}
        />
      )}

      {!loading && !error && shown.length === 0 && (
        <EmptyState
          title={t("repos", "empty.title")}
          description={t("repos", "empty.desc")}
          onReset={() => {
            setQuery("");
            setLangFilter("all");
            setSort("recent");
          }}
        />
      )}

      {!loading && !error && shown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {shown.map((repo) => {
            const langColor = repo.language ? LANG_COLORS[repo.language] ?? "#8b949e" : null;
            const desc =
              lang === "fa"
                ? repo.descriptionFa ?? repo.description
                : repo.description ?? repo.descriptionFa;
            return (
              <article
                key={repo.name}
                className="spotlight group relative rounded-2xl border border-border bg-card/70 backdrop-blur p-4 sm:p-5 flex flex-col gap-2.5 sm:gap-3 hover:border-brand/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("repos", "openRepo", { name: repo.name })}
                    className="min-w-0 inline-flex items-center gap-1.5 font-extrabold text-[15px] tracking-tight group-hover:text-brand transition-colors"
                  >
                    <Github className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-brand transition-colors" aria-hidden />
                    <span dir="ltr" className="truncate">
                      {repo.name}
                    </span>
                    {repo.isPrivate && (
                      <span
                        title={t("repos", "badge.private")}
                        className="inline-flex items-center gap-0.5 shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      >
                        <Lock className="w-2.5 h-2.5" aria-hidden />
                        {t("repos", "badge.private")}
                      </span>
                    )}
                    <ExternalLink
                      className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-70 transition-opacity"
                      aria-hidden
                    />
                  </a>
                  <button
                    onClick={() => copyClone(repo)}
                    title={t("repos", "copyClone")}
                    aria-label={t("repos", "copyClone")}
                    className="shrink-0 w-9 h-9 -me-1 grid place-items-center rounded-lg border border-border text-muted-foreground hover:text-brand hover:border-brand/40 active:scale-90 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden />
                  </button>
                </div>

                {/* Full description — comprehensive by design, no clamping */}
                <p dir="auto" className="text-start text-[13px] leading-6 text-muted-foreground">
                  {desc ?? t("repos", "noDesc")}
                </p>

                {/* GitHub Pages / live-site pill */}
                {repo.homepage && (
                  <a
                    href={repo.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("repos", "liveAria", { name: repo.name })}
                    title={t("repos", "liveAria", { name: repo.name })}
                    className="w-fit inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 active:scale-95 transition-all"
                  >
                    <Globe className="w-3 h-3" aria-hidden />
                    {t("repos", "live.title")}
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" aria-hidden />
                  </a>
                )}

                {repo.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5" dir="ltr">
                    {repo.topics.slice(0, 3).map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand/10 text-brand border border-brand/20"
                      >
                        {topic}
                      </span>
                    ))}
                    {repo.topics.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-muted-foreground border border-border">
                        {t("repos", "topics.more", { n: num(repo.topics.length - 3) })}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 text-xs text-muted-foreground border-t border-border/60">
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    {repo.language ? (
                      <>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: langColor ?? undefined }}
                          aria-hidden
                        />
                        <span dir="ltr" className="truncate">{repo.language}</span>
                      </>
                    ) : (
                      <span className="truncate">{t("repos", "lang.unknown")}</span>
                    )}
                    {repo.isFork && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold border border-border shrink-0">
                        {t("repos", "badge.fork")}
                      </span>
                    )}
                    {repo.archived && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold border border-border shrink-0">
                        {t("repos", "badge.archived")}
                      </span>
                    )}
                  </span>
                  {/* visibility is already badged in the title row — the footer
                      row carries only fork/archive to stay uncluttered on mobile */}
                  <span className="flex items-center gap-2.5 shrink-0 tabular-nums" dir="ltr">
                    <span className="inline-flex items-center gap-1" title={t("repos", "stats.stars")}>
                      <Star className="w-3.5 h-3.5 text-brand" aria-hidden />
                      {num(repo.stars)}
                    </span>
                    <span className="inline-flex items-center gap-1" title={t("repos", "stats.forks")}>
                      <GitFork className="w-3.5 h-3.5" aria-hidden />
                      {num(repo.forks)}
                    </span>
                  </span>
                </div>

                <time className="text-[11px] text-muted-foreground/70 flex items-center gap-1" dateTime={repo.pushedAt}>
                  <Clock3 className="w-3 h-3" aria-hidden />
                  {t("repos", "updated", { when: relativeTime(repo.pushedAt, lang) })}
                </time>
              </article>
            );
          })}
        </motion.div>
      )}

      {/* Summary line */}
      {!loading && !error && repos && repos.length > 0 && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          {num(repos.length)} {t("repos", "summary.repos")}
          {privateCount > 0 && (
            <>
              {" \u00b7 "}
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3 h-3" aria-hidden />
                {t("repos", "privateCount", { n: num(privateCount) })}
              </span>
            </>
          )}
          {" \u00b7 "}{num(totalStars)} {t("repos", "summary.stars")} · {num(langCount)}{" "}
          {t("repos", "summary.langs")} ·{" "}
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand font-bold hover:underline"
          >
            @CheginiSoroush
          </a>
        </p>
      )}
    </div>
  );
}
