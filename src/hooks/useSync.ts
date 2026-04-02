"use client";

import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  pullTasksFromSupabase,
  pullSessionsFromSupabase,
  pullSettingsFromSupabase,
  saveTasks,
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

  // Use refs for callbacks so realtime subscription never re-subscribes
  const onTasksRef = useRef(onTasksUpdate);
  const onSessionsRef = useRef(onSessionsUpdate);
  const onSettingsRef = useRef(onSettingsUpdate);
  useEffect(() => { onTasksRef.current = onTasksUpdate; }, [onTasksUpdate]);
  useEffect(() => { onSessionsRef.current = onSessionsUpdate; }, [onSessionsUpdate]);
  useEffect(() => { onSettingsRef.current = onSettingsUpdate; }, [onSettingsUpdate]);

  // Pull all data from Supabase on mount
  const pullAll = useCallback(async () => {
    if (!supabase) return;

    const [remoteTasks, remoteSessions, remoteSettings] = await Promise.all([
      pullTasksFromSupabase(),
      pullSessionsFromSupabase(),
      pullSettingsFromSupabase(),
    ]);

    if (remoteTasks && remoteTasks.length > 0) {
      saveTasks(remoteTasks, true);
      onTasksRef.current(remoteTasks);
    }

    if (remoteSessions && remoteSessions.length > 0) {
      const localSessions = getSessions();
      const remoteKeys = new Set(remoteSessions.map((s) => s.completedAt));
      const merged = [
        ...remoteSessions,
        ...localSessions.filter((s) => !remoteKeys.has(s.completedAt)),
      ];
      localStorage.setItem("pomoflow-sessions", JSON.stringify(merged));
      onSessionsRef.current(merged);
    }

    if (remoteSettings) {
      localStorage.setItem("pomoflow-settings", JSON.stringify(remoteSettings));
      onSettingsRef.current(remoteSettings);
    }
  }, []);

  // Initial pull — once only
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    pullAll();
  }, [pullAll]);

  // Realtime subscriptions — subscribe once, never re-subscribe
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("pomoflow-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        pullTasksFromSupabase().then((tasks) => {
          if (tasks) {
            saveTasks(tasks, true);
            onTasksRef.current(tasks);
          }
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => {
        pullSessionsFromSupabase().then((sessions) => {
          if (sessions) {
            localStorage.setItem("pomoflow-sessions", JSON.stringify(sessions));
            onSessionsRef.current(sessions);
          }
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, () => {
        pullSettingsFromSupabase().then((settings) => {
          if (settings) {
            localStorage.setItem("pomoflow-settings", JSON.stringify(settings));
            onSettingsRef.current(settings);
          }
        });
      })
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, []); // empty deps — subscribe once

  return { pullAll, isConnected: !!supabase };
}
