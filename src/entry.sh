#!/bin/sh
set -e

export ELECTRON_ENABLE_LOGGING=1
export ELECTRON_ENABLE_STACK_DUMPING=1

exec xvfb-run --auto-servernum \
  --server-args="-screen 0 1920x1080x24" \
  electron \
  --no-sandbox \
  --disable-gpu \
  --enable-unsafe-swiftshader \
  --disable-features=UseDBus \
  --log-level=3 \
  "$@"
