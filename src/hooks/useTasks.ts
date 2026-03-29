"use client";

import { useState, useEffect, useCallback } from "react";
import { Task } from "@/lib/types";
import { getTasks, saveTasks } from "@/lib/storage";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  useEffect(() => {
    setTasks(getTasks());
  }, []);

  const persist = useCallback((updated: Task[]) => {
    setTasks(updated);
    saveTasks(updated);
  }, []);

  const addTask = useCallback(
    (title: string, estimatedPomodoros: number = 1, notionId?: string) => {
      const task: Task = {
        id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        title,
        estimatedPomodoros,
        completedPomodoros: 0,
        done: false,
        createdAt: new Date().toISOString(),
        ...(notionId && { notionId }),
      };
      setTasks((prev) => {
        const updated = [...prev, task];
        saveTasks(updated);
        return updated;
      });
    },
    []
  );

  const removeTask = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        saveTasks(updated);
        return updated;
      });
      setActiveTaskId((prev) => (prev === id ? null : prev));
    },
    []
  );

  const toggleDone = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === id ? { ...t, done: !t.done } : t
        );
        saveTasks(updated);
        // Sync to Notion if task has notionId
        const task = updated.find((t) => t.id === id);
        if (task?.notionId) {
          fetch("/api/notion/tasks", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId: task.notionId,
              status: task.done ? "Fait" : "En cours",
            }),
          }).catch(() => {});
        }
        return updated;
      });
    },
    []
  );

  const incrementPomodoro = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const updated = prev.map((t) => {
          if (t.id !== id) return t;
          const newCompleted = t.completedPomodoros + 1;
          const nowDone = newCompleted >= t.estimatedPomodoros ? true : t.done;
          return { ...t, completedPomodoros: newCompleted, done: nowDone };
        });
        saveTasks(updated);
        // Auto-sync to Notion if task just completed
        const task = updated.find((t) => t.id === id);
        if (task?.done && task.notionId) {
          fetch("/api/notion/tasks", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId: task.notionId, status: "Fait" }),
          }).catch(() => {});
        }
        return updated;
      });
    },
    []
  );

  const clearDone = useCallback(() => {
    setTasks((prev) => {
      const updated = prev.filter((t) => !t.done);
      saveTasks(updated);
      return updated;
    });
  }, []);

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;

  return {
    tasks,
    setTasks,
    activeTask,
    activeTaskId,
    setActiveTaskId,
    addTask,
    removeTask,
    toggleDone,
    incrementPomodoro,
    clearDone,
  };
}
