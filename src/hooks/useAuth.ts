"use client";

import { useState, useEffect, useCallback } from "react";
import { isTauri } from "@/lib/tauri";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Desktop app doesn't need auth
    if (isTauri()) {
      setIsAuthenticated(true);
      return;
    }
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => setIsAuthenticated(data.authenticated))
      .catch(() => setIsAuthenticated(true));
  }, []);

  const login = useCallback(async (password: string) => {
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        return true;
      }
      setError("Wrong password");
      return false;
    } catch {
      setError("Connection error");
      return false;
    }
  }, []);

  return { isAuthenticated, login, error };
}
