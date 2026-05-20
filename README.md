# Kampung Kaki — Section 2 (CODEEXP)

A live, role-aware map of Singapore for citizens, responders, and ops.
One map. Three views. Real OneMap basemap. Real NEA data. Shared truth
store so an action by one role appears for the others in the same tick.

See `../BLUEPRINT.md` in the parent folder for the full product blueprint
including every data source we plan to wire (Tier A → D).

---

## Prerequisites

- **Node.js 18+** — https://nodejs.org
- That's it. No accounts, no API keys, no Gemini setup required for this
  section. The NEA endpoints we hit are public and CORS-open.

---

## One-shot build (recommended first run)

Installs dependencies and produces a production bundle in `dist/`.

```bash
# Linux / macOS
./build.sh

# Windows
build.bat
```

If `./build.sh` is not executable: `chmod +x build.sh run.sh`.

---

## Run

After `build.sh`, three modes:

```bash
./run.sh           # build (if needed) + preview on http://localhost:5173
./run.sh dev       # vite dev server on http://localhost:3000 (hot reload)
./run.sh share     # build + preview + public cloudflared tunnel
```

Windows: `run.bat`, `run.bat dev`, `run.bat share`.

All commands kill anything already listening on `3000` / `4173` / `5173`
before starting. The preview server binds to `0.0.0.0`, so anyone on
your LAN can hit `http://<your-LAN-IP>:5173`.

### Share publicly (no signup)

```bash
./run.sh share
```

Runs the preview, then opens a Cloudflare tunnel. After ~10 s a
`https://*.trycloudflare.com` URL is printed in the terminal — send it
to anyone, on any network, anywhere.

---

## What you'll see when it opens

- A real Singapore basemap (OneMap grey tiles via MapLibre GL)
- Top-left chip: `MAP · SG · CITIZEN` (changes with the role selector)
- Map pins: events at Bedok / AYE / Tampines + live NEA PSI and
  rainfall overlays refreshed every 60 s
- Top-right of map (ops only): an 11-tool drawing toolbox
- Bottom-centre: a tracking pill appears when there's a live SOS or
  assignment

Switch role from the top-left dropdown (`Citizen / Responder / Ops`).
Each role gets a different left rail, dock, and workspace set. The
shared store means a citizen `Report` immediately appears in the ops
`Reports` queue and the responder `Verify` queue.

---

## Project layout

```
src/
  AppContext.tsx              shared truth store + actions
  services/live.ts            real-time fetchers (NEA PSI, rainfall, 2h forecast)
  components/
    Shell.tsx                 top-level layout
    map/MapCanvas.tsx         MapLibre + OneMap basemap + overlays + drawing
    layout/
      TopChrome.tsx
      LeftRail.tsx            role-aware nav, includes responder groups + rooms
      WorkspaceDrawer.tsx     right-side workspace panel
      GlobalActionDock.tsx    role-aware bottom action dock
      BottomStrip.tsx
      workspaces/
        CitizenWorkspaces.tsx
        ResponderWorkspaces.tsx
        OpsWorkspaces.tsx
        WorkspaceContent.tsx  registry
    primitives/
      SeverityChip.tsx        L1..L5 chips
      StatusPipeline.tsx      Grab-style steppers
      TrackingPill.tsx        bottom-centre live process indicator
      CoveragePreview.tsx     "X cells, Y devices, Z residents" while drawing
      RolePreviewTabs.tsx     publish gate: citizen / responder / ops tabs
      SlashComposer.tsx       case room chat input with slash commands
```

---

## Troubleshooting

**"port already in use"** — `./run.sh` kills 3000/4173/5173 before starting.
If something exotic is on those ports, run `lsof -ti:5173 | xargs kill -9`.

**Map shows a grey rectangle but no tiles** — your network is blocking
`www.onemap.gov.sg`. Confirm with:
`curl -I https://www.onemap.gov.sg/maps/tiles/Grey/12/3274/2042.png`.
Should return `HTTP/2 200`.

**NEA chip in top chrome says "fetching…" forever** — your network or
ad-blocker is blocking `api.data.gov.sg`. Confirm with:
`curl -sI https://api.data.gov.sg/v1/environment/psi`.

**Anyone on the internet** — use `./run.sh share`. Don't use the LAN IP
for non-LAN users.

---

## Where the original AI Studio template went

The template's `GEMINI_API_KEY` and AI Studio metadata are not used in
Section 2. The Host AI in the case lobby is a deterministic stub today
(see `AppContext.askHost`). The Gemini wiring is planned for Section 5
when the backend ships and we run Host inference server-side.

---

## License

Internal R&D. Not for production deployment until partner agreements
land (Section 8). See `../BLUEPRINT.md` § 13 for the non-negotiables.
