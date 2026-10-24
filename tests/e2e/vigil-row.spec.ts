import { expect, test, type Page } from '@playwright/test';
import { debugPress } from './helpers';
import { dismiss, loadFixture, tolerantClicks } from './polish-screens';
import { scanTappables } from './polish-tap';

// Plan KV.6 (GDD §9.23): the Rising Vigil row on the Last Stand screen. Gate closed: nothing of it
// exists. Gate open: the row, its status line, the preview, the confirmation and the result.

const BASE = 'http://localhost:4173/the-last-hold/';
const vigilIds = (page: Page) => page.locator('[data-testid^="vigil"]');

// Act VI's real stand and Long Night, then the gate, then Bastion again: the stand screen with the gate open.
const openGate = async (page: Page): Promise<void> => {
  await debugPress(page, 'Finish Act VI');
  await dismiss(page);
  await debugPress(page, 'Open the gate', 'Unlock Bastion');
  await dismiss(page);
};

const openStand = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: /^Rank/ }).first().click();
  await page.getByRole('button', { name: 'Make the Last Stand' }).click();
  await expect(page.getByText(/^Expected:/)).toBeVisible({ timeout: 20_000 });
};

const setStands = async (page: Page, n: number): Promise<void> => {
  await page.getByRole('navigation').getByRole('button', { name: /^More/ }).click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByLabel('Stands fought with Rising Vigil').fill(String(n));
  await page.getByRole('button', { name: /^Set vigil stands to/ }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await dismiss(page);
  await page.getByRole('navigation').getByRole('button', { name: /^Hold/ }).click();
};

test('gate closed: no vigil row and no vigil test id', async ({ page }) => {
  tolerantClicks(page);
  await loadFixture(page, 'v11');
  await openStand(page);
  await expect(vigilIds(page)).toHaveCount(0);
  await expect(page.getByText('Rising Vigil')).toHaveCount(0);
});

test('gate open: the row, the status line, the preview and the confirmation', async ({ page }) => {
  tolerantClicks(page);
  await loadFixture(page, 'v11');
  await openGate(page);
  await setStands(page, 0);
  await openStand(page);
  await page.getByTestId('vigil-off').click(); // a played save may be left On
  const row = page.getByTestId('vigil-row');
  await expect(row).toBeVisible();
  await expect(row.getByText('Rising Vigil', { exact: true })).toBeVisible();
  await expect(page.getByTestId('vigil-help')).toHaveText(
    'On: every wave is stronger, one step more for each stand you make with it on, and the Embers rise to make up for it. Off: an ordinary stand. Your level is kept.',
  );
  // Off, nothing fought On yet: no status line.
  await expect(page.getByTestId('vigil-off')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('vigil-status')).toHaveCount(0);
  const off = await page.getByText(/^Embers now:/).innerText();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByTestId('vigil-confirm')).toHaveCount(0);
  await page.getByRole('button', { name: 'Close' }).last().click();

  // On: the preview is worked out again, with the level.
  await page.getByTestId('vigil-on').click();
  await expect(page.getByTestId('vigil-status')).toHaveText('This stand: vigil level 1');
  await expect(page.getByText(/^Expected:/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/^Embers now:/)).not.toHaveText(off);
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByTestId('vigil-confirm')).toHaveText('Rising Vigil is on at level 1.');
  await page.getByRole('button', { name: 'Close' }).last().click();

  // Off again, with stands fought: the next level shows.
  await page.getByTestId('vigil-off').click();
  await expect(page.getByTestId('vigil-status')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Close' })
    .last()
    .click()
    .catch(() => {});
});

test('the status line in each state, and the Embers breakdown line', async ({ page }) => {
  tolerantClicks(page);
  await loadFixture(page, 'v11');
  await openGate(page);
  await setStands(page, 3);
  await openStand(page);
  await page.getByTestId('vigil-off').click(); // a played save may be left On
  await expect(page.getByTestId('vigil-status')).toHaveText('Next level when on: 4');
  await page.getByTestId('vigil-on').click();
  await expect(page.getByTestId('vigil-status')).toHaveText('This stand: vigil level 4');
  await expect(page.getByText(/^Expected:/)).toBeVisible({ timeout: 20_000 });
  await page
    .getByText(/^Embers now:/)
    .getByRole('button', { name: 'Show breakdown' })
    .click();
  await expect(page.getByText(/^Rising Vigil: \+\d+% on the waves part$/)).toBeVisible();
});

for (const on of [true, false])
  test(`the result sheet ${on ? 'carries' : 'does not carry'} the line when ${on ? 'On' : 'Off'}`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    tolerantClicks(page);
    await loadFixture(page, 'v11');
    await openGate(page);
    await setStands(page, 3);
    await openStand(page);
    await page.getByTestId(on ? 'vigil-on' : 'vigil-off').click();
    await expect(page.getByText(/^Expected:/)).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.getByRole('button', { name: 'Go up to the walls' }).click();
    const night = page.getByRole('dialog', { name: 'The Long Night' });
    await expect(night.getByText(/The walls held/)).toBeVisible();
    if (on)
      await expect(night.getByTestId('vigil-result')).toHaveText(
        'Fought with Rising Vigil at level 4.',
      );
    else await expect(night.getByTestId('vigil-result')).toHaveCount(0);
  });

for (const width of [320, 360])
  for (const size of ['match', 'large', 'largest'])
    test(`layout at ${width} px, Text size ${size}: taps of 44 px, no sideways scroll`, async ({
      browser,
    }) => {
      test.setTimeout(120_000);
      const ctx = await browser.newContext({ viewport: { width, height: 740 }, baseURL: BASE });
      const page = await ctx.newPage();
      page.setDefaultTimeout(6000);
      tolerantClicks(page);
      await page.addInitScript((s) => {
        for (const prefix of ['lasthold:', 'lasthold-preview:'])
          localStorage.setItem(`${prefix}settings`, JSON.stringify({ textSize: s }));
      }, size);
      await loadFixture(page, 'v11');
      await openGate(page);
      await setStands(page, 3);
      await openStand(page);
      await page.getByTestId('vigil-on').click();
      await page.getByTestId('vigil-row').scrollIntoViewIfNeeded();
      for (const id of ['vigil-on', 'vigil-off']) {
        const box = await page.getByTestId(id).boundingBox();
        expect(box?.width, id).toBeGreaterThanOrEqual(44);
        expect(box?.height, id).toBeGreaterThanOrEqual(44);
      }
      const scan = await scanTappables(page);
      expect(scan.small.map((s) => s.name)).toEqual([]);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      const help = await page.getByTestId('vigil-help').boundingBox();
      expect((help?.x ?? 0) + (help?.width ?? 0)).toBeLessThanOrEqual(width);
      await ctx.close();
    });
