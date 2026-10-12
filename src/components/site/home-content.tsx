"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { RadarChart } from "./radar-chart";
import { GitHubCard } from "./github-card";
import { useSpotlight } from "@/hooks/use-spotlight";
import type { Project, ViewName } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

const TECH_MARQUEE = [
  "TypeScript", "Next.js 16", "React 19", "Three.js", "Cloudflare Workers",
  "Telegram Bot API", "Google Gemini", "OpenCV", "Python", "Tailwind CSS",
  "GSAP", "WebGL", "Prisma", "C++", "Bash", "D1 Database",
];

type CategoryCount = { id: string; label: string; icon: string; count: number; blurb: string };

export function HomeContent({
  projects,
  articleCounts,
  onNavigate,
}: {
  projects: Project[];
  articleCounts: { self: number; sports: number };
  onNavigate: (v: ViewName) => void;
}) {
  const featured = projects.filter((p) => p.featured);
  const onSpotlightMove = useSpotlight();

  const radarAxes = [
    { label: "ربات‌ها", icon: "🤖", value: projects.filter((p) => p.category === "bots").length },
    { label: "وب", icon: "🌐", value: projects.filter((p) => p.category === "web").length },
    { label: "سه‌بعدی", icon: "🪐", value: projects.filter((p) => p.category === "3d").length },
    { label: "ابزارها", icon: "🛠️", value: projects.filter((p) => p.category === "tools").length },
    {
      label: "نوشته‌ها",
      icon: "📝",
      value: articleCounts.self + articleCounts.sports,
    },
  ];

  const categories: CategoryCount[] = [
    {
      id: "bots",
      label: "ربات‌های تلگرام",
      icon: "🤖",
      count: projects.filter((p) => p.category === "bots").length,
      blurb: "ناوگانی از ربات‌های سرورلس روی Cloudflare Workers با هوش مصنوعی، صف‌بندی هوشمند و اتوماسیون کامل کانال‌ها.",
    },
    {
      id: "web",
      label: "وب و فروشگاه",
      icon: "🌐",
      count: projects.filter((p) => p.category === "web").length,
      blurb: "از فروشگاه‌های تعاملی با تم‌های خلاقانه تا لندینگ‌پیج‌های شیشه‌ای و اپلیکیشن‌های روان‌شناسی.",
    },
    {
      id: "3d",
      label: "سه‌بعدی و تعاملی",
      icon: "🪐",
      count: projects.filter((p) => p.category === "3d").length,
      blurb: "شبیه‌سازهای منظومه شمسی با تکسچر ناسا، کره‌های رویه‌ای با شیدرهای سفارشی و پورتفولیوهای فضایی.",
    },
    {
      id: "tools",
      label: "ابزارهای توسعه",
      icon: "🛠️",
      count: projects.filter((p) => p.category === "tools").length,
      blurb: "ابزارهای OpenCV، اسکریپت‌های Bash، چیت‌شیت‌های تعاملی و ماشین‌حساب‌های ++C برای کارِ سریع‌تر.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-24">
      {/* ---- Tech marquee ---- */}
      <div
        aria-hidden
        className="relative overflow-hidden rounded-2xl border border-border bg-card/50 py-4 -mt-2"
      >
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="marquee-track flex w-max gap-3" dir="ltr">
          {[...TECH_MARQUEE, ...TECH_MARQUEE].map((t, i) => (
            <span
              key={i}
              dir="ltr"
              className="whitespace-nowrap rounded-xl border border-border bg-background/70 px-4 py-1.5 text-xs font-mono text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      {/* ---- Radar chart + quick nav ---- */}
      <section aria-label="نقشه محتوای سایت" className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand bg-brand/10 border border-brand/25 rounded-full px-3 py-1.5 mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            نقشه محتوا
          </span>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
            من چه می‌سازم؟
          </h2>
          <p className="text-muted-foreground leading-8 text-sm sm:text-base mb-7">
            نمودار راداری زنده، توزیع واقعی محتوای سایت را نشان می‌دهد — مستقیم از
            دیتابیس. روی هر محور نگه دارید تا مقدار دقیق را ببینید.
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
                className="spotlight w-full flex items-center gap-3 rounded-2xl border border-border bg-card/70 px-4 py-3 text-right hover:border-brand/40 hover:bg-card transition-all group"
              >
                <span className="text-2xl card-emoji" aria-hidden>
                  {c.icon}
                </span>
                <span className="flex-grow min-w-0">
                  <span className="block font-bold text-sm">{c.label}</span>
                  <span className="block text-xs text-muted-foreground truncate">{c.blurb}</span>
                </span>
                <span className="text-sm font-black text-brand shrink-0 tabular-nums">
                  {c.count.toLocaleString("fa-IR")}
                </span>
                <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-brand group-hover:-translate-x-1 transition-all shrink-0" />
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
      <section aria-label="پروژه‌های منتخب">
        <h2 className="section-title mb-14">پروژه‌های منتخب</h2>
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
              <div className="flex items-start justify-between mb-4">
                <div className="text-5xl card-emoji" aria-hidden>
                  {p.icon}
                </div>
                <span className="text-[10px] font-bold text-brand bg-brand/10 border border-brand/25 rounded-full px-2.5 py-1">
                  {CATEGORY_LABELS[p.category]?.label}
                </span>
              </div>
              <h3 className="font-extrabold text-lg mb-2 leading-8">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-7 flex-grow mb-5">{p.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {p.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    dir="ltr"
                    className="text-[10px] font-mono rounded-md border border-border bg-secondary px-2 py-0.5 text-muted-foreground"
                  >
                    {t}
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
            مشاهده همه پروژه‌ها
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ---- Writing teaser ---- */}
      <section aria-label="نوشته‌ها">
        <h2 className="section-title mb-14">آخرین نوشته‌ها</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            {
              icon: "💡",
              title: "توسعه فردی",
              count: articleCounts.self,
              desc: "نقشه راه غلبه بر تنبلی، مهندسی عادت‌های اتمی و علم نوروساینس اراده — روانشناسی رفتار به زبان کد.",
              cat: "self" as const,
            },
            {
              icon: "🏋️",
              title: "علوم ورزشی",
              count: articleCounts.sports,
              desc: "مربی هوشمند تناسب اندام با Gemini؛ تکرار بالا یا پایین؟ پاسخ علمی با نمودارهای تعاملی.",
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
              className="glow-card spotlight group rounded-3xl border border-border bg-card p-7 text-right"
            >
              <div className="text-5xl mb-5 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" aria-hidden>
                {c.icon}
              </div>
              <h3 className="text-xl font-extrabold mb-2.5 group-hover:text-brand transition-colors">
                {c.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-7 mb-5">{c.desc}</p>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-brand">
                {c.count.toLocaleString("fa-IR")} نوشته — مطالعه
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform" />
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
