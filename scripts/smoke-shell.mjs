import { chromium } from 'playwright';

const baseURL = process.env.SMOKE_URL ?? 'http://localhost:3000/';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

const clickText = async (text) => {
  await page.getByText(text, { exact: false }).first().click();
};

const visibleText = async (text) => {
  const locator = page.getByText(text, { exact: false }).first();
  await locator.waitFor({ state: 'visible', timeout: 5000 });
};

try {
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await visibleText('QUICK AID SG');

  await clickText('Readiness');
  await visibleText('Shell readiness');
  await visibleText('Template algorithm ports');

  await clickText('Report');
  await clickText('Emergency report form');
  await clickText('Next');
  await clickText('Next');
  await page.getByPlaceholder('Short title').fill('Smoke test report');
  await page.getByPlaceholder('What did you see?').fill('Smoke test hazard near the station.');
  await clickText('Attach photo');
  await clickText('Next');
  await clickText('File report');
  await visibleText('Report filed.');

  await clickText('Alerts');
  await visibleText('My alerts');
  await visibleText('Nearby emergencies');

  await page.locator('select').first().selectOption('responder');
  await clickText('Join');
  await visibleText('Joinable missions');
  const accept = page.getByText('Accept SOS', { exact: false }).first();
  if (await accept.isVisible().catch(() => false)) await accept.click();
  await clickText('Events');
  await visibleText('Volunteer events');
  await page.getByTitle('Open profile').click();
  await visibleText('Profile');

  await page.locator('select').first().selectOption('ops');
  await clickText('Zones');
  await visibleText('Emergency zones');
  await clickText('Create demo drawn zone');
  await visibleText('New drawn operating zone');
  await clickText('Dispatch');
  await visibleText('Dispatch');
  await clickText('Broadcast');
  await visibleText('Geo broadcast');
  await clickText('Send broadcast');
  await visibleText('Broadcast queued');
  await clickText('Truth');
  await visibleText('Shell readiness');

  console.log('shell smoke passed');
} finally {
  await browser.close();
}
