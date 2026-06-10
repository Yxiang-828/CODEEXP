#!/usr/bin/env bash
set -euo pipefail
TMP="/tmp/qwen-deps"
rm -rf "$TMP"
mkdir -p "$TMP"
cd "$TMP"
apt-get download libgomp1 libvulkan1
for deb in *.deb; do
  dpkg-deb -x "$deb" .
done
QWEN="/mnt/c/Users/xiang/Downloads/qwen3-tts-bundle/qwen-tts-basic"
export LD_LIBRARY_PATH="$TMP/usr/lib/x86_64-linux-gnu:$QWEN/build:${LD_LIBRARY_PATH:-}"
exec bash "/mnt/c/Users/xiang/OneDrive/Documents/Kampung/CODEEXP-setup/scripts/render-host-voice.sh"
