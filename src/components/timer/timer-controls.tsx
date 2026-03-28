"use client";

import { motion } from "framer-motion";
import { TimerMode, MODE_LABELS } from "@/lib/types";

interface TimerControlsProps {
  mode: TimerMode;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSwitchMode: (mode: TimerMode) => void;
}

const modes: TimerMode[] = ["focus", "short", "long"];

export function TimerControls({
  mode,
  isRunning,
  onStart,
  onPause,
  onReset,
  onSwitchMode,
}: TimerControlsProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Mode tabs */}
      <div className="flex gap-1 rounded-2xl bg-secondary/40 p-1 backdrop-blur-md border border-border/30">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => onSwitchMode(m)}
            className="relative cursor-pointer rounded-xl px-5 py-2 text-sm font-medium transition-colors duration-300"
          >
            {mode === m && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-xl bg-foreground"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className={`relative z-10 transition-colors duration-200 ${
              mode === m ? "text-background" : "text-muted-foreground hover:text-foreground"
            }`}>
              {MODE_LABELS[m]}
            </span>
          </button>
        ))}
      </div>

      {/* Play / Pause / Reset */}
      <div className="flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={onReset}
          className="cursor-pointer flex h-12 w-12 items-center justify-center rounded-full border border-border/30 text-muted-foreground transition-colors duration-200 hover:bg-secondary/50 hover:text-foreground backdrop-blur-sm"
          aria-label="Reset timer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.04 }}
          onClick={isRunning ? onPause : onStart}
          className="cursor-pointer relative flex h-18 w-18 items-center justify-center rounded-full bg-foreground text-background shadow-2xl overflow-hidden"
          aria-label={isRunning ? "Pause" : "Start"}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 animate-shimmer" />

          {isRunning ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="relative z-10">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="relative z-10 ml-1">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => {
            const next = mode === "focus" ? "short" : "focus";
            onSwitchMode(next);
          }}
          className="cursor-pointer flex h-12 w-12 items-center justify-center rounded-full border border-border/30 text-muted-foreground transition-colors duration-200 hover:bg-secondary/50 hover:text-foreground backdrop-blur-sm"
          aria-label="Skip"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5,4 15,12 5,20" fill="currentColor" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </motion.button>
      </div>

      {/* Keyboard hints */}
      <motion.div
        className="flex gap-4 text-xs text-muted-foreground/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <span><kbd className="rounded border border-border/20 px-1.5 py-0.5 font-mono text-[10px]">Space</kbd> play/pause</span>
        <span><kbd className="rounded border border-border/20 px-1.5 py-0.5 font-mono text-[10px]">R</kbd> reset</span>
      </motion.div>
    </motion.div>
  );
}
