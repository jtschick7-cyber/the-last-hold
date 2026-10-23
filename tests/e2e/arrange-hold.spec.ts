import { expect, test, type Locator, type Page } from '@playwright/test';
import { tab } from './helpers';
import { load } from './layout-helpers';

// Plan TL.8 (GDD §9.21): the Arrange Hold sheet, on the played v12 save (Citadel, 8 × 6 open).

const open = async (page: Page): Promise<Locator> => {
  await load(page, () => {});
  await page.locator('[data-layout-button]').click();
  const sheet = page.getByRole('dialog', { name: 'Arrange Hold' });
  await expect(sheet).toBeVisible();
  return sheet;
};
const tile = (sheet: Locator, x: number, y: number) => sheet.locator(`[data-tile="${x},${y}"]`);
const where = async (sheet: Locator, id: string): Promise<string[]> =>
  sheet
    .locator(`[data-piece="${id}"]`)
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-tile') ?? ''));
const trayCount = async (sheet: Locator): Promise<number> =>
  Number(
    ((await sheet.locator('[data-tray-header]').textContent()) ?? '').match(
      /unplaced: (\d+)/,
    )?.[1] ?? -1,
  );
/** A free tile inside the clearing. */
const freeTile = async (sheet: Locator): Promise<string> => {
  const t = sheet.locator('[data-piece=""][data-locked="false"]').first();
  return (await t.getAttribute('data-tile')) ?? '';
};
const xy = (t: string): [number, number] => {
  const [x, y] = t.split(',').map(Number);
  return [x ?? 0, y ?? 0];
};

test('opens with the summary, an empty-selection line and a tray', async ({ page }) => {
  const sheet = await open(page);
  await expect(sheet.locator('[data-subtitle]')).toHaveText(
    /^Citadel · 8×6 open · \d+\/\d+ placed$/,
  );
  await expect(sheet).toContainText('▲ The Fell Breach');
  await expect(sheet).toContainText('▼ Lowland Gate');
  await expect(sheet.locator('[data-info-bar]')).toHaveText(
    'Tap an active piece or tray item to select',
  );
  await expect(sheet.locator('[data-tile]')).toHaveCount(64);
  await expect(sheet.locator('[data-tray-header]')).toHaveText(/^TRAY \(unplaced: \d+\)$/);
});

test('select, move to an open tile, swap, and a locked tile', async ({ page }) => {
  const sheet = await open(page);
  const [smithyAt] = await where(sheet, 'smithy');
  await sheet.locator(`[data-tile="${smithyAt}"]`).click();
  await expect(sheet.locator('[data-info-bar]')).toContainText(/^Selected: Smithy \(Tier \d\)/);
  await expect(sheet.locator('[data-info-bar]')).toContainText('Tap an open tile to move or swap');
  // Tapping the selected piece again lets go of it.
  await sheet.locator(`[data-tile="${smithyAt}"]`).click();
  await expect(sheet.locator('[data-info-bar]')).toHaveText(
    'Tap an active piece or tray item to select',
  );
  await sheet.locator(`[data-tile="${smithyAt}"]`).click();
  const free = await freeTile(sheet);
  const [fx, fy] = xy(free);
  await tile(sheet, fx, fy).click();
  expect(await where(sheet, 'smithy')).toEqual([free]);
  expect(await where(sheet, 'smithy')).not.toContain(smithyAt);

  // Swap: the Mill and the Sawpit trade places.
  const [millAt] = await where(sheet, 'mill');
  const [sawAt] = await where(sheet, 'sawpit');
  await sheet.locator(`[data-tile="${millAt}"]`).click();
  await sheet.locator(`[data-tile="${sawAt}"]`).click();
  expect(await where(sheet, 'mill')).toEqual([sawAt]);
  expect(await where(sheet, 'sawpit')).toEqual([millAt]);

  // A tile outside the Citadel's clearing says which Rank clears it, and places nothing.
  await tile(sheet, 0, 0).click();
  await expect(sheet.locator('[data-info-bar]')).toHaveText('Clears at Bastion');
  expect(await where(sheet, 'mill')).toEqual([sawAt]);
});

test('the Hearth Hall moves as 2 × 2, and Move to tray is not offered for it', async ({ page }) => {
  const sheet = await open(page);
  expect(await where(sheet, 'hearth-hall')).toHaveLength(4);
  await tile(sheet, 3, 3).click();
  await expect(sheet.locator('[data-tile][data-selected="true"]')).toHaveCount(4);
  await expect(sheet.getByRole('button', { name: 'Move to tray' })).toHaveCount(0);
  await tile(sheet, 3, 2).click();
  expect((await where(sheet, 'hearth-hall')).sort()).toEqual(['3,2', '3,3', '4,2', '4,3']);
  // Whatever stood in those tiles is still on the grid or in the tray: nothing was lost.
  const placed = await sheet.locator('[data-tile]:not([data-piece=""])').count();
  expect(placed).toBeGreaterThan(4);
});

test('Move to tray, then a tray item back onto the grid', async ({ page }) => {
  const sheet = await open(page);
  const before = await trayCount(sheet);
  const [at] = await where(sheet, 'lodge');
  await sheet.locator(`[data-tile="${at}"]`).click();
  await sheet.getByRole('button', { name: 'Move to tray' }).click();
  expect(await trayCount(sheet)).toBe(before + 1);
  expect(await where(sheet, 'lodge')).toEqual([]);
  await sheet.locator('[data-tray-item="lodge"]').click();
  await expect(sheet.locator('[data-info-bar]')).toContainText(/^Selected: /);
  const free = await freeTile(sheet);
  const [fx, fy] = xy(free);
  await tile(sheet, fx, fy).click();
  expect(await where(sheet, 'lodge')).toEqual([free]);
  expect(await trayCount(sheet)).toBe(before);
});

test('Auto-arrange, Clear to tray (cancel then confirm) and the ghosts switch', async ({
  page,
}) => {
  const sheet = await open(page);
  await sheet.getByRole('button', { name: 'Clear to tray…' }).click();
  await expect(sheet.getByRole('alertdialog')).toContainText(
    'Move all placed buildings except the Hearth Hall to the tray? Dormant blueprint outlines will be cleared.',
  );
  await sheet.getByRole('button', { name: 'Cancel' }).click();
  await expect(sheet.getByRole('alertdialog')).toHaveCount(0);
  const placedBefore = await sheet.locator('[data-tile]:not([data-piece=""])').count();
  expect(placedBefore).toBeGreaterThan(4);

  await sheet.getByRole('button', { name: 'Clear to tray…' }).click();
  await sheet.getByRole('button', { name: 'Clear to tray', exact: true }).click();
  await expect(sheet.locator('[data-tile]:not([data-piece=""])')).toHaveCount(4); // the Hall only
  expect(await trayCount(sheet)).toBeGreaterThan(10);

  await sheet.getByRole('button', { name: 'Auto-arrange' }).click();
  expect(await trayCount(sheet)).toBe(0);
  expect(await sheet.locator('[data-tile]:not([data-piece=""])').count()).toBe(placedBefore);

  const off = sheet
    .getByRole('group', { name: 'Blueprint ghosts' })
    .getByRole('button', { name: 'Off' });
  await off.click();
  await expect(off).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('[data-hold-grid]')).toHaveAttribute('data-ghosts', '0');
  // The badge: nothing in the tray, so the plain label.
  await expect(page.locator('[data-layout-button]')).toHaveText('Layout ▸');
});

test('the Layout badge counts the tray', async ({ page }) => {
  const sheet = await open(page);
  const [at] = await where(sheet, 'mill');
  await sheet.locator(`[data-tile="${at}"]`).click();
  await sheet.getByRole('button', { name: 'Move to tray' }).click();
  const n = await trayCount(sheet);
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('[data-layout-button]')).toHaveText(`Layout (${n}) ▸`);
});

test('at 320 px the tiles keep 44 × 44 inside their own scroll box; the page does not scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const sheet = await open(page);
  await expect(sheet.locator('[data-internal-scroll="true"]')).toHaveCount(1);
  const box = await tile(sheet, 7, 7).boundingBox();
  expect(Math.round(box?.width ?? 0)).toBeGreaterThanOrEqual(44);
  expect(Math.round(box?.height ?? 0)).toBeGreaterThanOrEqual(44);
  const { scroll, inner } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(inner);
  await tab(page, 'Hold');
});
