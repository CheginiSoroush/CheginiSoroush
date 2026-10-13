"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Github, Mail, MapPin, PenLine } from "lucide-react";
import { useSpotlight } from "@/hooks/use-spotlight";
import { useT } from "@/lib/i18n";
import { CONTACT_EMAIL_URL, GITHUB_PROFILE_URL } from "@/lib/site-config";

const TIMELINE = [
  { icon: "🔤", key: "t1" },
  { icon: "🤖", key: "t2" },
  { icon: "☁️", key: "t3" },
  { icon: "🪐", key: "t4" },
  { icon: "✍️", key: "t5" },
];

const STACK = ["TypeScript", "Python", "C++", "Three.js", "Cloudflare Workers", "OpenCV", "Bash", "Gemini API"];

export function AboutSection() {
  const onSpotlightMove = useSpotlight();
  const { t, num } = useT();

  return (
    <section aria-label={t("home", "about.aria")} className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-10 lg:gap-14 items-center">
        {/* ---- Photo side ---- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, rotate: -2 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-sm lg:max-w-none"
        >
          {/* decorative gradient frame */}
          <div className="about-frame rounded-[2rem] p-[3px]" aria-hidden>
            <div className="rounded-[calc(2rem-3px)] overflow-hidden bg-card">
              <Image
                src="/photos/ai.jpg"
                alt={t("home", "about.photoAlt")}
                width={720}
                height={900}
                className="about-photo w-full h-auto object-cover"
                sizes="(max-width: 1024px) 90vw, 40vw"
              />
            </div>
          </div>

          {/* floating badges */}
          <div className="about-badge -top-4 start-5 float-y" aria-hidden>
            <span className="text-lg font-black text-brand tabular-nums">+{num(39)}</span>
            <span className="text-[10px] text-muted-foreground font-bold">{t("home", "about.badge.projects")}</span>
          </div>
          <div className="about-badge -bottom-5 end-4 float-y" style={{ animationDelay: "-2.2s" }} aria-hidden>
            <PenLine className="w-4 h-4 text-brand" />
            <span className="text-[10px] text-muted-foreground font-bold">{t("home", "about.badge.dev")}</span>
          </div>

          {/* location chip */}
          <span className="absolute top-4 end-4 inline-flex items-center gap-1.5 text-[10px] font-bold text-foreground/90 bg-background/70 backdrop-blur border border-border rounded-full px-3 py-1.5 shadow-lg">
            <MapPin className="w-3 h-3 text-brand" />
            {t("home", "about.location")}
          </span>
        </motion.div>

        {/* ---- Text side ---- */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand bg-brand/10 border border-brand/25 rounded-full px-3 py-1.5 mb-5">
            ✨ {t("home", "about.chip")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-5">
            {t("home", "about.title.pre")}
            <span className="brand-gradient-text">{t("home", "about.title.grad")}</span>
            {t("home", "about.title.post")}
          </h2>
          <p className="text-muted-foreground leading-8 text-sm sm:text-base mb-4">
            {t("home", "about.bio1.a")}
            <strong className="text-brand font-bold">{t("home", "about.bio1.strong")}</strong>
            {t("home", "about.bio1.b")}
          </p>
          <p className="text-muted-foreground leading-8 text-sm sm:text-base mb-7">
            {t("home", "about.bio2")}
          </p>

          {/* mini timeline */}
          <ol className="relative space-y-4 mb-7 ps-6" aria-label={t("home", "about.timeline.aria")}>
            <span className="timeline-line" aria-hidden />
            {TIMELINE.map((item, i) => (
              <motion.li
                key={item.key}
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                onMouseMove={onSpotlightMove}
                className="spotlight relative rounded-2xl border border-border bg-card/60 px-4 py-3 hover:border-brand/40 transition-colors"
              >
                <span className="timeline-dot" aria-hidden />
                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5" aria-hidden>
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm">{t("home", `about.${item.key}.title`)}</p>
                    <p className="text-xs text-muted-foreground leading-6 mt-0.5">{t("home", `about.${item.key}.desc`)}</p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>

          {/* stack pills */}
          <div className="flex flex-wrap gap-1.5 mb-7" aria-label={t("home", "about.stack.aria")}>
            {STACK.map((s) => (
              <span
                key={s}
                dir="ltr"
                className="text-[10px] font-mono rounded-lg border border-border bg-secondary/70 px-2.5 py-1 text-muted-foreground hover:text-brand hover:border-brand/40 transition-colors cursor-default"
              >
                {s}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={GITHUB_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-brand text-primary-foreground font-bold px-6 py-3 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[46px]"
            >
              <Github className="w-5 h-5" />
              {t("home", "about.cta.github")}
            </a>
            <a
              href={CONTACT_EMAIL_URL}
              className="inline-flex items-center gap-2 rounded-2xl border border-border font-bold px-6 py-3 hover:text-brand hover:border-brand/50 hover:-translate-y-0.5 transition-all min-h-[46px]"
            >
              <Mail className="w-5 h-5" />
              {t("home", "about.cta.talk")}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
