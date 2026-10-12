"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Clock, Eye, ArrowLeft, Github, Share2, Check } from "lucide-react";
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
import type { Article } from "@/lib/types";

const DETAIL_INIT = Symbol("detail-init");

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const postedRef = useRef<Set<string>>(new Set());
  
  const { toast } = useToast();
  const onSpotlightMove = useSpotlight();

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
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-4xl card-emoji" aria-hidden>
                      {a.icon}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
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
                    </div>
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
              <div className="reading-progress -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-5" aria-hidden>
                <span style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>

              <DialogHeader>
                <div className="text-5xl mb-3 card-emoji" aria-hidden>
                  {selected.icon}
                </div>
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
                <button
                  onClick={() => shareArticle(selected)}
                  aria-label="هم‌رسانی لینک نوشته"
                  title="هم‌رسانی لینک"
                  className="mr-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-brand rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 hover:bg-brand/20 active:scale-95 transition-all min-h-[30px]"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  هم‌رسانی
                </button>
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
