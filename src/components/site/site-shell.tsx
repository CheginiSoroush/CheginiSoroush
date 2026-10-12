"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Mail, Heart, LockKeyhole, Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SiteHeader } from "./site-header";
import { ScrollProgress } from "./scroll-progress";
import { AdminMessagesDialog } from "./admin-messages-dialog";
import { CommandPalette } from "./command-palette";
import { Hero } from "./hero";
import { HomeContent } from "./home-content";
import { ProjectsExplorer } from "./projects-explorer";
import { ArticlesSection } from "./articles-section";
import { ContactSection } from "./contact-section";
import type { Article, Project, SiteStats, ViewName } from "@/lib/types";

const VIEWS: ViewName[] = ["home", "projects", "writing", "contact"];

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center mb-12">
      <h2 className="section-title">{title}</h2>
      <p className="mt-7 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-7">
        {subtitle}
      </p>
    </div>
  );
}

type Route = { view: ViewName; detail?: string; category?: string };

function parseHash(): Route {
  if (typeof window === "undefined") return { view: "home" };
  const raw = decodeURIComponent(window.location.hash.replace(/^#\/?/, ""));
  const [v, second, third] = raw.split("/");
  if (VIEWS.includes(v as ViewName)) {
    // Category deep-link: #projects/cat/<id> or #writing/cat/<id>
    if (second === "cat" && third) {
      if (v === "projects") return { view: "projects", category: third };
      if (v === "writing") return { view: "writing", category: third };
    }
    return { view: v as ViewName, detail: second || undefined };
  }
  return { view: "home" };
}

// External store over location.hash (back/forward + shareable links)
let routeCache: { hash: string; route: Route } | null = null;
function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
function getHashSnapshot(): Route {
  const h = window.location.hash;
  if (!routeCache || routeCache.hash !== h) {
    routeCache = { hash: h, route: parseHash() };
  }
  return routeCache.route;
}
const SERVER_ROUTE: Route = { view: "home" };
function getServerRoute(): Route {
  return SERVER_ROUTE;
}

function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const rows: { keys: string[]; desc: string }[] = [
    { keys: ["Ctrl", "K"], desc: "جستجوی سراسری (پالت فرمان)" },
    { keys: ["1"], desc: "خانه" },
    { keys: ["2"], desc: "پروژه‌ها" },
    { keys: ["3"], desc: "نوشته‌ها" },
    { keys: ["4"], desc: "تماس" },
    { keys: ["/"], desc: "جستجوی پروژه‌ها" },
    { keys: ["T"], desc: "تغییر تم روشن/تاریک" },
    { keys: ["؟", "?"], desc: "نمایش همین راهنما" },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6 rounded-3xl dialog-accent">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-brand" />
            میان‌برهای صفحه‌کلید
          </DialogTitle>
          <DialogDescription>سریع‌تر بین بخش‌ها جابه‌جا شوید.</DialogDescription>
        </DialogHeader>
        <ul className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <li key={r.desc} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5">
              <span className="text-sm text-muted-foreground">{r.desc}</span>
              <span className="flex items-center gap-1.5" dir="ltr">
                {r.keys.map((k) => (
                  <kbd key={k} className="kbd">
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export function SiteShell({
  initialProjects,
  initialArticles,
}: {
  initialProjects: Project[];
  initialArticles: Article[];
}) {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [projects] = useState<Project[]>(initialProjects);
  const [articles] = useState<Article[]>(initialArticles);
  const [adminOpen, setAdminOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const visitedOnce = useRef(false);
  const route = useSyncExternalStore(subscribeHash, getHashSnapshot, getServerRoute);

  // Register visit once per session
  useEffect(() => {
    if (visitedOnce.current) return;
    visitedOnce.current = true;
    (async () => {
      try {
        const res = await fetch("/api/stats", { method: "POST" });
        const data = (await res.json()) as SiteStats;
        setStats(data);
      } catch {
        // ignore
      }
    })();
  }, []);

  const navigate = useCallback((v: ViewName) => {
    const target = `#${v}`;
    if (window.location.hash === target) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // hashchange subscription performs the state update
      window.location.hash = target;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const openDetail = useCallback(
    (view: "projects" | "writing", slug: string) => {
      const target = `#/${view}/${encodeURIComponent(slug)}`;
      if (window.location.hash !== target) {
        window.location.hash = target;
      }
    },
    []
  );

  const closeDetail = useCallback(
    (view: "projects" | "writing") => {
      const target = `#${view}`;
      if (window.location.hash !== target) {
        window.location.hash = target;
      }
    },
    []
  );

  const handleExplore = useCallback(() => {
    document.getElementById("home-content")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case "1":
          navigate("home");
          break;
        case "2":
          navigate("projects");
          break;
        case "3":
          navigate("writing");
          break;
        case "4":
          navigate("contact");
          break;
        case "/":
          e.preventDefault();
          if (route.view !== "projects") {
            navigate("projects");
            // wait for the projects view to mount its search input
            window.setTimeout(() => window.dispatchEvent(new CustomEvent("focus-project-search")), 550);
          } else {
            window.dispatchEvent(new CustomEvent("focus-project-search"));
          }
          break;
        case "t":
        case "T":
        case "ط":
          window.dispatchEvent(new CustomEvent("toggle-site-theme"));
          break;
        case "?":
        case "؟":
          setShortcutsOpen((v) => !v);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, route.view]);

  // Global shortcuts dispatched from CommandPalette / footer
  useEffect(() => {
    const onAdmin = () => setAdminOpen(true);
    const onShortcuts = () => setShortcutsOpen(true);
    window.addEventListener("open-admin-panel", onAdmin);
    window.addEventListener("open-shortcuts", onShortcuts);
    return () => {
      window.removeEventListener("open-admin-panel", onAdmin);
      window.removeEventListener("open-shortcuts", onShortcuts);
    };
  }, []);

  const selfCount = articles.filter((a) => a.category === "self").length;
  const sportsCount = articles.filter((a) => a.category === "sports").length;

  return (
    <div className="min-h-screen flex flex-col relative">
      <ScrollProgress />
      <SiteHeader view={route.view} onNavigate={navigate} />

      <main className="flex-grow relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={route.view}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {route.view === "home" && (
              <>
                <Hero stats={stats} onExplore={handleExplore} />
                <div id="home-content" className="pb-24 scroll-mt-20">
                  <HomeContent
                    projects={projects}
                    articleCounts={{ self: selfCount, sports: sportsCount }}
                    onNavigate={navigate}
                  />
                </div>
              </>
            )}

            {route.view === "projects" && (
              <div className="pt-28 pb-24">
                <SectionHeading
                  title="کارنامه پروژه‌ها"
                  subtitle="۳۹ پروژه واقعی و متن‌باز؛ از ربات‌های سرورلس تا شبیه‌سازهای سه‌بعدی. جستجو کنید، فیلتر کنید و جزئیات هر پروژه را ببینید."
                />
                <ProjectsExplorer
                  initialProjects={projects}
                  initialCategory={route.view === "projects" ? route.category : undefined}
                  detailSlug={
                    route.view === "projects" && !route.category ? route.detail : undefined
                  }
                  onOpenDetail={(slug) => openDetail("projects", slug)}
                  onCloseDetail={() => closeDetail("projects")}
                />
              </div>
            )}

            {route.view === "writing" && (
              <div className="pt-28 pb-24">
                <SectionHeading
                  title="نوشته‌ها و کاوش‌ها"
                  subtitle="روانشناسی رفتار، نوروساینس اراده و علوم ورزشی — هر مقاله همراه با یک پروژه تعاملی واقعی."
                />
                <ArticlesSection
                  articles={articles}
                  loading={false}
                  initialCategory={route.view === "writing" ? route.category : undefined}
                  detailSlug={
                    route.view === "writing" && !route.category ? route.detail : undefined
                  }
                  onOpenDetail={(slug) => openDetail("writing", slug)}
                  onCloseDetail={() => closeDetail("writing")}
                />
              </div>
            )}

            {route.view === "contact" && (
              <div className="pt-28 pb-24">
                <SectionHeading
                  title="ارتباط با من"
                  subtitle="خوشحال می‌شم نظرات، پیشنهادات یا ایده‌های همکاری‌تون رو بشنوم."
                />
                <ContactSection />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky footer */}
      <footer className="footer-gradient mt-auto border-t border-border bg-card/60 backdrop-blur relative z-10 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <nav aria-label="شبکه‌های اجتماعی" className="flex items-center gap-3">
              <a
                href="https://github.com/CheginiSoroush"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold rounded-xl border border-border px-4 py-2.5 hover:text-brand hover:border-brand/50 hover:-translate-y-0.5 transition-all min-h-[42px]"
              >
                <Github className="w-4.5 h-4.5" />
                گیت‌هاب
              </a>
              <a
                href="mailto:imsoroushchegini@gmail.com"
                className="inline-flex items-center gap-2 text-sm font-bold rounded-xl border border-border px-4 py-2.5 hover:text-brand hover:border-brand/50 hover:-translate-y-0.5 transition-all min-h-[42px]"
              >
                <Mail className="w-4.5 h-4.5" />
                ایمیل
              </a>
              {stats && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground rounded-xl border border-border px-4 py-2.5">
                  👁️ {stats.visits.toLocaleString("fa-IR")} بازدید
                </span>
              )}
              <button
                onClick={() => setAdminOpen(true)}
                aria-label="پنل مدیریت پیام‌ها"
                title="پنل مدیریت"
                className="w-[42px] h-[42px] grid place-items-center rounded-xl border border-border text-muted-foreground/60 hover:text-brand hover:border-brand/50 transition-all"
              >
                <LockKeyhole className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShortcutsOpen(true)}
                aria-label="میان‌برهای صفحه‌کلید"
                title="میان‌برهای صفحه‌کلید (؟)"
                className="w-[42px] h-[42px] grid place-items-center rounded-xl border border-border text-muted-foreground/60 hover:text-brand hover:border-brand/50 transition-all"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            </nav>

            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
              ساخته شده با
              <Heart className="w-4 h-4 text-brand fill-brand" aria-label="علاقه" />
              و کد © {new Date().toLocaleDateString("fa-IR", { year: "numeric" })} سروش چگینی
            </p>
          </div>
        </div>
      </footer>

      <AdminMessagesDialog open={adminOpen} onOpenChange={setAdminOpen} />
      <CommandPalette projects={projects} articles={articles} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
