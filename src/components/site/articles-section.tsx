"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Clock, Eye, ArrowLeft, Share2, Check, Heart, MessageCircle, Search, X, ArrowDownWideNarrow, LayoutGrid, ListTree, ChevronDown } from "lucide-react";
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
import { ArticleComments } from "@/components/site/article-comments";
import { ProjectCover } from "@/components/site/project-cover";
import { EmptyState } from "@/components/site/empty-state";
import { cn } from "@/lib/utils";
import type { Article } from "@/lib/types";

const DETAIL_INIT = Symbol("detail-init");
const LIKED_STORAGE_KEY = "imsoroush-liked-articles";
const LIKES_EVENT = "imsoroush-likes-change";
const EMPTY_LIKED: ReadonlySet<string> = new Set();

// External store over localStorage so liked hearts survive reloads (SSR-safe)
let likedCache: Set<string> | null = null;
function subscribeLiked(onChange: () => void) {
  window.addEventListener(LIKES_EVENT, onChange);
  return () => window.removeEventListener(LIKES_EVENT, onChange);
}
function getLikedSnapshot(): ReadonlySet<string> {
  if (!likedCache) {
    try {
      const raw = JSON.parse(localStorage.getItem(LIKED_STORAGE_KEY) ?? "[]") as string[];
      likedCache = new Set(Array.isArray(raw) ? raw : []);
    } catch {
      likedCache = new Set();
    }
  }
  return likedCache;
}
function getServerLiked(): ReadonlySet<string> {
  return EMPTY_LIKED;
}
function writeLiked(next: Set<string>) {
  likedCache = next;
  try {
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    // storage unavailable — in-memory only
  }
  window.dispatchEvent(new Event(LIKES_EVENT));
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  self: { label: "توسعه فردی", color: "text-fuchsia-500 border-fuchsia-500/30 bg-fuchsia-500/10" },
  sports: { label: "علوم ورزشی", color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10" },
};

const ART_FILTERS = [
  { id: "all", label: "همه نوشته‌ها", icon: "📚" },
  { id: "self", label: "توسعه فردی", icon: "🧠" },
  { id: "sports", label: "علوم ورزشی", icon: "💪" },
];

// Same normalization as the API (ي→ی ك→ک + ZWNJ → space)
const norm = (s: string) =>
  s.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/‌/g, " ").trim().toLowerCase();

// Deterministic anchor id for a TOC heading (same on both TOC list and rendered h3)
const headingId = (text: string) => `sec-${norm(text).replace(/\s+/g, "-").slice(0, 60)}`;

// Flatten ReactMarkdown heading children into plain text
const childrenText = (children: React.ReactNode): string => {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map((c) => (typeof c === "string" ? c : "")).join("");
  return String(children ?? "");
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function ArticlesSection({
  articles,
  loading,
  initialCategory,
  detailSlug,
  onOpenDetail,
  onCloseDetail,
}: {
  articles: Article[];
  loading: boolean;
  initialCategory?: string;
  detailSlug?: string;
  onOpenDetail: (slug: string) => void;
  onCloseDetail: () => void;
}) {
  const [selected, setSelected] = useState<Article | null>(null);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [bumpedSlugs, setBumpedSlugs] = useState<Set<string>>(new Set());
  const likedSlugs = useSyncExternalStore(subscribeLiked, getLikedSnapshot, getServerLiked);
  const [likesOverrides, setLikesOverrides] = useState<Record<string, number>>({});
  const [burstSlug, setBurstSlug] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const postedRef = useRef<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [tocOpen, setTocOpen] = useState(true);
  const validCat =
    initialCategory && ART_FILTERS.some((f) => f.id === initialCategory) ? initialCategory : "all";
  const [filter, setFilter] = useState(validCat);
  const [sort, setSort] = useState<"default" | "popular">("default");

  // Deep-link: sync filter when the category part of the hash changes (back/forward)
  const [prevCategory, setPrevCategory] = useState<string | undefined>(undefined);
  if (prevCategory !== initialCategory) {
    setPrevCategory(initialCategory);
    const next =
      initialCategory && ART_FILTERS.some((f) => f.id === initialCategory) ? initialCategory : "all";
    if (filter !== next) setFilter(next);
  }

  // Shareable filter URL: #/writing/cat/<id> (no history spam)
  const changeFilter = useCallback((id: string) => {
    setFilter(id);
    const target = id === "all" ? "#/writing" : `#/writing/cat/${id}`;
    if (window.location.hash !== target) {
      history.replaceState(null, "", target);
    }
  }, []);

  const { toast } = useToast();
  const onSpotlightMove = useSpotlight();

  const likesOf = (a: Article) => likesOverrides[a.slug] ?? a.likes;

  const handleCommentCount = useCallback((slug: string, total: number) => {
    setCommentCounts((prev) => ({ ...prev, [slug]: total }));
  }, []);

  const toggleLike = async (a: Article) => {
    const wasLiked = likedSlugs.has(a.slug);
    const action = wasLiked ? "unlike" : "like";
    const delta = wasLiked ? -1 : 1;

    // Optimistic update (persisted liked-set + card list + reader copy)
    const nextLiked = new Set(likedSlugs);
    if (wasLiked) nextLiked.delete(a.slug);
    else nextLiked.add(a.slug);
    writeLiked(nextLiked);
    setLikesOverrides((prev) => ({ ...prev, [a.slug]: Math.max(0, likesOf(a) + delta) }));
    setSelected((s) => (s && s.slug === a.slug ? { ...s, likes: Math.max(0, s.likes + delta) } : s));
    if (!wasLiked) {
      setBurstSlug(a.slug);
      window.setTimeout(() => setBurstSlug((b) => (b === a.slug ? null : b)), 650);
    }

    // Sync with server; reconcile on response
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: a.slug, action }),
      });
      const data = (await res.json()) as { likes?: number };
      if (typeof data.likes === "number") {
        setLikesOverrides((prev) => ({ ...prev, [a.slug]: data.likes as number }));
        setSelected((s) => (s && s.slug === a.slug ? { ...s, likes: data.likes as number } : s));
      }
    } catch {
      toast({ title: "ثبت لایک ناموفق بود", description: "اتصال برقرار نشد؛ بعداً تلاش کنید.", variant: "destructive" });
    }
  };

  const openArticle = (a: Article) => {
    if (!bumpedSlugs.has(a.slug)) {
      setBumpedSlugs((prev) => new Set(prev).add(a.slug));
      setSelected({ ...a, views: a.views + 1 });
    } else {
      setSelected(a);
    }
    onOpenDetail(a.slug);
  };

  // Deep-link: derive reader state from hash during render (prop-change adjustment)
  // Sentinel so a detailSlug present at mount still triggers the first adjustment
  const [prevDetail, setPrevDetail] = useState<string | undefined | symbol>(DETAIL_INIT);
  if (prevDetail !== detailSlug) {
    setPrevDetail(detailSlug);
    if (!detailSlug) {
      setSelected(null);
    } else {
      const a = articles.find((x) => x.slug === detailSlug);
      if (a && selected?.slug !== a.slug) {
        if (!bumpedSlugs.has(a.slug)) {
          setBumpedSlugs((prev) => new Set(prev).add(a.slug));
          setSelected({ ...a, views: a.views + 1 });
        } else {
          setSelected(a);
        }
      }
    }
  }

  // Count the view once per slug (external side-effect)
  useEffect(() => {
    const slug = selected?.slug;
    if (!slug || !bumpedSlugs.has(slug) || postedRef.current.has(slug)) return;
    postedRef.current.add(slug);
    fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => {});
  }, [selected, bumpedSlugs]);

  // Reset reading progress when article changes (render-phase adjustment)
  const [prevOpenSlug, setPrevOpenSlug] = useState<string | null>(null);
  if ((selected?.slug ?? null) !== prevOpenSlug) {
    setPrevOpenSlug(selected?.slug ?? null);
    setProgress(0);
    setTocOpen(true);
  }

  // Reset scroll position imperatively
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [selected?.slug]);

  const onReaderScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(el.scrollTop / max, 1) : 0);
  };

  const shareArticle = async (a: Article) => {
    const url = `${window.location.origin}/#/writing/${encodeURIComponent(a.slug)}`;
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    if (navigator.share) {
      try {
        await navigator.share({ title: a.title, url });
        return;
      } catch {
        // cancelled → clipboard fallback
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "لینک کپی شد", description: "لینک نوشته در کلیپ‌بورد ذخیره شد." });
    } catch {
      toast({ title: "کپی نشد", description: url, variant: "destructive" });
    }
  };

  // Table of contents: level-3 headings act as sections (the leading `##` is the opener)
  const tocItems = useMemo(() => {
    if (!selected) return [];
    const out: { id: string; title: string }[] = [];
    const re = /^###\s+(.+)$/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(selected.content)) !== null) {
      const title = m[1].trim();
      out.push({ id: headingId(title), title });
    }
    return out;
  }, [selected]);

  const jumpToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Deterministic h3 anchors — same id math as tocItems above
  const markdownComponents = useMemo(
    () => ({
      h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 id={headingId(childrenText(children))} className="scroll-mt-8">{children}</h3>
      ),
    }),
    []
  );

  // Client-side search + filter + sort (list is small; no API round-trip needed)
  const visible = useMemo(() => {
    const tokens = query ? norm(query).split(/\s+/) : [];
    let list = articles.filter((a) => {
      if (filter !== "all" && a.category !== filter) return false;
      if (tokens.length === 0) return true;
      const hay = norm(`${a.title} ${a.excerpt} ${a.content.slice(0, 500)}`);
      return tokens.every((t) => hay.includes(t));
    });
    if (sort === "popular") {
      list = [...list].sort((x, y) => y.views - x.views);
    }
    return list;
  }, [articles, query, filter, sort]);

  const resetFilters = useCallback(() => {
    setQuery("");
    changeFilter("all");
    setSort("default");
  }, [changeFilter]);

  return (
    <section id="articles" aria-label="نوشته‌ها" className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Search + Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در نوشته‌ها..."
            aria-label="جستجوی نوشته"
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

        <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="فیلتر دسته‌بندی نوشته‌ها">
          {ART_FILTERS.map((f) => (
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
            {`${visible.length.toLocaleString("fa-IR")} نوشته یافت شد`}
          </p>
          <span className="w-1 h-1 rounded-full bg-border" aria-hidden />
          <button
            onClick={() => setSort((s) => (s === "popular" ? "default" : "popular"))}
            aria-pressed={sort === "popular"}
            title={sort === "popular" ? "بازگشت به چیدمان پیش‌فرض" : "مرتب‌سازی بر اساس پربازدیدترین"}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-bold rounded-full border px-3.5 py-1.5 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[30px]",
              sort === "popular"
                ? "text-primary-foreground bg-brand border-brand chip-active"
                : "text-brand border-brand/30 bg-brand/10 hover:bg-brand/20"
            )}
          >
            {sort === "popular" ? (
              <ArrowDownWideNarrow className="w-3.5 h-3.5" />
            ) : (
              <LayoutGrid className="w-3.5 h-3.5" />
            )}
            {sort === "popular" ? "پربازدیدترین" : "چیدمان پیش‌فرض"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title="نوشته‌ای یافت نشد"
          description="عبارت دیگری را جستجو کنید یا فیلتر دسته‌بندی را تغییر دهید."
          onReset={query || filter !== "all" || sort !== "default" ? resetFilters : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence>
            {visible.map((a, i) => {
              const meta = CATEGORY_META[a.category];
              return (
                <motion.button
                  key={a.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  onClick={() => openArticle(a)}
                  onMouseMove={onSpotlightMove}
                  className="glow-card spotlight group text-right rounded-2xl border border-border bg-card p-6 flex flex-col h-full"
                >
                  {/* generative cover art */}
                  <div className="cover-wrap -mx-6 -mt-6 mb-4 rounded-t-2xl overflow-hidden">
                    <ProjectCover slug={a.slug} category={a.category} idPrefix="art" className="h-24 sm:h-28 w-full" />
                    <div className="cover-float">
                      <span className="text-3xl card-emoji drop-shadow-lg" aria-hidden>
                        {a.icon}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {meta && (
                        <span
                          className={`text-[10px] font-bold rounded-full border px-2.5 py-1 ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-muted-foreground inline-flex items-center gap-1 border border-border rounded-full px-2.5 py-1">
                        <Clock className="w-3 h-3" />
                        {a.readTime.toLocaleString("fa-IR")} دقیقه
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-bold inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition-colors",
                          likedSlugs.has(a.slug)
                            ? "text-brand border-brand/30 bg-brand/10"
                            : "text-muted-foreground border-border"
                        )}
                      >
                        <Heart
                          className={cn(
                            "w-3 h-3",
                            likedSlugs.has(a.slug) && "fill-brand",
                            burstSlug === a.slug && "like-burst"
                          )}
                        />
                        {likesOf(a).toLocaleString("fa-IR")}
                      </span>
                      {(commentCounts[a.slug] ?? 0) > 0 && (
                        <span className="text-[10px] font-bold text-muted-foreground inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1">
                          <MessageCircle className="w-3 h-3" />
                          {commentCounts[a.slug].toLocaleString("fa-IR")}
                        </span>
                      )}
                  </div>
                  <h3 className="font-extrabold text-lg mb-2 leading-8 group-hover:text-brand transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-7 flex-grow line-clamp-3 mb-4">
                    {a.excerpt}
                  </p>
                  <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(a.publishedAt)}</span>
                    <span className="font-bold text-brand inline-flex items-center gap-1.5">
                      مطالعه
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform" />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Reader dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); onCloseDetail(); } }}>
        <DialogContent
          ref={scrollRef}
          onScroll={onReaderScroll}
          className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 rounded-3xl dialog-accent"
        >
          {selected && (
            <>
              <div className="reading-progress -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-0" aria-hidden>
                <span style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>

              {/* generative hero cover */}
              <div className="cover-wrap dialog-cover -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-5 overflow-hidden">
                <ProjectCover
                  slug={selected.slug}
                  category={selected.category}
                  idPrefix="artdlg"
                  className="h-28 sm:h-32 w-full"
                />
                <span className="absolute bottom-3 right-5 text-4xl card-emoji drop-shadow-xl" aria-hidden>
                  {selected.icon}
                </span>
              </div>

              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl leading-9 text-right">
                  {selected.title}
                </DialogTitle>
                <DialogDescription className="text-right text-sm leading-7 pt-1">
                  {selected.excerpt}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2 my-4">
                {CATEGORY_META[selected.category] && (
                  <Badge variant="secondary">
                    {CATEGORY_META[selected.category].label}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {selected.readTime.toLocaleString("fa-IR")} دقیقه مطالعه
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Eye className="w-3 h-3" />
                  {selected.views.toLocaleString("fa-IR")} بازدید
                </Badge>
                <div className="mr-auto flex items-center gap-1.5">
                  <button
                    onClick={() => toggleLike(selected)}
                    aria-pressed={likedSlugs.has(selected.slug)}
                    aria-label={
                      likedSlugs.has(selected.slug) ? "برداشتن لایک" : "لایک کردن این نوشته"
                    }
                    title={likedSlugs.has(selected.slug) ? "لایک شده" : "لایک"}
                    className={cn(
                      "inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full border px-3 py-1.5 transition-all min-h-[30px] active:scale-95",
                      likedSlugs.has(selected.slug)
                        ? "text-brand border-brand/40 bg-brand/15"
                        : "text-muted-foreground border-border hover:text-brand hover:border-brand/40"
                    )}
                  >
                    <Heart
                      className={cn(
                        "w-3.5 h-3.5",
                        likedSlugs.has(selected.slug) && "fill-brand",
                        burstSlug === selected.slug && "like-burst"
                      )}
                    />
                    {selected.likes.toLocaleString("fa-IR")}
                  </button>
                  <button
                    onClick={() => shareArticle(selected)}
                    aria-label="هم‌رسانی لینک نوشته"
                    title="هم‌رسانی لینک"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 hover:bg-brand/20 active:scale-95 transition-all min-h-[30px]"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    هم‌رسانی
                  </button>
                </div>
              </div>

              {/* Table of contents */}
              {tocItems.length > 1 && (
                <nav aria-label="فهرست مطالب" className="toc-box mb-5">
                  <button
                    type="button"
                    onClick={() => setTocOpen((v) => !v)}
                    aria-expanded={tocOpen}
                    className="w-full flex items-center gap-2 font-extrabold text-sm"
                  >
                    <ListTree className="w-4 h-4 text-brand" aria-hidden />
                    فهرست مطالب
                    <span className="text-[10px] font-bold text-brand bg-brand/10 border border-brand/25 rounded-full px-2 py-0.5">
                      {tocItems.length.toLocaleString("fa-IR")} بخش
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 mr-auto text-muted-foreground transition-transform duration-300",
                        tocOpen && "rotate-180"
                      )}
                      aria-hidden
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {tocOpen && (
                      <motion.ol
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="toc-list overflow-hidden list-none space-y-0.5 mt-2"
                      >
                        {tocItems.map((item, i) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => jumpToSection(item.id)}
                              className="toc-link w-full text-right flex items-baseline gap-2.5 rounded-xl px-2.5 py-2 text-xs text-muted-foreground hover:text-brand hover:bg-brand/5 transition-all min-h-[34px]"
                            >
                              <span
                                className="shrink-0 w-5 h-5 grid place-items-center rounded-lg border border-brand/25 bg-brand/10 text-[9px] font-black text-brand"
                                aria-hidden
                              >
                                {(i + 1).toLocaleString("fa-IR")}
                              </span>
                              <span className="leading-6">{item.title}</span>
                            </button>
                          </li>
                        ))}
                      </motion.ol>
                    )}
                  </AnimatePresence>
                </nav>
              )}

              <div className="prose-fa max-w-none">
                <ReactMarkdown components={markdownComponents}>{selected.content}</ReactMarkdown>
              </div>

              <ArticleComments slug={selected.slug} onCountChange={handleCommentCount} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
