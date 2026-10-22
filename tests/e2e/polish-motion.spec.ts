import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';
import { tab } from './helpers';
import { FLOWS, loadFixture, tolerantClicks, type Visit } from './polish-screens';

// Plan TV.5 (GDD §9.20): motion is reduced if the phone says so OR the Settings switch is on. Then
// `document.getAnimations()` is empty on the named screens; with both off it is at least what the
// build before TV.5 had there (BASELINE_WRITE=1, run on that build, records those counts).

const BASE = 'http://localhost:4173/the-last-hold/';
const BASELINE = new URL('./baselines/motion-counts.json', import.meta.url);
const writing = process.env.BASELINE_WRITE === '1';
const SCREENS = ['hold', 'sheet', 'fight', 'reading'] as const;
type Screen = (typeof SCREENS)[number];
type Counts = Record<Screen, number>;

const animations = (page: Page): Promise<number> =>
  page.evaluate(() => document.getAnimations().length);

/** The most animations seen at once while watching for `ms` (a name's fade lasts only 0.6 s). */
const peak = async (page: Page, ms: number): Promise<number> => {
  let most = 0;
  for (let t = 0; t < ms; t += 100) {
    most = Math.max(most, await animations(page));
    await page.waitForTimeout(100);
  }
  return most;
};

const turnSwitchOn = async (page: Page): Promise<void> => {
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  await page
    .getByRole('group', { name: 'Reduce motion' })
    .getByRole('button', { name: 'On', exact: true })
    .click();
  await page.getByRole('button', { name: 'Close' }).last().click();
};

/** A fresh page on the fixture (each part needs its own load), with the phone and switch as given. */
const open = async (
  browser: Browser,
  fixture: string,
  phone: 'reduce' | 'no-preference',
  switchOn: boolean,
): Promise<{ page: Page; close: () => Promise<void> }> => {
  const ctx = await browser.newContext({
    viewport: { width: 360, height: 740 },
    baseURL: BASE,
    reducedMotion: phone,
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(6000);
  tolerantClicks(page);
  await loadFixture(page, fixture);
  if (switchOn) await turnSwitchOn(page);
  return { page, close: () => ctx.close() };
};

const run = async (
  browser: Browser,
  phone: 'reduce' | 'no-preference',
  switchOn: boolean,
): Promise<Counts> => {
  const counts: Partial<Counts> = {};
  {
    const { page, close } = await open(browser, 'v11', phone, switchOn);
    await tab(page, 'Hold').click();
    counts.hold = await peak(page, 1000);
    // A sheet opening: the rates sheet, read just after it opens and again a moment later.
    await page.getByRole('button', { name: /Food.*Wood/ }).click();
    counts.sheet = await peak(page, 600);
    await close();
  }
  for (const id of ['events-boss', 'remembering-remember']) {
    const flow = FLOWS.find((f) => f.id === id);
    if (!flow) throw new Error(id);
    const { page, close } = await open(browser, flow.fixture, phone, switchOn);
    const visit: Visit = async (shown) => {
      if (shown === 'events-boss-playback') {
        // Same timeline and pace whatever is reduced: the playback has not jumped to its end.
        await expect(page.getByRole('button', { name: 'Skip' })).toBeVisible();
        counts.fight = await peak(page, 1500);
      }
      if (shown === 'remembering-reading') counts.reading = await peak(page, 2600);
    };
    try {
      await flow.run(page, visit);
    } catch {
      // Whatever follows the measured screen does not matter; only the counts do.
    }
    await close();
  }
  for (const s of SCREENS) expect(counts[s], `${s} was reached`).toBeDefined();
  return counts as Counts;
};

test('with both off, the named screens animate at least as much as before TV.5', async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const counts = await run(browser, 'no-preference', false);
  console.log('animations, both off:', JSON.stringify(counts));
  if (writing) {
    writeFileSync(BASELINE, `${JSON.stringify(counts, null, 1)}\n`);
    return;
  }
  expect(existsSync(BASELINE)).toBe(true);
  const was = JSON.parse(readFileSync(BASELINE, 'utf8')) as Counts;
  for (const s of SCREENS) expect(counts[s], s).toBeGreaterThanOrEqual(was[s]);
});

test('the phone says reduce: no animations on the named screens', async ({ browser }) => {
  test.skip(writing);
  test.setTimeout(300_000);
  const counts = await run(browser, 'reduce', false);
  expect(counts).toEqual({ hold: 0, sheet: 0, fight: 0, reading: 0 });
});

test('the switch is on: no animations on the named screens', async ({ browser }) => {
  test.skip(writing);
  test.setTimeout(300_000);
  const counts = await run(browser, 'no-preference', true);
  expect(counts).toEqual({ hold: 0, sheet: 0, fight: 0, reading: 0 });
});
