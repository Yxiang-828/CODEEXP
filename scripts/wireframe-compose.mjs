// Compose the submission wireframe.
//
// Outputs:
//   docs/index.html      — GitHub Pages root (interactive flow + descriptions)
//   docs/wireframe.png   — single-image fallback render
//   docs/.nojekyll       — disables Jekyll on GitHub Pages
//
// Inputs:
//   docs/wireframe/*.png — captured by scripts/wireframe.mjs
//
// Each role lane lays its screens out on a CSS Grid; an SVG overlay draws
// curved flow arrows between screen pairs declared in EDGES at load time.

import { chromium } from 'playwright';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const SHOTS_DIR = join(ROOT, 'docs', 'wireframe');
const DOCS_DIR = join(ROOT, 'docs');
const HTML_OUT = join(DOCS_DIR, 'index.html');
const PNG_OUT = join(DOCS_DIR, 'wireframe.png');
const NOJEKYLL = join(DOCS_DIR, '.nojekyll');

// id → { match, title, desc, comments[], col, row }
// match = suffix of screenshot file after the NN- prefix
// col/row in the lane's CSS grid (1-indexed)
const SCREENS = {
  // ── Auth ─────────────────────────────────────────────────────────
  'auth-login': {
    lane: 'auth',
    match: 'login',
    title: 'Demo login',
    desc: 'Three demo role buttons. Email/password fields are present but the real sign-in flow is stubbed for the prototype.',
    comments: [
      'Calls AppContext.demoLogin(role) — no backend auth in this section.',
      'Login screen never sees the map; chrome and dock load only after auth.',
    ],
    col: 1, row: 1,
  },

  // ── Citizen ──────────────────────────────────────────────────────
  'cz-home': {
    lane: 'citizen',
    match: 'citizen-home',
    title: 'Citizen home',
    desc: 'OneMap SG basemap. Bottom dock exposes the citizen actions: Need help, Report, AI, Brief, Alerts.',
    comments: [
      'Only verified events + NEA live overlays show on this map (no responder pins).',
      'GPS toggle is opt-in; pinned location is shown as a labelled point if granted.',
    ],
    col: 1, row: 1,
  },
  'cz-brief': {
    lane: 'citizen',
    match: 'citizen-briefing',
    title: 'Briefing',
    desc: 'Aggregates verified incidents + role-relevant notifications. Number badge is the briefingInView selector.',
    comments: [
      'Driven by selectors.selectBriefingCounts(role) — same source for the top-chrome counter.',
    ],
    col: 2, row: 1,
  },
  'cz-alerts': {
    lane: 'citizen',
    match: 'citizen-alerts',
    title: 'Nearby alerts',
    desc: 'Verified events sorted by proximity to the live GPS, plus volunteer events within 5 km.',
    comments: [
      'Uses selectNearby<CanonicalEvent>(events, selfLocation, 5).',
      'Falls back to Singapore centroid only when GPS is off — explicitly labelled.',
    ],
    col: 3, row: 1,
  },
  'cz-report': {
    lane: 'citizen',
    match: 'citizen-report-compose',
    title: 'File report',
    desc: '4-step wizard: category → location → describe → review. Submits to ops queue, not directly to responders.',
    comments: [
      'Pin uses selfLocation; report body annotated "[approximate]" when GPS off.',
      'Voice mode parses keywords (fire / flood / medical / crash) into a kind.',
    ],
    col: 1, row: 2,
  },
  'cz-sos': {
    lane: 'citizen',
    match: 'citizen-sos-draft',
    title: 'SOS · pick category',
    desc: 'Six categories. Single tap → broadcasts to ops + suitable responders simultaneously.',
    comments: [
      'GPS banner is yellow + "Singapore centroid" copy when no live location.',
      'startSos(citizenName, category, location) — citizenName pulled from the AppUser table, not hardcoded.',
    ],
    col: 2, row: 2,
  },
  'cz-sos-live': {
    lane: 'citizen',
    match: 'citizen-sos-draft', // shares the SOS surface; the live flow is shown in tracking pill
    title: 'SOS live tracking',
    desc: 'Tracking pill + drawer show responder status, ETA, and two-acknowledgement closure rule.',
    comments: [
      'ETA derived from getDistanceKm(responder, sos) and a 35 km/h surface mix.',
      'Closure requires citizen + responder safe-acks before ops can audit-close.',
    ],
    col: 3, row: 2,
  },
  'cz-ai': {
    lane: 'citizen',
    match: 'citizen-citizen-ai',
    title: 'AI Kaki',
    desc: 'On-demand safety advisor for citizens at rest. Loads only when Ask is pressed.',
    comments: [
      'Workspace: citizen_assistant. Server prefetches PSI + nearest AED.',
      'Says "unavailable" rather than invent live values — no PSI/AED hallucinations.',
    ],
    col: 4, row: 1,
  },

  // ── Responder ────────────────────────────────────────────────────
  'rp-home': {
    lane: 'responder',
    match: 'responder-home',
    title: 'Responder home',
    desc: 'Left rail (status, mission board, assignments, signal checks, groups, events, logs). Live duty pill in top chrome.',
    comments: [
      'Responder map sees: verified events, SOS, all responders (with org tone), and own position.',
    ],
    col: 1, row: 1,
  },
  'rp-mboard': {
    lane: 'responder',
    match: 'responder-mission-board',
    title: 'Mission board',
    desc: 'Three collapsible panels: Current mission · Assignments · Joinable. Driven by the operations cluster.',
    comments: [
      'selectCurrentMission() resolves SOS-assigned-to-self first, then any case the responder has joined.',
    ],
    col: 2, row: 1,
  },
  'rp-join': {
    lane: 'responder',
    match: 'responder-joinable-missions',
    title: 'Joinable missions',
    desc: 'Open SOS + ops-formed case rooms within 8 km. Each row carries a fit % and reason.',
    comments: [
      'fitForSos / fitForCase — capability × distance × ready-status × severity.',
      'Restricted official cases get "monitor only" not "join".',
    ],
    col: 3, row: 1,
  },
  'rp-copilot': {
    lane: 'responder',
    match: 'responder-mission-copilot',
    title: 'Mission copilot',
    desc: 'Ranks joinable SOS + case rooms by fit × distance from the responder\'s live position.',
    comments: [
      'Workspace: responder_mission. Volunteer unitType de-prioritises suppression-heavy fires.',
      'No host call until Ask pressed — quota-safe.',
    ],
    col: 4, row: 1,
  },
  'rp-groups': {
    lane: 'responder',
    match: 'responder-groups',
    title: 'Groups & cases',
    desc: 'Org/capability cadres + live case rooms. Join/leave is a single CSOT mutation.',
    comments: [
      'Cases section is the same data as the left rail "Rooms" list.',
    ],
    col: 1, row: 2,
  },
  'rp-events': {
    lane: 'responder',
    match: 'responder-volunteer-events',
    title: 'Volunteer events',
    desc: 'Non-emergency community work nearby. Register / unregister persists to the network cluster.',
    comments: [
      'Sorted by distance from the responder\'s last-known location.',
    ],
    col: 2, row: 2,
  },
  'rp-log': {
    lane: 'responder',
    match: 'responder-activity-log',
    title: 'Activity log',
    desc: 'Append-only audit feed for all actions visible to the role.',
    comments: [
      'Same backing store as ops/citizen logs; visibility filtered by ActionLog.visibleTo.',
    ],
    col: 3, row: 2,
  },

  // ── Ops ──────────────────────────────────────────────────────────
  'ops-home': {
    lane: 'ops',
    match: 'ops-home',
    title: 'Ops home',
    desc: 'Ops left rail: reports, dispatch, status, roster, new event, missions, logs. Drawing toolbox on the map.',
    comments: [
      'Only ops sees the polygon/lasso toolbox + draftPolygon state.',
    ],
    col: 1, row: 1,
  },
  'ops-reports': {
    lane: 'ops',
    match: 'ops-report-queue',
    title: 'Report queue',
    desc: 'Pending + claimed citizen reports. Verify / dismiss decisions promote to incidents.',
    comments: [
      'Verify creates a CanonicalEvent and notifies the reporter + responders.',
      'Dismiss notifies the reporter that nothing was published.',
    ],
    col: 2, row: 1,
  },
  'ops-distress': {
    lane: 'ops',
    match: 'ops-distress',
    title: 'Distress oversight',
    desc: 'All non-resolved SOS sessions with category, status, citizen handle.',
    comments: [
      'Click-through routes straight to the dispatch flow.',
    ],
    col: 3, row: 1,
  },
  'ops-cases': {
    lane: 'ops',
    match: 'ops-case-overview',
    title: 'Case overview',
    desc: 'All cases — severity, state, members, captain. Real-time as members join/leave.',
    comments: [
      'Case state pipeline: forming → staging → active → consolidating → resolved.',
    ],
    col: 4, row: 1,
  },
  'ops-roster': {
    lane: 'ops',
    match: 'ops-responder-roster',
    title: 'Responder roster',
    desc: 'Every responder, current status, current assignment. Used to manually retask units.',
    comments: [
      'Filters out offline units; pros + volunteers shown side-by-side with org tag.',
    ],
    col: 1, row: 2,
  },
  'ops-dispatch': {
    lane: 'ops',
    match: 'ops-dispatch',
    title: 'Dispatch',
    desc: 'Ranks ready/en-route responders by Euclidean distance to the active SOS or case centroid.',
    comments: [
      'One-tap assign — also patches the responder to en_route + the SOS to ack.',
    ],
    col: 2, row: 2,
  },
  'ops-declare': {
    lane: 'ops',
    match: 'ops-declare',
    title: 'Declare incident',
    desc: 'Manual L1–L5 declaration. Polygon optional — uses draftPolygon centroid when present.',
    comments: [
      'Severity ≥ 4 fires an urgent notification to citizens + responders + ops.',
    ],
    col: 3, row: 2,
  },
  'ops-copilot': {
    lane: 'ops',
    match: 'ops-command-copilot',
    title: 'Command copilot',
    desc: 'Sees the entire active CSOT — reports, SOS (with nearest ready responder), cases, sources, PSI.',
    comments: [
      'Workspace: ops_command. Suggests dispatch + drafts broadcasts grounded in the live snapshot.',
      'ETAs always m:ss via 35 km/h surface mix — never invented.',
    ],
    col: 4, row: 2,
  },
  'ops-broadcast': {
    lane: 'ops',
    match: 'ops-broadcast',
    title: 'Broadcast',
    desc: 'Audience scope + 40-char title + body. Polygon defines the geo target.',
    comments: [
      'Shows polygon area in km² (shoelace) — no fabricated device count.',
    ],
    col: 1, row: 3,
  },
  'ops-sources': {
    lane: 'ops',
    match: 'ops-source-health',
    title: 'Source health',
    desc: 'Every external provider with its current state (fresh / stale / down / not_configured / unavailable).',
    comments: [
      'Sources from /api/host/tools.js + NEA + OneMap layers all report into this view.',
      'God Mode can flip states to demo degradation paths.',
    ],
    col: 2, row: 3,
  },
  'ops-log': {
    lane: 'ops',
    match: 'ops-ops-activity-log',
    title: 'Activity log',
    desc: 'Append-only system of record. Captures every action (incl. God Mode seeds, marked actor=godmode).',
    comments: [
      'Same store as responder/citizen log — visibility scoped by ActionLog.visibleTo.',
    ],
    col: 3, row: 3,
  },

  // ── God Mode ─────────────────────────────────────────────────────
  'god-csot': {
    lane: 'godmode',
    match: 'godmode-csot',
    title: 'CSOT clusters',
    desc: 'Live counts per cluster (intake · incidents · operations · network · intel · presentation).',
    comments: [
      'Mirrors state/relations.ts. Source of truth for the wireframe lane structure.',
    ],
    col: 1, row: 1,
  },
  'god-seed': {
    lane: 'godmode',
    match: 'godmode-seed',
    title: 'Seed scenarios',
    desc: 'Minor + major demo seeds, plus "send SOS as me" using the device GPS. Reset wipes everything.',
    comments: [
      'Major seed lands a critical fire + open medical SOS — drives the responder + ops pushes.',
    ],
    col: 2, row: 1,
  },
  'god-sources': {
    lane: 'godmode',
    match: 'godmode-sources',
    title: 'Source state cycler',
    desc: 'Click any source to cycle its state. Demonstrates honest UI degradation.',
    comments: [
      'Same SourceHealth array the ops surface reads — single CSOT mutation.',
    ],
    col: 3, row: 1,
  },
  'god-matrix': {
    lane: 'godmode',
    match: 'godmode-ai-matrix',
    title: 'AI dispatch matrix',
    desc: 'Role × workspace → system prompt mapping for the Host AI.',
    comments: [
      'Mirrors api/host/systemPrompts.js. Five real modes + back-compat aliases.',
    ],
    col: 4, row: 1,
  },
  'god-seeded': {
    lane: 'godmode',
    match: 'godmode-csot-seeded',
    title: 'CSOT after major seed',
    desc: 'Same CSOT tab after a major seed — counts move, source health remains honest.',
    comments: [
      'Useful for the pitch: shows the cluster relations animate with a single click.',
    ],
    col: 5, row: 1,
  },
};

const LANES = [
  { id: 'auth', title: '1 · Auth', blurb: 'Demo accounts gate the shell.', cols: 1 },
  { id: 'citizen', title: '2 · Citizen', blurb: 'Map · brief · report · SOS · AI. Only verified incidents reach this role.', cols: 4 },
  { id: 'responder', title: '3 · Responder', blurb: 'Mission board + case rooms. Volunteer / professional treated equally; restricted cases are monitor-only.', cols: 4 },
  { id: 'ops', title: '4 · Ops', blurb: 'Triage, dispatch, declare, broadcast. Every action lands in the audit log.', cols: 4 },
  { id: 'godmode', title: '5 · God Mode (demo dock)', blurb: 'Off by default. Seeds scenarios, flips source health, swaps roles, inspects the CSOT.', cols: 5 },
];

// Flow edges. Each is a pair [fromScreenId, toScreenId, label?].
// Edges only connect screens within the same lane (visually tractable).
const EDGES = [
  // Auth → first home of each role lane (rendered as cross-lane note in the UI)
  // (Cross-lane arrows are too long visually; we annotate with a footer note instead.)

  // Citizen flow
  ['cz-home', 'cz-brief'],
  ['cz-home', 'cz-alerts'],
  ['cz-home', 'cz-ai'],
  ['cz-brief', 'cz-alerts'],
  ['cz-alerts', 'cz-report'],
  ['cz-alerts', 'cz-sos'],
  ['cz-report', 'cz-sos'],
  ['cz-sos', 'cz-sos-live'],

  // Responder flow
  ['rp-home', 'rp-mboard'],
  ['rp-mboard', 'rp-join'],
  ['rp-mboard', 'rp-copilot'],
  ['rp-join', 'rp-copilot'],
  ['rp-home', 'rp-groups'],
  ['rp-groups', 'rp-events'],
  ['rp-mboard', 'rp-log'],

  // Ops flow
  ['ops-home', 'ops-reports'],
  ['ops-reports', 'ops-declare'],
  ['ops-home', 'ops-distress'],
  ['ops-distress', 'ops-dispatch'],
  ['ops-dispatch', 'ops-roster'],
  ['ops-home', 'ops-cases'],
  ['ops-cases', 'ops-dispatch'],
  ['ops-copilot', 'ops-dispatch'],
  ['ops-copilot', 'ops-broadcast'],
  ['ops-declare', 'ops-broadcast'],
  ['ops-broadcast', 'ops-sources'],
  ['ops-sources', 'ops-log'],

  // God Mode flow
  ['god-csot', 'god-seed'],
  ['god-seed', 'god-seeded'],
  ['god-csot', 'god-sources'],
  ['god-csot', 'god-matrix'],
];

async function main() {
  await mkdir(DOCS_DIR, { recursive: true });

  const files = (await readdir(SHOTS_DIR)).filter((f) => f.endsWith('.png'));
  const byMatch = new Map();
  for (const f of files) {
    const trimmed = f.replace(/^\d+-/, '').replace(/\.png$/, '');
    byMatch.set(trimmed, f);
  }

  const dataUriCache = new Map();
  async function asDataUri(filename) {
    if (dataUriCache.has(filename)) return dataUriCache.get(filename);
    const buf = await readFile(join(SHOTS_DIR, filename));
    const uri = `data:image/png;base64,${buf.toString('base64')}`;
    dataUriCache.set(filename, uri);
    return uri;
  }

  // Build per-lane screen cards
  async function renderLane(lane) {
    const screens = Object.entries(SCREENS).filter(([, s]) => s.lane === lane.id);
    const cards = [];
    for (const [id, s] of screens) {
      const file = byMatch.get(s.match);
      const img = file
        ? `<img src="${await asDataUri(file)}" alt="${s.title}" />`
        : `<div class="placeholder">missing ${s.match}</div>`;
      const comments = s.comments.map((c) => `<li>${escape(c)}</li>`).join('');
      cards.push(`
        <article class="screen" id="${id}" style="grid-column:${s.col};grid-row:${s.row}">
          <header><span class="num">${id}</span><h3>${escape(s.title)}</h3></header>
          ${img}
          <p class="desc">${escape(s.desc)}</p>
          ${comments ? `<ul class="comments">${comments}</ul>` : ''}
        </article>
      `);
    }
    return `
      <section class="lane lane-${lane.id}" data-lane="${lane.id}" style="--cols:${lane.cols}">
        <header class="lane-head">
          <h2><span class="lane-pill">${escape(lane.title)}</span></h2>
          <p>${escape(lane.blurb)}</p>
        </header>
        <div class="lane-canvas">
          <svg class="arrows" aria-hidden="true"></svg>
          <div class="grid">${cards.join('\n')}</div>
        </div>
      </section>
    `;
  }

  const lanesHtml = [];
  for (const lane of LANES) lanesHtml.push(await renderLane(lane));

  const edgeData = JSON.stringify(EDGES);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1480" />
  <title>Kampung Kaki · Wireframe (CODE_EXP 2026)</title>
  <style>
    :root {
      --ink: #1a1a1a;
      --paper: #f4f4f1;
      --paper-2: #ebebe6;
      --paper-3: #ddddd6;
      --accent: #facc15;
      --critical: #dc2626;
      --info: #2563eb;
      --success: #22c55e;
    }
    * { box-sizing: border-box; }
    html { background: var(--paper); }
    body {
      margin: 0;
      padding: 40px 32px 64px;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      color: var(--ink);
      min-width: 1720px;
    }
    header.hero {
      border: 2.5px solid var(--ink);
      background: var(--paper);
      padding: 22px 24px;
      margin-bottom: 28px;
      box-shadow: 8px 8px 0 var(--ink);
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 24px;
      align-items: start;
    }
    header.hero h1 {
      margin: 0 0 6px;
      font-size: 32px;
      font-weight: 900;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    header.hero .tagline {
      margin: 0 0 12px;
      font-size: 13px;
      color: #444;
    }
    header.hero .meta {
      display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;
    }
    header.hero .meta span {
      border: 1.5px solid var(--ink);
      padding: 3px 8px;
      background: var(--paper-2);
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-weight: 800;
    }
    .clusters {
      border: 1.5px solid var(--ink);
      background: var(--paper-2);
      padding: 10px 12px;
    }
    .clusters h3 {
      margin: 0 0 8px;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 900;
    }
    .cluster-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 12px;
    }
    .cluster-grid div {
      font-size: 11px;
      line-height: 1.4;
    }
    .cluster-grid strong {
      display: inline-block;
      background: var(--ink);
      color: var(--paper);
      padding: 1px 6px;
      font-size: 9px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-right: 6px;
    }
    .legend {
      border: 1.5px solid var(--ink);
      background: var(--paper);
      padding: 8px 12px;
      margin-top: 8px;
      font-size: 11px;
      display: flex; gap: 16px; align-items: center; flex-wrap: wrap;
    }
    .legend .swatch {
      display: inline-block; width: 14px; height: 8px; border: 1px solid var(--ink); vertical-align: middle;
    }

    .lane {
      margin-bottom: 32px;
      border: 2.5px solid var(--ink);
      background: var(--paper);
      box-shadow: 8px 8px 0 var(--ink);
    }
    .lane-head {
      padding: 14px 20px;
      border-bottom: 2px solid var(--ink);
      background: var(--paper-2);
      display: flex; flex-direction: column; gap: 6px;
    }
    .lane-head h2 { margin: 0; }
    .lane-pill {
      display: inline-block;
      padding: 5px 12px;
      background: var(--ink);
      color: var(--paper);
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      box-shadow: 3px 3px 0 var(--accent);
    }
    .lane-head p { margin: 0; font-size: 12px; color: #444; max-width: 100ch; }

    .lane-canvas { position: relative; padding: 24px; }
    .arrows {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; overflow: visible; z-index: 3;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(var(--cols, 4), 300px);
      grid-auto-rows: minmax(380px, auto);
      gap: 64px 80px;
      position: relative;
      z-index: 2;
    }

    .screen {
      border: 2px solid var(--ink);
      background: var(--paper);
      box-shadow: 4px 4px 0 var(--ink);
      display: flex; flex-direction: column;
      position: relative;
      width: 300px;
    }
    .screen header {
      padding: 6px 10px;
      border-bottom: 1.5px solid var(--ink);
      background: var(--paper-2);
      display: flex; align-items: center; gap: 8px;
    }
    .screen .num {
      background: var(--accent);
      border: 1.5px solid var(--ink);
      padding: 2px 6px;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      box-shadow: 2px 2px 0 var(--ink);
    }
    .screen h3 {
      margin: 0;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.02em;
    }
    .screen img {
      width: 100%; height: 180px; object-fit: cover; object-position: top center;
      border-bottom: 1.5px solid var(--ink);
      display: block;
    }
    .placeholder {
      width: 100%; height: 180px;
      background: repeating-linear-gradient(45deg, transparent 0 8px, rgba(0,0,0,0.04) 8px 16px);
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; color: #999;
      border-bottom: 1.5px solid var(--ink);
    }
    .screen .desc {
      margin: 0;
      padding: 8px 10px 6px;
      font-size: 11.5px;
      line-height: 1.45;
    }
    .screen .comments {
      margin: 0;
      padding: 0 10px 10px 24px;
      font-size: 10.5px;
      line-height: 1.45;
      color: #555;
    }
    .screen .comments li { margin-bottom: 2px; }

    /* Arrow styling */
    .arrow-path { fill: none; stroke: var(--ink); stroke-width: 2.4; stroke-linecap: round; }
    .arrow-head { fill: var(--ink); }
    .grid { z-index: 1; }

    footer.matrix {
      border: 2.5px solid var(--ink);
      background: var(--paper);
      padding: 18px 20px;
      box-shadow: 8px 8px 0 var(--ink);
      margin-top: 32px;
    }
    footer.matrix h2 {
      margin: 0 0 10px;
      font-size: 14px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-weight: 900;
    }
    .matrix-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
    }
    .matrix-cell {
      border: 1.5px solid var(--ink);
      background: var(--paper-2);
      padding: 8px 10px;
      font-size: 11px;
    }
    .matrix-cell strong {
      display: block;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .matrix-cell code {
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 10.5px;
      background: var(--paper);
      border: 1px solid var(--ink);
      padding: 1px 4px;
    }
    .tools {
      margin-top: 10px;
      font-size: 11px;
    }
    .tools code {
      font-family: ui-monospace, monospace;
      background: var(--paper-2);
      padding: 1px 6px;
      border: 1px solid var(--ink);
      margin-right: 4px;
      display: inline-block;
      margin-bottom: 3px;
    }
    .note {
      margin-top: 14px;
      font-size: 11px;
      color: #555;
      border-left: 3px solid var(--accent);
      padding-left: 10px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <header class="hero">
    <div>
      <h1>Kampung Kaki · Wireframe</h1>
      <p class="tagline">A live, role-aware map of Singapore for citizens, responders, and operations. One map · three views · shared truth.</p>
      <div class="meta">
        <span>CODE_EXP 2026</span>
        <span>Section 2 · Shell</span>
        <span>OneMap SG · NEA live · OneMap themes</span>
        <span>Host AI · 5 role/workspace modes</span>
      </div>
      <p style="font-size:11.5px;margin:0;line-height:1.5;">
        The CSOT (single source of truth) is split into six clusters with explicit
        relations — see <code>src/state/relations.ts</code>. Every UI surface below reads from those clusters; no
        screen invents data. A presenter-only <strong>God Mode</strong> dock seeds demo state and flips source
        health so a pitch can show degradation paths honestly.
      </p>
    </div>
    <div class="clusters">
      <h3>CSOT clusters</h3>
      <div class="cluster-grid">
        <div><strong>intake</strong>Reports + SOS</div>
        <div><strong>incidents</strong>Events + zones</div>
        <div><strong>operations</strong>Cases + chat + responders</div>
        <div><strong>network</strong>Users + groups + volunteer events</div>
        <div><strong>intel</strong>Sources + NEA + logs + notifications</div>
        <div><strong>presentation</strong>Shell + selection state</div>
      </div>
      <div class="legend">
        <span><span class="swatch" style="background:var(--ink)"></span> flow within a lane</span>
        <span>screens read from clusters; mutations route through actions</span>
      </div>
    </div>
  </header>

  ${lanesHtml.join('\n')}

  <footer class="matrix">
    <h2>Host AI dispatch matrix</h2>
    <div class="matrix-grid">
      <div class="matrix-cell"><strong>citizen · alert</strong><code>citizen_alert</code><br/>Situation / Do now / If worse · 995 / 999 included for sev ≥ 3.</div>
      <div class="matrix-cell"><strong>citizen · assistant</strong><code>citizen_assistant</code><br/>AI Kaki · general safety questions, ≤ 6 lines.</div>
      <div class="matrix-cell"><strong>responder · case</strong><code>responder_case</code><br/>Slash-aware case-room copilot inside the lobby.</div>
      <div class="matrix-cell"><strong>responder · mission</strong><code>responder_mission</code><br/>Mission-board copilot, fit × distance ranking.</div>
      <div class="matrix-cell"><strong>ops · command</strong><code>ops_command</code><br/>Dispatch + declaration + broadcast suggestions.</div>
    </div>
    <div class="tools">
      <strong style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;">Server-side tools</strong>
      <div style="margin-top:6px">
        <code>getLivePsi</code><code>getLiveRainfall</code><code>getNearestAed</code><code>getNearestHospital</code>
      </div>
    </div>
    <p class="note">
      Anything outside this matrix says <em>unavailable</em> rather than invent. ETAs are derived from
      <code>getDistanceKm(responder, target) ÷ 35 km/h</code>; SOS / report locations come from device GPS, never from a
      hardcoded constant. Broadcast reach reports polygon area in km² because device-density isn't a live source yet.
    </p>
  </footer>

  <script>
    // Draw arrows between screens within the same lane.
    const EDGES = ${edgeData};
    function laneOf(id) {
      const el = document.getElementById(id);
      return el ? el.closest('.lane') : null;
    }
    function tipPath(svg, fromEl, toEl) {
      const svgBox = svg.getBoundingClientRect();
      const a = fromEl.getBoundingClientRect();
      const b = toEl.getBoundingClientRect();
      // Right-middle of source → left-middle of target
      let x1 = a.right - svgBox.left;
      let y1 = a.top + a.height / 2 - svgBox.top;
      let x2 = b.left - svgBox.left;
      let y2 = b.top + b.height / 2 - svgBox.top;
      // If target is to the left or below, route around the right side and down.
      if (x2 <= x1) {
        x1 = a.left + a.width / 2 - svgBox.left;
        y1 = a.bottom - svgBox.top;
        x2 = b.left + b.width / 2 - svgBox.left;
        y2 = b.top - svgBox.top;
      }
      const dx = Math.abs(x2 - x1);
      const c1x = x1 + Math.max(40, dx / 2);
      const c1y = y1;
      const c2x = x2 - Math.max(40, dx / 2);
      const c2y = y2;
      return { x1, y1, x2, y2, d: \`M\${x1},\${y1} C\${c1x},\${c1y} \${c2x},\${c2y} \${x2},\${y2}\` };
    }
    function drawArrows() {
      const lanes = document.querySelectorAll('.lane');
      lanes.forEach((lane) => {
        const svg = lane.querySelector('svg.arrows');
        if (!svg) return;
        svg.innerHTML = '';
        // SVG uses user-space units == screen pixels (no viewBox so 1:1).
        // arrowhead marker
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = '<marker id="ah-' + lane.dataset.lane + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" class="arrow-head"/></marker>';
        svg.appendChild(defs);
      });
      EDGES.forEach(([from, to]) => {
        const fromEl = document.getElementById(from);
        const toEl = document.getElementById(to);
        if (!fromEl || !toEl) return;
        const lane = fromEl.closest('.lane');
        const svg = lane ? lane.querySelector('svg.arrows') : null;
        if (!svg) return;
        const { d } = tipPath(svg, fromEl, toEl);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', 'arrow-path');
        path.setAttribute('marker-end', 'url(#ah-' + lane.dataset.lane + ')');
        svg.appendChild(path);
      });
    }
    if (document.readyState === 'complete') drawArrows();
    else window.addEventListener('load', drawArrows);
    window.addEventListener('resize', drawArrows);
  </script>
</body>
</html>
`;

  await writeFile(HTML_OUT, html);
  await writeFile(NOJEKYLL, '');
  console.log('Wrote', HTML_OUT);

  // Render to single PNG.
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1800, height: 1100 }, deviceScaleFactor: 1.4 });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(HTML_OUT).href, { waitUntil: 'load' });
  // Wait for fonts + images, then re-draw arrows so they catch the final layout.
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const fn = window.dispatchEvent;
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: PNG_OUT, fullPage: true });
  await browser.close();
  console.log('Wrote', PNG_OUT);
}

function escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
