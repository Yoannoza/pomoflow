export type TimerMode = "focus" | "short" | "long";

export interface TimerSettings {
  focus: number; // minutes
  short: number;
  long: number;
  longBreakInterval: number; // after N pomodoros
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

export interface Task {
  id: string;
  title: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  done: boolean;
  createdAt: string;
}

export interface PomodoroSession {
  date: string; // YYYY-MM-DD
  mode: TimerMode;
  duration: number; // seconds
  completedAt: string; // ISO string
}

export interface DayStats {
  date: string;
  focusMinutes: number;
  sessions: number;
}

export const DEFAULT_SETTINGS: TimerSettings = {
  focus: 25,
  short: 5,
  long: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
};

export const MODE_LABELS: Record<TimerMode, string> = {
  focus: "Focus",
  short: "Short Break",
  long: "Long Break",
};
