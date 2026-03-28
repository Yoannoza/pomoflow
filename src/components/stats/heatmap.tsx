"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DayStats } from "@/lib/types";
import { getDayStats, getStreak } from "@/lib/storage";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Mon", "", "Wed", "", "Fri", "", ""];

function getColor(minutes: number): string {
  if (minutes === 0) return "var(--border)";
  return "var(--chart-1)";
}

function getOpacity(minutes: number): number {
  if (minutes === 0) return 0.2;
  if (minutes < 30) return 0.4;
  if (minutes < 60) return 0.6;
  if (minutes < 120) return 0.8;
  return 1;
}

export function Heatmap() {
  const [stats, setStats] = useState<DayStats[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalFocus, setTotalFocus] = useState(0);
  const [hoveredDay, setHoveredDay] = useState<DayStats | null>(null);

  useEffect(() => {
    const data = getDayStats(365);
    setStats(data);
    setStreak(getStreak());
    setTotalFocus(data.reduce((s, d) => s + d.focusMinutes, 0));
  }, []);

  const weeks: DayStats[][] = [];
  const last364 = stats.slice(-364);
  for (let i = 0; i < last364.length; i += 7) {
    weeks.push(last364.slice(i, i + 7));
  }

  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    if (week[0]) {
      const month = new Date(week[0].date).getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ label: MONTHS[month], weekIndex: wi });
        lastMonth = month;
      }
    }
  });

  const totalHours = Math.round(totalFocus / 60);
  const totalSessions = stats.reduce((s, d) => s + d.sessions, 0);

  const statCards = [
    { value: streak, label: "Day Streak", accent: true },
    { value: `${totalHours}h`, label: "Total Focus", accent: false },
    { value: totalSessions, label: "Sessions", accent: false },
  ];

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2
        className="text-lg font-semibold mb-6"
        style={{ fontFamily: "var(--font-heading), serif" }}
      >
        Statistics
      </h2>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glow-card rounded-xl border border-border/30 bg-card/50 p-5 text-center backdrop-blur-sm"
          >
            <p className={`text-3xl font-light tabular-nums ${card.accent ? "text-primary" : ""}`}
              style={{ fontFamily: "var(--font-heading), serif" }}>
              {card.value}
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-1.5 uppercase tracking-wider">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Heatmap */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-border/30 bg-card/30 p-5 overflow-x-auto backdrop-blur-sm"
      >
        <div className="flex gap-1 min-w-fit">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] pr-2 pt-5">
            {DAYS.map((d, i) => (
              <div key={i} className="h-[11px] text-[9px] text-muted-foreground/40 leading-[11px]">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="relative">
            <div className="relative h-4 mb-1">
              {monthLabels.map(({ label, weekIndex }) => (
                <span
                  key={`${label}-${weekIndex}`}
                  className="text-[9px] text-muted-foreground/40 absolute whitespace-nowrap"
                  style={{ left: weekIndex * 14 }}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      className="h-[11px] w-[11px] rounded-[3px] transition-all duration-150 hover:ring-1 hover:ring-foreground/10 cursor-pointer"
                      style={{
                        backgroundColor: getColor(day.focusMinutes),
                        opacity: getOpacity(day.focusMinutes),
                      }}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      role="gridcell"
                      aria-label={`${day.date}: ${day.focusMinutes} minutes, ${day.sessions} sessions`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-xs text-muted-foreground text-center"
          >
            <span className="font-medium text-foreground">{hoveredDay.date}</span>
            {" — "}
            {hoveredDay.focusMinutes > 0
              ? `${hoveredDay.focusMinutes} min focus, ${hoveredDay.sessions} sessions`
              : "No focus sessions"}
          </motion.div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-3">
          <span className="text-[9px] text-muted-foreground/30">Less</span>
          {[0.2, 0.4, 0.6, 0.8, 1].map((op) => (
            <div
              key={op}
              className="h-[11px] w-[11px] rounded-[3px]"
              style={{
                backgroundColor: op === 0.2 ? "var(--border)" : "var(--chart-1)",
                opacity: op,
              }}
            />
          ))}
          <span className="text-[9px] text-muted-foreground/30">More</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
