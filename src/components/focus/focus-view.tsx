"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimerMode, MODE_LABELS } from "@/lib/types";
import { Task } from "@/lib/types";
import { NeuralBackground } from "./neural-background";

interface AmbientSoundMini {
  id: string;
  label: string;
  icon: React.ReactNode;
  src: string;
}

const MINI_SOUNDS: AmbientSoundMini[] = [
  {
    id: "rain",
    label: "Rain",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
        <path d="M16 14v6" /><path d="M8 14v6" /><path d="M12 16v6" />
      </svg>
    ),
    src: "/sounds/rain.mp3",
  },
  {
    id: "fire",
    label: "Fire",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
    src: "/sounds/fire.mp3",
  },
  {
    id: "wind",
    label: "Wind",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
        <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
        <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
      </svg>
    ),
    src: "/sounds/wind.mp3",
  },
  {
    id: "forest",
    label: "Forest",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 2L7 9h3l-4 7h4l-5 8h14l-5-8h4l-4-7h3L12 2z" />
      </svg>
    ),
    src: "/sounds/forest.mp3",
  },
];

interface FocusViewProps {
  secondsLeft: number;
  totalSeconds: number;
  progress: number;
  mode: TimerMode;
  isRunning: boolean;
  activeTask: Task | null;
  pomodoroCount: number;
  longBreakInterval: number;
  onPause: () => void;
  onStart: () => void;
  onReset: () => void;
  onExit: () => void;
}

const MODE_COLORS: Record<TimerMode, { stroke: string; glow: string; particle: string }> = {
  focus: { stroke: "var(--pomo-focus)", glow: "var(--pomo-focus-glow)", particle: "rgba(196, 163, 90, 0.3)" },
  short: { stroke: "var(--pomo-short)", glow: "var(--pomo-short-glow)", particle: "rgba(139, 168, 157, 0.3)" },
  long: { stroke: "var(--pomo-long)", glow: "var(--pomo-long-glow)", particle: "rgba(212, 196, 160, 0.3)" },
};

export function FocusView({
  secondsLeft,
  progress,
  mode,
  isRunning,
  activeTask,
  pomodoroCount,
  longBreakInterval,
  onPause,
  onStart,
  onReset,
  onExit,
}: FocusViewProps) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  const { stroke, glow, particle } = MODE_COLORS[mode];

  const size = 420;
  const strokeWidth = 3;
  const center = size / 2;
  const radius = center - strokeWidth - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  // Mini ambient player state
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showAmbient, setShowAmbient] = useState(false);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setActiveSound(null);
  }, []);

  const playSound = useCallback(
    (sound: AmbientSoundMini) => {
      if (activeSound === sound.id) { stopSound(); return; }
      stopSound();

      const audio = new Audio(sound.src);
      audio.loop = true;
      audio.volume = volume;
      audio.play();
      audioRef.current = audio;
      setActiveSound(sound.id);
    },
    [activeSound, stopSound, volume]
  );

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Neural particle flow field background */}
      <NeuralBackground
        color={particle}
        trailOpacity={0.06}
        particleCount={500}
        speed={0.7}
      />

      {/* Subtle center glow */}
      <motion.div
        className="absolute rounded-full blur-[150px] pointer-events-none"
        animate={{
          opacity: [0.05, 0.15, 0.05],
          scale: [0.9, 1.1, 0.9],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${glow}, transparent 60%)`,
        }}
      />

      {/* Top bar - exit + ambient toggle */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between"
      >
        <button
          onClick={onExit}
          className="cursor-pointer flex items-center gap-2 rounded-xl border border-border/15 bg-secondary/20 px-4 py-2.5 text-sm text-muted-foreground/60 backdrop-blur-md transition-all hover:text-foreground hover:bg-secondary/40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Exit Focus
        </button>

        <button
          onClick={() => setShowAmbient(!showAmbient)}
          className={`cursor-pointer flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm backdrop-blur-md transition-all ${
            activeSound
              ? "border-primary/20 bg-primary/8 text-primary"
              : "border-border/15 bg-secondary/20 text-muted-foreground/60 hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          {activeSound ? MINI_SOUNDS.find(s => s.id === activeSound)?.label : "Ambient"}
        </button>
      </motion.div>

      {/* Ambient panel */}
      <AnimatePresence>
        {showAmbient && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-20 right-6 z-30 rounded-2xl border border-border/15 bg-background/80 backdrop-blur-2xl p-4 shadow-2xl"
          >
            <div className="flex gap-2 mb-3">
              {MINI_SOUNDS.map((sound) => {
                const isActive = activeSound === sound.id;
                return (
                  <button
                    key={sound.id}
                    onClick={() => playSound(sound)}
                    className={`cursor-pointer flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                      isActive
                        ? "border-primary/20 bg-primary/8 text-primary"
                        : "border-border/15 bg-secondary/20 text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                    }`}
                  >
                    {sound.icon}
                    <span className="text-[10px] font-medium">{sound.label}</span>
                  </button>
                );
              })}
            </div>
            {activeSound && (
              <div className="flex items-center gap-3 px-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40 shrink-0">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
                </svg>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 appearance-none rounded-full bg-border/50 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40 shrink-0">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Mode label with breathing dot */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <motion.span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: stroke }}
            animate={{
              opacity: [1, 0.3, 1],
              scale: [1, 0.7, 1],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <span
            className="text-base uppercase tracking-[0.3em] font-medium"
            style={{ color: stroke, fontFamily: "var(--font-heading), serif" }}
          >
            {MODE_LABELS[mode]}
          </span>
        </motion.div>

        {/* Timer Ring with breathing rings */}
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          <svg width={size} height={size} className="relative z-10 -rotate-90">
            {/* Outer decorative ring */}
            <circle
              cx={center}
              cy={center}
              r={radius + 18}
              fill="none"
              stroke="var(--border)"
              strokeWidth={0.5}
              opacity={0.1}
              strokeDasharray="2 14"
            />
            {/* Track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth={strokeWidth}
              opacity={0.08}
            />
            {/* Progress arc */}
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
                filter: `drop-shadow(0 0 24px ${glow})`,
                transition: "stroke-dashoffset 0.3s ease-out",
              }}
            />
            {/* Glowing dot at tip */}
            {progress > 0.01 && progress < 0.99 && (
              <circle
                cx={center + radius * Math.cos(2 * Math.PI * progress - Math.PI / 2)}
                cy={center + radius * Math.sin(2 * Math.PI * progress - Math.PI / 2)}
                r={5}
                fill={stroke}
                opacity={0.9}
                style={{ filter: `drop-shadow(0 0 12px ${glow})` }}
              />
            )}
          </svg>

          {/* Center time display */}
          <div className="absolute z-20 flex flex-col items-center gap-2">
            <motion.span
              className="text-8xl sm:text-[10rem] font-extralight tracking-tight tabular-nums leading-none"
              style={{
                color: "var(--foreground)",
                fontFamily: "var(--font-heading), serif",
                letterSpacing: "-0.03em",
              }}
              initial={false}
            >
              {timeStr}
            </motion.span>
          </div>
        </motion.div>

        {/* Active task - prominently displayed */}
        <AnimatePresence>
          {activeTask && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col items-center gap-4 max-w-lg px-4"
            >
              <div className="h-px w-40 bg-gradient-to-r from-transparent via-border/30 to-transparent" />
              <motion.p
                className="text-2xl sm:text-3xl font-medium text-center text-foreground/85 leading-snug"
                style={{ fontFamily: "var(--font-heading), serif" }}
                animate={{
                  opacity: [0.85, 1, 0.85],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                {activeTask.title}
              </motion.p>
              <div className="flex items-center gap-2.5">
                {Array.from({ length: activeTask.estimatedPomodoros }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="h-2 w-7 rounded-full"
                    animate={{
                      backgroundColor: i < activeTask.completedPomodoros
                        ? stroke
                        : "var(--border)",
                      scale: i < activeTask.completedPomodoros ? 1 : 0.85,
                    }}
                    transition={{ duration: 0.4 }}
                  />
                ))}
                <span className="ml-2 text-sm text-muted-foreground/40 tabular-nums">
                  {activeTask.completedPomodoros}/{activeTask.estimatedPomodoros}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pomodoro session dots */}
        <motion.div
          className="flex items-center gap-2.5 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {Array.from({ length: longBreakInterval }).map((_, i) => (
            <motion.span
              key={i}
              animate={{
                scale: i < (pomodoroCount % longBreakInterval) ? 1.3 : 1,
                backgroundColor: i < (pomodoroCount % longBreakInterval)
                  ? stroke
                  : "var(--border)",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="h-3 w-3 rounded-full"
            />
          ))}
          <span className="ml-2 text-sm text-muted-foreground/30 tabular-nums">
            #{pomodoroCount}
          </span>
        </motion.div>

        {/* Controls */}
        <motion.div
          className="flex items-center gap-5 mt-6"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            onClick={onReset}
            className="cursor-pointer flex h-16 w-16 items-center justify-center rounded-full border border-border/20 text-muted-foreground/50 transition-colors hover:bg-secondary/30 hover:text-foreground backdrop-blur-sm"
            aria-label="Reset timer"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.04 }}
            onClick={isRunning ? onPause : onStart}
            className="cursor-pointer relative flex h-24 w-24 items-center justify-center rounded-full bg-foreground text-background shadow-2xl overflow-hidden"
            aria-label={isRunning ? "Pause" : "Start"}
          >
            <div className="absolute inset-0 animate-shimmer" />
            {isRunning ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="relative z-10">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="relative z-10 ml-1">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            onClick={onExit}
            className="cursor-pointer flex h-16 w-16 items-center justify-center rounded-full border border-border/20 text-muted-foreground/50 transition-colors hover:bg-secondary/30 hover:text-foreground backdrop-blur-sm"
            aria-label="Exit focus mode"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 9V4.5M9 9H4.5M9 9 3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5 5.5 5.5" />
            </svg>
          </motion.button>
        </motion.div>

        {/* Keyboard hints - very subtle */}
        <motion.div
          className="flex gap-5 text-sm text-muted-foreground/20 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <span><kbd className="rounded border border-border/10 px-2 py-1 font-mono text-xs">Space</kbd> play/pause</span>
          <span><kbd className="rounded border border-border/10 px-2 py-1 font-mono text-xs">R</kbd> reset</span>
          <span><kbd className="rounded border border-border/10 px-2 py-1 font-mono text-xs">Esc</kbd> exit</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
