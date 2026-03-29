"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { TimerMode, TimerSettings, DEFAULT_SETTINGS } from "@/lib/types";
import { addSession, getSettings } from "@/lib/storage";

export function useTimer() {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<TimerMode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SETTINGS.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetEndRef = useRef<number>(0);
  const settingsRef = useRef(DEFAULT_SETTINGS);
  const modeRef = useRef<TimerMode>("focus");
  const pomodoroCountRef = useRef(0);

  useEffect(() => {
    const s = getSettings();
    setSettings(s);
    settingsRef.current = s;
    setSecondsLeft(s.focus * 60);
  }, []);

  // Keep refs in sync
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { pomodoroCountRef.current = pomodoroCount; }, [pomodoroCount]);

  const totalSeconds = settings[mode] * 60;
  const progress = 1 - secondsLeft / totalSeconds;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const playAlarm = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1000;
        osc2.type = "sine";
        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.8);
      }, 300);
    } catch {
      // Audio not available
    }
  }, []);

  const startTimerWithSeconds = useCallback(
    (secs: number) => {
      clearTimer();
      setIsRunning(true);
      setSecondsLeft(secs);
      targetEndRef.current = Date.now() + secs * 1000;

      intervalRef.current = setInterval(() => {
        const remaining = Math.round((targetEndRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          setSecondsLeft(0);
          // Will be handled by the effect below
        } else {
          setSecondsLeft(remaining);
        }
      }, 200);
    },
    [clearTimer]
  );

  // Handle timer completion via effect to avoid stale closures
  useEffect(() => {
    if (secondsLeft !== 0 || !isRunning) return;

    clearTimer();
    setIsRunning(false);
    playAlarm();

    const currentMode = modeRef.current;
    const currentSettings = settingsRef.current;
    const currentCount = pomodoroCountRef.current;

    const now = new Date();
    addSession({
      date: now.toISOString().split("T")[0],
      mode: currentMode,
      duration: currentSettings[currentMode] * 60,
      completedAt: now.toISOString(),
    });

    if (currentMode === "focus") {
      const newCount = currentCount + 1;
      setPomodoroCount(newCount);
      pomodoroCountRef.current = newCount;

      const nextMode: TimerMode = newCount % currentSettings.longBreakInterval === 0 ? "long" : "short";
      const nextSecs = currentSettings[nextMode] * 60;

      setMode(nextMode);
      modeRef.current = nextMode;
      setSecondsLeft(nextSecs);

      if (currentSettings.autoStartBreaks) {
        setTimeout(() => startTimerWithSeconds(nextSecs), 600);
      }
    } else {
      setMode("focus");
      modeRef.current = "focus";
      const nextSecs = currentSettings.focus * 60;
      setSecondsLeft(nextSecs);

      if (currentSettings.autoStartPomodoros) {
        setTimeout(() => startTimerWithSeconds(nextSecs), 600);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, isRunning]);

  const switchMode = useCallback(
    (newMode: TimerMode) => {
      clearTimer();
      setIsRunning(false);
      setMode(newMode);
      modeRef.current = newMode;
      setSecondsLeft(settingsRef.current[newMode] * 60);
    },
    [clearTimer]
  );

  const start = useCallback(() => {
    // Read current secondsLeft at call time
    setSecondsLeft((current) => {
      clearTimer();
      setIsRunning(true);
      targetEndRef.current = Date.now() + current * 1000;

      intervalRef.current = setInterval(() => {
        const remaining = Math.round((targetEndRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          setSecondsLeft(0);
        } else {
          setSecondsLeft(remaining);
        }
      }, 200);

      return current;
    });
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setSecondsLeft(settingsRef.current[modeRef.current] * 60);
  }, [clearTimer]);

  const updateSettings = useCallback(
    (newSettings: TimerSettings) => {
      setSettings(newSettings);
      settingsRef.current = newSettings;
      if (!isRunning) {
        setSecondsLeft(newSettings[modeRef.current] * 60);
      }
    },
    [isRunning]
  );

  // Cleanup
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        // Toggle based on current state
        setIsRunning((running) => {
          if (running) {
            clearTimer();
            return false;
          } else {
            start();
            return true; // start() will set this too, but we need to return something
          }
        });
      }
      if (e.code === "KeyR" && !e.metaKey && !e.ctrlKey) {
        reset();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [start, reset, clearTimer]);

  return {
    mode,
    secondsLeft,
    totalSeconds,
    progress,
    isRunning,
    pomodoroCount,
    settings,
    switchMode,
    start,
    pause,
    reset,
    updateSettings,
  };
}
