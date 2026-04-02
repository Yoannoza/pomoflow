import { Task, PomodoroSession, TimerSettings, DEFAULT_SETTINGS, DayStats } from "./types";
import { supabase } from "./supabase";

const KEYS = {
  tasks: "pomoflow-tasks",
  sessions: "pomoflow-sessions",
  settings: "pomoflow-settings",
  theme: "pomoflow-theme",
} as const;

// ─── Local helpers ───────────────────────────────────────

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

// ─── Tasks ───────────────────────────────────────────────

export function getTasks(): Task[] {
  return safeGet(KEYS.tasks, []);
}

export function saveTasks(tasks: Task[], skipSync = false) {
  safeSet(KEYS.tasks, tasks);
  if (!skipSync) {
    syncTasksToSupabase(tasks);
  }
}

async function syncTasksToSupabase(tasks: Task[]) {
  if (!supabase) return;
  try {
    // Upsert all tasks
    const rows = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      estimated_pomodoros: t.estimatedPomodoros,
      completed_pomodoros: t.completedPomodoros,
      done: t.done,
      created_at: t.createdAt,
    }));
    if (rows.length > 0) {
      await supabase.from("tasks").upsert(rows, { onConflict: "id" });
    }
    // Delete tasks that were removed locally
    const localIds = tasks.map((t) => t.id);
    const { data: remoteTasks } = await supabase.from("tasks").select("id");
    if (remoteTasks) {
      const toDelete = remoteTasks.filter((r) => !localIds.includes(r.id)).map((r) => r.id);
      if (toDelete.length > 0) {
        await supabase.from("tasks").delete().in("id", toDelete);
      }
    }
  } catch {
    // Sync failed silently — localStorage is the source of truth
  }
}

export async function pullTasksFromSupabase(): Promise<Task[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: true });
    if (error || !data) return null;
    return data.map((row) => ({
      id: row.id,
      title: row.title,
      estimatedPomodoros: row.estimated_pomodoros,
      completedPomodoros: row.completed_pomodoros,
      done: row.done,
      createdAt: row.created_at,
    }));
  } catch {
    return null;
  }
}

// ─── Sessions ────────────────────────────────────────────

export function getSessions(): PomodoroSession[] {
  return safeGet(KEYS.sessions, []);
}

export function addSession(session: PomodoroSession) {
  const sessions = getSessions();
  sessions.push(session);
  safeSet(KEYS.sessions, sessions);
  syncSessionToSupabase(session);
}

async function syncSessionToSupabase(session: PomodoroSession) {
  if (!supabase) return;
  try {
    await supabase.from("sessions").insert({
      date: session.date,
      mode: session.mode,
      duration: session.duration,
      completed_at: session.completedAt,
    });
  } catch {
    // Sync failed silently
  }
}

export async function pullSessionsFromSupabase(): Promise<PomodoroSession[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("completed_at", { ascending: true });
    if (error || !data) return null;
    return data.map((row) => ({
      date: row.date,
      mode: row.mode,
      duration: row.duration,
      completedAt: row.completed_at,
    }));
  } catch {
    return null;
  }
}

// ─── Settings ────────────────────────────────────────────

export function getSettings(): TimerSettings {
  return { ...DEFAULT_SETTINGS, ...safeGet(KEYS.settings, DEFAULT_SETTINGS) };
}

export function saveSettings(settings: TimerSettings) {
  safeSet(KEYS.settings, settings);
  syncSettingsToSupabase(settings);
}

async function syncSettingsToSupabase(settings: TimerSettings) {
  if (!supabase) return;
  try {
    await supabase.from("settings").upsert({
      id: 1,
      focus: settings.focus,
      short: settings.short,
      long: settings.long,
      long_break_interval: settings.longBreakInterval,
      auto_start_breaks: settings.autoStartBreaks,
      auto_start_pomodoros: settings.autoStartPomodoros,
    });
  } catch {
    // Sync failed silently
  }
}

export async function pullSettingsFromSupabase(): Promise<TimerSettings | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (error || !data) return null;
    return {
      focus: data.focus,
      short: data.short,
      long: data.long,
      longBreakInterval: data.long_break_interval,
      autoStartBreaks: data.auto_start_breaks,
      autoStartPomodoros: data.auto_start_pomodoros,
    };
  } catch {
    return null;
  }
}

// ─── Theme ───────────────────────────────────────────────

export function getTheme(): "dark" | "light" {
  return safeGet(KEYS.theme, "dark");
}

export function saveTheme(theme: "dark" | "light") {
  safeSet(KEYS.theme, theme);
}

// ─── Stats helpers ───────────────────────────────────────

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
  for (let i = stats.length - 1; i >= 0; i--) {
    if (stats[i].sessions > 0) {
      streak++;
    } else {
      const isToday = stats[i].date === new Date().toISOString().split("T")[0];
      if (isToday) continue;
      break;
    }
  }
  return streak;
}
