"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ExternalLink, X, Eye, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "همه", icon: "✨" },
  { id: "bots", label: "ربات‌های تلگرام", icon: "🤖" },
  { id: "web", label: "وب و فروشگاه", icon: "🌐" },
  { id: "3d", label: "سه‌بعدی و تعاملی", icon: "🪐" },
  { id: "tools", label: "ابزارهای توسعه", icon: "🛠️" },
];

export function ProjectsExplorer({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Project | null>(null);

  // Open detail dialog + count the view
  const openProject = (p: Project) => {
    setSelected((prev) =>
      prev?.id === p.id ? prev : { ...p, views: p.views + 1 }
    );
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: p.slug }),
    }).catch(() => {});
  };

  // Fetch with debounce when query/filter changes
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter !== "all") params.set("category", filter);
        if (query.trim()) params.set("q", query.trim());
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
  }, [query, filter]);

  const grouped = useMemo(() => {
    if (filter !== "all") return null;
    const map = new Map<string, Project[]>();
    for (const p of projects) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return map;
  }, [projects, filter]);

  const renderCard = (p: Project, index: number) => (
    <motion.button
      key={p.id}
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.4) }}
      onClick={() => openProject(p)}
      className="glow-card group text-right rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col h-full w-full"
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="text-4xl" aria-hidden>
          {p.icon}
        </div>
        <div className="flex items-center gap-1.5">
          {p.featured && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand bg-brand/10 border border-brand/25 rounded-full px-2 py-0.5">
              <Star className="w-3 h-3" /> منتخب
            </span>
          )}
        </div>
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
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium border transition-all min-h-[38px]",
                filter === f.id
                  ? "bg-brand text-primary-foreground border-brand shadow-[0_8px_20px_-8px_var(--brand-glow)]"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-brand/40"
              )}
            >
              <span aria-hidden>{f.icon} </span>
              {f.label}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground" aria-live="polite">
          {loading
            ? "در حال جستجو..."
            : `${projects.length.toLocaleString("fa-IR")} پروژه یافت شد`}
        </p>
      </div>

      {/* Grid */}
      {loading && projects.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-5xl mb-4" aria-hidden>
            🔍
          </div>
          <p className="font-bold mb-1">پروژه‌ای یافت نشد</p>
          <p className="text-sm">عبارت دیگری را جستجو کنید یا فیلتر را تغییر دهید.</p>
        </div>
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
            {projects.map((p, i) => renderCard(p, i))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-6 rounded-3xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4 mb-1">
                  <div className="text-5xl shrink-0" aria-hidden>
                    {selected.icon}
                  </div>
                  <div className="min-w-0">
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
              <div className="flex flex-wrap gap-2 mb-6">
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

              <a
                href={`https://github.com/${selected.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand text-primary-foreground font-bold px-6 py-3 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[46px]"
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
