"use client";

import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  pullTasksFromSupabase,
  pullSessionsFromSupabase,
  pullSettingsFromSupabase,
  saveTasks as saveTasksLocal,
  getSettings,
  getSessions,
} from "@/lib/storage";
import { Task, PomodoroSession, TimerSettings } from "@/lib/types";

interface UseSyncOptions {
  onTasksUpdate: (tasks: Task[]) => void;
  onSessionsUpdate: (sessions?: PomodoroSession[]) => void;
  onSettingsUpdate: (settings: TimerSettings) => void;
}

export function useSync({ onTasksUpdate, onSessionsUpdate, onSettingsUpdate }: UseSyncOptions) {
  const initializedRef = useRef(false);

  // Pull all data from Supabase on mount
  const pullAll = useCallback(async () => {
    if (!supabase) return;

    const [remoteTasks, remoteSessions, remoteSettings] = await Promise.all([
      pullTasksFromSupabase(),
      pullSessionsFromSupabase(),
      pullSettingsFromSupabase(),
    ]);

    if (remoteTasks && remoteTasks.length > 0) {
      saveTasksLocal(remoteTasks);
      onTasksUpdate(remoteTasks);
    }

    if (remoteSessions && remoteSessions.length > 0) {
      // Merge: keep local sessions that aren't in remote (by completedAt)
      const localSessions = getSessions();
      const remoteKeys = new Set(remoteSessions.map((s) => s.completedAt));
      const merged = [
        ...remoteSessions,
        ...localSessions.filter((s) => !remoteKeys.has(s.completedAt)),
      ];
      localStorage.setItem("pomoflow-sessions", JSON.stringify(merged));
      onSessionsUpdate(merged);
    }

    if (remoteSettings) {
      localStorage.setItem("pomoflow-settings", JSON.stringify(remoteSettings));
      onSettingsUpdate(remoteSettings);
    }
  }, [onTasksUpdate, onSessionsUpdate, onSettingsUpdate]);

  // Initial pull
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    pullAll();
  }, [pullAll]);

  // Realtime subscriptions
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("pomoflow-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        pullTasksFromSupabase().then((tasks) => {
          if (tasks) {
            saveTasksLocal(tasks);
            onTasksUpdate(tasks);
          }
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => {
        pullSessionsFromSupabase().then((sessions) => {
          if (sessions) {
            localStorage.setItem("pomoflow-sessions", JSON.stringify(sessions));
            onSessionsUpdate(sessions);
          }
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, () => {
        pullSettingsFromSupabase().then((settings) => {
          if (settings) {
            localStorage.setItem("pomoflow-settings", JSON.stringify(settings));
            onSettingsUpdate(settings);
          }
        });
      })
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [onTasksUpdate, onSessionsUpdate, onSettingsUpdate]);

  return { pullAll, isConnected: !!supabase };
}
