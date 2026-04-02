#!/bin/bash
# Build script for Tauri - temporarily removes API routes since static export doesn't support them
# The desktop app uses direct API calls instead of Next.js API routes

set -e

# Move API routes out of the way
if [ -d "src/app/api" ]; then
  mv src/app/api src/app/_api_backup
fi

# Build Next.js as static export
TAURI_ENV_PLATFORM=darwin npm run build

# Restore API routes
if [ -d "src/app/_api_backup" ]; then
  mv src/app/_api_backup src/app/api
fi
