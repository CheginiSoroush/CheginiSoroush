"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Clock, Eye, ArrowLeft, Github } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Article } from "@/lib/types";

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
}: {
  articles: Article[];
  loading: boolean;
}) {
  const [selected, setSelected] = useState<Article | null>(null);

  const openArticle = async (a: Article) => {
    setSelected(a);
    // increment views (fire and forget)
    try {
      await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: a.slug }),
      });
    } catch {
      // ignore
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
                  className="glow-card group text-right rounded-2xl border border-border bg-card p-6 flex flex-col h-full"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-4xl" aria-hidden>
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
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 rounded-3xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="text-5xl mb-3" aria-hidden>
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
                  {(selected.views + 1).toLocaleString("fa-IR")} بازدید
                </Badge>
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
