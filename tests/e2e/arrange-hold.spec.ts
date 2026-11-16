import { expect, test, type Locator, type Page } from '@playwright/test';
import { tab } from './helpers';
import { clearScenes, fixture, load } from './layout-helpers';
import { scanContrast } from './polish-contrast';
import { scanTappables } from './polish-tap';
import { overflow } from './polish-text';

// Plan TL.8 & T18.6 (GDD §9.21): the Arrange Hold sheet on the played v12 save (Citadel, 8 × 10 open)
// and v11 save (Bastion, 8 × 12 open), expanded to 8 × 12 with tactical overlays, Presets and modes.

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
    /^Citadel · 8×10 open · \d+\/\d+ placed$/,
  );
  await expect(sheet).toContainText('▲ The Fell Breach');
  await expect(sheet).toContainText('▼ Lowland Gate');
  await expect(sheet.locator('[data-tactics-bar]')).toContainText(
    /Hearth Hall: (Warded|Exposed) · \d+ linked · \d+ Screened/,
  );
  await expect(sheet.locator('[data-info-bar]')).toHaveText(
    'Tap an active piece or tray item to select',
  );
  await expect(sheet.locator('[data-tile]')).toHaveCount(96);
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
  expect((await where(sheet, 'hearth-hall')).sort()).toEqual(['3,6', '3,7', '4,6', '4,7']);
  await tile(sheet, 3, 6).click();
  await expect(sheet.locator('[data-tile][data-selected="true"]')).toHaveCount(4);
  await expect(sheet.getByRole('button', { name: 'Move to tray' })).toHaveCount(0);
  await tile(sheet, 3, 5).click();
  expect((await where(sheet, 'hearth-hall')).sort()).toEqual(['3,5', '3,6', '4,5', '4,6']);
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
  const box = await tile(sheet, 7, 11).boundingBox();
  expect(Math.round(box?.width ?? 0)).toBeGreaterThanOrEqual(44);
  expect(Math.round(box?.height ?? 0)).toBeGreaterThanOrEqual(44);
  const { scroll, inner } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(inner);
  await tab(page, 'Hold');
});

test('360 and 390 px have zero horizontal scroll on Match and Largest text; 320 px Largest text fits', async ({
  page,
}) => {
  await load(page, () => {}, fixture('v11'));
  await page.locator('[data-layout-button]').click();
  const sheet = page.getByRole('dialog', { name: 'Arrange Hold' });
  await expect(sheet).toBeVisible();

  for (const textSize of ['match', 'largest'] as const) {
    await page.evaluate((sz) => {
      document.documentElement.dataset.textSize = sz;
    }, textSize);
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 844 });
      const m = await page.evaluate(() => {
        const scroller = document.querySelector('[data-internal-scroll="true"]');
        const dlg = document.querySelector('[role="dialog"]');
        return {
          pageScroll: document.documentElement.scrollWidth,
          inner: window.innerWidth,
          dlgScroll: dlg?.scrollWidth ?? 0,
          dlgClient: dlg?.clientWidth ?? 0,
          gridScroll: scroller?.scrollWidth ?? 0,
          gridClient: scroller?.clientWidth ?? 0,
        };
      });
      expect(m.pageScroll, `page @${width} ${textSize}`).toBeLessThanOrEqual(m.inner);
      expect(m.dlgScroll, `sheet @${width} ${textSize}`).toBeLessThanOrEqual(m.dlgClient);
      expect(m.gridScroll, `grid scroller @${width} ${textSize}`).toBeLessThanOrEqual(m.gridClient);
    }
  }

  // 320 px with Largest text size: page/sheet never spill, tiles stay >= 44px, controls fit & meet contrast.
  await page.setViewportSize({ width: 320, height: 700 });
  const over = await overflow(page);
  expect(over.page).toBeNull();
  expect(over.clipped).toEqual([]);
  const tap = await scanTappables(page);
  expect(tap.scanned).toBeGreaterThan(100);
  expect(tap.small).toEqual([]);
  expect(tap.covered).toEqual([]);
  expect(tap.outside).toEqual([]);
  const contrast = await scanContrast(page);
  expect(contrast.failing).toEqual([]);
  await page.evaluate(() => (document.documentElement.dataset.theme = 'light'));
  const lightContrast = await scanContrast(page);
  expect(lightContrast.failing).toEqual([]);
  const cornerTile = await tile(sheet, 7, 11).boundingBox();
  expect(Math.round(cornerTile?.width ?? 0)).toBeGreaterThanOrEqual(44);
  expect(Math.round(cornerTile?.height ?? 0)).toBeGreaterThanOrEqual(44);
});

test('live tactical indicators update on move/arrange and keep zero motion under Reduce Motion', async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    baseURL: 'http://localhost:4173/the-last-hold/',
  });
  const page = await ctx.newPage();
  await load(
    page,
    (s) => {
      s.buildings.walls = 15;
      s.buildings.watchtower = 15;
    },
    fixture('v11'),
  );
  await page.locator('[data-layout-button]').click();
  const sheet = page.getByRole('dialog', { name: 'Arrange Hold' });
  await expect(sheet).toBeVisible();

  // Clear to tray leaves only Hearth Hall -> Exposed, 0 links, 0 Screened.
  await sheet.getByRole('button', { name: 'Clear to tray…' }).click();
  await sheet.getByRole('alertdialog').getByRole('button', { name: 'Clear to tray' }).click();
  await expect(sheet.locator('[data-hall-ward="exposed"]')).toHaveCount(1);
  await expect(sheet.locator('[data-tactics-bar]')).toContainText(
    'Hearth Hall: Exposed · 0 linked · 0 Screened',
  );
  await expect(sheet.locator('[data-adj-link]')).toHaveCount(0);
  await expect(sheet.locator('[data-screened-tower]')).toHaveCount(0);

  // Fortress auto-arrange creates AoE links, Screened towers, and a Warded enclosure.
  await sheet.getByRole('button', { name: 'Fortress', exact: true }).click();
  await sheet.getByRole('button', { name: 'Auto-arrange' }).click();
  await expect(sheet.locator('[data-hall-ward="warded"]')).toHaveCount(1);
  expect(await sheet.locator('[data-adj-link]').count()).toBeGreaterThan(0);
  expect(await sheet.locator('[data-adj-badge]').count()).toBeGreaterThan(0);
  expect(await sheet.locator('[data-screened-tower]').count()).toBeGreaterThan(0);
  await expect(sheet.locator('[data-tile][data-warded="true"]').first()).toBeVisible();
  await expect(sheet.locator('[data-tactics-bar]')).toContainText(/Hearth Hall: Warded/);

  // Selecting an active screened watchtower reports its live tactical status in info bar.
  const firstScreenedId = await sheet
    .locator('[data-screened-tower]')
    .first()
    .getAttribute('data-screened-tower');
  const [towerTile] = await where(sheet, firstScreenedId ?? '');
  await sheet.locator(`[data-tile="${towerTile}"]`).click();
  await expect(sheet.locator('[data-selected-tactics]')).toContainText('Screened');
  // Deselect tower before clicking the wall at (0, 0).
  await sheet.locator(`[data-tile="${towerTile}"]`).click();

  // Removing one north-curtain wall breaches the ward live -> Hearth Hall flips to Exposed.
  await tile(sheet, 0, 0).click();
  await sheet.getByRole('button', { name: 'Move to tray' }).click();
  await expect(sheet.locator('[data-hall-ward="exposed"]')).toHaveCount(1);
  await expect(sheet.locator('[data-tactics-bar]')).toContainText(/Hearth Hall: Exposed/);

  // Reduce Motion compliance: zero CSS animations anywhere on the tactical overlays.
  expect(
    await page.evaluate(() =>
      [
        ...document.querySelectorAll('[data-hall-ward], [data-adj-badge], [data-screened-tower]'),
      ].every((el) => getComputedStyle(el).animationName === 'none'),
    ),
  ).toBe(true);
  await ctx.close();
});

test('mode selector and 2-slot Preset bar save, swap, persist across reload, and feed Suggest layout', async ({
  page,
}) => {
  const snapshot = async (sheet: Locator): Promise<string[]> =>
    sheet
      .locator('button[data-tile]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-piece') ?? ''));

  await load(
    page,
    (s) => {
      s.buildings.walls = 15;
      s.buildings.watchtower = 15;
    },
    fixture('v11'),
  );
  await page.locator('[data-layout-button]').click();
  const sheet = page.getByRole('dialog', { name: 'Arrange Hold' });
  await expect(sheet).toBeVisible();

  // Default state: Balanced active, Slot 1 & Slot 2 Empty with Apply disabled.
  await expect(sheet.getByRole('button', { name: 'Balanced', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(sheet.locator('[data-preset-status="1"]')).toHaveText('Empty');
  await expect(sheet.locator('[data-preset-status="2"]')).toHaveText('Empty');
  await expect(sheet.getByRole('button', { name: 'Apply Slot 1' })).toBeDisabled();
  await expect(sheet.getByRole('button', { name: 'Apply Slot 2' })).toBeDisabled();

  // Tapping Economy does NOT alter placed pieces until Auto-arrange is tapped.
  const beforeBoard = await snapshot(sheet);
  await sheet.getByRole('button', { name: 'Economy', exact: true }).click();
  await expect(sheet.getByRole('button', { name: 'Economy', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await snapshot(sheet)).toEqual(beforeBoard);

  // Auto-arrange in Economy and save to Slot 1.
  await sheet.getByRole('button', { name: 'Auto-arrange' }).click();
  const econBoard = await snapshot(sheet);
  await sheet.getByRole('button', { name: 'Save Slot 1' }).click();
  await expect(sheet.locator('[data-preset-status="1"]')).toHaveText(/^\d+ placed$/);
  await expect(sheet.getByRole('button', { name: 'Apply Slot 1' })).toBeEnabled();

  // Switch to Fortress, Auto-arrange, and save to Slot 2.
  await sheet.getByRole('button', { name: 'Fortress', exact: true }).click();
  await sheet.getByRole('button', { name: 'Auto-arrange' }).click();
  const fortBoard = await snapshot(sheet);
  expect(fortBoard).not.toEqual(econBoard);
  await sheet.getByRole('button', { name: 'Save Slot 2' }).click();
  await expect(sheet.locator('[data-preset-status="2"]')).toHaveText(/^\d+ placed$/);

  // Swap Slot 1 <-> Slot 2 cleanly.
  await sheet.getByRole('button', { name: 'Apply Slot 1' }).click();
  expect(await snapshot(sheet)).toEqual(econBoard);
  await sheet.getByRole('button', { name: 'Apply Slot 2' }).click();
  expect(await snapshot(sheet)).toEqual(fortBoard);

  // Selected mode also feeds Suggest layout cleanly.
  await sheet.getByTestId('suggest-layout').click();
  expect(await sheet.locator('[data-suggest-target]').count()).toBeGreaterThan(0);

  // Presets persist across reload.
  await page.waitForTimeout(1500);
  await page.reload();
  await clearScenes(page);
  await page.locator('[data-layout-button]').click();
  const reopened = page.getByRole('dialog', { name: 'Arrange Hold' });
  await expect(reopened.locator('[data-preset-status="1"]')).toHaveText(/^\d+ placed$/);
  await expect(reopened.locator('[data-preset-status="2"]')).toHaveText(/^\d+ placed$/);
  await reopened.getByRole('button', { name: 'Apply Slot 1' }).click();
  expect(await snapshot(reopened)).toEqual(econBoard);
});
