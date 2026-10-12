"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Clock, Eye, ArrowLeft, Github, Share2, Check, Heart, MessageCircle } from "lucide-react";
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
  detailSlug,
  onOpenDetail,
  onCloseDetail,
}: {
  articles: Article[];
  loading: boolean;
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
  const [prevDetail, setPrevDetail] = useState<string | symbol>(DETAIL_INIT);
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

  return (
    <section id="articles" aria-label="نوشته‌ها" className="max-w-6xl mx-auto px-4 sm:px-6">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence>
            {articles.map((a, i) => {
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

              <div className="prose-fa max-w-none">
                <ReactMarkdown>{selected.content}</ReactMarkdown>
              </div>

              {selected.repo && (
                <a
                  href={`https://github.com/${selected.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center justify-center gap-2 w-full rounded-2xl border border-brand/40 bg-brand/10 text-brand font-bold px-6 py-3 hover:bg-brand hover:text-primary-foreground transition-all min-h-[46px]"
                >
                  <Github className="w-5 h-5" />
                  مشاهده پروژه تعاملی در گیت‌هاب
                </a>
              )}

              <ArticleComments slug={selected.slug} onCountChange={handleCommentCount} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
