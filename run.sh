#!/usr/bin/env bash
# Quick Aid SG — build + serve.
# Usage:
#   ./run.sh           build + preview on 5173 (production)
#   ./run.sh dev       dev server on 3000 (hot reload)
#   ./run.sh share     build + preview + public tunnel
set -e

cd "$(dirname "$0")"

MODE="${1:-preview}"

echo ">> killing anything on 3000/5173/4173..."
( lsof -ti:3000,5173,4173 2>/dev/null | xargs -r kill -9 ) || true
pkill -f "vite" 2>/dev/null || true
sleep 1

if [ ! -d node_modules ]; then
  echo ">> installing dependencies..."
  npm install --no-audit --no-fund
fi

case "$MODE" in
  dev)
    echo ">> starting dev server on http://0.0.0.0:3000"
    exec npm run dev -- --host 0.0.0.0
    ;;
  share)
    echo ">> building..."
    npm run build
    echo ">> starting preview on http://0.0.0.0:5173"
    npx vite preview --host 0.0.0.0 --port 5173 &
    PREVIEW_PID=$!
    sleep 2
    echo ""
    echo ">> opening public tunnel (cloudflared)..."
    echo ">> share the trycloudflare URL printed below."
    echo ""
    trap "kill $PREVIEW_PID 2>/dev/null" EXIT
    npx --yes cloudflared tunnel --url http://localhost:5173
    ;;
  preview|*)
    echo ">> building..."
    npm run build
    echo ""
    echo ">> starting preview server on http://0.0.0.0:5173"
    echo ">> LAN users: open the Network URL printed below."
    echo ""
    exec npx vite preview --host 0.0.0.0 --port 5173
    ;;
esac
