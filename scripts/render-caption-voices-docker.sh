#!/usr/bin/env bash
set -euo pipefail
QWEN="/qwen"
OUT="/out"
REF_WAV="$QWEN/voice_actors/english/7_juilliard.wav"
REF_TXT="$QWEN/voice_actors/english/7_juilliard.txt"

render() {
  local id="$1"
  local text="$2"
  local seed="$3"
  echo "[render] $id (seed $seed)"
  LD_LIBRARY_PATH="$QWEN/build:${LD_LIBRARY_PATH:-}" \
    "$QWEN/build/qwen-tts" \
    --model "$QWEN/models/qwen-talker-0.6b-base-Q4_K_M.gguf" \
    --codec "$QWEN/models/qwen-tokenizer-12hz-Q4_K_M.gguf" \
    --lang english \
    --ref-wav "$REF_WAV" \
    --ref-text "$REF_TXT" \
    --seed "$seed" \
    -o "$OUT/${id}.wav" <<< "$text"
}

render "map-pelita-rain" "Pelita is checking the cached rainfall reading already available on Mei Ling's map." 301
render "map-bekal-aed" "While Bekal checks, the map exposes the nearest bundled A E D around the S O S." 302
echo "[render] done"
