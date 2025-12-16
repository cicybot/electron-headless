#!/usr/bin/env bash


# mac os
# brew install fswatch rsync
#chmod +x rsync-watch.sh
#./rsync-watch.sh

LOCAL_DIR="/Users/data/electron/electron-headless/"
REMOTE="vm"
REMOTE_DIR="~/electron-headless/"
DELAY=1

sync() {
  rsync -azv \
    --delete \
    --partial \
    --inplace \
    --exclude 'node_modules/' \
    --exclude '.git/' \
    --exclude '.idea/' \
    --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r \
    "$LOCAL_DIR" "$REMOTE:$REMOTE_DIR"
}

fswatch -o "$LOCAL_DIR" | while read _; do
  sleep "$DELAY"
  sync
done