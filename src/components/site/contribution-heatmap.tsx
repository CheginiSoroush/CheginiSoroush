"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useT } from "@/lib/i18n";

type Day = { date: string; count: number };

const LEVEL_CLASSES = [
  "heatmap-l0",
  "heatmap-l1",
  "heatmap-l2",
  "heatmap-l3",
  "heatmap-l4",
];

function levelOf(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
}

export function ContributionHeatmap({
  days,
  totalContributions,
}: {
  days: Day[];
  totalContributions: number;
}) {
  const { t, num, lang } = useT();
  if (!days.length) return null;

  const locale = lang === "fa" ? "fa-IR" : "en-US";
  const dayLabel = (day: Day) => {
    const dateStr = new Date(day.date).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (day.count === 0) return t("home", "heatmap.day.none", { date: dateStr });
    return t("home", "heatmap.day.some", { n: num(day.count), date: dateStr });
  };

  // Group consecutive days into week columns (GitHub-style)
  const weeks: Day[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const activeDays = days.filter((d) => d.count > 0).length;
  const bestDay = days.reduce((best, d) => (d.count > best.count ? d : best), days[0]);

  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h4 className="flex items-center gap-2 text-sm font-extrabold">
          <Flame className="w-4 h-4 text-brand" />
          {t("home", "heatmap.title")}
        </h4>
        <span className="text-[11px] font-bold text-brand bg-brand/10 border border-brand/30 rounded-full px-2.5 py-1 tabular-nums shrink-0">
          {t("home", "heatmap.total", { n: num(totalContributions) })}
        </span>
      </div>

      <div dir="ltr" className="overflow-x-auto pb-1 heatmap-scroll">
        <div className="flex gap-[3px] min-w-max" role="img" aria-label={t("home", "heatmap.aria", { n: num(totalContributions) })}>
          {weeks.map((week, wi) => (
            <motion.div
              key={wi}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: Math.min(wi * 0.012, 0.5) }}
              className="flex flex-col gap-[3px]"
            >
              {week.map((day) => (
                <span
                  key={day.date}
                  title={dayLabel(day)}
                  className={`heatmap-cell ${LEVEL_CLASSES[levelOf(day.count)]} ${
                    day.count > 0 ? "heatmap-cell-active" : ""
                  }`}
                />
              ))}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-3 flex-wrap">
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {t("home", "heatmap.activeDays", { n: num(activeDays), m: num(days.length) })}
          {bestDay.count > 0 && (
            <>
              {" "}
              {t("home", "heatmap.record", { n: num(bestDay.count) })}
            </>
          )}
        </p>
        <div dir="ltr" className="flex items-center gap-1" aria-hidden>
          <span className="text-[10px] text-muted-foreground ms-1">{t("home", "heatmap.less")}</span>
          {LEVEL_CLASSES.map((cls) => (
            <span key={cls} className={`heatmap-cell ${cls}`} />
          ))}
          <span className="text-[10px] text-muted-foreground me-1">{t("home", "heatmap.more")}</span>
        </div>
      </div>
    </div>
  );
}
