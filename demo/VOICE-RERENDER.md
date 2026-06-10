# Stale demo voice WAVs — re-render needed

The narration for **10 scenes** in `demo/incident-281.json` was rewritten
(commit `added some stuff`), but the pre-rendered WAVs in `public/demo/voice/`
still speak the **old** text. Captions show the new text, so audio and
captions contradict each other until these are re-rendered.

Quick-showcase voices (`public/demo/voice/quick/`) are **fine** — the quick
narration was not changed. The other 38 live-demo WAVs are also fine.

## Requirements (the device doing the render)

- Qwen3-TTS toolchain at `~/.aiko-core/workspace/tmp/qwen-tts-basic/qwentts.cpp`
  (binary + models + reference voices), or set `AIKO_QWEN_ROOT` to its location
- ffmpeg
- Node 20+

## Re-render exactly the 10 stale files

`scripts/ai-demo-voice.mjs` supports `--scene=<id>`, so you don't need
`--force` on the whole pack:

```bash
cd CODEEXP

node scripts/ai-demo-voice.mjs --render --force --scene=god-agents
node scripts/ai-demo-voice.mjs --render --force --scene=resident-intro
node scripts/ai-demo-voice.mjs --render --force --scene=bekal-intro
node scripts/ai-demo-voice.mjs --render --force --scene=resident-relief
node scripts/ai-demo-voice.mjs --render --force --scene=ops-deploy-bot
node scripts/ai-demo-voice.mjs --render --force --scene=ops-broadcast
node scripts/ai-demo-voice.mjs --render --force --scene=resident-safe
node scripts/ai-demo-voice.mjs --render --force --scene=map-ops-camera
node scripts/ai-demo-voice.mjs --render --force --scene=pondok-result
node scripts/ai-demo-voice.mjs --render --force --scene=ops-broadcast-action
```

Then commit the updated `public/demo/voice/*.wav` (and the manifest if the
script rewrites it) and push.

## The 10 stale scenes and their NEW narration

| WAV file | Voice | Speaker | New narration the WAV must say |
|---|---|---|---|
| `public/demo/voice/god-agents.wav` | director | God Mode | Now I add disposable witness reports, rain pressure, and synthetic demo responders. They support the S O S presentation; they are not autonomous A I agents or the emergency trigger. |
| `public/demo/voice/resident-intro.wav` | resident | Citizen, Mei Ling | In this drill, rain has crowded people under the covered M R T exit while an e bike smokes near the choke point. I am asthmatic, so first I make sure my aid card is set. |
| `public/demo/voice/bekal-intro.wav` | director | AI Director | Bekal is the S O S companion A I. It does not dispatch anyone. It calls the A E D and hospital skills, then gives Mei Ling specific guidance while the response forms. |
| `public/demo/voice/resident-relief.wav` | resident | Citizen, Mei Ling | This is the moment that matters. My map does not merely say help is coming. I can see nearby responder approach markers, while the full supporting roster remains in the case room. |
| `public/demo/voice/ops-deploy-bot.wav` | ops | Ops, Nadia | Now my job is coordination. The medical S O S continues in its private case room, while I send a separate responder to investigate the blocked access road. |
| `public/demo/voice/ops-broadcast.wav` | ops | Ops, Nadia | The smoke report is verified and blocked access remains an active reported risk, so I warn people away from the station exit without exposing the private case room. |
| `public/demo/voice/resident-safe.wav` | resident | Citizen, Mei Ling | The alert tells everyone else what to avoid. In my case room I can see responder presence, and I am now clear of the smoke. So I tap I'm safe. |
| `public/demo/voice/map-ops-camera.wav` | director | AI Director | Nadia opens the nearest traffic camera to Exit B as potential access evidence, then judges whether its view is useful. |
| `public/demo/voice/pondok-result.wav` | director | AI Director | Pondok has compared the live roster with the case and highlighted skill-fit candidates for medical and A E D support. Nadia still decides every deployment. |
| `public/demo/voice/ops-broadcast-action.wav` | director | AI Director | Nadia sends the warning to citizens and responders, labels the area Exit B, marks it Emergency, and gives one clear public action: keep the walkway and access road clear. |

The script reads the narration straight from `demo/incident-281.json`, so the
table above is just for verification — no manual text entry needed.

## Verify afterwards

Play any one of the re-rendered WAVs and check it matches the new text, or run
the live demo in captions-only mode first
(`http://localhost:3000/?demo=director&autostart=1&silent=1`) and then with
sound.
