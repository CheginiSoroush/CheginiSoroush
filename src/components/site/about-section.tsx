"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Github, Mail, MapPin, PenLine } from "lucide-react";
import { useSpotlight } from "@/hooks/use-spotlight";

const TIMELINE = [
  {
    icon: "🔤",
    title: "شروع مسیر",
    desc: "یادگیری مبانی برنامه‌نویسی، C++ و عاشق شدن به حل مسئله",
  },
  {
    icon: "🤖",
    title: "ساخت ربات‌های تلگرام",
    desc: "از اتوماسیون ساده تا ناوگان ۱۶ ربات حرفه‌ای با هوش مصنوعی",
  },
  {
    icon: "☁️",
    title: "معماری بدون سرور",
    desc: "مهاجرت کامل به Cloudflare Workers و دیتابیس‌های لبه (D1, KV)",
  },
  {
    icon: "🪐",
    title: "تجربه‌های سه‌بعدی",
    desc: "شبیه‌سازها و پورتفولیوهای تعاملی با Three.js و WebGL",
  },
  {
    icon: "✍️",
    title: "نوشتن و کاوش",
    desc: "روانشناسی رفتار، نوروساینس اراده و علوم ورزشی به زبان ساده",
  },
];

const STACK = ["TypeScript", "Python", "C++", "Three.js", "Cloudflare Workers", "OpenCV", "Bash", "Gemini API"];

export function AboutSection() {
  const onSpotlightMove = useSpotlight();

  return (
    <section aria-label="درباره من" className="relative">
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
                alt="تصویر هنری از دنیای دیجیتال سروش"
                width={720}
                height={900}
                className="about-photo w-full h-auto object-cover"
                sizes="(max-width: 1024px) 90vw, 40vw"
              />
            </div>
          </div>

          {/* floating badges */}
          <div className="about-badge -top-4 right-5 float-y" aria-hidden>
            <span className="text-lg font-black text-brand tabular-nums">+۳۹</span>
            <span className="text-[10px] text-muted-foreground font-bold">پروژه متن‌باز</span>
          </div>
          <div className="about-badge -bottom-5 left-4 float-y" style={{ animationDelay: "-2.2s" }} aria-hidden>
            <PenLine className="w-4 h-4 text-brand" />
            <span className="text-[10px] text-muted-foreground font-bold">توسعه‌دهنده و نویسنده</span>
          </div>

          {/* location chip */}
          <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-[10px] font-bold text-foreground/90 bg-background/70 backdrop-blur border border-border rounded-full px-3 py-1.5 shadow-lg">
            <MapPin className="w-3 h-3 text-brand" />
            تهران، ایران
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
            ✨ درباره من
          </span>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-5">
            کُد می‌نویسم، <span className="brand-gradient-text">داستان</span> می‌سازم
          </h2>
          <p className="text-muted-foreground leading-8 text-sm sm:text-base mb-4">
            من سروش چگینی هستم؛ توسعه‌دهنده‌ای که مرز بین مهندسی و خلاقیت را جدی نمی‌گیرد!
            از ربات‌های هوش مصنوعی سرورلس تا شبیه‌سازهای منظومه شمسی با تکسچر واقعی ناسا —
            همه‌چیز را از صفر خودم ساخته‌ام و باور دارم بهترین راه یادگیری، <strong className="text-brand font-bold">ساختن</strong> است.
          </p>
          <p className="text-muted-foreground leading-8 text-sm sm:text-base mb-7">
            وقتی کد نمی‌زنم، درباره روانشناسی رفتار و علوم ورزشی می‌نویسم؛ چون فکر می‌کنم
            یک مهندس خوب باید هم ذهنش را بفهمد، هم بدنش را.
          </p>

          {/* mini timeline */}
          <ol className="relative space-y-4 mb-7 pr-6" aria-label="مسیر من">
            <span className="timeline-line" aria-hidden />
            {TIMELINE.map((t, i) => (
              <motion.li
                key={t.title}
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                onMouseMove={onSpotlightMove}
                className="spotlight relative rounded-2xl border border-border bg-card/60 px-4 py-3 hover:border-brand/40 transition-colors"
              >
                <span className="timeline-dot" aria-hidden />
                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5" aria-hidden>
                    {t.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground leading-6 mt-0.5">{t.desc}</p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ol>

          {/* stack pills */}
          <div className="flex flex-wrap gap-1.5 mb-7" aria-label="تکنولوژی‌های پرکاربرد">
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
              href="https://github.com/CheginiSoroush"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-shine inline-flex items-center gap-2 rounded-2xl bg-brand text-primary-foreground font-bold px-6 py-3 hover:-translate-y-0.5 active:scale-95 transition-all min-h-[46px]"
            >
              <Github className="w-5 h-5" />
              دنبال کردن در گیت‌هاب
            </a>
            <a
              href="mailto:imsoroushchegini@gmail.com"
              className="inline-flex items-center gap-2 rounded-2xl border border-border font-bold px-6 py-3 hover:text-brand hover:border-brand/50 hover:-translate-y-0.5 transition-all min-h-[46px]"
            >
              <Mail className="w-5 h-5" />
              گفت‌وگو با من
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
