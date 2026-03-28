import { Task, PomodoroSession, TimerSettings, DEFAULT_SETTINGS, DayStats } from "./types";

const KEYS = {
  tasks: "pomoflow-tasks",
  sessions: "pomoflow-sessions",
  settings: "pomoflow-settings",
  theme: "pomoflow-theme",
} as const;

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Tasks
export function getTasks(): Task[] {
  return safeGet(KEYS.tasks, []);
}

export function saveTasks(tasks: Task[]) {
  safeSet(KEYS.tasks, tasks);
}

// Sessions
export function getSessions(): PomodoroSession[] {
  return safeGet(KEYS.sessions, []);
}

export function addSession(session: PomodoroSession) {
  const sessions = getSessions();
  sessions.push(session);
  safeSet(KEYS.sessions, sessions);
}

// Settings
export function getSettings(): TimerSettings {
  return safeGet(KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings: TimerSettings) {
  safeSet(KEYS.settings, settings);
}

// Theme
export function getTheme(): "dark" | "light" {
  return safeGet(KEYS.theme, "dark");
}

export function saveTheme(theme: "dark" | "light") {
  safeSet(KEYS.theme, theme);
}

// Stats helpers
export function getDayStats(days: number = 365): DayStats[] {
  const sessions = getSessions();
  const map = new Map<string, DayStats>();

  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    map.set(key, { date: key, focusMinutes: 0, sessions: 0 });
  }

  for (const s of sessions) {
    if (s.mode === "focus") {
      const existing = map.get(s.date);
      if (existing) {
        existing.focusMinutes += Math.round(s.duration / 60);
        existing.sessions += 1;
      }
    }
  }

  return Array.from(map.values()).reverse();
}

export function getStreak(): number {
  const stats = getDayStats(365);
  let streak = 0;
  // Start from yesterday (today might not be done yet)
  const today = new Date().toISOString().split("T")[0];
  const todayStats = stats.find((s) => s.date === today);
  if (todayStats && todayStats.sessions > 0) streak = 1;

  for (let i = stats.length - 2; i >= 0; i--) {
    if (stats[i].date === today) continue;
    if (stats[i].sessions > 0) {
      streak++;
    } else if (streak > 0) {
      break;
    }
  }
  return streak;
}
