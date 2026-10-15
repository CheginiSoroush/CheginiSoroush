"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Star, Share2, Dices, Link2, Check, ArrowDownWideNarrow, LayoutGrid, Terminal, Copy, LockKeyhole, Globe, Flame, Tag, BookOpen, ChevronDown, Award, Github } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema as sanitizeSchema } from "rehype-sanitize";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useSpotlight } from "@/hooks/use-spotlight";
import { ProjectCover } from "./project-cover";
import { SearchInput } from "./search-input";
import { EmptyState } from "./empty-state";
import type { Project } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { repoUrl } from "@/lib/site-config";
import { demoHost } from "@/lib/demo-urls";
import { projectAward } from "@/lib/project-awards";
import { projectSites } from "@/lib/project-sites";
import { cn } from "@/lib/utils";
import { useT, pickEn, relativeTime } from "@/lib/i18n";

const DETAIL_INIT = Symbol("detail-init");
const FAV_STORAGE_KEY = "imsoroush-fav-projects";
const FAV_EVENT = "imsoroush-favs-change";
const EMPTY_FAV: ReadonlySet<string> = new Set();

// External store over localStorage so favorite stars survive reloads (SSR-safe)
let favCache: Set<string> | null = null;
function subscribeFav(onChange: () => void) {
  window.addEventListener(FAV_EVENT, onChange);
  return () => window.removeEventListener(FAV_EVENT, onChange);
}
function getFavSnapshot(): ReadonlySet<string> {
  if (!favCache) {
    try {
      const raw = JSON.parse(localStorage.getItem(FAV_STORAGE_KEY) ?? "[]") as string[];
      favCache = new Set(Array.isArray(raw) ? raw : []);
    } catch {
      favCache = new Set();
    }
  }
  return favCache;
}
function getServerFav(): ReadonlySet<string> {
  return EMPTY_FAV;
}
function writeFav(next: Set<string>) {
  favCache = next;
  try {
    localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    // storage unavailable — in-memory only
  }
  window.dispatchEvent(new Event(FAV_EVENT));
}

// Repo visibility map from the live GitHub pipeline (/api/repos):
// lowercase repo name -> private?. Fetched once per session and cached at
// module level so every dialog open is synchronous and free.
// 47 of the 55 repos are private today — showing their GitHub/clone links
// would 404 for visitors, so private projects get a lock state instead.
let privateReposCache: ReadonlySet<string> | null = null;
function usePrivateRepos() {
  const [set, setSet] = useState<ReadonlySet<string> | null>(privateReposCache);
  useEffect(() => {
    if (privateReposCache) return;
    let alive = true;
    fetch("/api/repos")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const repos: Array<{ name?: string; isPrivate?: boolean }> = Array.isArray(d?.repos)
          ? d.repos
          : [];
        privateReposCache = new Set(
          repos.filter((x) => x.isPrivate && x.name).map((x) => x.name!.toLowerCase())
        );
        if (alive) setSet(privateReposCache);
      })
      .catch(() => {
        // visibility map is optional decoration — silently keep links live
      });
    return () => {
      alive = false;
    };
  }, []);
  return set;
}

/** "CheginiSoroush/Some-Repo" -> "some-repo" (the key used in the visibility map). */
const repoKey = (repo: string) => repo.slice(repo.lastIndexOf("/") + 1).toLowerCase();

// Category chips (labels via i18n: projects "filter.all" + core "cat.*")
const FILTERS = [
  { id: "all", icon: "✨" },
  { id: "bots", icon: "🤖" },
  { id: "web", icon: "🌐" },
  { id: "3d", icon: "🪐" },
  { id: "tools", icon: "🛠️" },
];

/**
 * Collapsible repo documentation inside the detail dialog — lazily fetched
 * through /api/github/readme (server-side, works for private repos too),
 * rendered with react-markdown (raw HTML never executes).
 */
function ReadmeSection({ repo }: { repo: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "empty" | "error">("idle");
  const [content, setContent] = useState("");
  const requested = useRef(false);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !requested.current) {
      requested.current = true;
      setStatus("loading");
      fetch(`/api/github/readme?repo=${encodeURIComponent(repo)}`)
        .then((r) => r.json() as Promise<{ content: string | null }>)
        .then((j) => {
          if (j.content && j.content.trim()) {
            setContent(j.content);
            setStatus("ok");
          } else {
            setStatus("empty");
          }
        })
        .catch(() => setStatus("error"));
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-border bg-secondary/30 overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 text-start hover:bg-secondary/50 transition-colors min-h-[44px]"
      >
        <BookOpen className="w-4 h-4 text-brand shrink-0" aria-hidden />
        <span className="text-xs font-bold flex-grow">{t("projects", "detail.readme")}</span>
        <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">
          {open ? t("projects", "detail.readmeHide") : t("projects", "detail.readmeShow")}
        </span>
        <ChevronDown
          className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              dir="ltr"
              className="readme-body max-h-72 overflow-y-auto px-4 pb-4 pt-1 text-left text-xs leading-6 text-foreground/85 [&_h1]:text-sm [&_h1]:font-extrabold [&_h1]:mt-3 [&_h1]:mb-1.5 [&_h2]:text-[13px] [&_h2]:font-extrabold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:mt-2.5 [&_h3]:mb-1 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:ps-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:ps-5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_a]:text-brand [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2 [&_pre]:bg-secondary/70 [&_pre]:rounded-lg [&_pre]:p-2.5 [&_pre]:overflow-x-auto [&_code]:text-[10px] [&_code]:font-mono [&_blockquote]:border-s-2 [&_blockquote]:border-brand/40 [&_blockquote]:ps-3 [&_blockquote]:text-muted-foreground [&_table]:w-full [&_th]:text-start [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1"
            >
              {status === "loading" && (
                <div className="space-y-2 py-2">
                  <div className="h-3 w-3/4 rounded bg-secondary animate-pulse" />
                  <div className="h-3 w-full rounded bg-secondary animate-pulse" />
                  <div className="h-3 w-5/6 rounded bg-secondary animate-pulse" />
                  <div className="h-3 w-2/3 rounded bg-secondary animate-pulse" />
                </div>
              )}
              {status === "empty" && (
                <p className="py-3 text-muted-foreground">{t("projects", "detail.readmeEmpty")}</p>
              )}
              {status === "error" && (
                <p className="py-3 text-red-500">{t("projects", "detail.readmeFailed")}</p>
              )}
              {status === "ok" && (
                <ReactMarkdown
                  // Raw HTML (GitHub banners, <details>, <img>) is parsed and
                  // then sanitized — scripts/event handlers never survive.
                  rehypePlugins={[
                    rehypeRaw,
                    [
                      rehypeSanitize,
                      {
                        ...sanitizeSchema,
                        tagNames: [
                          ...(sanitizeSchema.tagNames ?? []),
                          "img",
                          "details",
                          "summary",
                          "picture",
                          "source",
                          "kbd",
                        ],
                        attributes: {
                          ...sanitizeSchema.attributes,
                          img: [
                            "src",
                            "srcSet",
                            "alt",
                            "title",
                            "width",
                            "height",
                            "loading",
                          ],
                          source: ["src", "srcSet", "media", "type"],
                          span: ["dir"],
                          div: ["align", "dir"],
                          p: ["align", "dir"],
                        },
                      },
                    ],
                  ]}
                  components={{
                    a: (props) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    ),
                    img: (props) => (
                      <img {...props} loading="lazy" alt={props.alt ?? ""} />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Tiny 12-week commit sparkline — pure SVG, no chart lib. */
function CommitSparkline({ data }: { data: number[] }) {
  const weeks = data.slice(-12);
  if (weeks.length === 0) return null;
  const max = Math.max(...weeks, 1);
  return (
    <svg width="92" height="24" viewBox="0 0 92 24" aria-hidden className="shrink-0">
      {weeks.map((v, i) => {
        const h = Math.max(2, Math.round((v / max) * 20));
        return (
          <rect
            key={i}
            x={i * 8}
            y={22 - h}
            width="5"
            height={h}
            rx="1.5"
            className={cn(i === weeks.length - 1 ? "fill-brand" : "fill-brand/45")}
          />
        );
      })}
    </svg>
  );
}

export function ProjectsExplorer({
  initialProjects,
  initialCategory,
  detailSlug,
  onOpenDetail,
  onCloseDetail,
}: {
  initialProjects: Project[];
  initialCategory?: string;
  detailSlug?: string;
  onOpenDetail: (slug: string) => void;
  onCloseDetail: () => void;
}) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const validCategory =
    initialCategory && FILTERS.some((f) => f.id === initialCategory) ? initialCategory : "all";
  const [filter, setFilter] = useState(validCategory);
  const [sort, setSort] = useState<"default" | "views">("default");
  const [selected, setSelected] = useState<Project | null>(null);
  const [copied, setCopied] = useState(false);
  const [cloneCopied, setCloneCopied] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [bumpedSlugs, setBumpedSlugs] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);
  const postedRef = useRef<Set<string>>(new Set());
  const favSlugs = useSyncExternalStore(subscribeFav, getFavSnapshot, getServerFav);
  const [favOnly, setFavOnly] = useState(false);
  const { toast } = useToast();
  const onSpotlightMove = useSpotlight();
  const { t, num, lang, isRtl } = useT();
  // Live repo visibility — private repos render a lock state instead of 404 links
  const privateRepos = usePrivateRepos();
  // Chip/heading labels: "all" lives in the projects dict, categories in core
  const filterLabel = (id: string) =>
    id === "all" ? t("projects", "filter.all") : t("core", `cat.${id}`);

  // Deep-link: sync filter when the category part of the hash changes (back/forward)
  const [prevCategory, setPrevCategory] = useState<string | undefined>(undefined);
  if (prevCategory !== initialCategory) {
    setPrevCategory(initialCategory);
    const next =
      initialCategory && FILTERS.some((f) => f.id === initialCategory) ? initialCategory : "all";
    if (filter !== next) setFilter(next);
  }

  // Shareable filter URL: keep #/projects/cat/<id> in the address bar (no history spam)
  const changeFilter = useCallback((id: string) => {
    setFilter(id);
    const target = id === "all" ? "#projects" : `#/projects/cat/${id}`;
    if (window.location.hash !== target) {
      history.replaceState(null, "", target);
    }
  }, []);

  const openProject = useCallback(
    (p: Project) => {
      // bumpedSlugs still gates the (invisible) analytics POST — one ping per
      // slug per session — but the UI no longer displays or inflates counts.
      if (!bumpedSlugs.has(p.slug)) {
        setBumpedSlugs((prev) => new Set(prev).add(p.slug));
      }
      setSelected(p);
      onOpenDetail(p.slug);
    },
    [onOpenDetail, bumpedSlugs]
  );

  // Deep-link: derive dialog state from hash during render (prop-change adjustment)
  // Sentinel so a detailSlug present at mount still triggers the first adjustment
  const [prevDetail, setPrevDetail] = useState<string | undefined | symbol>(DETAIL_INIT);
  if (prevDetail !== detailSlug) {
    setPrevDetail(detailSlug);
    if (!detailSlug) {
      setSelected(null);
    } else {
      const p = initialProjects.find((x) => x.slug === detailSlug);
      if (p && selected?.slug !== p.slug) {
        if (!bumpedSlugs.has(p.slug)) {
          setBumpedSlugs((prev) => new Set(prev).add(p.slug));
          setSelected(p);
        } else {
          setSelected(p);
        }
      }
    }
  }

  // (View-count display was removed by design — bumpedSlugs now only gates
  // the once-per-session analytics POST below.)

  // Count the view once per slug (external side-effect)
  useEffect(() => {
    const slug = selected?.slug;
    if (!slug || !bumpedSlugs.has(slug) || postedRef.current.has(slug)) return;
    postedRef.current.add(slug);
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => {});
  }, [selected, bumpedSlugs]);

  // Keyboard "/" focuses the search input
  useEffect(() => {
    const onFocus = () => searchRef.current?.focus();
    window.addEventListener("focus-project-search", onFocus);
    return () => window.removeEventListener("focus-project-search", onFocus);
  }, []);

  // Command palette / footer action: open projects in favorites mode
  useEffect(() => {
    const onFav = () => setFavOnly(true);
    window.addEventListener("toggle-projects-favorites", onFav);
    return () => window.removeEventListener("toggle-projects-favorites", onFav);
  }, []);

  const toggleFav = useCallback((slug: string) => {
    const next = new Set(getFavSnapshot());
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    writeFav(next);
  }, []);

  const closeDialog = (open: boolean) => {
    if (!open) {
      setSelected(null);
      onCloseDetail();
    }
  };

  // Undefined map (still loading) is treated as "public" so links never flicker
  const selectedIsPrivate = selected ? (privateRepos?.has(repoKey(selected.repo)) ?? false) : false;

  // Config-driven third-party recognition for the selected project
  const selectedAward = selected ? projectAward(selected.slug) : null;
  const selectedSites = selected ? projectSites(selected.slug) : [];

  const shareProject = async (p: Project) => {
    const url = `${window.location.origin}/#/projects/${encodeURIComponent(p.slug)}`;
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    if (navigator.share) {
      try {
        await navigator.share({ title: pickEn(lang, p.titleEn, p.title), url });
        return;
      } catch {
        // user cancelled → fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: t("projects", "toast.linkCopied.title"),
        description: t("projects", "toast.linkCopied.desc"),
      });
    } catch {
      toast({ title: t("projects", "toast.copyFailed.title"), description: url, variant: "destructive" });
    }
  };

  const copyCloneCommand = async (repo: string) => {
    const cmd = `git clone ${repoUrl(repo)}.git`;
    try {
      await navigator.clipboard.writeText(cmd);
      setCloneCopied(true);
      setTimeout(() => setCloneCopied(false), 1600);
      toast({
        title: t("projects", "toast.cmdCopied.title"),
        description: t("projects", "toast.cmdCopied.desc"),
      });
    } catch {
      toast({ title: t("projects", "toast.copyFailed.title"), description: cmd, variant: "destructive" });
    }
  };

  const randomProject = () => {
    const pool = initialProjects;
    if (pool.length === 0 || rolling) return;
    setRolling(true);
    let ticks = 0;
    const iv = setInterval(() => {
      const p = pool[Math.floor(Math.random() * pool.length)];
      setSelected(p);
      ticks += 1;
      if (ticks >= 9) {
        clearInterval(iv);
        setRolling(false);
        openProject(p);
      }
    }, 90);
  };

  // Fetch with debounce when query/filter/sort changes
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter !== "all") params.set("category", filter);
        if (query.trim()) params.set("q", query.trim());
        if (sort === "views") params.set("sort", "views");
        const res = await fetch(`/api/projects?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { projects?: Project[] };
        if (data.projects) {
          setProjects(data.projects);
          // Keep the open dialog in sync with the enriched row (auto-sync
          // meta lives only in the API payload, not in the server props).
          setSelected((prev) => {
            if (!prev) return prev;
            return data.projects?.find((x) => x.slug === prev.slug) ?? prev;
          });
        }
      } catch {
        // aborted
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, filter, sort]);

  const grouped = useMemo(() => {
    if (filter !== "all" || sort === "views" || favOnly) return null;
    const map = new Map<string, Project[]>();
    for (const p of projects) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return map;
  }, [projects, filter, sort, favOnly]);

  // Favorites mode filters the fetched list client-side by starred slugs
  const displayList = useMemo(
    () => (favOnly ? projects.filter((p) => favSlugs.has(p.slug)) : projects),
    [projects, favOnly, favSlugs]
  );

  // Related projects in the same category (detail dialog)
  const relatedProjects = useMemo(() => {
    if (!selected) return [];
    return initialProjects
      .filter((p) => p.category === selected.category && p.slug !== selected.slug)
      .slice(0, 3);
  }, [initialProjects, selected]);

  const renderCard = (p: Project, index: number) => {
    // Config-driven award + extra sites for this slug (src/lib/project-*.ts)
    const award = projectAward(p.slug);
    const sites = projectSites(p.slug);
    return (
    <motion.button
      key={p.id}
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.4) }}
      onClick={() => openProject(p)}
      onMouseMove={onSpotlightMove}
      className="glow-card spotlight group text-start rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col h-full w-full"
    >
      {/* generative cover art — clipping lives on an INNER wrapper so the
          floating sticker can overhang the cover edge instead of being cut off */}
      <div className="cover-wrap relative -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-5">
        <div className="overflow-hidden rounded-t-2xl">
          <ProjectCover slug={p.slug} category={p.category} className="h-24 sm:h-28 w-full" />
        </div>
        <div className="cover-float">
          <span className="text-3xl card-emoji drop-shadow-lg" aria-hidden>
            {p.icon}
          </span>
        </div>
        {p.featured && (
          <span className="absolute top-2.5 end-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#05261f] bg-brand border border-white/20 rounded-full px-2 py-0.5 shadow-lg">
            <Star className="w-3 h-3" /> {t("projects", "card.featured")}
          </span>
        )}
        {p.trending && (
          <span
            title={t("projects", "card.trending")}
            className={cn(
              "absolute end-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-foreground bg-background/85 backdrop-blur border border-border rounded-full px-2 py-0.5 shadow-lg",
              p.featured ? "top-11" : "top-2.5"
            )}
          >
            <Flame className="w-3 h-3 text-orange-500" aria-hidden /> {t("projects", "card.trending")}
          </span>
        )}
        {/* Favorite toggle — span keeps the card's single-button semantics valid */}
        <span
          role="button"
          tabIndex={0}
          aria-pressed={favSlugs.has(p.slug)}
          aria-label={
            favSlugs.has(p.slug)
              ? t("projects", "favorites.remove", { title: pickEn(lang, p.titleEn, p.title) })
              : t("projects", "favorites.add", { title: pickEn(lang, p.titleEn, p.title) })
          }
          title={
            favSlugs.has(p.slug)
              ? t("projects", "favorites.removeShort")
              : t("projects", "favorites.addShort")
          }
          onClick={(e) => {
            e.stopPropagation();
            toggleFav(p.slug);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              toggleFav(p.slug);
            }
          }}
          className={cn(
            "fav-star absolute top-2.5 start-2.5 z-10 w-8 h-8 grid place-items-center rounded-full border backdrop-blur-md",
            favSlugs.has(p.slug)
              ? "fav-star-on border-brand/60 bg-brand/30 text-brand"
              : "border-white/30 bg-black/30 text-white/90 hover:text-brand hover:border-brand/50"
          )}
        >
          <Star className={cn("w-4 h-4", favSlugs.has(p.slug) && "fill-brand")} aria-hidden />
        </span>
      </div>
      <h3 className="font-extrabold text-base sm:text-lg mb-1.5 group-hover:text-brand transition-colors leading-7">
        {pickEn(lang, p.titleEn, p.title)}
      </h3>
      <p dir="ltr" className="text-[11px] font-mono text-muted-foreground/70 truncate mb-3 text-left">
        {p.repo}
      </p>
      {/* Full, comprehensive description — intentionally NOT clamped so every
          card tells the complete story of its project */}
      <p className="text-sm text-muted-foreground leading-7 flex-grow">
        {pickEn(lang, p.descriptionEn, p.description)}
      </p>
      {/* GitHub Pages / live-site pill — shows the actual demo address;
          span+role keeps the card a single button (no nested interactive
          elements inside <button>) */}
      {p.demoUrl && (
        <span
          role="button"
          tabIndex={0}
          aria-label={t("projects", "card.liveAria", { title: pickEn(lang, p.titleEn, p.title) })}
          title={t("projects", "card.live")}
          onClick={(e) => {
            e.stopPropagation();
            window.open(p.demoUrl ?? "", "_blank", "noopener,noreferrer");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              window.open(p.demoUrl ?? "", "_blank", "noopener,noreferrer");
            }
          }}
          className={cn(
            "w-fit max-w-full inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer active:scale-95",
            p.demoOk === false
              ? "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
              : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20"
          )}
        >
          <Globe className="w-3 h-3 shrink-0" aria-hidden />
          <span dir="ltr" className="truncate">{demoHost(p.demoUrl) ?? t("projects", "card.live")}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" aria-hidden />
        </span>
      )}
      {/* Extra curated sites (e.g. GitHub Pages) — config-driven
          (src/lib/project-sites.ts); same single-button-safe span pattern */}
      {sites.map((site) => (
        <span
          key={site.id}
          role="button"
          tabIndex={0}
          aria-label={t("projects", `site.${site.id}.aria`)}
          title={t("projects", `site.${site.id}.label`)}
          onClick={(e) => {
            e.stopPropagation();
            window.open(site.href, "_blank", "noopener,noreferrer");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              window.open(site.href, "_blank", "noopener,noreferrer");
            }
          }}
          className="mt-2 w-fit max-w-full inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border border-border bg-secondary text-foreground/80 hover:text-foreground hover:border-brand/40 transition-all cursor-pointer active:scale-95"
        >
          <Github className="w-3 h-3 shrink-0" aria-hidden />
          <span className="truncate">{t("projects", `site.${site.id}.short`)}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" aria-hidden />
        </span>
      ))}
      {/* Third-party recognition — config-driven (src/lib/project-awards.ts);
          span+role pattern keeps the card a single <button> (no nested <a>) */}
      {award && (
        <span
          role="button"
          tabIndex={0}
          aria-label={t("projects", `award.${award.id}.aria`)}
          title={t("projects", `award.${award.id}.label`)}
          onClick={(e) => {
            e.stopPropagation();
            window.open(award.href, "_blank", "noopener,noreferrer");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              window.open(award.href, "_blank", "noopener,noreferrer");
            }
          }}
          className="mt-2 w-fit max-w-full inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer active:scale-95"
        >
          <Award className="w-3 h-3 shrink-0" aria-hidden />
          <span className="truncate">{t("projects", `award.${award.id}.short`)}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" aria-hidden />
        </span>
      )}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground inline-flex items-center gap-1.5">
          <span aria-hidden>{FILTERS.find((f) => f.id === p.category)?.icon ?? "✨"}</span>
          {t("core", `cat.${p.category}`)}
        </span>
        <span className="text-xs font-bold text-brand inline-flex items-center gap-1">
          {t("projects", "card.details")}
          <ExternalLink className={cn("w-3.5 h-3.5", isRtl && "-scale-x-100")} />
        </span>
      </div>
    </motion.button>
  );
  };

  return (
    <section id="projects" aria-label={t("projects", "aria.projects")} className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Search + Filters */}
      <div className="mb-8 space-y-4">
        <SearchInput
          inputRef={searchRef}
          value={query}
          onChange={setQuery}
          placeholder={t("projects", "controls.searchPlaceholder")}
          ariaLabel={t("projects", "controls.search")}
          clearLabel={t("projects", "controls.clearSearch")}
        />

        <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label={t("projects", "controls.filterAria")}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => changeFilter(f.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium border transition-all min-h-[38px]",
                filter === f.id
                  ? "bg-brand text-primary-foreground border-brand chip-active"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-brand/40"
              )}
            >
              <span aria-hidden>{f.icon} </span>
              {filterLabel(f.id)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <p className="text-center text-xs text-muted-foreground" aria-live="polite">
            {loading
              ? t("projects", "controls.searching")
              : t(
                  "projects",
                  displayList.length === 1 ? "controls.foundOne" : "controls.found",
                  { n: num(displayList.length) }
                )}
          </p>
          <span className="w-1 h-1 rounded-full bg-border" aria-hidden />
          <button
            onClick={() => setSort((s) => (s === "views" ? "default" : "views"))}
            aria-pressed={sort === "views"}
            title={sort === "views" ? t("projects", "sort.toDefault") : t("projects", "sort.byViews")}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-bold rounded-full border px-3.5 py-1.5 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[30px]",
              sort === "views"
                ? "text-primary-foreground bg-brand border-brand chip-active"
                : "text-brand border-brand/30 bg-brand/10 hover:bg-brand/20"
            )}
          >
            {sort === "views" ? (
              <ArrowDownWideNarrow className="w-3.5 h-3.5" />
            ) : (
              <LayoutGrid className="w-3.5 h-3.5" />
            )}
            {sort === "views" ? t("projects", "sort.mostViewed") : t("projects", "sort.default")}
          </button>
          <span className="w-1 h-1 rounded-full bg-border" aria-hidden />
          <button
            onClick={randomProject}
            disabled={rolling}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 hover:bg-brand/20 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 min-h-[30px]"
          >
            <Dices className={cn("w-3.5 h-3.5", rolling && "animate-spin")} />
            {rolling ? t("projects", "controls.rolling") : t("projects", "controls.random")}
          </button>
          <span className="w-1 h-1 rounded-full bg-border" aria-hidden />
          <button
            onClick={() => setFavOnly((v) => !v)}
            aria-pressed={favOnly}
            title={favOnly ? t("projects", "favorites.showAll") : t("projects", "favorites.onlyStarred")}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-bold rounded-full border px-3.5 py-1.5 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[30px]",
              favOnly
                ? "text-primary-foreground bg-brand border-brand chip-active"
                : "text-brand border-brand/30 bg-brand/10 hover:bg-brand/20"
            )}
          >
            <Star className={cn("w-3.5 h-3.5", favOnly && "fill-current")} aria-hidden />
            {t("projects", "favorites.label")}
            {favSlugs.size > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px]",
                  favOnly ? "bg-primary-foreground/25" : "bg-brand/15"
                )}
              >
                {num(favSlugs.size)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading && projects.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <EmptyState
          title={favOnly ? t("projects", "empty.favs.title") : t("projects", "empty.search.title")}
          description={
            favOnly
              ? t("projects", "empty.favs.desc")
              : t("projects", "empty.search.desc")
          }
          onReset={
            favOnly
              ? () => setFavOnly(false)
              : query || filter !== "all"
                ? () => { setQuery(""); changeFilter("all"); }
                : undefined
          }
        />
      ) : grouped ? (
        <div className="space-y-10">
          {FILTERS.filter((f) => f.id !== "all" && grouped.has(f.id)).map((f) => {
            const items = grouped.get(f.id)!;
            return (
              <div key={f.id}>
                <h3 className="flex items-center gap-2 font-extrabold text-lg mb-4">
                  <span aria-hidden>{f.icon}</span>
                  {filterLabel(f.id)}
                  <span className="text-xs font-medium text-muted-foreground bg-secondary rounded-full px-2.5 py-1">
                    {num(items.length)}
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  <AnimatePresence mode="popLayout">
                    {items.map((p, i) => renderCard(p, i))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <AnimatePresence mode="popLayout">
            {displayList.map((p, i) => renderCard(p, i))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={closeDialog}>
        <DialogContent className="dialog-sheet dialog-accent max-h-[92dvh] sm:max-h-[85dvh] overflow-hidden p-0 gap-0 rounded-t-3xl rounded-b-none sm:rounded-3xl">
          {selected && (
            <div className="max-h-[92dvh] sm:max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-3xl">
              {/* Grabber bar — bottom-sheet affordance, phones only */}
              <div
                aria-hidden
                className="sm:hidden absolute top-2.5 left-1/2 -translate-x-1/2 z-10 h-1.5 w-10 rounded-full bg-foreground/25"
              />
              {/* Full-bleed hero cover — the sticker floats ABOVE the fade
                  overlay (z-index) and is never clipped by the scroll area */}
              <div className="cover-wrap dialog-cover relative">
                <div className="overflow-hidden rounded-t-3xl">
                  <ProjectCover
                    slug={selected.slug}
                    category={selected.category}
                    idPrefix="dlg"
                    className="h-32 sm:h-36 w-full"
                  />
                </div>
                <div className="cover-float">
                  <span className="text-2xl card-emoji drop-shadow-xl" aria-hidden>
                    {selected.icon}
                  </span>
                </div>
              </div>
              <div className="p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-6">
              <DialogHeader>
                <div className="flex items-center gap-4 mb-1">
                  <div className="min-w-0 flex-grow">
                    <DialogTitle className="text-lg sm:text-xl leading-8 text-start">
                      {pickEn(lang, selected.titleEn, selected.title)}
                    </DialogTitle>
                    <DialogDescription dir="ltr" className="text-left text-xs font-mono mt-1 truncate">
                      {selected.repo}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary" className="gap-1">
                  <span aria-hidden>{CATEGORY_LABELS[selected.category]?.icon}</span>
                  {CATEGORY_LABELS[selected.category]
                    ? t("core", `cat.${selected.category}`)
                    : selected.category}
                </Badge>
                {selected.featured && (
                  <Badge className="gap-1 bg-brand text-primary-foreground border-0">
                    <Star className="w-3 h-3" /> {t("projects", "detail.featuredBadge")}
                  </Badge>
                )}
                {selectedIsPrivate && (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <LockKeyhole className="w-3 h-3" aria-hidden />
                    {t("projects", "detail.privateBadge")}
                  </Badge>
                )}
                {/* View-count badge removed by design — no traffic numbers in
                    the public UI (tracking still feeds the owner-only stats). */}
              </div>

              <p className="text-sm leading-8 text-foreground/90 mb-5">
                {pickEn(lang, selected.descriptionEn, selected.description)}
              </p>

              {/* Third-party recognition banner — shows where this project's
                  code is already trusted as a worked reference */}
              {selectedAward && (
                <a
                  href={selectedAward.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t("projects", `award.${selectedAward.id}.aria`)}
                  className="group mb-5 flex items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] px-3.5 py-3 hover:border-amber-500/45 hover:bg-amber-500/[0.12] active:scale-[0.99] transition-all"
                >
                  <span className="w-9 h-9 grid place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden>
                    <Award className="w-5 h-5" />
                  </span>
                  <span className="flex-grow min-w-0">
                    <span className="block text-[13px] font-extrabold text-amber-600 dark:text-amber-400">
                      {t("projects", `award.${selectedAward.id}.label`)}
                    </span>
                    <span className="block text-[11px] leading-5 text-muted-foreground">
                      {t("projects", `award.${selectedAward.id}.desc`)}
                    </span>
                  </span>
                  <ExternalLink className="w-4 h-4 opacity-50 shrink-0 group-hover:opacity-90 transition-opacity" aria-hidden />
                </a>
              )}

              <h4 className="text-sm font-extrabold mb-2.5">{t("projects", "detail.stack")}</h4>
              <div className="flex flex-wrap gap-2 mb-5">
                {selected.tags.map((t) => (
                  <span
                    key={t}
                    dir="ltr"
                    className="text-[11px] font-mono rounded-lg border border-brand/25 bg-brand/10 text-brand px-2.5 py-1"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Auto-sync panel — latest release + weekly commit activity */}
              {(selected.latestTag || (selected.commitActivity?.length ?? 0) > 0) && (
                <div className="mb-5 rounded-2xl border border-border bg-secondary/40 px-3.5 py-3 flex items-center justify-between gap-3 flex-wrap">
                  {selected.latestTag && (
                    <span
                      dir="ltr"
                      title={t("projects", "detail.release")}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand bg-brand/10 border border-brand/25 rounded-full px-2.5 py-1"
                    >
                      <Tag className="w-3 h-3" aria-hidden />
                      {selected.latestTag}
                    </span>
                  )}
                  {(selected.commitActivity?.length ?? 0) > 0 && (
                    <div className="flex items-center gap-2 min-w-0" dir="ltr">
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {t("projects", "detail.activity")}
                      </span>
                      <CommitSparkline data={selected.commitActivity ?? []} />
                    </div>
                  )}
                </div>
              )}

              {/* Related projects (same category) */}
              {relatedProjects.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-sm font-extrabold mb-2.5">{t("projects", "detail.related")}</h4>
                  <div className="grid gap-2">
                    {relatedProjects.map((r) => (
                      <button
                        key={r.slug}
                        onClick={() => openProject(r)}
                        className="related-item text-start rounded-2xl border border-border bg-card px-3.5 py-2.5 flex items-center gap-3 hover:border-brand/40 transition-all min-h-[48px]"
                      >
                        <span
                          className="w-9 h-9 grid place-items-center rounded-xl bg-secondary text-xl shrink-0"
                          aria-hidden
                        >
                          {r.icon}
                        </span>
                        <span className="flex-grow min-w-0 text-xs font-bold truncate">
                          {pickEn(lang, r.titleEn, r.title)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-[1fr_auto_auto] gap-2 sm:gap-2.5">
                {selectedIsPrivate ? (
                  /* Private today → no dead GitHub link; a quiet lock CTA instead.
                     Swap happens automatically once the repo goes public. */
                  <button
                    type="button"
                    disabled
                    title={t("projects", "detail.privateNote")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 text-muted-foreground font-bold px-3 text-sm sm:px-6 sm:text-base py-3 cursor-not-allowed min-h-[46px]"
                  >
                    <LockKeyhole className="w-5 h-5" aria-hidden />
                    {t("projects", "detail.privateCta")}
                  </button>
                ) : (
                  <a
                    href={repoUrl(selected.repo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-shine inline-flex items-center justify-center gap-2 rounded-2xl bg-brand text-primary-foreground font-bold px-3 text-sm sm:px-6 sm:text-base py-3 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[46px]"
                  >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("projects", "detail.github")}
                </a>
                )}
                <button
                  onClick={() => toggleFav(selected.slug)}
                  aria-pressed={favSlugs.has(selected.slug)}
                  aria-label={
                    favSlugs.has(selected.slug)
                      ? t("projects", "favorites.removeThis")
                      : t("projects", "favorites.addThis")
                  }
                  title={
                    favSlugs.has(selected.slug)
                      ? t("projects", "favorites.removeShort")
                      : t("projects", "favorites.addShort")
                  }
                  className={cn(
                    "w-[46px] rounded-2xl border grid place-items-center active:scale-95 transition-all",
                    favSlugs.has(selected.slug)
                      ? "border-brand/50 bg-brand/15 text-brand"
                      : "border-border text-muted-foreground hover:text-brand hover:border-brand/50"
                  )}
                >
                  <Star
                    className={cn("w-5 h-5", favSlugs.has(selected.slug) && "fill-brand fav-star-on")}
                    aria-hidden
                  />
                </button>
                <button
                  onClick={() => shareProject(selected)}
                  aria-label={t("projects", "detail.shareAria")}
                  title={t("projects", "detail.shareTitle")}
                  className="w-[46px] rounded-2xl border border-border grid place-items-center text-muted-foreground hover:text-brand hover:border-brand/50 hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  {copied ? <Check className="w-5 h-5 text-brand" /> : <Share2 className="w-5 h-5" />}
                </button>
              </div>

              {/* Live site (GitHub Pages) secondary CTA — rendered for any
                  project with a demoUrl, private or not */}
              {selected.demoUrl && (
                <a
                  href={selected.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={
                    selected.demoOk === false
                      ? t("projects", "detail.demoDown")
                      : selected.demoUrl
                  }
                  className={cn(
                    "mt-3 flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border font-bold px-4 py-3 text-sm text-center sm:flex-row sm:gap-2 sm:px-6 sm:text-base hover:-translate-y-0.5 active:scale-95 transition-all min-h-[46px]",
                    selected.demoOk === false
                      ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-5 h-5 shrink-0" aria-hidden />
                    {t("projects", "detail.live")}
                  </span>
                  <span
                    dir="ltr"
                    className="max-w-full truncate text-[11px] font-mono opacity-70"
                  >
                    {demoHost(selected.demoUrl)}
                  </span>
                  <ExternalLink className="hidden w-4 h-4 opacity-60 shrink-0 sm:block" aria-hidden />
                </a>
              )}

              {/* Extra curated sites (e.g. GitHub Pages) — config-driven
                  (src/lib/project-sites.ts); rendered as secondary CTAs */}
              {selectedSites.map((site) => (
                <a
                  key={site.id}
                  href={site.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={t("projects", `site.${site.id}.aria`)}
                  className="mt-3 flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-secondary/60 font-bold px-4 py-3 text-sm text-center sm:flex-row sm:gap-2 sm:px-6 sm:text-base hover:-translate-y-0.5 hover:border-brand/40 active:scale-95 transition-all min-h-[46px]"
                >
                  <span className="flex items-center gap-2">
                    <Github className="w-5 h-5 shrink-0" aria-hidden />
                    {t("projects", `site.${site.id}.label`)}
                  </span>
                  <span
                    dir="ltr"
                    className="max-w-full truncate text-[11px] font-mono opacity-70"
                  >
                    {demoHost(site.href)}
                  </span>
                  <ExternalLink className="hidden w-4 h-4 opacity-60 shrink-0 sm:block" aria-hidden />
                </a>
              ))}

              {/* Terminal-style clone command — hidden for private repos
                  (cloning would require owner auth and 404 for visitors) */}
              {selectedIsPrivate ? (
                <div
                  className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2"
                  dir="auto"
                >
                  <LockKeyhole className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />
                  <span className="text-[11px] text-muted-foreground">
                    {t("projects", "detail.privateCloneNote")}
                  </span>
                </div>
              ) : (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2" dir="ltr">
                <Terminal className="w-3.5 h-3.5 text-brand shrink-0" aria-hidden />
                <code className="flex-grow min-w-0 truncate text-[11px] font-mono text-muted-foreground">
                  {`git clone ${repoUrl(selected.repo)}.git`}
                </code>
                <button
                  onClick={() => copyCloneCommand(selected.repo)}
                  aria-label={t("projects", "detail.copyClone")}
                  title={t("projects", "detail.copyClone")}
                  className="shrink-0 w-7 h-7 grid place-items-center rounded-lg text-muted-foreground hover:text-brand hover:bg-brand/10 transition-all"
                >
                  {cloneCopied ? (
                    <Check className="w-3.5 h-3.5 text-brand" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              )}

              {/* Repository documentation — lazy, cached server-side */}
              <ReadmeSection key={selected.slug} repo={selected.repo} />

              <p className="mt-2.5 text-[11px] text-muted-foreground flex items-center gap-1 justify-center">
                <Link2 className="w-3 h-3" />
                {t("projects", "detail.deeplinkNote")}
              </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
