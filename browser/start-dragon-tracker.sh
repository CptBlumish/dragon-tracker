#!/usr/bin/env sh

set -eu

cd "$(dirname "$0")"

PORT="${DRAGON_TRACKER_PORT:-8765}"
URL="http://127.0.0.1:${PORT}/index.html"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is needed to run Dragon Tracker through a local browser server."
  echo "You can still open index.html directly for offline tracking, but clan sign-in will be unavailable."
  exit 1
fi

python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT INT TERM

sleep 1

if command -v open >/dev/null 2>&1; then
  open "$URL"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL"
else
  echo "Open $URL in your browser."
fi

echo "Dragon Tracker is running at $URL"
echo "Keep this window open while using the tracker. Press Ctrl+C to stop it."
wait "$SERVER_PID"
