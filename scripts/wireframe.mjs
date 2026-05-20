// Wireframe screenshot job. Boots Playwright against a running dev server
// (default http://localhost:3000) and captures every role + workspace +
// God Mode tab as a PNG into docs/wireframe/.
//
//   node scripts/wireframe.mjs            # uses 3000
//   BASE_URL=http://localhost:5173 node scripts/wireframe.mjs
//
// Uses window.__kk (exposed by AppProvider in dev) to drive the shell
// directly instead of clicking through the UI — far more robust.

import { chromium } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT_DIR = join(process.cwd(), 'docs', 'wireframe');
const VIEWPORT = { width: 1440, height: 900 };
const SHOTS = [];

function shot(name) {
  return join(OUT_DIR, `${SHOTS.length.toString().padStart(2, '0')}-${name}.png`);
}

async function snap(page, label) {
  await page.waitForTimeout(400);
  const path = shot(label);
  await page.screenshot({ path, fullPage: false });
  SHOTS.push(label);
  console.log('  ●', label);
}

async function snapDrawer(page, label) {
  // Capture only the open drawer so the wireframe tile shows the workspace
  // content rather than the underlying map.
  await page.waitForTimeout(300);
  const drawer = page.locator('aside').first();
  const visible = await drawer.isVisible().catch(() => false);
  if (!visible) return;
  const path = join(OUT_DIR, `${(SHOTS.length - 1).toString().padStart(2, '0')}-${label}-drawer.png`);
  try {
    await drawer.screenshot({ path });
    console.log('    ↳ drawer', label);
  } catch (err) {
    console.warn('    ! drawer skipped', label, err.message);
  }
}

async function waitForKk(page) {
  await page.waitForFunction(() => Boolean(window.__kk));
}

async function login(page, role) {
  await page.evaluate((r) => window.__kk.demoLogin(r), role);
  await waitForKk(page);
  await page.waitForTimeout(400);
}

async function openDrawer(page, id) {
  await page.evaluate((d) => window.__kk.setDrawerContent(d), id);
  await page.waitForTimeout(450);
}

async function closeDrawer(page) {
  await page.evaluate(() => window.__kk.setDrawerContent(null));
  await page.waitForTimeout(250);
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  page.on('pageerror', (err) => console.warn('  ! pageerror:', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.warn('  ! console error:', msg.text());
  });

  // Pre-dismiss the permission prompt and GPS gating so it doesn't cover shots.
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem(
      'kk_permissions_prompted',
      JSON.stringify({ location: false, notifications: false }),
    );
  });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await waitForKk(page);
  await snap(page, 'login');

  // Seed something so the role homes have real data to render against.
  await login(page, 'ops');
  await page.evaluate(() => window.__kk.godSeedScenario('major'));
  await page.waitForTimeout(800);

  // ── Citizen ─────────────────────────────────────────────────────────
  await login(page, 'citizen');
  await snap(page, 'citizen-home');
  for (const [id, label] of [
    ['briefing', 'briefing'],
    ['alerts', 'alerts'],
    ['report_compose', 'report-compose'],
    ['citizen_ai', 'citizen-ai'],
    ['sos_draft', 'sos-draft'],
  ]) {
    await openDrawer(page, id);
    await snap(page, `citizen-${label}`);
    await snapDrawer(page, `citizen-${label}`);
    await closeDrawer(page);
  }

  // ── Responder ───────────────────────────────────────────────────────
  await login(page, 'responder');
  await snap(page, 'responder-home');
  for (const [id, label] of [
    ['mission_board', 'mission-board'],
    ['joinable_missions', 'joinable-missions'],
    ['responder_ai', 'mission-copilot'],
    ['groups', 'groups'],
    ['volunteer_events', 'volunteer-events'],
    ['activity_log', 'activity-log'],
  ]) {
    await openDrawer(page, id);
    await snap(page, `responder-${label}`);
    await snapDrawer(page, `responder-${label}`);
    await closeDrawer(page);
  }

  // ── Ops ─────────────────────────────────────────────────────────────
  await login(page, 'ops');
  await snap(page, 'ops-home');
  for (const [id, label] of [
    ['report_queue', 'report-queue'],
    ['distress_oversight', 'distress'],
    ['case_oversight', 'case-overview'],
    ['responder_oversight', 'responder-roster'],
    ['dispatch', 'dispatch'],
    ['declare', 'declare'],
    ['ops_ai', 'command-copilot'],
    ['broadcast', 'broadcast'],
    ['source_health', 'source-health'],
    ['activity_log', 'ops-activity-log'],
  ]) {
    await openDrawer(page, id);
    await snap(page, `ops-${label}`);
    await snapDrawer(page, `ops-${label}`);
    await closeDrawer(page);
  }

  // ── God Mode ────────────────────────────────────────────────────────
  // Open via localStorage flag + reload (most robust)
  await page.evaluate(() => localStorage.setItem('kk:godmode:open', '1'));
  await page.reload({ waitUntil: 'networkidle' });
  await waitForKk(page);
  await login(page, 'ops'); // re-auth after reload
  await page.evaluate(() => localStorage.setItem('kk:godmode:open', '1'));
  await page.reload({ waitUntil: 'networkidle' });
  await waitForKk(page);
  await login(page, 'ops');

  await page.waitForTimeout(500);
  await snap(page, 'godmode-csot');

  for (const tab of ['Seed', 'Sources', 'AI matrix']) {
    const btn = page.locator('aside').last().getByRole('button', { name: new RegExp(`^${tab}$`, 'i') }).first();
    await btn.click();
    await page.waitForTimeout(350);
    await snap(page, `godmode-${tab.toLowerCase().replace(/\s+/g, '-')}`);
  }

  // Seed via God Mode and re-capture CSOT
  const seedTab = page.locator('aside').last().getByRole('button', { name: /^Seed$/i }).first();
  await seedTab.click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /seed · major scenario/i }).click();
  await page.waitForTimeout(400);
  const csotTab = page.locator('aside').last().getByRole('button', { name: /^CSOT$/i }).first();
  await csotTab.click();
  await page.waitForTimeout(400);
  await snap(page, 'godmode-csot-seeded');

  await browser.close();
  console.log(`\nWrote ${SHOTS.length} screenshots to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
