#!/bin/sh
set -e

echo "[run] args: $*"

xvfb-run --auto-servernum \
  --server-args="-screen 0 1920x1080x24" \
  -- \
  electron \
  --no-sandbox \
  --disable-gpu \
  --enable-unsafe-swiftshader \
  --disable-features=UseDBus \
  --log-level=3 \
  /data
