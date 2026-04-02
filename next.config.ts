import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // When building for Tauri, export as static site
  // TAURI_ENV_PLATFORM is automatically set by Tauri during builds
  ...(process.env.TAURI_ENV_PLATFORM ? { output: "export" } : {}),
};

export default nextConfig;
