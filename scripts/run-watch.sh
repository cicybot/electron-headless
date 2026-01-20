#!/usr/bin/env bash

LOCAL_DIR="/Users/data/electron/electron-mcp/src"
DELAY=0.5
ELECTRON_CMD="electron $LOCAL_DIR"

PID=""

restart() {
  if [ -n "$PID" ]; then
    echo "⏹ stopping electron ($PID)"
    kill "$PID" 2>/dev/null || true
    wait "$PID" 2>/dev/null || true
  fi

  echo "▶ starting electron"
  $ELECTRON_CMD &
  PID=$!
}

# 首次启动
restart

fswatch -o "$LOCAL_DIR" | while read _; do
  sleep "$DELAY"
  restart
done
