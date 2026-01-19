#!/usr/bin/env bash


# mac os
# brew install fswatch rsync
#chmod +x rsync-watch.sh
#./rsync-watch.sh

LOCAL_DIR="/Users/data/electron/electron-mcp/"
REMOTE="vm"
REMOTE_DIR="~/electron-mcp/"
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
  ssh vm "
    docker rm -f  my-electron
    docker run -d --name my-electron --rm \
      --network=host -p 3000:3000 \
      -v /home/ton/electron-mcp/src:/data \
      my-electron
  "
done