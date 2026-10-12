"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

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

function fa(n: number) {
  return n.toLocaleString("fa-IR");
}

function dayLabel(day: Day) {
  const dateFa = new Date(day.date).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  if (day.count === 0) return `بدون فعالیت — ${dateFa}`;
  return `${fa(day.count)} فعالیت در ${dateFa}`;
}

export function ContributionHeatmap({
  days,
  totalContributions,
}: {
  days: Day[];
  totalContributions: number;
}) {
  if (!days.length) return null;

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
          نقشه فعالیت یک سال گذشته
        </h4>
        <span className="text-[11px] font-bold text-brand bg-brand/10 border border-brand/30 rounded-full px-2.5 py-1 tabular-nums shrink-0">
          {fa(totalContributions)} مشارکت
        </span>
      </div>

      <div dir="ltr" className="overflow-x-auto pb-1 heatmap-scroll">
        <div className="flex gap-[3px] min-w-max" role="img" aria-label={`نقشه فعالیت گیت‌هاب با ${fa(totalContributions)} مشارکت در یک سال گذشته`}>
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
          {fa(activeDays)} روز فعال از {fa(days.length)} روز
          {bestDay.count > 0 && (
            <>
              {" "}
              · رکورد: {fa(bestDay.count)} در یک روز 🏆
            </>
          )}
        </p>
        <div dir="ltr" className="flex items-center gap-1" aria-hidden>
          <span className="text-[10px] text-muted-foreground ml-1">کم</span>
          {LEVEL_CLASSES.map((cls) => (
            <span key={cls} className={`heatmap-cell ${cls}`} />
          ))}
          <span className="text-[10px] text-muted-foreground mr-1">زیاد</span>
        </div>
      </div>
    </div>
  );
}
