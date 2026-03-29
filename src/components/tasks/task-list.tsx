"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task } from "@/lib/types";
import { NotionTask } from "@/hooks/useNotionTasks";

interface TaskListProps {
  tasks: Task[];
  activeTaskId: string | null;
  onSelectTask: (id: string) => void;
  onAddTask: (title: string, pomodoros: number) => void;
  onToggleDone: (id: string) => void;
  onRemoveTask: (id: string) => void;
  onClearDone: () => void;
  notionTasks?: NotionTask[];
  isNotionConnected?: boolean;
  isNotionLoading?: boolean;
  onFetchNotion?: () => void;
  onImportNotionTask?: (task: NotionTask) => void;
}

export function TaskList({
  tasks,
  activeTaskId,
  onSelectTask,
  onAddTask,
  onToggleDone,
  onRemoveTask,
  onClearDone,
  notionTasks = [],
  isNotionConnected = false,
  isNotionLoading = false,
  onFetchNotion,
  onImportNotionTask,
}: TaskListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newPomos, setNewPomos] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showNotion, setShowNotion] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), newPomos);
    setNewTitle("");
    setNewPomos(1);
    setShowForm(false);
  };

  const doneTasks = tasks.filter((t) => t.done);
  const pendingTasks = tasks.filter((t) => !t.done);
  const totalEstimated = pendingTasks.reduce((s, t) => s + t.estimatedPomodoros, 0);
  const totalCompleted = pendingTasks.reduce((s, t) => s + t.completedPomodoros, 0);

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading), serif" }}>
          Tasks
        </h2>
        <div className="flex items-center gap-3 text-base text-muted-foreground">
          <span className="tabular-nums text-sm">{totalCompleted}/{totalEstimated}</span>
          {doneTasks.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearDone();
              }}
              className="cursor-pointer text-xs text-destructive/60 hover:text-destructive transition-colors"
            >
              Clear done
            </button>
          )}
        </div>
      </div>

      {/* Notion import toggle */}
      {onFetchNotion && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setShowNotion(!showNotion);
            if (!isNotionConnected && onFetchNotion) {
              onFetchNotion();
            }
          }}
          className="cursor-pointer mb-3 w-full flex items-center justify-center gap-2 rounded-xl border border-border/30 bg-secondary/30 p-3 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary/50 hover:text-foreground backdrop-blur-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-70">
            <path d="M4 4.5l1.2.8c.4.3 1 .3 1.4 0L8 4.5l1.5.8c.4.2.9.2 1.3 0L12.5 4l1.5 1c.4.3 1 .3 1.4 0l1.6-1 1.5.8c.4.2.9.2 1.3 0L21.5 4V19l-1.7 1c-.4.2-.9.2-1.3 0L17 19l-1.5 1c-.4.3-1 .3-1.4 0L12.5 19 11 20c-.4.3-1 .3-1.3 0L8.5 19l-1.4.8c-.4.3-1 .3-1.4 0L4 19V4.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {showNotion ? "Hide Notion tasks" : "Import from Notion"}
          {isNotionConnected && notionTasks.length > 0 && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs tabular-nums text-primary">
              {notionTasks.length}
            </span>
          )}
        </motion.button>
      )}

      {/* Notion tasks panel */}
      <AnimatePresence>
        {showNotion && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-3"
          >
            <div className="rounded-xl border border-border/30 bg-secondary/20 p-3 space-y-2 backdrop-blur-sm">
              {/* Refresh button */}
              {isNotionConnected && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onFetchNotion?.(); }}
                  className="cursor-pointer w-full flex items-center justify-center gap-2 rounded-lg border border-border/20 bg-card/30 p-2 text-xs text-muted-foreground/60 hover:text-foreground hover:bg-card/60 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={isNotionLoading ? "animate-spin" : ""}>
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Refresh Notion tasks
                </button>
              )}
              {isNotionLoading ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground/50">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading...
                </div>
              ) : notionTasks.length > 0 ? (
                notionTasks.slice(0, 15).map((nt) => (
                  <motion.button
                    key={nt.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onImportNotionTask?.(nt)}
                    className="cursor-pointer w-full flex items-center gap-3 rounded-lg border border-border/20 bg-card/50 p-3 text-left transition-all hover:bg-card hover:border-border/40"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      nt.priority === "Urgent" || nt.priority === "🔴" ? "bg-red-400" :
                      nt.priority === "Important" || nt.priority === "🟠" ? "bg-orange-400" :
                      nt.priority === "Medium" || nt.priority === "🟡" ? "bg-yellow-400" :
                      "bg-muted-foreground/30"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{nt.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {nt.status && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary/50 text-muted-foreground/60">{nt.status}</span>
                        )}
                        {nt.priority && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary/50 text-muted-foreground/60">{nt.priority}</span>
                        )}
                        {nt.type && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary/50 text-muted-foreground/60">{nt.type}</span>
                        )}
                        {nt.dueDate && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary/50 text-muted-foreground/60">{nt.dueDate}</span>
                        )}
                        {nt.context && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary/50 text-muted-foreground/60">{nt.context}</span>
                        )}
                        {nt.energy && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary/50 text-muted-foreground/60">{nt.energy}</span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-primary/60 font-medium">+ Add</span>
                  </motion.button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground/50 text-center py-3">
                  {isNotionConnected ? "No pending tasks" : "Could not connect to Notion"}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending tasks */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {pendingTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, x: -20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onSelectTask(task.id)}
              className={`glow-card group cursor-pointer flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-200 ${
                activeTaskId === task.id
                  ? "border-primary/20 bg-primary/5 shadow-sm"
                  : "border-border/30 bg-card/50 hover:border-border/50 hover:bg-card/80 backdrop-blur-sm"
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onToggleDone(task.id);
                }}
                className={`cursor-pointer flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors active:scale-90 ${
                  activeTaskId === task.id
                    ? "border-primary/40 hover:border-primary hover:bg-primary/10"
                    : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
                }`}
                aria-label={`Mark "${task.title}" as done`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-0 group-hover:opacity-30">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>

              {/* Title & progress */}
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium truncate">{task.title}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  {Array.from({ length: task.estimatedPomodoros }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-4 rounded-full"
                      animate={{
                        backgroundColor: i < task.completedPomodoros
                          ? "var(--primary)"
                          : "var(--border)",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                  <span className="ml-1.5 text-xs text-muted-foreground/50 tabular-nums">
                    {task.completedPomodoros}/{task.estimatedPomodoros}
                  </span>
                </div>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onRemoveTask(task.id);
                }}
                className="cursor-pointer sm:opacity-0 sm:group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all"
                aria-label={`Delete "${task.title}"`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Done tasks */}
        <AnimatePresence>
          {doneTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0, height: 0 }}
              className="group flex items-center gap-3 rounded-xl border border-border/20 p-3"
            >
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => onToggleDone(task.id)}
                className="cursor-pointer flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                aria-label={`Mark "${task.title}" as not done`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.button>
              <p className="flex-1 text-base line-through text-muted-foreground">{task.title}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTask(task.id);
                }}
                className="cursor-pointer opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all"
                aria-label={`Delete "${task.title}"`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {pendingTasks.length === 0 && doneTasks.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-muted-foreground/40 py-6"
        >
          No tasks yet. Add one or import from Notion.
        </motion.p>
      )}

      {/* Add task form */}
      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5 }}
            onSubmit={handleSubmit}
            className="mt-3 rounded-xl border border-border/30 bg-card/50 p-4 space-y-3 backdrop-blur-sm"
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What are you working on?"
              className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/30"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground/50 uppercase tracking-wider">Pomos</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setNewPomos(Math.max(1, newPomos - 1))}
                    className="cursor-pointer h-7 w-7 rounded-lg border border-border/30 text-sm flex items-center justify-center hover:bg-secondary/50 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm tabular-nums">{newPomos}</span>
                  <button
                    type="button"
                    onClick={() => setNewPomos(newPomos + 1)}
                    className="cursor-pointer h-7 w-7 rounded-lg border border-border/30 text-sm flex items-center justify-center hover:bg-secondary/50 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="cursor-pointer text-sm text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="cursor-pointer rounded-lg bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  Add
                </motion.button>
              </div>
            </div>
          </motion.form>
        ) : (
          <motion.button
            key="add-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            className="cursor-pointer mt-3 w-full rounded-xl border-2 border-dashed border-border/30 p-3.5 text-base text-muted-foreground/50 transition-all hover:border-primary/20 hover:text-foreground hover:bg-card/30"
          >
            + Add Task
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
