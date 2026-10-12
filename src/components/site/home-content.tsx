"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { RadarChart } from "./radar-chart";
import { GitHubCard } from "./github-card";
import { ProjectCover } from "./project-cover";
import { DirArrow } from "./dir-arrow";
import { AboutSection } from "./about-section";
import { useSpotlight } from "@/hooks/use-spotlight";
import { useT, pickEn } from "@/lib/i18n";
import type { Project, ViewName } from "@/lib/types";

const TECH_MARQUEE = [
  "TypeScript", "Next.js 16", "React 19", "Three.js", "Cloudflare Workers",
  "Telegram Bot API", "Google Gemini", "OpenCV", "Python", "Tailwind CSS",
  "GSAP", "WebGL", "Prisma", "C++", "Bash", "D1 Database",
];

type CategoryCount = { id: string; label: string; icon: string; count: number; blurb: string; thumb: string };

export function HomeContent({
  projects,
  articleCounts,
  onNavigate,
}: {
  projects: Project[];
  articleCounts: { self: number; sports: number };
  onNavigate: (v: ViewName) => void;
}) {
  const { t, num, lang } = useT();
  const featured = projects.filter((p) => p.featured);
  const onSpotlightMove = useSpotlight();

  const radarAxes = [
    { label: t("home", "radar.bots"), icon: "🤖", value: projects.filter((p) => p.category === "bots").length },
    { label: t("home", "radar.web"), icon: "🌐", value: projects.filter((p) => p.category === "web").length },
    { label: t("home", "radar.3d"), icon: "🪐", value: projects.filter((p) => p.category === "3d").length },
    { label: t("home", "radar.tools"), icon: "🛠️", value: projects.filter((p) => p.category === "tools").length },
    {
      label: t("home", "radar.articles"),
      icon: "📝",
      value: articleCounts.self + articleCounts.sports,
    },
  ];

  const categories: CategoryCount[] = [
    {
      id: "bots",
      label: t("core", "cat.bots"),
      icon: "🤖",
      count: projects.filter((p) => p.category === "bots").length,
      blurb: t("home", "cat.bots.blurb"),
      thumb: "/photos/cat-bots.png",
    },
    {
      id: "web",
      label: t("core", "cat.web"),
      icon: "🌐",
      count: projects.filter((p) => p.category === "web").length,
      blurb: t("home", "cat.web.blurb"),
      thumb: "/photos/cat-web.png",
    },
    {
      id: "3d",
      label: t("core", "cat.3d"),
      icon: "🪐",
      count: projects.filter((p) => p.category === "3d").length,
      blurb: t("home", "cat.3d.blurb"),
      thumb: "/photos/cat-3d.png",
    },
    {
      id: "tools",
      label: t("core", "cat.tools"),
      icon: "🛠️",
      count: projects.filter((p) => p.category === "tools").length,
      blurb: t("home", "cat.tools.blurb"),
      thumb: "/photos/cat-tools.png",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-24">
      {/* ---- Tech marquee ---- */}
      <div
        aria-hidden
        className="relative overflow-hidden rounded-2xl border border-border bg-card/50 py-4 -mt-2"
      >
        <div className="absolute inset-y-0 end-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="absolute inset-y-0 start-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="marquee-track flex w-max gap-3" dir="ltr">
          {[...TECH_MARQUEE, ...TECH_MARQUEE].map((tech, i) => (
            <span
              key={i}
              dir="ltr"
              className="whitespace-nowrap rounded-xl border border-border bg-background/70 px-4 py-1.5 text-xs font-mono text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
      {/* ---- About me ---- */}
      <AboutSection />
      {/* ---- Radar chart + quick nav ---- */}
      <section aria-label={t("home", "map.aria")} className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand bg-brand/10 border border-brand/25 rounded-full px-3 py-1.5 mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            {t("home", "map.badge")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
            {t("home", "map.title")}
          </h2>
          <p className="text-muted-foreground leading-8 text-sm sm:text-base mb-7">
            {t("home", "map.desc")}
          </p>
          <div className="space-y-3">
            {categories.map((c, i) => (
              <button
                key={c.id}
                onClick={() => {
                  // Category deep-link: #/projects/cat/<id>
                  window.location.hash = `projects/cat/${c.id}`;
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onMouseMove={onSpotlightMove}
                className="spotlight w-full flex items-center gap-3.5 rounded-2xl border border-border bg-card/70 p-3 pe-4 text-start hover:border-brand/40 hover:bg-card transition-all group"
              >
                <span className="relative">
                  <Image
                    src={c.thumb}
                    alt=""
                    aria-hidden
                    width={104}
                    height={104}
                    className="cat-thumb"
                  />
                  <span className="absolute -bottom-1.5 -start-1.5 text-base drop-shadow" aria-hidden>
                    {c.icon}
                  </span>
                </span>
                <span className="flex-grow min-w-0">
                  <span className="block font-bold text-sm">{c.label}</span>
                  <span className="block text-xs text-muted-foreground truncate">{c.blurb}</span>
                </span>
                <span className="text-sm font-black text-brand shrink-0 tabular-nums">
                  {num(c.count)}
                </span>
                <DirArrow className="w-4 h-4 text-muted-foreground group-hover:text-brand shrink-0 dir-slide" />
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-border bg-card/60 p-6 sm:p-8 backdrop-blur"
        >
          <RadarChart axes={radarAxes} />
        </motion.div>
      </section>

      {/* ---- Featured projects ---- */}
      <section aria-label={t("home", "featured.aria")}>
        <h2 className="section-title mb-14">{t("home", "featured.title")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {featured.slice(0, 4).map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              onMouseMove={onSpotlightMove}
              className="glow-card spotlight rounded-3xl border border-border bg-card p-6 sm:p-7 flex flex-col"
            >
              {/* generative cover art */}
              <div className="cover-wrap -mx-6 sm:-mx-7 -mt-6 sm:-mt-7 mb-5 rounded-t-3xl overflow-hidden">
                <ProjectCover slug={p.slug} category={p.category} idPrefix="feat" className="h-28 sm:h-32 w-full" />
                <div className="cover-float">
                  <span className="text-3xl card-emoji drop-shadow-lg" aria-hidden>
                    {p.icon}
                  </span>
                </div>
                <span className="absolute top-3 end-3 text-[10px] font-bold text-[#05261f] bg-brand border border-white/20 rounded-full px-2.5 py-1 shadow-lg">
                  {t("core", `cat.${p.category}`)}
                </span>
              </div>
              <h3 className="font-extrabold text-lg mb-2 leading-8">{pickEn(lang, p.titleEn, p.title)}</h3>
              <p className="text-sm text-muted-foreground leading-7 flex-grow mb-5">{pickEn(lang, p.descriptionEn, p.description)}</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {p.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    dir="ltr"
                    className="text-[10px] font-mono rounded-md border border-border bg-secondary px-2 py-0.5 text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <a
                href={`https://github.com/${p.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="mt-auto text-xs font-mono text-left text-muted-foreground hover:text-brand transition-colors truncate"
              >
                github.com/{p.repo}
              </a>
            </motion.article>
          ))}
        </div>
        <div className="text-center mt-10">
          <button
            onClick={() => onNavigate("projects")}
            className="inline-flex items-center gap-2 rounded-2xl border border-brand/40 bg-brand/10 text-brand font-bold px-8 py-3 hover:bg-brand hover:text-primary-foreground hover:-translate-y-0.5 transition-all min-h-[46px]"
          >
            {t("home", "featured.viewAll")}
            <DirArrow className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ---- Writing teaser ---- */}
      <section aria-label={t("home", "teaser.aria")}>
        <h2 className="section-title mb-14">{t("home", "teaser.title")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            {
              icon: "💡",
              title: t("home", "teaser.self.title"),
              count: articleCounts.self,
              desc: t("home", "teaser.self.desc"),
              cat: "self" as const,
            },
            {
              icon: "🏋️",
              title: t("home", "teaser.sports.title"),
              count: articleCounts.sports,
              desc: t("home", "teaser.sports.desc"),
              cat: "sports" as const,
            },
          ].map((c, i) => (
            <motion.button
              key={c.cat}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              onClick={() => onNavigate("writing")}
              onMouseMove={onSpotlightMove}
              className="glow-card spotlight group rounded-3xl border border-border bg-card p-7 text-start"
            >
              <div className="text-5xl mb-5 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" aria-hidden>
                {c.icon}
              </div>
              <h3 className="text-xl font-extrabold mb-2.5 group-hover:text-brand transition-colors">
                {c.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-7 mb-5">{c.desc}</p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-brand">
                {t("home", "teaser.cta", { n: num(c.count) })}
                <DirArrow className="w-4 h-4 dir-slide" />
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ---- GitHub live stats ---- */}
      <GitHubCard />
    </div>
  );
}
