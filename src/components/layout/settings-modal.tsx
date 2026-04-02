"use client";

import { useState } from "react";
import { TimerSettings } from "@/lib/types";
import { saveSettings } from "@/lib/storage";
import { isTauri } from "@/lib/tauri";
import { getNotionCredentials, saveNotionCredentials } from "@/lib/notion-client";

interface SettingsModalProps {
  settings: TimerSettings;
  onUpdate: (settings: TimerSettings) => void;
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ settings, onUpdate, open, onClose }: SettingsModalProps) {
  const [local, setLocal] = useState<TimerSettings>(settings);
  const isDesktop = isTauri();
  const existingCreds = isDesktop ? getNotionCredentials() : null;
  const [notionApiKey, setNotionApiKey] = useState(existingCreds?.apiKey || "");
  const [notionDbId, setNotionDbId] = useState(existingCreds?.databaseId || "");

  if (!open) return null;

  const handleSave = () => {
    saveSettings(local);
    onUpdate(local);
    if (isDesktop && (notionApiKey || notionDbId)) {
      saveNotionCredentials({ apiKey: notionApiKey, databaseId: notionDbId });
    }
    onClose();
  };

  const set = (key: keyof TimerSettings, value: number | boolean) => {
    setLocal((s) => ({ ...s, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border/50 bg-background p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Settings</h3>
          <button
            onClick={onClose}
            className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Timer durations */}
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Time (minutes)</p>

          <div className="grid grid-cols-3 gap-3">
            {(["focus", "short", "long"] as const).map((key) => (
              <div key={key} className="space-y-1">
                <label className="text-xs text-muted-foreground capitalize">{key === "short" ? "Short Break" : key === "long" ? "Long Break" : key}</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={local[key]}
                  onChange={(e) => set(key, parseInt(e.target.value) || 1)}
                  className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm tabular-nums outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Long break interval</label>
            <input
              type="number"
              min={1}
              max={10}
              value={local.longBreakInterval}
              onChange={(e) => set("longBreakInterval", parseInt(e.target.value) || 4)}
              className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm tabular-nums outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="h-px bg-border/50 my-4" />

          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Auto Start</p>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Auto-start breaks</span>
            <div
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                local.autoStartBreaks ? "bg-primary" : "bg-secondary"
              }`}
              onClick={() => set("autoStartBreaks", !local.autoStartBreaks)}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  local.autoStartBreaks ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Auto-start pomodoros</span>
            <div
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                local.autoStartPomodoros ? "bg-primary" : "bg-secondary"
              }`}
              onClick={() => set("autoStartPomodoros", !local.autoStartPomodoros)}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  local.autoStartPomodoros ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
          </label>
        </div>

        {isDesktop && (
          <div className="space-y-4 mt-4">
            <div className="h-px bg-border/50" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notion Integration</p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">API Key</label>
                <input
                  type="password"
                  value={notionApiKey}
                  onChange={(e) => setNotionApiKey(e.target.value)}
                  placeholder="ntn_..."
                  className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Database ID</label>
                <input
                  type="text"
                  value={notionDbId}
                  onChange={(e) => setNotionDbId(e.target.value)}
                  placeholder="abc123..."
                  className="w-full rounded-lg border border-border/50 bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          className="cursor-pointer mt-6 w-full rounded-xl bg-foreground py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 active:scale-[0.99]"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
