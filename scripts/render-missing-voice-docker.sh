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

render "responder-aidcard" "There â€” Mei Ling's aid card: asthma, inhaler, no drug allergies. That only appeared because I joined the private case room." 296
render "responder-host" "Every case room has Host â€” slash commands, not another chat bot. I type slash host status; the whole room gets the same structured readout from live case data." 294
echo "[render] done"
