"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TimerMode } from "@/lib/types";

interface TimerRingProps {
  progress: number;
  mode: TimerMode;
  secondsLeft: number;
  isRunning: boolean;
}

const MODE_COLORS: Record<TimerMode, { stroke: string; glow: string }> = {
  focus: { stroke: "var(--pomo-focus)", glow: "var(--pomo-focus-glow)" },
  short: { stroke: "var(--pomo-short)", glow: "var(--pomo-short-glow)" },
  long: { stroke: "var(--pomo-long)", glow: "var(--pomo-long-glow)" },
};

export function TimerRing({ progress, mode, secondsLeft, isRunning }: TimerRingProps) {
  const size = 300;
  const strokeWidth = 4;
  const center = size / 2;
  const radius = center - strokeWidth - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const { stroke, glow } = MODE_COLORS[mode];

  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Ambient glow behind the ring */}
      <motion.div
        className="absolute rounded-full blur-3xl"
        animate={{
          opacity: isRunning ? 0.5 : 0.15,
          scale: isRunning ? [1, 1.1, 1] : 1,
        }}
        transition={{
          opacity: { duration: 0.8 },
          scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{
          width: size * 0.65,
          height: size * 0.65,
          background: glow,
        }}
      />

      {/* Outer decorative ring */}
      <svg width={size} height={size} className="absolute z-10 -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius + 12}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
          opacity={0.3}
          strokeDasharray="4 8"
        />
      </svg>

      <svg width={size} height={size} className="relative z-10 -rotate-90">
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        {/* Progress */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: isRunning ? `drop-shadow(0 0 10px ${glow})` : "none",
            transition: "stroke-dashoffset 0.3s ease-out, stroke 0.5s ease, filter 0.5s ease",
          }}
        />

        {/* Glowing dot at progress tip — no PI/2 offset since SVG has -rotate-90 */}
        {progress > 0.01 && progress < 0.99 && (
          <circle
            cx={center + radius * Math.cos(2 * Math.PI * progress)}
            cy={center + radius * Math.sin(2 * Math.PI * progress)}
            r={isRunning ? 4 : 3}
            fill={stroke}
            opacity={0.9}
            style={{
              filter: `drop-shadow(0 0 6px ${glow})`,
            }}
          />
        )}
      </svg>

      {/* Time display */}
      <div className="absolute z-20 flex flex-col items-center gap-2">
        <motion.span
          key={timeStr}
          className="text-7xl font-extralight tracking-tight tabular-nums"
          style={{
            color: "var(--foreground)",
            fontFamily: "var(--font-heading), serif",
            letterSpacing: "-0.02em",
          }}
          initial={false}
        >
          {timeStr}
        </motion.span>

        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1.5"
            >
              <motion.span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: stroke }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <span
                className="text-[10px] uppercase tracking-[0.2em] font-medium"
                style={{ color: "var(--muted-foreground)" }}
              >
                {mode === "focus" ? "Focusing" : "Breaking"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
