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
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const s = getSettings();
    setSettings(s);
    setSecondsLeft(s.focus * 60);
  }, []);

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
      // Second beep
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

  const switchMode = useCallback(
    (newMode: TimerMode) => {
      clearTimer();
      setIsRunning(false);
      setMode(newMode);
      setSecondsLeft(settings[newMode] * 60);
    },
    [clearTimer, settings]
  );

  const handleComplete = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    playAlarm();

    const now = new Date();
    addSession({
      date: now.toISOString().split("T")[0],
      mode,
      duration: settings[mode] * 60,
      completedAt: now.toISOString(),
    });

    if (mode === "focus") {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      if (newCount % settings.longBreakInterval === 0) {
        switchMode("long");
        if (settings.autoStartBreaks) {
          setTimeout(() => start(), 500);
        }
      } else {
        switchMode("short");
        if (settings.autoStartBreaks) {
          setTimeout(() => start(), 500);
        }
      }
    } else {
      switchMode("focus");
      if (settings.autoStartPomodoros) {
        setTimeout(() => start(), 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimer, mode, playAlarm, pomodoroCount, settings, switchMode]);

  const start = useCallback(() => {
    clearTimer();
    setIsRunning(true);
    startTimeRef.current = Date.now();
    const targetEnd = Date.now() + secondsLeft * 1000;

    intervalRef.current = setInterval(() => {
      const remaining = Math.round((targetEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        setSecondsLeft(0);
        handleComplete();
      } else {
        setSecondsLeft(remaining);
      }
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimer, secondsLeft]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setSecondsLeft(settings[mode] * 60);
  }, [clearTimer, mode, settings]);

  const updateSettings = useCallback(
    (newSettings: TimerSettings) => {
      setSettings(newSettings);
      if (!isRunning) {
        setSecondsLeft(newSettings[mode] * 60);
      }
    },
    [isRunning, mode]
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
        isRunning ? pause() : start();
      }
      if (e.code === "KeyR" && !e.metaKey && !e.ctrlKey) {
        reset();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isRunning, pause, start, reset]);

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
