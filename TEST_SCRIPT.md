# Quick Aid SG — 3-Tester Demo Script

**Setup:** Open `https://quickaid-sg.vercel.app` in one browser window.
**Duration:** 8–12 minutes.
**Roles:** Tester A (Citizen/Resident), Tester B (CFR/Responder), Tester C (Ops).

Since the MVP uses an in-memory shared store (no backend yet), all three
roles are tested in **the same browser tab** via the role switcher in
the top-left. The app state persists across role switches, so actions by
"Citizen" are immediately visible when you switch to "Responder" or "Ops".

---

## Scene 0 — Setup (30s)

1. Refresh the page. The app loads with the Singapore basemap.
2. Top-left: confirm the role switcher says `01 · Citizen`.
3. Point out:
   - Real OneMap SG basemap (not a mock)
   - Top-right `NEA live` chip (data pulled from data.gov.sg every 60s)
   - Map pins at Bedok, AYE, Tampines (these are the minimal seed data)

---

## Scene 1 — Citizen Reports an Incident (1 min)

**Role:** Citizen (`01 · Citizen` selected in dropdown)

1. **Bottom dock** → tap `Report`.
2. **Compose drawer opens.** Select:
   - Category: `Fire`
   - Location: tap map at Toa Payoh (or use auto-detected)
   - (Optional) type: "Smoke from upper floor"
   - Tap `Send`
3. **Observe:** Drawer closes. A yellow ring marker appears on the map
   at the report location.
4. **Top Chrome** → `Brief` count increments by 1.

---

## Scene 2 — Responder Sees the Report (1 min)

**Role:** Responder (`02 · Responder` selected in dropdown)

1. **Left rail** shows:
   - `Bulletin (5)` — island-wide active items
   - `Assignments (1)` — your current SOS assignment
   - `Verify (3)` — pending reports (was 2 seed + 1 you just filed)
2. **Tap `Verify`** in the left rail.
3. **Verify queue drawer opens.** The top item is the citizen's report
   you just filed: "Smoke from upper floor · Toa Payoh".
   - Trust score shown: `60%`
   - `Claim` and `Verify` buttons visible
4. **Tap `Claim`** (or `Verify` if single-button).
   - Row updates to "claimed by you"
5. **Switch to Citizen** briefly — confirm the report still shows as
   pending (citizen sees no change until verified).

---

## Scene 3 — Ops Sees the Report Queue (1 min)

**Role:** Ops (`03 · Ops` selected in dropdown)

1. **Left rail** shows:
   - `Reports (3)` — pending + claimed
   - `Distress (1)` — active SOS
   - `Cases (1)` — active case
2. **Tap `Reports`**.
3. **Report queue drawer opens.** See the same 3 reports.
   - The citizen's report shows `claimed` by the responder.
   - `Verify` and `Dismiss` buttons available to ops too.
4. **Tap `Verify`** on the citizen's report.
5. **Switch to Citizen** — open `Brief`. The report now shows as a
   **verified event** (not just a report). Yellow ring → solid pin.
6. **Switch to Responder** — the report is gone from Verify queue
   (status changed to `verified`).

---

## Scene 4 — Citizen SOS Distress (1 min)

**Role:** Citizen

1. **Bottom dock** → tap `Need help` (red button).
2. **SOS compose drawer:**
   - Select category: `Medical`
   - Location auto-detected (or tap map)
   - Tap `Send SOS`
3. **Tracking pill appears** at bottom centre:
   - `SOS LIVE · Searching · ETA: searching`
   - Progress bar at 10%
4. **Switch to Ops** — the new SOS appears in `Distress (2)`.
5. **Switch to Responder** — a red SOS pin appears on the map.

---

## Scene 5 — Ops Dispatches Responder (1 min)

**Role:** Ops

1. **Left rail** → tap `Distress`.
2. **Distress oversight drawer:** See the new SOS with status `requesting`.
3. **Tap the SOS row** (or use `Dispatch` workspace).
4. **Dispatch drawer opens.** Available responders listed:
   - Echo-1 (ready, nearest)
   - Delta-1 (ready)
5. **Tap `Assign`** next to Echo-1.
6. **Switch to Responder** — tracking pill updates:
   - `SOS LIVE · Responder en route · ETA: 4:00`
   - Progress bar at 35%
7. **Switch to Citizen** — same tracking pill update visible.
8. **Watch the map** — Echo-1's pin starts moving toward the SOS
   location (real coordinate interpolation, 600ms tick).

---

## Scene 6 — Responder Arrives + Case Room (2 min)

**Role:** Responder

1. Wait for Echo-1 pin to reach the SOS location (or tap `Arrived` in
   the Assignment workspace if impatient).
2. **Left rail** → `Assignments`. Tap `Arrived`.
3. **Tracking pill updates:** `Responder arrived · now · 85%`
4. **Switch to Citizen** — tracking pill shows `Responder arrived`.
5. **Switch to Responder** — if this SOS was part of a case, the case
   room appears in the left rail under `Rooms`.
   - Tap `#ALPHA-09` (or whichever case)
6. **Case lobby opens.** See:
   - Severity chip, case state (`active`)
   - Roster: Bravo-9 (captain), Charlie-3, Host AI
   - Chat timeline with previous messages
7. **Type in chat:** `We need AED nearby`
8. **Type slash command:** `/host nearest aed`
9. **Host AI replies** with grounded info + source chips.

---

## Scene 7 — Ops Declares an Incident (2 min)

**Role:** Ops

1. **Bottom dock** → tap `Declare`.
2. **Declare incident workspace** (4-step wizard):
   - Step 1: enter title "Flooding at Punggol", set severity to L3
   - Step 2: switch to map, use drawing toolbox (right of map) →
     select `Polygon` → click 4+ points on map → `Finish`
     - Coverage preview appears: "4 cells, ~2,700 devices, ~8,400 residents"
   - Step 3: sources auto-attached (reports + sensor signals)
   - Step 4: **Role-preview gate** — click through Citizen tab,
     Responder tab, Ops tab. Publish button unlocks.
   - Tap `Publish`
3. **Switch to Citizen** — new event pin appears on map. Tap it →
   see citizen-safe wording.
4. **Switch to Responder** — same event, but with severity code (L3)
   and source count.

---

## Scene 8 — Responder Groups (1 min)

**Role:** Responder

1. **Left rail** → tap `Groups`.
2. **Groups & Cases drawer:**
   - Cases section: `#ALPHA-09` — tap `Leave` (you're not actually in it
     as Echo-1 unless you joined earlier)
   - Organisations: `SCDF · East District`, `Medic Volunteers`, etc.
3. **Tap `Join`** on `Medic Volunteers`.
4. **Row updates:** button flips to `Leave`.
5. **Switch to Ops** → `Roster` workspace. Echo-1 now shows
   `Medic Volunteers` in their groups list.

---

## Scene 9 — Wrap / Source Health (30s)

**Role:** Any

1. **Top Chrome** → tap the `Source Health` chip (`Activity` icon).
2. **Source health drawer:** See all adapters with status:
   - `NEA PSI` — fresh (35s ago)
   - `NEA rainfall` — fresh (22s ago)
   - `SCDF dispatch` — fresh
   - `OneMap traffic` — stale (9 min ago)
3. Point out: this is where ops monitors which data feeds are alive.

---

## Troubleshooting during demo

| Problem | Fix |
|---|---|
| "Map is grey, no tiles" | Network blocking OneMap. Use `curl -I https://www.onemap.gov.sg/maps/tiles/Grey/12/3274/2042.png` to test. |
| "NEA chip says fetching forever" | Network blocking data.gov.sg. The seed data still works for demo. |
| "I don't see the SOS I just sent" | Check you're on the right role. Citizen sees their own SOS as a tracking pill. Responder/Ops see it as a map pin + queue item. |
| "Responder never arrives" | The ticker runs in real time (600ms steps). For demo speed, manually tap `Arrived` in the Assignment workspace. |
| "I want to reset" | Refresh the page. All in-memory state resets to seed. |

---

## Post-Demo Checklist

- [ ] Citizen reported an incident
- [ ] Responder claimed/verified the report
- [ ] Ops verified the report → became a verified event
- [ ] Citizen sent an SOS
- [ ] Ops dispatched a responder
- [ ] Responder arrived (live tracking visible)
- [ ] Case room chat used (including Host AI)
- [ ] Ops declared an incident with drawing + role-preview gate
- [ ] Responder joined a group
- [ ] Source health inspected
