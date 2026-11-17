import { expect, test } from '@playwright/test';
import { begin, tab } from './helpers';
import { dismiss, loadFixture, tolerantClicks } from './polish-screens';

// Plan TV.3b (GDD §9.20): at 320, 360, 900 and 1300 px a plain window (not phone emulation, which
// widens itself to fit and hides sideways scroll) never scrolls sideways, the bottom bar sits inside
// the window, and the four Archive section tabs are all inside it.

const WIDTHS = [320, 360, 900, 1300];
const SECTIONS = ['Bestiary', 'Library', 'Accounts', 'Names'];
const BASE = 'http://localhost:4173/the-last-hold/';

const noSideways = async (page: import('@playwright/test').Page, where: string): Promise<void> => {
  const m = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(m.scroll, `${where}: page width`).toBeLessThanOrEqual(m.inner);
};

test('a brand-new game does not scroll sideways, and the bar fits', async ({ browser }) => {
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 740 }, baseURL: BASE });
    const page = await ctx.newPage();
    await page.goto('./');
    await begin(page, 'Mira');
    await page.waitForTimeout(300);
    await noSideways(page, `new game @${width}`);
    for (const b of await page
      .getByRole('navigation', { name: 'Screens' })
      .getByRole('button')
      .all()) {
      const box = await b.boundingBox();
      expect(box, `bar tab @${width}`).not.toBeNull();
      expect((box?.x ?? 0) + (box?.width ?? 0), `bar tab @${width}`).toBeLessThanOrEqual(
        width + 0.5,
      );
    }
    await ctx.close();
  }
});

test('the four Archive tabs are inside the window', async ({ browser }) => {
  test.setTimeout(120_000);
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, baseURL: BASE });
  const page = await ctx.newPage();
  tolerantClicks(page);
  await loadFixture(page, 'v11');
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 740 });
    await dismiss(page);
    await tab(page, 'Archive').click();
    for (const s of SECTIONS) {
      const box = await page.getByRole('button', { name: s, exact: true }).boundingBox();
      expect(box, `${s} @${width}`).not.toBeNull();
      expect(box?.x ?? -1, `${s} left @${width}`).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0), `${s} right @${width}`).toBeLessThanOrEqual(
        width + 0.5,
      );
    }
    for (const s of SECTIONS) {
      await page.getByRole('button', { name: s, exact: true }).click();
      await noSideways(page, `Archive ${s} @${width}`);
    }
  }
  await ctx.close();
});

test('the v1.8 Hold Grid, Arrange Hold (8 × 12), and Hold Look do not scroll sideways across 320–1300 px', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, baseURL: BASE });
  const page = await ctx.newPage();
  tolerantClicks(page);
  await loadFixture(page, 'v16-played');
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 740 });
    await dismiss(page);
    await tab(page, 'Hold').click();
    await noSideways(page, `Hold Grid @${width}`);
    await page.getByRole('button', { name: /^Layout/ }).click();
    await noSideways(page, `Arrange Hold @${width}`);
    await page.getByRole('button', { name: 'Close' }).last().click();
    await page.locator('[data-hold-look-button="hold"]').click();
    await noSideways(page, `Hold Look @${width}`);
    await page.getByRole('button', { name: 'Close' }).last().click();
  }
  await ctx.close();
});

test('the v1.9 Great Beasts, Hut brew breakdown, Emberwright Plate, and PreparationPicker do not scroll sideways across 320–1300 px', async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, baseURL: BASE });
  const page = await ctx.newPage();
  tolerantClicks(page);
  await loadFixture(page, 'v16-owner:v19');
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 740 });
    await dismiss(page);
    await tab(page, 'Hold').click();
    await noSideways(page, `Hold 8 marks @${width}`);

    await page.locator('[data-hold-look-button="hold"]').click();
    await noSideways(page, `Hold Look 8 marks @${width}`);
    await dismiss(page);

    await page.getByRole('button', { name: /^The Great Beast/ }).click();
    await noSideways(page, `Beacon-Bane sheet @${width}`);
    await page.getByRole('button', { name: 'Send a party' }).click();
    await noSideways(page, `Beacon-Bane party @${width}`);
    await dismiss(page);

    await page.getByRole('button', { name: 'Open' }).first().click();
    await noSideways(page, `Hut brew @${width}`);
    await page.getByTestId('brew-time-line').getByLabel('Show breakdown').click();
    await noSideways(page, `Hut brew breakdown @${width}`);
    await dismiss(page);

    await tab(page, 'Contracts').click();
    await page
      .getByRole('listitem')
      .filter({ hasText: /Draugr \(/ })
      .first()
      .getByRole('button', { name: 'Prepare' })
      .click();
    const prep = page.getByRole('dialog').last();
    await prep.getByLabel('Oil').first().selectOption('grave-oil');
    await prep.getByLabel('Bomb 1').selectOption('saltburst');
    await prep.getByLabel('Bomb 2').selectOption('poppy-smoke');
    await noSideways(page, `Launch prep v1.9 @${width}`);
    await dismiss(page);

    await tab(page, 'Hunters').click();
    await page.getByRole('button', { name: /^Arvid/ }).click();
    await noSideways(page, `Arvid Emberwright Plate @${width}`);
    await dismiss(page);

    await tab(page, 'Archive').click();
    await page.getByRole('button', { name: 'Bestiary', exact: true }).click();
    await noSideways(page, `Bestiary Great Beasts @${width}`);
    await page.getByRole('button', { name: 'The Beacon-Bane' }).click();
    await noSideways(page, `Bestiary Beacon-Bane @${width}`);
    await dismiss(page);
  }
  await ctx.close();
});
