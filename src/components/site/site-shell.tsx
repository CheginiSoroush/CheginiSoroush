"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Mail, Heart, LockKeyhole, Keyboard, Eye } from "lucide-react";
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
import { NewsletterForm } from "./newsletter-form";
import { BackToTop } from "./back-to-top";
import { MorphingLogo } from "./morphing-logo";
import { Hero } from "./hero";
import { HomeContent } from "./home-content";
import { ProjectsExplorer } from "./projects-explorer";
import { ArticlesSection } from "./articles-section";
import { ContactSection } from "./contact-section";
import { applyDocumentLang, toggleLang, useT } from "@/lib/i18n";
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
  const { t } = useT();
  const rows: { keys: string[]; desc: string }[] = [
    { keys: ["Ctrl", "K"], desc: t("core", "sc.palette") },
    { keys: ["1"], desc: t("core", "sc.home") },
    { keys: ["2"], desc: t("core", "sc.projects") },
    { keys: ["3"], desc: t("core", "sc.writing") },
    { keys: ["4"], desc: t("core", "sc.contact") },
    { keys: ["/"], desc: t("core", "sc.searchProjects") },
    { keys: ["T"], desc: t("core", "sc.theme") },
    { keys: ["L"], desc: t("core", "sc.lang") },
    { keys: ["؟", "?"], desc: t("core", "sc.help") },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6 rounded-3xl dialog-accent">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-brand" />
            {t("core", "sc.title")}
          </DialogTitle>
          <DialogDescription>{t("core", "sc.desc")}</DialogDescription>
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
  const { t, num, lang } = useT();

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

  // Keep <html lang/dir> and the document title in sync with the active language
  useEffect(() => {
    applyDocumentLang(lang);
  }, [lang]);
  useEffect(() => {
    document.title = t("core", "meta.title");
  }, [t]);

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
        case "l":
        case "L":
        case "ل":
          toggleLang();
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
      <MorphingLogo />

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
                  title={t("core", "heading.projects.title")}
                  subtitle={t("core", "heading.projects.sub")}
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
                  title={t("core", "heading.writing.title")}
                  subtitle={t("core", "heading.writing.sub")}
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
                  title={t("core", "heading.contact.title")}
                  subtitle={t("core", "heading.contact.sub")}
                />
                <ContactSection />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky footer */}
      <footer className="footer-gradient mt-auto border-t border-border bg-card/60 backdrop-blur relative z-10 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Newsletter strip */}
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <NewsletterForm />
            </div>
          </div>

          <div className="border-t border-border/70 pt-6 flex flex-col sm:flex-row items-center justify-between gap-5">
            <nav aria-label={t("core", "footer.social")} className="flex items-center gap-3">
              <a
                href="https://github.com/CheginiSoroush"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold rounded-xl border border-border px-4 py-2.5 hover:text-brand hover:border-brand/50 hover:-translate-y-0.5 transition-all min-h-[42px]"
              >
                <Github className="w-4.5 h-4.5" />
                {t("core", "footer.github")}
              </a>
              <a
                href="mailto:imsoroushchegini@gmail.com"
                className="inline-flex items-center gap-2 text-sm font-bold rounded-xl border border-border px-4 py-2.5 hover:text-brand hover:border-brand/50 hover:-translate-y-0.5 transition-all min-h-[42px]"
              >
                <Mail className="w-4.5 h-4.5" />
                {t("core", "footer.email")}
              </a>
              {stats && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground rounded-xl border border-border px-4 py-2.5" title={t("core", "footer.visits", { n: num(stats.visits) })}>
                  <Eye className="w-3.5 h-3.5" aria-hidden />
                  {t("core", "footer.visits", { n: num(stats.visits) })}
                </span>
              )}
              <button
                onClick={() => setAdminOpen(true)}
                aria-label={t("core", "aria.admin")}
                title={t("core", "aria.admin")}
                className="w-[42px] h-[42px] grid place-items-center rounded-xl border border-border text-muted-foreground/60 hover:text-brand hover:border-brand/50 transition-all"
              >
                <LockKeyhole className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShortcutsOpen(true)}
                aria-label={t("core", "aria.shortcuts")}
                title={t("core", "footer.shortcutsTitle")}
                className="w-[42px] h-[42px] grid place-items-center rounded-xl border border-border text-muted-foreground/60 hover:text-brand hover:border-brand/50 transition-all"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            </nav>

            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
              {t("core", "footer.madeWith")}
              <Heart className="w-4 h-4 text-brand fill-brand" aria-label={t("core", "footer.love")} />
              {t("core", "footer.andCode")} ©{" "}
              {new Date().toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US", {
                year: "numeric",
              })}{" "}
              {lang === "fa" ? "سروش چگینی" : "Soroush Chegini"}
            </p>
          </div>
        </div>
      </footer>

      <BackToTop />

      <AdminMessagesDialog open={adminOpen} onOpenChange={setAdminOpen} />
      <CommandPalette projects={projects} articles={articles} />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
