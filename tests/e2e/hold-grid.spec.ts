import { expect, test, type Page } from '@playwright/test';
import { tab } from './helpers';
import { clearScenes, load, remembered } from './layout-helpers';

// Plan TL.7 (GDD §9.21): the Hold screen's grid header, its cosmetics, the Act VI frost and the
// lamp, the Hold view setting and the Classic scene. Saves are the played v12 fixture, edited.

const all = ['gatehouse-banners', 'wall-lanterns', 'carved-hearth-hall-door', 'watchtower-bell'];
const grid = (page: Page) => page.locator('[data-hold-grid]');

test('plain: no cosmetics, frost or lamp; pieces and the border strips show', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await load(page, (s) => {
    s.delve.shop.cosmetics = [];
    s.remembering.endings = [];
    s.cycles.forEach((c: { act: number | null }) => (c.act = 1));
  });
  const g = grid(page);
  await expect(g).toBeVisible();
  await expect(g).toHaveAttribute('data-look', 'plain');
  await expect(g).toHaveAttribute('data-door', 'false');
  await expect(g).toHaveAttribute('data-bell', 'none');
  await expect(g.locator('[data-piece="hearth-hall"]')).toHaveCount(1);
  await expect(g.locator('[data-strip]')).toHaveCount(2);
  await expect(g.locator('[data-tile]')).toHaveCount(64);
  await expect(g.locator('[data-ground="outside"]')).toHaveCount(16); // Citadel: 8 × 6 of 64
  await expect(g.locator('[data-frost], [data-lamp], [data-cosmetic]')).toHaveCount(0);
  await expect(g).toContainText('▲ The Fell Breach');
  await expect(g).toContainText('▼ Lowland Gate');
  // Mostly grass, earth and flags sparingly (not a checkerboard).
  const grass = await g.locator('[data-ground="grass"]').count();
  expect(grass).toBeGreaterThan(24);
  // [Layout ▸] is a real button, at least 44 × 44, and nothing in the header is a button.
  const layout = page.locator('[data-layout-button]');
  const box = await layout.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  await expect(g.getByRole('button')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('every cosmetic on the pieces, with the Act VI frost', async ({ page }) => {
  await load(page, (s) => {
    s.delve.shop.cosmetics = all;
    s.remembering.endings = [];
    s.cycles[s.cycles.length - 1].act = 6;
  });
  const g = grid(page);
  await expect(g).toHaveAttribute('data-look', 'frost');
  await expect(g).toHaveAttribute('data-door', 'true');
  await expect(g).toHaveAttribute('data-banners', 'true');
  await expect(g).toHaveAttribute('data-bell', 'tower');
  await expect(g).toHaveAttribute('data-lanterns', 'walls');
  await expect(g.locator('[data-cosmetic="door"]')).toHaveCount(1);
  await expect(g.locator('[data-cosmetic="banners"]')).toHaveCount(1);
  await expect(g.locator('[data-cosmetic="bell"]')).toHaveCount(1);
  const walls = await g.locator('[data-piece^="wall-"]').count();
  expect(walls).toBeGreaterThan(0);
  await expect(g.locator('[data-cosmetic="lanterns"]')).toHaveCount(walls);
  await expect(g.locator('[data-frost="hall"]')).toHaveCount(1);
  await expect(g.locator('[data-frost="wall"]')).toHaveCount(walls);
  await expect(g.locator('[data-lamp]')).toHaveCount(0);
});

test('border cosmetics before any wall or tower, and the lamp after Remember Them', async ({
  page,
}) => {
  await load(
    page,
    (s) => {
      s.delve.shop.cosmetics = all;
      s.buildings.walls = 0;
      s.buildings.watchtower = 0;
    },
    remembered,
  );
  const g = grid(page);
  await expect(g).toHaveAttribute('data-look', 'lamp');
  await expect(g).toHaveAttribute('data-bell', 'border');
  await expect(g).toHaveAttribute('data-lanterns', 'border');
  await expect(g.locator('[data-cosmetic="lanterns-border"]')).toHaveCount(1);
  await expect(g.locator('[data-cosmetic="bell"]')).toHaveCount(1);
  await expect(g.locator('[data-lamp="hall"]')).toHaveCount(1);
  await expect(g.locator('[data-frost]')).toHaveCount(0);
});

test('Hold view: Classic scene shows the pixel scene with its cosmetics, and the choice stays', async ({
  page,
}) => {
  await load(
    page,
    (s) => {
      s.delve.shop.cosmetics = all;
    },
    remembered,
  );
  await expect(grid(page)).toHaveCount(1);
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  await page.getByRole('button', { name: 'Classic scene', exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await tab(page, 'Hold').click();
  await expect(grid(page)).toHaveCount(0);
  await expect(page.locator('img[src*="scenes/cosmetics/"]')).toHaveCount(4);
  await expect(
    page.locator('img[src*="scene.look"], img[src*="scenes/look"]').first(),
  ).toBeVisible();
  // [Layout ▸] stays beside [Rank ▸]; it opens the sheet.
  await expect(page.getByRole('button', { name: /^Rank/ }).first()).toBeVisible();
  await page.locator('[data-layout-button]').click();
  await expect(page.getByRole('dialog', { name: 'Arrange Hold' })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  // The choice is kept across a reload.
  await page.reload();
  await clearScenes(page);
  await expect(grid(page)).toHaveCount(0);
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  await expect(page.getByRole('button', { name: 'Classic scene', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('the grid fits at 320 px with no sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await load(page, () => {});
  const { scroll, inner } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(inner);
  const box = await grid(page).boundingBox();
  expect(box?.width ?? 0).toBeLessThanOrEqual(320);
});
