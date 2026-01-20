#!/usr/bin/env bash

LOCAL_DIR="/Users/data/electron/electron-mcp/"
REMOTE_DIR="/Volumes/ai2/electron-mcp/"
DELAY=1

sync() {
  rsync -azv \
    --delete \
    --partial \
    --inplace \
    --exclude 'assets' \
    --exclude '.ipynb_checkpoints' \
    --exclude 'package-lock.json' \
    --exclude 'node_modules' \
    --exclude '.git/' \
    --exclude '.idea/' \
    --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r \
    "$LOCAL_DIR" "$REMOTE_DIR"
}
sync
fswatch -o "$LOCAL_DIR" | while read _; do
  sleep "$DELAY"
  sync
done