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
    (title: string, estimatedPomodoros: number = 1) => {
      const task: Task = {
        id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        title,
        estimatedPomodoros,
        completedPomodoros: 0,
        done: false,
        createdAt: new Date().toISOString(),
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
        return updated;
      });
    },
    []
  );

  const incrementPomodoro = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === id
            ? { ...t, completedPomodoros: t.completedPomodoros + 1 }
            : t
        );
        saveTasks(updated);
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
