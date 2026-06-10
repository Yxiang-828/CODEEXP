#!/usr/bin/env bash
set -euo pipefail
QWEN="/qwen"
OUT="/out"
REF_WAV="$QWEN/voice_actors/english/2_amateur.wav"
REF_TXT="$QWEN/voice_actors/english/2_amateur.txt"

render() {
  local id="$1"
  local text="$2"
  local seed="$3"
  local tmp="/tmp/${id}.txt"
  printf '%s\n' "$text" > "$tmp"
  echo "[render] $id (seed $seed)"
  LD_LIBRARY_PATH="$QWEN/build:${LD_LIBRARY_PATH:-}" \
    "$QWEN/build/qwen-tts" \
    --model "$QWEN/models/qwen-talker-0.6b-base-Q4_K_M.gguf" \
    --codec "$QWEN/models/qwen-tokenizer-12hz-Q4_K_M.gguf" \
    --lang english \
    --ref-wav "$REF_WAV" \
    --ref-text "$REF_TXT" \
    --seed "$seed" \
    -o "$OUT/${id}.wav" < "$tmp"
  rm -f "$tmp"
}

render "responder-host" \
  "Every case room has a Host — slash commands, not another chat bot. I type slash host status so everyone in the room gets the same structured readout." \
  294

render "responder-host-result" \
  "There. Same answer for the whole room — severity, roster, who is en route. Host reads live case data; Bekal and Pelita stay the A I agents." \
  295

echo "[render] done"
