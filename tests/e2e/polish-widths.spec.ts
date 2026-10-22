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
