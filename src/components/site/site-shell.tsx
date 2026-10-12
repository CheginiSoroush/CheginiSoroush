"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Mail, Heart } from "lucide-react";
import { SiteHeader } from "./site-header";
import { Hero } from "./hero";
import { HomeContent } from "./home-content";
import { ProjectsExplorer } from "./projects-explorer";
import { ArticlesSection } from "./articles-section";
import { ContactSection } from "./contact-section";
import type { Article, Project, SiteStats, ViewName } from "@/lib/types";

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

export function SiteShell({
  initialProjects,
  initialArticles,
}: {
  initialProjects: Project[];
  initialArticles: Article[];
}) {
  const [view, setView] = useState<ViewName>("home");
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [projects] = useState<Project[]>(initialProjects);
  const [articles] = useState<Article[]>(initialArticles);
  const visitedOnce = useRef(false);

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

  const handleNavigate = useCallback((v: ViewName) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleExplore = useCallback(() => {
    document.getElementById("home-content")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const selfCount = articles.filter((a) => a.category === "self").length;
  const sportsCount = articles.filter((a) => a.category === "sports").length;

  return (
    <div className="min-h-screen flex flex-col relative">
      <SiteHeader view={view} onNavigate={handleNavigate} />

      <main className="flex-grow relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {view === "home" && (
              <>
                <Hero stats={stats} onExplore={handleExplore} />
                <div id="home-content" className="pb-24 scroll-mt-20">
                  <HomeContent
                    projects={projects}
                    articleCounts={{ self: selfCount, sports: sportsCount }}
                    onNavigate={handleNavigate}
                  />
                </div>
              </>
            )}

            {view === "projects" && (
              <div className="pt-28 pb-24">
                <SectionHeading
                  title="کارنامه پروژه‌ها"
                  subtitle="۳۹ پروژه واقعی و متن‌باز؛ از ربات‌های سرورلس تا شبیه‌سازهای سه‌بعدی. جستجو کنید، فیلتر کنید و جزئیات هر پروژه را ببینید."
                />
                <ProjectsExplorer initialProjects={projects} />
              </div>
            )}

            {view === "writing" && (
              <div className="pt-28 pb-24">
                <SectionHeading
                  title="نوشته‌ها و کاوش‌ها"
                  subtitle="روانشناسی رفتار، نوروساینس اراده و علوم ورزشی — هر مقاله همراه با یک پروژه تعاملی واقعی."
                />
                <ArticlesSection articles={articles} loading={false} />
              </div>
            )}

            {view === "contact" && (
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
      <footer className="mt-auto border-t border-border bg-card/60 backdrop-blur relative z-10 pb-[env(safe-area-inset-bottom)]">
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
            </nav>

            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
              ساخته شده با
              <Heart className="w-4 h-4 text-brand fill-brand" aria-label="علاقه" />
              و کد © {new Date().toLocaleDateString("fa-IR", { year: "numeric" })} سروش چگینی
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
