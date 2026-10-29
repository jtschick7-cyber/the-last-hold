import { expect, test, type Page } from '@playwright/test';
import { dismiss, loadFixture, tolerantClicks } from './polish-screens';

// Plan TB.8b (GDD §9.25, Q61 yes): the Lanes strip on the Last Stand screen, the Arrange Hold button,
// Suggest layout (places nothing) and Use this layout (one tap, defenses only). Fixture v11 is Bastion.

const BASE = 'http://localhost:4173/the-last-hold/';
const SUGGESTED = /^Suggested: about \d+ waves \(now about \d+\)\.$/;
const openStand = async (page: Page): Promise<void> => {
  tolerantClicks(page);
  await loadFixture(page, 'v11');
  await page.getByRole('button', { name: /^Rank/ }).first().click();
  await page.getByRole('button', { name: 'Make the Last Stand' }).first().click();
  await expect(page.getByTestId('lanes')).toBeVisible();
};
const openSheet = async (page: Page): Promise<void> => {
  await page.getByTestId('stand-arrange-hold').click();
  await expect(page.getByRole('dialog', { name: 'Arrange Hold' })).toBeVisible();
};
const covers = async (page: Page): Promise<string[]> =>
  Promise.all(
    [1, 2, 3, 4, 5, 6, 7, 8].map(
      async (n) => (await page.getByTestId(`lane-${n}`).innerText()).split('\n')[1] ?? '',
    ),
  );
/** Every tile's piece, as the sheet draws it. */
const tiles = (page: Page): Promise<string[]> =>
  page
    .locator('button[data-tile]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-piece') ?? ''));
const tray = (page: Page): Promise<string[]> =>
  page
    .locator('[data-tray-item]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-tray-item') ?? ''));
const isDefense = (id: string): boolean => /^(wall|watchtower)-/.test(id);
const clearToTray = async (page: Page): Promise<void> => {
  const sheet = page.getByRole('dialog', { name: 'Arrange Hold' });
  await sheet.getByRole('button', { name: 'Clear to tray…' }).click();
  await sheet.getByRole('alertdialog').getByRole('button', { name: 'Clear to tray' }).click();
};

test('the Last Stand strip shows the sheet’s numbers and lights nothing', async ({ page }) => {
  await openStand(page);
  const onStand = await covers(page);
  await expect(page.getByTestId('lanes-hint')).toBeVisible();
  // A tap opens the breakdown with numbers only; there is no grid here to light.
  await page.getByTestId('lane-3').click();
  const dlg = page.getByRole('dialog', { name: 'Lane 3' });
  await expect(dlg.getByText(/^Cover: \d+%$/)).toBeVisible();
  await expect(page.locator('[data-lit-piece]')).toHaveCount(0);
  await dlg.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByTestId('lane-3')).toHaveAttribute('aria-pressed', 'false');
  await openSheet(page);
  expect(await covers(page)).toEqual(onStand);
  await dismiss(page);
});

test('Arrange Hold opens the sheet and the chosen party is still there on return', async ({
  page,
}) => {
  await openStand(page);
  const boxes = page.getByRole('checkbox');
  const before = await boxes.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).checked));
  expect(before.length).toBeGreaterThan(0);
  await boxes.first().click();
  const changed = await boxes.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).checked));
  expect(changed).not.toEqual(before);
  await openSheet(page);
  await page
    .getByRole('dialog', { name: 'Arrange Hold' })
    .getByRole('button', { name: 'Close' })
    .click();
  await expect(page.getByTestId('lanes')).toBeVisible();
  expect(await boxes.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).checked))).toEqual(
    changed,
  );
  // The strip on the stand screen follows a move made on the sheet.
  const stand = await covers(page);
  await openSheet(page);
  await clearToTray(page);
  await page
    .getByRole('dialog', { name: 'Arrange Hold' })
    .getByRole('button', { name: 'Close' })
    .click();
  expect(await covers(page)).not.toEqual(stand);
});

test('Suggest layout lights target tiles with its line and places nothing', async ({ page }) => {
  await openStand(page);
  await openSheet(page);
  await clearToTray(page);
  const before = { tiles: await tiles(page), tray: await tray(page) };
  const suggest = page.getByTestId('suggest-layout');
  await expect(suggest).toHaveText('Suggest layout');
  await expect(suggest).toBeEnabled();
  await suggest.click();
  const targets = page.locator('[data-suggest-target]');
  expect(await targets.count()).toBeGreaterThan(0);
  const first = targets.first();
  await expect(first).toContainText('◆');
  expect(await first.evaluate((e) => getComputedStyle(e).outlineStyle)).toBe('dotted');
  expect(await first.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
  await expect(page.getByTestId('suggest-line')).toHaveText(SUGGESTED, { timeout: 30_000 });
  expect({ tiles: await tiles(page), tray: await tray(page) }).toEqual(before);
  // A move after the suggestion makes it stale: it goes away rather than being applied later.
  await page.locator('[data-tray-item]').first().click();
  await page.locator('button[data-tile="0,5"]').click();
  await expect(page.getByTestId('suggest-result')).toHaveCount(0);
  await expect(targets).toHaveCount(0);
  await dismiss(page);
});

test('Use this layout puts the suggested defenses down in one tap and moves no other piece', async ({
  page,
}) => {
  await openStand(page);
  await openSheet(page);
  await clearToTray(page);
  const trayBefore = await tray(page);
  const emptyStrip = await covers(page);
  await page.getByTestId('suggest-layout').click();
  const targetTiles = await page
    .locator('[data-suggest-target]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-suggest-target') ?? ''));
  expect(targetTiles.length).toBeGreaterThan(0);
  await page.getByTestId('use-layout').click();
  // The suggestion is used up, and each target now holds a wall or a tower.
  await expect(page.getByTestId('suggest-result')).toHaveCount(0);
  const after = await tiles(page);
  const placed = after.filter((id) => id !== '');
  expect(placed.every((id) => isDefense(id) || id === 'hearth-hall')).toBe(true);
  for (const t of targetTiles) {
    const piece = await page.locator(`button[data-tile="${t}"]`).getAttribute('data-piece');
    expect(isDefense(piece ?? '')).toBe(true);
  }
  // Every other piece stays in the Tray exactly as it was.
  const trayAfter = await tray(page);
  expect(trayAfter.filter((id) => !isDefense(id))).toEqual(
    trayBefore.filter((id) => !isDefense(id)),
  );
  expect(await covers(page)).not.toEqual(emptyStrip);
  await dismiss(page);
});

for (const width of [320, 360, 375, 390]) {
  for (const size of ['match', 'largest']) {
    test(`at ${width} px, Text size ${size}: the new controls are 44 px and nothing scrolls sideways`, async ({
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
      await openStand(page);
      const big = async (locator: ReturnType<Page['locator']>): Promise<void> => {
        const r = await locator.boundingBox();
        expect(r?.width ?? 0).toBeGreaterThanOrEqual(44);
        expect(r?.height ?? 0).toBeGreaterThanOrEqual(44);
      };
      const noScroll = async (): Promise<void> => {
        const m = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          inner: window.innerWidth,
        }));
        expect(m.scroll).toBeLessThanOrEqual(m.inner);
      };
      await big(page.getByTestId('stand-arrange-hold'));
      for (const b of await page.getByTestId('lanes-strip').getByRole('button').all()) await big(b);
      await noScroll();
      await openSheet(page);
      await page.getByTestId('suggest-layout').click();
      await big(page.getByTestId('suggest-layout'));
      await big(page.getByTestId('use-layout'));
      await noScroll();
      await ctx.close();
    });
  }
}
