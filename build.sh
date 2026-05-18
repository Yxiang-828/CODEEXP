#!/usr/bin/env bash
# Quick Aid SG — one-shot install + build.
# Usage: ./build.sh
# Produces a production-ready `dist/` folder.
set -e
cd "$(dirname "$0")"

NODE_VER="$(node -v 2>/dev/null || echo missing)"
echo ">> node: $NODE_VER"
if [ "$NODE_VER" = "missing" ]; then
  echo "!! node.js not found. Install Node 18+ first (https://nodejs.org)."
  exit 1
fi

echo ">> installing dependencies (npm ci if lockfile present, else npm install)..."
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

echo ">> building production bundle..."
npm run build

echo ""
echo ">> ✓ build complete."
echo ">> output: dist/"
echo ">> next:   ./run.sh           # preview locally"
echo ">>        ./run.sh share     # public cloudflared tunnel"
