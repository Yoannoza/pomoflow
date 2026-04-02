"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimerRing } from "@/components/timer/timer-ring";
import { TimerControls } from "@/components/timer/timer-controls";
import { TaskList } from "@/components/tasks/task-list";
import { AmbientPlayer } from "@/components/ambient/ambient-player";
import { Heatmap } from "@/components/stats/heatmap";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SettingsModal } from "@/components/layout/settings-modal";
import { DottedSurface } from "@/components/ui/dotted-surface";
import { FocusView } from "@/components/focus/focus-view";
import { useTimer } from "@/hooks/useTimer";
import { useTasks } from "@/hooks/useTasks";
import { useNotionTasks } from "@/hooks/useNotionTasks";
import { useConfetti } from "@/hooks/useConfetti";
import { useSync } from "@/hooks/useSync";
import { useAuth } from "@/hooks/useAuth";
import { MODE_LABELS } from "@/lib/types";

function LoginScreen({ onLogin, error }: { onLogin: (pw: string) => Promise<boolean>; error: string | null }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onLogin(password);
    setLoading(false);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm p-8"
      >
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-primary/8 flex items-center justify-center border border-border/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading), serif" }}>
            PomoFlow
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full rounded-xl border border-border/50 bg-secondary/30 px-4 py-3 text-sm outline-none focus:border-primary/50 transition-colors backdrop-blur-sm"
          />
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "..." : "Enter"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

type Tab = "timer" | "stats";

export default function Home() {
  const auth = useAuth();
  const timer = useTimer();
  const taskManager = useTasks();
  const notion = useNotionTasks();
  const { fireConfetti } = useConfetti();
  const [tab, setTab] = useState<Tab>("timer");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [, setStatsKey] = useState(0); // force re-render of stats
  const prevCountRef = useRef(0);

  // Supabase realtime sync — use refs to avoid re-subscribing on every render
  const taskManagerRef = useRef(taskManager);
  const timerRef = useRef(timer);
  useEffect(() => { taskManagerRef.current = taskManager; }, [taskManager]);
  useEffect(() => { timerRef.current = timer; }, [timer]);

  const handleSyncTasks = useCallback((tasks: import("@/lib/types").Task[]) => {
    taskManagerRef.current.setTasks(tasks);
  }, []);

  const handleSyncSessions = useCallback(() => {
    setStatsKey((k) => k + 1);
  }, []);

  const handleSyncSettings = useCallback((settings: import("@/lib/types").TimerSettings) => {
    timerRef.current.updateSettings(settings);
  }, []);

  useSync({
    onTasksUpdate: handleSyncTasks,
    onSessionsUpdate: handleSyncSessions,
    onSettingsUpdate: handleSyncSettings,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-enter focus mode when timer starts (only on fresh start, not re-entry)
  const userExitedRef = useRef(false);
  useEffect(() => {
    if (timer.isRunning && !focusMode && !userExitedRef.current) {
      setFocusMode(true);
    }
    // Reset the flag when the timer stops
    if (!timer.isRunning) {
      userExitedRef.current = false;
    }
  }, [timer.isRunning, focusMode]);

  // Exit focus mode on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Escape" && focusMode) {
        setFocusMode(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusMode]);

  // Update document title with timer
  useEffect(() => {
    if (!mounted) return;
    const mins = Math.floor(timer.secondsLeft / 60);
    const secs = timer.secondsLeft % 60;
    const time = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    document.title = `${time} — ${MODE_LABELS[timer.mode]} | PomoFlow`;
  }, [timer.secondsLeft, timer.mode, mounted]);

  // On pomodoro complete: increment task + confetti
  useEffect(() => {
    if (timer.pomodoroCount > prevCountRef.current) {
      if (taskManager.activeTaskId) {
        taskManager.incrementPomodoro(taskManager.activeTaskId);
      }
      fireConfetti();
    }
    prevCountRef.current = timer.pomodoroCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.pomodoroCount]);

  const handleImportNotionTask = (nt: { id: string; title: string }) => {
    taskManager.addTask(nt.title, 1, nt.id);
  };

  const handleExitFocus = useCallback(() => {
    userExitedRef.current = true;
    setFocusMode(false);
  }, []);

  if (!mounted || auth.isAuthenticated === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <motion.div
          className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <LoginScreen onLogin={auth.login} error={auth.error} />;
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Three.js dotted surface background */}
      <DottedSurface />

      {/* Radial glow overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-[5] bg-[radial-gradient(ellipse_at_center,var(--pomo-focus-glow),transparent_60%)] blur-[30px]"
      />

      {/* Header */}
      <motion.header
        className="relative z-10 flex items-center justify-between px-6 py-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center border border-border/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: "var(--font-heading), serif" }}>
            PomoFlow
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div className="flex rounded-xl bg-secondary/30 p-0.5 backdrop-blur-md border border-border/20">
            {(["timer", "stats"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="relative cursor-pointer rounded-lg px-5 py-2 text-sm font-medium transition-colors"
              >
                {tab === t && (
                  <motion.div
                    layoutId="headerTab"
                    className="absolute inset-0 rounded-lg bg-background shadow-sm border border-border/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 capitalize text-base ${tab === t ? "text-foreground" : "text-muted-foreground"}`}>
                  {t}
                </span>
              </button>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSettingsOpen(true)}
            className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl border border-border/20 text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-secondary/30 backdrop-blur-sm"
            aria-label="Open settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </motion.button>
          <ThemeToggle />
        </div>
      </motion.header>

      {/* Main content */}
      <main className="relative z-10 flex flex-1 flex-col items-center px-4 pb-8">
        <AnimatePresence mode="wait">
          {tab === "timer" ? (
            <motion.div
              key="timer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-1 w-full max-w-6xl pt-4 sm:pt-8 gap-8"
            >
              {/* Left sidebar: Tasks */}
              <div className="hidden lg:flex flex-col gap-6 w-80 shrink-0">
                <TaskList
                  tasks={taskManager.tasks}
                  activeTaskId={taskManager.activeTaskId}
                  onSelectTask={taskManager.setActiveTaskId}
                  onAddTask={taskManager.addTask}
                  onToggleDone={taskManager.toggleDone}
                  onRemoveTask={taskManager.removeTask}
                  onClearDone={taskManager.clearDone}
                  notionTasks={notion.notionTasks}
                  isNotionConnected={notion.isConnected}
                  isNotionLoading={notion.isLoading}
                  onFetchNotion={notion.fetchTasks}
                  onImportNotionTask={handleImportNotionTask}
                />
              </div>

              {/* Center: Timer */}
              <div className="flex flex-1 flex-col items-center gap-8">
                {/* Active task indicator */}
                <AnimatePresence>
                  {taskManager.activeTask && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="flex items-center gap-2 rounded-full bg-secondary/30 px-5 py-2 backdrop-blur-md border border-border/20"
                    >
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-base text-muted-foreground truncate max-w-52">
                        {taskManager.activeTask.title}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pomodoro counter */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: timer.settings.longBreakInterval }).map((_, i) => (
                    <motion.span
                      key={i}
                      animate={{
                        scale: i < (timer.pomodoroCount % timer.settings.longBreakInterval) ? 1.2 : 1,
                        backgroundColor: i < (timer.pomodoroCount % timer.settings.longBreakInterval)
                          ? "var(--primary)"
                          : "var(--border)",
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="h-2.5 w-2.5 rounded-full"
                    />
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground/40 tabular-nums tracking-wider">
                    #{timer.pomodoroCount}
                  </span>
                </div>

                {/* Timer */}
                <TimerRing
                  progress={timer.progress}
                  mode={timer.mode}
                  secondsLeft={timer.secondsLeft}
                  isRunning={timer.isRunning}
                />

                {/* Controls */}
                <TimerControls
                  mode={timer.mode}
                  isRunning={timer.isRunning}
                  onStart={timer.start}
                  onPause={timer.pause}
                  onReset={timer.reset}
                  onSwitchMode={timer.switchMode}
                />

                {/* Mobile only: Tasks + Ambient stacked below */}
                <div className="lg:hidden w-full max-w-md flex flex-col gap-6">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
                  <TaskList
                    tasks={taskManager.tasks}
                    activeTaskId={taskManager.activeTaskId}
                    onSelectTask={taskManager.setActiveTaskId}
                    onAddTask={taskManager.addTask}
                    onToggleDone={taskManager.toggleDone}
                    onRemoveTask={taskManager.removeTask}
                    onClearDone={taskManager.clearDone}
                    notionTasks={notion.notionTasks}
                    isNotionConnected={notion.isConnected}
                    isNotionLoading={notion.isLoading}
                    onFetchNotion={notion.fetchTasks}
                    onImportNotionTask={handleImportNotionTask}
                  />
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
                  <AmbientPlayer />
                </div>
              </div>

              {/* Right sidebar: Ambient */}
              <div className="hidden lg:flex flex-col gap-6 w-72 shrink-0">
                <AmbientPlayer />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl pt-4 sm:pt-8"
            >
              <Heatmap />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center">
        <span className="text-xs text-muted-foreground/20 tracking-widest uppercase" style={{ fontFamily: "var(--font-heading), serif" }}>
          PomoFlow
        </span>
      </footer>

      {/* Focus View Overlay */}
      <AnimatePresence>
        {focusMode && (
          <FocusView
            secondsLeft={timer.secondsLeft}
            progress={timer.progress}
            mode={timer.mode}
            isRunning={timer.isRunning}
            activeTask={taskManager.activeTask}
            pomodoroCount={timer.pomodoroCount}
            longBreakInterval={timer.settings.longBreakInterval}
            onPause={timer.pause}
            onStart={timer.start}
            onReset={timer.reset}
            onExit={handleExitFocus}
          />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <SettingsModal
        settings={timer.settings}
        onUpdate={timer.updateSettings}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
