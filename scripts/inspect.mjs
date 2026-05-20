import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(pathToFileURL(join(process.cwd(), 'docs', 'index.html')).href, { waitUntil: 'load' });
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);

// Probe: does the ::before render?
const probe = await page.evaluate(() => {
  // Try citizen's second tile (cz-brief), preceded by cz-home in same .grid.
  const target = document.getElementById('cz-brief');
  if (!target) return 'no cz-brief';
  const cs = window.getComputedStyle(target, '::before');
  return {
    content: cs.content,
    fontSize: cs.fontSize,
    position: cs.position,
    left: cs.left,
    display: cs.display,
    color: cs.color,
    width: cs.width,
    visibility: cs.visibility,
  };
});
console.log(JSON.stringify(probe, null, 2));

const lane = process.argv[2] ?? 'citizen';
await page.locator('.lane-' + lane).screenshot({ path: join(process.cwd(), 'docs', `inspect-${lane}.png`) });
await browser.close();
