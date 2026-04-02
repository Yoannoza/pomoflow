"use client";

import { useState, useCallback, useEffect } from "react";
import { isTauri } from "@/lib/tauri";
import { getNotionCredentials, fetchNotionTasksDirect } from "@/lib/notion-client";

export interface NotionTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  type: string;
  energy: string;
  context: string;
}

export function useNotionTasks() {
  const [notionTasks, setNotionTasks] = useState<NotionTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isTauri()) {
        // Desktop: call Notion API directly via Tauri HTTP plugin
        const creds = getNotionCredentials();
        if (!creds) {
          setError("Notion credentials not configured");
          setIsConnected(false);
          setIsLoading(false);
          return;
        }
        const tasks = await fetchNotionTasksDirect(creds);
        setNotionTasks(tasks);
        setIsConnected(true);
      } else {
        // Web: use API route
        const res = await fetch("/api/notion/tasks");
        if (res.ok) {
          const data = await res.json();
          setNotionTasks(data.tasks || []);
          setIsConnected(true);
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed to fetch tasks");
          setIsConnected(false);
        }
      }
    } catch {
      setError("Cannot connect to Notion");
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateTaskStatus = useCallback(async (taskId: string, status: string) => {
    try {
      if (isTauri()) {
        const creds = getNotionCredentials();
        if (creds) {
          const { updateNotionTaskDirect } = await import("@/lib/notion-client");
          await updateNotionTaskDirect(creds, taskId, status);
        }
      } else {
        await fetch("/api/notion/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, status }),
        });
      }
      fetchTasks();
    } catch {
      // silently fail
    }
  }, [fetchTasks]);

  return {
    notionTasks,
    isLoading,
    isConnected,
    error,
    fetchTasks,
    updateTaskStatus,
  };
}
