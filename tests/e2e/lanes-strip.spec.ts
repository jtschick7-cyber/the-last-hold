import { expect, test, type Page } from '@playwright/test';
import { dismiss, loadFixture, tolerantClicks } from './polish-screens';

// Plan TB.8a (GDD §9.25): the Lanes strip, its text list and the lane breakdown sheet on the Arrange
// Hold sheet. The Bastion fixture is v11; v12-played is a Citadel hold (no lanes yet).

const BASE = 'http://localhost:4173/the-last-hold/';
const open = async (page: Page, fixture = 'v11'): Promise<void> => {
  tolerantClicks(page);
  await loadFixture(page, fixture);
  await page.locator('[data-layout-button]').click();
  await expect(page.getByRole('dialog', { name: 'Arrange Hold' })).toBeVisible();
};
const covers = async (page: Page): Promise<string[]> =>
  Promise.all(
    [1, 2, 3, 4, 5, 6, 7, 8].map(
      async (n) => (await page.getByTestId(`lane-${n}`).innerText()).split('\n')[1] ?? '',
    ),
  );

test('at Bastion the strip shows eight labelled boxes, the hint and the help line', async ({
  page,
}) => {
  await open(page);
  await expect(page.getByTestId('lanes').getByRole('heading', { name: 'Lanes' })).toBeVisible();
  for (let n = 1; n <= 8; n++) {
    const box = page.getByTestId(`lane-${n}`);
    await expect(box).toBeVisible();
    const lines = (await box.innerText()).split('\n');
    expect(lines[0]).toBe(`Lane ${n}`);
    expect(lines[1]).toMatch(/^\d+% cover$/);
  }
  await expect(page.getByTestId('lanes-hint')).toHaveText('Tap a lane to see what covers it.');
  await expect(page.getByTestId('lanes-help')).toHaveText(
    'Only walls and towers in the three rows nearest the Fell Breach count.',
  );
  // One dot for each of the next 12 waves, spread over the eight lanes.
  let dots = 0;
  for (let n = 1; n <= 8; n++)
    dots += await page.getByTestId(`lane-${n}`).locator('span[aria-hidden] > span').count();
  expect(dots).toBe(12);
});

test('the strip updates as pieces move', async ({ page }) => {
  await open(page);
  const before = await covers(page);
  const sheet = page.getByRole('dialog', { name: 'Arrange Hold' });
  // Send every placed building to the Tray (Clear to tray, then its confirmation).
  await sheet.getByRole('button', { name: 'Clear to tray…' }).click();
  await sheet.getByRole('alertdialog').getByRole('button', { name: 'Clear to tray' }).click();
  const after = await covers(page);
  expect(after).not.toEqual(before);
  await expect(page.getByTestId('lanes-empty')).toHaveText(
    'No walls or towers on the front rows yet. Only the ruined edge gives cover.',
  );
  // Only the ruined edge covers: 25% in the two edge lanes, nothing in between.
  expect(after).toEqual([
    '25% cover',
    '0% cover',
    '0% cover',
    '0% cover',
    '0% cover',
    '0% cover',
    '0% cover',
    '25% cover',
  ]);
});

test('a tap on a lane opens its breakdown and lights the pieces that cover it', async ({
  page,
}) => {
  await open(page);
  const lit = page.locator('[data-lit-piece]');
  await expect(lit).toHaveCount(0);
  await page.getByTestId('lane-4').click();
  const dlg = page.getByRole('dialog', { name: 'Lane 4' });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByText(/^Cover: \d+%$/)).toBeVisible();
  await expect(dlg.getByText(/^Walls: −[\d.]+% damage taken in this lane$/)).toBeVisible();
  await expect(dlg.getByText(/^Watchtower volley in this lane: \d+$/)).toBeVisible();
  await dlg.getByRole('button', { name: 'Close' }).click();
  const sheet = page.getByRole('dialog', { name: 'Arrange Hold' });
  await expect(sheet).toBeVisible();
  expect(await lit.count()).toBeGreaterThan(0);
  await expect(page.getByTestId('lane-4')).toHaveAttribute('aria-pressed', 'true');
  // Never colour alone: a dashed outline and a corner mark, and no animation.
  const first = lit.first();
  await expect(first).toContainText('◤');
  expect(await first.evaluate((e) => getComputedStyle(e).outlineStyle)).toBe('dashed');
  expect(await first.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
});

test('the list shows the same numbers as the strip', async ({ page }) => {
  await open(page);
  const strip = await covers(page);
  await page.getByRole('button', { name: 'List', exact: true }).click();
  for (let n = 1; n <= 8; n++) {
    const line = await page.getByTestId(`lane-line-${n}`).innerText();
    expect(line).toMatch(
      new RegExp(
        `^Lane ${n}: cover \\d+%, tower reach \\d+%, waves (none in the first 12|\\d+(, \\d+)* and \\d+|\\d+)$`,
      ),
    );
    expect(line).toContain(`cover ${(strip[n - 1] ?? '').replace('% cover', '')}%`);
  }
  await expect(page.getByTestId('lanes-strip')).toHaveCount(0);
  await page.getByRole('button', { name: 'Strip', exact: true }).click();
  await expect(page.getByTestId('lanes-strip')).toBeVisible();
});

test('no strip before Bastion', async ({ page }) => {
  await open(page, 'v12-played');
  await expect(page.getByTestId('lanes')).toHaveCount(0);
  await expect(page.getByText('Lanes', { exact: true })).toHaveCount(0);
});

for (const width of [320, 360, 375, 390]) {
  for (const size of ['match', 'largest']) {
    test(`at ${width} px, Text size ${size}: every control is 44 px, two rows of four, no sideways scroll`, async ({
      browser,
    }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 740 }, baseURL: BASE });
      const page = await ctx.newPage();
      await page.addInitScript((s) => {
        for (const prefix of ['lasthold:', 'lasthold-preview:'])
          localStorage.setItem(
            `${prefix}settings`,
            JSON.stringify({ textSize: s, backupReminder: true }),
          );
      }, size);
      await open(page);
      const boxes = page.getByTestId('lanes-strip').getByRole('button');
      const ys = new Set<number>();
      for (const b of await boxes.all()) {
        const r = await b.boundingBox();
        expect(r?.width ?? 0).toBeGreaterThanOrEqual(44);
        expect(r?.height ?? 0).toBeGreaterThanOrEqual(44);
        expect((r?.x ?? 0) + (r?.width ?? 0)).toBeLessThanOrEqual(width + 0.5);
        ys.add(Math.round((r?.y ?? 0) / 4));
      }
      for (const name of ['Strip', 'List']) {
        const r = await page.getByRole('button', { name, exact: true }).boundingBox();
        expect(r?.height ?? 0).toBeGreaterThanOrEqual(44);
      }
      expect(ys.size).toBe(2); // two rows of four
      const m = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        inner: window.innerWidth,
      }));
      expect(m.scroll).toBeLessThanOrEqual(m.inner);
      await ctx.close();
    });
  }
}

test('at 900 px the eight boxes sit in one row', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 800 }, baseURL: BASE });
  const page = await ctx.newPage();
  await open(page);
  const ys = new Set<number>();
  for (const b of await page.getByTestId('lanes-strip').getByRole('button').all())
    ys.add(Math.round(((await b.boundingBox())?.y ?? 0) / 4));
  expect(ys.size).toBe(1);
  await dismiss(page);
  await ctx.close();
});
