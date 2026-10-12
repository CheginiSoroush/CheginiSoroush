"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Clock, Eye, ArrowLeft, Share2, Check, Heart, MessageCircle, Search, X, ArrowDownWideNarrow, LayoutGrid, ListTree, ChevronDown, BookOpen, Send, History, Trash2, Minus, Plus, Type } from "lucide-react";
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

// ---------- Reading progress store (localStorage-backed, SSR-safe) ----------
const READING_KEY = "imsoroush-reading-progress";
const READING_EVENT = "imsoroush-reading-change";
export type ReadingEntry = {
  slug: string;
  title: string;
  icon: string;
  category: string;
  progress: number; // 0..1
  updatedAt: number;
  dismissed?: boolean;
};
type ReadingMap = Record<string, ReadingEntry>;
const EMPTY_READING: ReadingMap = {};

let readingCache: ReadingMap | null = null;
function subscribeReading(onChange: () => void) {
  window.addEventListener(READING_EVENT, onChange);
  return () => window.removeEventListener(READING_EVENT, onChange);
}
function getReadingSnapshot(): ReadingMap {
  if (!readingCache) {
    try {
      const raw = JSON.parse(localStorage.getItem(READING_KEY) ?? "{}") as ReadingMap;
      readingCache = raw && typeof raw === "object" ? raw : {};
    } catch {
      readingCache = {};
    }
  }
  return readingCache;
}
function getServerReading(): ReadingMap {
  return EMPTY_READING;
}
function writeReadingMap(next: ReadingMap) {
  readingCache = next;
  try {
    localStorage.setItem(READING_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — in-memory only
  }
  window.dispatchEvent(new Event(READING_EVENT));
}
function saveReadingEntry(entry: ReadingEntry) {
  const map = { ...getReadingSnapshot() };
  map[entry.slug] = { ...entry, dismissed: false };
  writeReadingMap(map);
}
function dismissReadingEntry(slug: string) {
  const map = { ...getReadingSnapshot() };
  if (map[slug]) map[slug] = { ...map[slug], dismissed: true };
  writeReadingMap(map);
}
function removeReadingEntry(slug: string) {
  const map = { ...getReadingSnapshot() };
  delete map[slug];
  writeReadingMap(map);
}
function clearReadingHistory() {
  writeReadingMap({});
}

// Persian relative time (same wording as article-comments)
function relativeTime(ts: number) {
  try {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return "همین حالا";
    if (mins < 60) return `${mins.toLocaleString("fa-IR")} دقیقه پیش`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours.toLocaleString("fa-IR")} ساعت پیش`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days.toLocaleString("fa-IR")} روز پیش`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks.toLocaleString("fa-IR")} هفته پیش`;
    return new Date(ts).toLocaleDateString("fa-IR");
  } catch {
    return "";
  }
}

// Reader font-size steps (percent, persisted via external store — SSR-safe)
const FONT_STEPS = [100, 108, 117, 126];
const FONT_KEY = "imsoroush-reader-font";
const FONT_EVENT = "imsoroush-reader-font-change";
function loadFontStep(): number {
  try {
    const raw = Number(localStorage.getItem(FONT_KEY));
    if (Number.isInteger(raw) && raw >= 0 && raw < FONT_STEPS.length) return raw;
  } catch {
    // storage unavailable
  }
  return 0;
}
let fontStepCache: number | null = null;
function subscribeFont(onChange: () => void) {
  window.addEventListener(FONT_EVENT, onChange);
  return () => window.removeEventListener(FONT_EVENT, onChange);
}
function getFontSnapshot(): number {
  if (fontStepCache === null) fontStepCache = loadFontStep();
  return fontStepCache;
}
function getServerFont(): number {
  return 0;
}
function writeFontStep(step: number) {
  fontStepCache = step;
  try {
    localStorage.setItem(FONT_KEY, String(step));
  } catch {
    // storage unavailable — session-only
  }
  window.dispatchEvent(new Event(FONT_EVENT));
}

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

// Brand share-target links for the reader (URL-safe, hash-routed)
function shareLinksFor(a: Article) {
  const url = encodeURIComponent(`${window.location.origin}/#/writing/${encodeURIComponent(a.slug)}`);
  const text = encodeURIComponent(a.title);
  return {
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
  };
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function XLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
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
  const readingMap = useSyncExternalStore(subscribeReading, getReadingSnapshot, getServerReading);
  const pendingResumeRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const lastWriteRef = useRef(0);
  const [query, setQuery] = useState("");
  const [tocOpen, setTocOpen] = useState(true);
  const fontStep = useSyncExternalStore(subscribeFont, getFontSnapshot, getServerFont);
  const [historyOpen, setHistoryOpen] = useState(false);
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

  // Most recent unfinished (and not dismissed) reading session — for the resume card
  const resumeEntry = useMemo(() => {
    const list = Object.values(readingMap).filter(
      (e) => e && !e.dismissed && e.progress < 0.97 && e.progress > 0.01
    );
    if (list.length === 0) return null;
    return list.reduce((a, b) => (b.updatedAt > a.updatedAt ? b : a));
  }, [readingMap]);

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

  const resumeReading = () => {
    if (!resumeEntry) return;
    const a = articles.find((x) => x.slug === resumeEntry.slug);
    if (!a) {
      removeReadingEntry(resumeEntry.slug);
      return;
    }
    pendingResumeRef.current = resumeEntry.progress;
    openArticle(a);
  };

  // Resume from an arbitrary history row (even finished ones just re-open)
  const resumeFromHistory = (slug: string, saved: number) => {
    const a = articles.find((x) => x.slug === slug);
    if (!a) {
      removeReadingEntry(slug);
      return;
    }
    setHistoryOpen(false);
    pendingResumeRef.current = saved >= 0.97 ? 0 : saved;
    openArticle(a);
  };

  // Full reading history (newest first)
  const historyList = useMemo(
    () => Object.values(readingMap).sort((a, b) => b.updatedAt - a.updatedAt),
    [readingMap]
  );

  // Command palette → open history panel
  useEffect(() => {
    const open = () => setHistoryOpen(true);
    window.addEventListener("imsoroush-open-history", open);
    return () => window.removeEventListener("imsoroush-open-history", open);
  }, []);

  // Load persisted reader font size handled by the external store above
  const changeFontStep = (next: number) => {
    const clamped = Math.max(0, Math.min(FONT_STEPS.length - 1, next));
    writeFontStep(clamped);
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

  // Reset scroll position imperatively (then apply a pending resume position)
  useEffect(() => {
    const target = pendingResumeRef.current;
    pendingResumeRef.current = null;
    scrollRef.current?.scrollTo({ top: 0 });
    if (selected && typeof target === "number") {
      const t = window.setTimeout(() => {
        const el = scrollRef.current;
        if (!el) return;
        const max = el.scrollHeight - el.clientHeight;
        el.scrollTo({ top: max * target, behavior: "auto" });
      }, 120);
      return () => window.clearTimeout(t);
    }
  }, [selected?.slug]);

  const onReaderScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const p = max > 0 ? Math.min(el.scrollTop / max, 1) : 0;
    setProgress(p);
    progressRef.current = p;

    // Persist reading position (throttled) for the resume card + history panel
    const now = Date.now();
    if (selected && now - lastWriteRef.current > 700) {
      lastWriteRef.current = now;
      if (p < 0.005) {
        // barely opened — nothing worth keeping
        removeReadingEntry(selected.slug);
      } else {
        // finished articles are KEPT (progress 1) so the history shows them as done
        saveReadingEntry({
          slug: selected.slug,
          title: selected.title,
          icon: selected.icon,
          category: selected.category,
          progress: Math.min(p, 1),
          updatedAt: now,
        });
      }
    }
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

  // Related articles in the same category (reader)
  const relatedArticles = useMemo(() => {
    if (!selected) return [];
    return articles
      .filter((a) => a.category === selected.category && a.slug !== selected.slug)
      .slice(0, 2);
  }, [articles, selected]);

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
      {/* Continue-reading resume card */}
      {resumeEntry && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          role="region"
          aria-label="ادامه مطالعه"
          className="resume-card mb-7 max-w-xl mx-auto"
        >
          <div className="flex items-center gap-3.5">
            <span className="resume-cover grid place-items-center shrink-0 w-14 h-14 rounded-2xl text-3xl" aria-hidden>
              {resumeEntry.icon}
            </span>
            <div className="flex-grow min-w-0">
              <p className="text-[11px] font-black text-brand flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" aria-hidden />
                ادامه مطالعه
              </p>
              <p className="font-extrabold text-sm truncate mt-0.5">{resumeEntry.title}</p>
              <div
                className="resume-progress mt-2"
                role="progressbar"
                aria-valuenow={Math.round(resumeEntry.progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="پیشرفت مطالعه"
              >
                <span style={{ width: `${Math.round(resumeEntry.progress * 100)}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {Math.round(resumeEntry.progress * 100).toLocaleString("fa-IR")}٪ خوانده شده
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-1.5 shrink-0">
              <button
                onClick={resumeReading}
                className="btn-shine inline-flex items-center gap-1.5 rounded-xl bg-brand text-primary-foreground font-bold text-xs px-4 py-2.5 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[38px]"
              >
                ادامه
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
              </button>
              <button
                onClick={() => dismissReadingEntry(resumeEntry.slug)}
                aria-label="بستن کارت ادامه مطالعه"
                title="بستن"
                className="w-full h-7 grid place-items-center rounded-lg border border-border text-muted-foreground/60 hover:text-foreground hover:border-border/80 transition-all"
              >
                <X className="w-3.5 h-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </motion.div>
      )}

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
          {historyList.length > 0 && (
            <button
              onClick={() => setHistoryOpen(true)}
              title="تاریخچه مطالعه شما"
              aria-label={`تاریخچه مطالعه، ${historyList.length.toLocaleString("fa-IR")} نوشته`}
              className="history-trigger inline-flex items-center gap-1.5 text-xs font-bold text-brand rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1.5 hover:bg-brand/20 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[30px]"
            >
              <History className="w-3.5 h-3.5" aria-hidden />
              تاریخچه
              <span className="text-[10px] font-black bg-brand text-primary-foreground rounded-full px-1.5 min-w-[18px] text-center">
                {historyList.length.toLocaleString("fa-IR")}
              </span>
            </button>
          )}
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
              const read = readingMap[a.slug];
              const readPct = read ? Math.round(read.progress * 100) : 0;
              const isDone = !!read && read.progress >= 0.97 && !read.dismissed;
              const isInProgress = !!read && !read.dismissed && read.progress >= 0.005 && read.progress < 0.97;
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
                      {isDone && (
                        <span className="text-[10px] font-black text-emerald-500 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1">
                          <Check className="w-3 h-3" aria-hidden />
                          خوانده شد
                        </span>
                      )}
                  </div>
                  <h3 className="font-extrabold text-lg mb-2 leading-8 group-hover:text-brand transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-7 flex-grow line-clamp-3 mb-4">
                    {a.excerpt}
                  </p>
                  {isInProgress && (
                    <div className="mb-4">
                      <div
                        className="card-progress"
                        role="progressbar"
                        aria-valuenow={readPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`پیشرفت مطالعه ${a.title}`}
                      >
                        <span style={{ width: `${readPct}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-brand" aria-hidden />
                        {readPct.toLocaleString("fa-IR")}٪ خوانده شده — ادامه دهید
                      </p>
                    </div>
                  )}
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
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            // Persist the final position so the resume card + history stay accurate
            const now = Date.now();
            if (selected && progressRef.current > 0.01) {
              saveReadingEntry({
                slug: selected.slug,
                title: selected.title,
                icon: selected.icon,
                category: selected.category,
                progress: Math.min(progressRef.current, 1),
                updatedAt: now,
              });
            }
            setSelected(null);
            onCloseDetail();
          }
        }}
      >
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
                  <div className="flex items-center gap-1.5" role="group" aria-label="هم‌رسانی در شبکه‌های اجتماعی">
                    {(() => {
                      const links = shareLinksFor(selected);
                      return (
                        <>
                          <a
                            href={links.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="هم‌رسانی در تلگرام"
                            title="تلگرام"
                            className="share-bubble share-telegram"
                          >
                            <Send className="w-4 h-4" aria-hidden />
                          </a>
                          <a
                            href={links.whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="هم‌رسانی در واتساپ"
                            title="واتساپ"
                            className="share-bubble share-whatsapp"
                          >
                            <WhatsAppIcon className="w-4 h-4" />
                          </a>
                          <a
                            href={links.x}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="هم‌رسانی در ایکس"
                            title="ایکس"
                            className="share-bubble share-x"
                          >
                            <XLogoIcon className="w-3.5 h-3.5" />
                          </a>
                        </>
                      );
                    })()}
                  </div>
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

              {/* Reader font-size controls */}
              <div className="reader-font-group flex items-center gap-2 justify-end -mt-1 mb-3" role="group" aria-label="اندازه قلم نوشته">
                <span className="text-[10px] font-bold text-muted-foreground inline-flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-brand" aria-hidden />
                  اندازه قلم
                </span>
                <div className="flex items-center rounded-full border border-border bg-card p-0.5">
                  <button
                    type="button"
                    onClick={() => changeFontStep(fontStep - 1)}
                    disabled={fontStep === 0}
                    aria-label="کوچک‌تر کردن قلم"
                    title="قلم کوچک‌تر"
                    className="w-8 h-8 grid place-items-center rounded-full text-muted-foreground hover:text-brand hover:bg-brand/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <Minus className="w-4 h-4" aria-hidden />
                  </button>
                  <span className="text-[10px] font-black text-brand min-w-[44px] text-center tabular-nums" aria-live="polite">
                    {FONT_STEPS[fontStep].toLocaleString("fa-IR")}٪
                  </span>
                  <button
                    type="button"
                    onClick={() => changeFontStep(fontStep + 1)}
                    disabled={fontStep === FONT_STEPS.length - 1}
                    aria-label="بزرگ‌تر کردن قلم"
                    title="قلم بزرگ‌تر"
                    className="w-8 h-8 grid place-items-center rounded-full text-muted-foreground hover:text-brand hover:bg-brand/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <Plus className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </div>

              <div className="prose-fa max-w-none" style={{ fontSize: `${FONT_STEPS[fontStep] / 100}rem` }}>
                <ReactMarkdown components={markdownComponents}>{selected.content}</ReactMarkdown>
              </div>

              {/* Related articles (same category) */}
              {relatedArticles.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-extrabold mb-2.5 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-brand" aria-hidden />
                    نوشته‌های مرتبط
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {relatedArticles.map((r) => (
                      <button
                        key={r.slug}
                        onClick={() => openArticle(r)}
                        className="related-item text-right rounded-2xl border border-border bg-card px-3.5 py-3 flex items-center gap-3 hover:border-brand/40 transition-all min-h-[52px]"
                      >
                        <span
                          className="w-9 h-9 grid place-items-center rounded-xl bg-secondary text-xl shrink-0"
                          aria-hidden
                        >
                          {r.icon}
                        </span>
                        <span className="flex-grow min-w-0">
                          <span className="block text-xs font-bold truncate">{r.title}</span>
                          <span className="block text-[10px] text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3 inline -mt-0.5" aria-hidden /> {r.readTime.toLocaleString("fa-IR")} دقیقه
                          </span>
                        </span>
                        <ArrowLeft className="w-4 h-4 text-brand shrink-0" aria-hidden />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <ArticleComments slug={selected.slug} onCountChange={handleCommentCount} />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reading history dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col p-0 rounded-3xl dialog-accent"
        >
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
            <DialogTitle className="text-base flex items-center gap-2 text-right">
              <History className="w-4.5 h-4.5 text-brand" aria-hidden />
              تاریخچه مطالعه
              <span className="text-[10px] font-black text-brand bg-brand/10 border border-brand/25 rounded-full px-2 py-0.5">
                {historyList.length.toLocaleString("fa-IR")} نوشته
              </span>
            </DialogTitle>
            <DialogDescription className="text-right text-xs">
              پیشرفت مطالعه شما روی همین دستگاه ذخیره می‌شود.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto px-4 py-3 space-y-2 reading-history-scroll" role="list">
            {historyList.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-10">
                هنوز چیزی در تاریخچه نیست؛ یکی از نوشته‌ها را باز کنید ✨
              </p>
            ) : (
              historyList.map((h) => {
                const pct = Math.round(h.progress * 100);
                const done = h.progress >= 0.97;
                const catMeta = CATEGORY_META[h.category];
                return (
                  <div
                    key={h.slug}
                    role="listitem"
                    className={cn(
                      "history-row group rounded-2xl border border-border bg-card px-3.5 py-3 flex items-center gap-3 transition-all",
                      h.dismissed && "opacity-60"
                    )}
                  >
                    <span className="w-10 h-10 grid place-items-center rounded-xl bg-secondary text-xl shrink-0" aria-hidden>
                      {h.icon}
                    </span>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold truncate">{h.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {done ? (
                          <span className="text-[10px] font-black text-emerald-500 inline-flex items-center gap-1">
                            <Check className="w-3 h-3" aria-hidden />
                            کامل خوانده شد
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-brand">{pct.toLocaleString("fa-IR")}٪</span>
                        )}
                        {catMeta && (
                          <span className="text-[9px] font-bold text-muted-foreground">• {catMeta.label}</span>
                        )}
                        <span className="text-[9px] text-muted-foreground/70">• {relativeTime(h.updatedAt)}</span>
                      </div>
                      {!done && (
                        <div
                          className="history-progress mt-1.5"
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`پیشرفت ${h.title}`}
                        >
                          <span style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => resumeFromHistory(h.slug, h.progress)}
                        aria-label={`ادامه ${h.title}`}
                        title={done ? "مطالعه دوباره" : "ادامه مطالعه"}
                        className="w-9 h-9 grid place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand hover:bg-brand/20 active:scale-90 transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" aria-hidden />
                      </button>
                      <button
                        onClick={() => removeReadingEntry(h.slug)}
                        aria-label={`حذف ${h.title} از تاریخچه`}
                        title="حذف از تاریخچه"
                        className="history-delete w-9 h-9 grid place-items-center rounded-xl border border-border text-muted-foreground/60 hover:text-destructive hover:border-destructive/40 active:scale-90 transition-all"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {historyList.length > 0 && (
            <div className="px-5 py-3 border-t border-border shrink-0 flex items-center justify-between">
              <button
                onClick={() => {
                  clearReadingHistory();
                  toast({ title: "تاریخچه پاک شد", description: "همه رکوردهای مطالعه حذف شدند." });
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-destructive transition-colors min-h-[34px] px-2 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden />
                پاک کردن همه
              </button>
              <span className="text-[10px] text-muted-foreground/70">روی همین دستگاه ذخیره شده</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
