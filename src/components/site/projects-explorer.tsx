"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ExternalLink, X, Eye, Star, Share2, Dices, Link2, Check, ArrowDownWideNarrow, LayoutGrid, Terminal, Copy } from "lucide-react";
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
import { EmptyState } from "./empty-state";
import type { Project } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

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

const FILTERS = [
  { id: "all", label: "همه", icon: "✨" },
  { id: "bots", label: "ربات‌های تلگرام", icon: "🤖" },
  { id: "web", label: "وب و فروشگاه", icon: "🌐" },
  { id: "3d", label: "سه‌بعدی و تعاملی", icon: "🪐" },
  { id: "tools", label: "ابزارهای توسعه", icon: "🛠️" },
];

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
      if (!bumpedSlugs.has(p.slug)) {
        setBumpedSlugs((prev) => new Set(prev).add(p.slug));
        setSelected({ ...p, views: p.views + 1 });
      } else {
        setSelected(p);
      }
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
          setSelected({ ...p, views: p.views + 1 });
        } else {
          setSelected(p);
        }
      }
    }
  }

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

  const shareProject = async (p: Project) => {
    const url = `${window.location.origin}/#/projects/${encodeURIComponent(p.slug)}`;
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    if (navigator.share) {
      try {
        await navigator.share({ title: p.title, url });
        return;
      } catch {
        // user cancelled → fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "لینک کپی شد", description: "لینک پروژه در کلیپ‌بورد ذخیره شد." });
    } catch {
      toast({ title: "کپی نشد", description: url, variant: "destructive" });
    }
  };

  const copyCloneCommand = async (repo: string) => {
    const cmd = `git clone https://github.com/${repo}.git`;
    try {
      await navigator.clipboard.writeText(cmd);
      setCloneCopied(true);
      setTimeout(() => setCloneCopied(false), 1600);
      toast({ title: "دستور کپی شد", description: "دستور کلون در کلیپ‌بورد ذخیره شد." });
    } catch {
      toast({ title: "کپی نشد", description: cmd, variant: "destructive" });
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
        if (data.projects) setProjects(data.projects);
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

  const renderCard = (p: Project, index: number) => (
    <motion.button
      key={p.id}
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.4) }}
      onClick={() => openProject(p)}
      onMouseMove={onSpotlightMove}
      className="glow-card spotlight group text-right rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col h-full w-full"
    >
      {/* generative cover art */}
      <div className="cover-wrap -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-4 rounded-t-2xl overflow-hidden">
        <ProjectCover slug={p.slug} category={p.category} className="h-24 sm:h-28 w-full" />
        <div className="cover-float">
          <span className="text-3xl card-emoji drop-shadow-lg" aria-hidden>
            {p.icon}
          </span>
        </div>
        {p.featured && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#05261f] bg-brand border border-white/20 rounded-full px-2 py-0.5 shadow-lg">
            <Star className="w-3 h-3" /> منتخب
          </span>
        )}
        {/* Favorite toggle — span keeps the card's single-button semantics valid */}
        <span
          role="button"
          tabIndex={0}
          aria-pressed={favSlugs.has(p.slug)}
          aria-label={
            favSlugs.has(p.slug)
              ? `حذف ${p.title} از علاقه‌مندی‌ها`
              : `افزودن ${p.title} به علاقه‌مندی‌ها`
          }
          title={favSlugs.has(p.slug) ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
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
            "fav-star absolute top-2.5 right-2.5 z-10 w-8 h-8 grid place-items-center rounded-full border backdrop-blur-md",
            favSlugs.has(p.slug)
              ? "fav-star-on border-brand/60 bg-brand/30 text-brand"
              : "border-white/30 bg-black/30 text-white/90 hover:text-brand hover:border-brand/50"
          )}
        >
          <Star className={cn("w-4 h-4", favSlugs.has(p.slug) && "fill-brand")} aria-hidden />
        </span>
      </div>
      <h3 className="font-extrabold text-base sm:text-lg mb-1.5 group-hover:text-brand transition-colors leading-7">
        {p.title}
      </h3>
      <p dir="ltr" className="text-[11px] font-mono text-muted-foreground/70 truncate mb-3 text-left">
        {p.repo}
      </p>
      <p className="text-sm text-muted-foreground leading-7 flex-grow line-clamp-3">
        {p.description}
      </p>
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />
          {p.views.toLocaleString("fa-IR")}
        </span>
        <span className="text-xs font-bold text-brand inline-flex items-center gap-1">
          جزئیات
          <ExternalLink className="w-3.5 h-3.5 -scale-x-100" />
        </span>
      </div>
    </motion.button>
  );

  return (
    <section id="projects" aria-label="پروژه‌ها" className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Search + Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground pointer-events-none" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در پروژه‌ها، تکنولوژی‌ها و ریپوها..."
            aria-label="جستجوی پروژه"
            className="w-full rounded-2xl border border-border bg-card px-11 py-3.5 text-sm outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20 transition-all min-h-[46px]"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="پاک کردن جستجو"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="فیلتر دسته‌بندی">
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
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3">
          <p className="text-center text-xs text-muted-foreground" aria-live="polite">
            {loading
              ? "در حال جستجو..."
              : `${displayList.length.toLocaleString("fa-IR")} پروژه یافت شد`}
          </p>
          <span className="w-1 h-1 rounded-full bg-border" aria-hidden />
          <button
            onClick={() => setSort((s) => (s === "views" ? "default" : "views"))}
            aria-pressed={sort === "views"}
            title={sort === "views" ? "بازگشت به چیدمان پیش‌فرض" : "مرتب‌سازی بر اساس بیشترین بازدید"}
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
            {sort === "views" ? "پربازدیدترین" : "چیدمان پیش‌فرض"}
          </button>
          <span className="w-1 h-1 rounded-full bg-border" aria-hidden />
          <button
            onClick={randomProject}
            disabled={rolling}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 hover:bg-brand/20 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 min-h-[30px]"
          >
            <Dices className={cn("w-3.5 h-3.5", rolling && "animate-spin")} />
            {rolling ? "در حال چرخش..." : "پروژه تصادفی"}
          </button>
          <span className="w-1 h-1 rounded-full bg-border" aria-hidden />
          <button
            onClick={() => setFavOnly((v) => !v)}
            aria-pressed={favOnly}
            title={favOnly ? "نمایش همه پروژه‌ها" : "فقط پروژه‌های نشان‌ستاره‌دار شما"}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-bold rounded-full border px-3.5 py-1.5 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[30px]",
              favOnly
                ? "text-primary-foreground bg-brand border-brand chip-active"
                : "text-brand border-brand/30 bg-brand/10 hover:bg-brand/20"
            )}
          >
            <Star className={cn("w-3.5 h-3.5", favOnly && "fill-current")} aria-hidden />
            علاقه‌مندی‌ها
            {favSlugs.size > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px]",
                  favOnly ? "bg-primary-foreground/25" : "bg-brand/15"
                )}
              >
                {favSlugs.size.toLocaleString("fa-IR")}
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
          title={favOnly ? "هنوز پروژه‌ای نشان نکرده‌اید" : "پروژه‌ای یافت نشد"}
          description={
            favOnly
              ? "با زدن ستاره روی کارت پروژه‌ها، آن‌ها را برای مرور بعدی ذخیره کنید."
              : "عبارت دیگری را جستجو کنید یا فیلتر دسته‌بندی را تغییر دهید."
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
                  {f.label}
                  <span className="text-xs font-medium text-muted-foreground bg-secondary rounded-full px-2.5 py-1">
                    {items.length.toLocaleString("fa-IR")}
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-6 rounded-3xl dialog-accent">
          {selected && (
            <>
              {/* generative hero cover */}
              <div className="cover-wrap dialog-cover -mx-6 -mt-6 mb-5 overflow-hidden">
                <ProjectCover
                  slug={selected.slug}
                  category={selected.category}
                  idPrefix="dlg"
                  className="h-32 sm:h-36 w-full"
                />
                <span className="absolute bottom-3 right-5 text-4xl card-emoji drop-shadow-xl" aria-hidden>
                  {selected.icon}
                </span>
              </div>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-1">
                  <div className="min-w-0 flex-grow">
                    <DialogTitle className="text-lg sm:text-xl leading-8 text-right">
                      {selected.title}
                    </DialogTitle>
                    <DialogDescription dir="ltr" className="text-left text-xs font-mono mt-1">
                      {selected.repo}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary" className="gap-1">
                  <span aria-hidden>{CATEGORY_LABELS[selected.category]?.icon}</span>
                  {CATEGORY_LABELS[selected.category]?.label ?? selected.category}
                </Badge>
                {selected.featured && (
                  <Badge className="gap-1 bg-brand text-primary-foreground border-0">
                    <Star className="w-3 h-3" /> پروژه منتخب
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <Eye className="w-3 h-3" />
                  {selected.views.toLocaleString("fa-IR")} بازدید
                </Badge>
              </div>

              <p className="text-sm leading-8 text-foreground/90 mb-5">{selected.description}</p>

              <h4 className="text-sm font-extrabold mb-2.5">پشته فناوری</h4>
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

              {/* Related projects (same category) */}
              {relatedProjects.length > 0 && (
                <div className="mb-5">
                  <h4 className="text-sm font-extrabold mb-2.5">پروژه‌های مرتبط</h4>
                  <div className="grid gap-2">
                    {relatedProjects.map((r) => (
                      <button
                        key={r.slug}
                        onClick={() => openProject(r)}
                        className="related-item text-right rounded-2xl border border-border bg-card px-3.5 py-2.5 flex items-center gap-3 hover:border-brand/40 transition-all min-h-[48px]"
                      >
                        <span
                          className="w-9 h-9 grid place-items-center rounded-xl bg-secondary text-xl shrink-0"
                          aria-hidden
                        >
                          {r.icon}
                        </span>
                        <span className="flex-grow min-w-0 text-xs font-bold truncate">{r.title}</span>
                        <span className="shrink-0 text-[10px] text-muted-foreground inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" aria-hidden />
                          {r.views.toLocaleString("fa-IR")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-[1fr_auto_auto] gap-2.5">
                <a
                  href={`https://github.com/${selected.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-shine inline-flex items-center justify-center gap-2 rounded-2xl bg-brand text-primary-foreground font-bold px-6 py-3 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[46px]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  مشاهده در گیت‌هاب
                </a>
                <button
                  onClick={() => toggleFav(selected.slug)}
                  aria-pressed={favSlugs.has(selected.slug)}
                  aria-label={
                    favSlugs.has(selected.slug)
                      ? "حذف این پروژه از علاقه‌مندی‌ها"
                      : "افزودن این پروژه به علاقه‌مندی‌ها"
                  }
                  title={favSlugs.has(selected.slug) ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
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
                  aria-label="هم‌رسانی لینک پروژه"
                  title="هم‌رسانی لینک"
                  className="w-[46px] rounded-2xl border border-border grid place-items-center text-muted-foreground hover:text-brand hover:border-brand/50 hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  {copied ? <Check className="w-5 h-5 text-brand" /> : <Share2 className="w-5 h-5" />}
                </button>
              </div>

              {/* Terminal-style clone command */}
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 py-2" dir="ltr">
                <Terminal className="w-3.5 h-3.5 text-brand shrink-0" aria-hidden />
                <code className="flex-grow min-w-0 truncate text-[11px] font-mono text-muted-foreground">
                  git clone https://github.com/{selected.repo}.git
                </code>
                <button
                  onClick={() => copyCloneCommand(selected.repo)}
                  aria-label="کپی دستور کلون"
                  title="کپی دستور کلون"
                  className="shrink-0 w-7 h-7 grid place-items-center rounded-lg text-muted-foreground hover:text-brand hover:bg-brand/10 transition-all"
                >
                  {cloneCopied ? (
                    <Check className="w-3.5 h-3.5 text-brand" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <p className="mt-2.5 text-[11px] text-muted-foreground flex items-center gap-1 justify-center">
                <Link2 className="w-3 h-3" />
                لینک این پروژه قابل هم‌رسانی و نشانی‌پذیر است
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
