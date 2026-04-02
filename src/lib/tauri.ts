export function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
}
