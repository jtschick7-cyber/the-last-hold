import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { roll } from '../../src/content/story/roll';
import { begin, closeOrdersScenes, debugPress, onwardAll, tab } from './helpers';

// Plan T11.16 (GDD §9.19, §6.5): the Remembering on the real production build, at the narrowest
// phone, a normal phone and the 900 and 1300 px breakpoints: no sideways scroll with the card, the
// near-scene, the reading and every ending card open; all 40 names with their village lines fit; and
// the time from the tap to the first name painted (a proposed §6.5 row, D464 (5)).

const shot = async (page: Page, name: string): Promise<void> => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}.png` });
};

const save = JSON.parse(
  readFileSync(new URL('../saves/fixtures/v11.json', import.meta.url), 'utf8'),
);

const SIZES = [
  { width: 320, height: 640 },
  { width: 360, height: 740 },
  { width: 900, height: 800 },
  { width: 1300, height: 800 },
];

/** No sideways scroll on the page, and nothing in the open sheet wider than the sheet. */
const fits = async (page: Page, what: string): Promise<void> => {
  const original = page.viewportSize() ?? SIZES[1];
  for (const size of SIZES) {
    await page.setViewportSize(size);
    const r = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"]');
      return {
        scroll: document.documentElement.scrollWidth,
        inner: window.innerWidth,
        dialog: dlg ? { scroll: dlg.scrollWidth, client: dlg.clientWidth } : null,
      };
    });
    expect(r.scroll, `${what} at ${size.width}px: page`).toBeLessThanOrEqual(r.inner);
    if (r.dialog)
      expect(r.dialog.scroll, `${what} at ${size.width}px: sheet`).toBeLessThanOrEqual(
        r.dialog.client,
      );
  }
  if (original) await page.setViewportSize(original);
};

const importSave = async (page: Page): Promise<void> => {
  await page.goto('./?debug');
  await begin(page, 'Mira');
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Save/ }).first().click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(save)),
  });
  await page.getByRole('button', { name: 'Yes, load it' }).click();
  await page.waitForTimeout(800);
};

/** Closes the away sheet and the scenes that come first (Onward, the Orders' scenes) until the Hold is clean. */
const clearSheets = async (page: Page): Promise<void> => {
  for (let i = 0; i < 4; i++) {
    await onwardAll(page);
    await closeOrdersScenes(page);
    const close = page.getByRole('button', { name: 'Close' }).first();
    if (!(await close.isVisible().catch(() => false))) return;
    await close.click();
  }
};

test('the card, the near-scene, the reading and every ending card fit', async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 360, height: 740 });
  await importSave(page);
  await clearSheets(page);

  // Not ready: Act VI's stand is made, the gate is closed. The near-scene plays on the Hold.
  await debugPress(page, 'Finish Act VI');
  await tab(page, 'Hold').click();
  const near = page.getByRole('dialog', { name: 'The line along the wall' });
  await expect(near).toBeVisible({ timeout: 15_000 });
  await fits(page, 'R-01');
  await shot(page, 'remembering-near');
  await near.getByRole('button', { name: 'Continue' }).click();
  // Other scenes (the away sheet, a new warden) may follow; the card is on the Hold screen.
  await clearSheets(page);
  const card = page.getByRole('region', { name: 'The Remembering' });
  await card.scrollIntoViewIfNeeded();
  await expect(card.getByText(/Names found:/)).toBeVisible();
  await fits(page, 'the card, not open');
  await shot(page, 'remembering-card-closed');

  // The gate opens: the card's two choices.
  await debugPress(page, 'Open the gate');
  await tab(page, 'Hold').click();
  await card.scrollIntoViewIfNeeded();
  await expect(card.getByRole('button', { name: 'Remember Them' })).toBeVisible();
  await fits(page, 'the card, open');
  await shot(page, 'remembering-card-open');

  // Remember Them: R-03, then the reading, timed from the tap to the first name painted.
  await card.getByRole('button', { name: 'Remember Them' }).click();
  const roller = page.getByRole('dialog', { name: 'The roll' });
  await expect(roller).toBeVisible();
  await fits(page, 'R-03');
  const first = roll.slice().sort((a, b) => a.year - b.year)[0];
  if (!first) throw new Error('empty roll');
  await page.evaluate((firstName) => {
    const w = window as unknown as { __t0: number; __t1: number };
    w.__t0 = 0;
    w.__t1 = 0;
    document.addEventListener(
      'click',
      () => {
        w.__t0 = performance.now();
      },
      { capture: true, once: true },
    );
    const seen = (): boolean =>
      [...document.querySelectorAll('h3')].some((h) => h.textContent === firstName);
    const mo = new MutationObserver(() => {
      if (!w.__t1 && w.__t0 && seen()) {
        // The paint after the DOM change: the next frame.
        requestAnimationFrame(() => {
          w.__t1 = performance.now();
        });
        mo.disconnect();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }, first.name);
  // The tap is timed on a 4× slower CPU, as the other §6.5 rows are (a stand-in for a mid-range phone).
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await roller.getByRole('button', { name: 'Continue' }).click();
  const reading = page.getByRole('dialog', { name: 'The reading' });
  await expect(reading.getByRole('heading', { name: first.name })).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __t1: number }).__t1 > 0);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const startMs = await page.evaluate(() => {
    const w = window as unknown as { __t0: number; __t1: number };
    return w.__t1 - w.__t0;
  });
  console.log(`reading start (tap to first name painted, 4× slowdown): ${startMs.toFixed(1)} ms`);

  // All 40 names with their village lines, at every size: tap through them in order.
  const ordered = roll.slice().sort((a, b) => a.year - b.year);
  for (let i = 0; i < ordered.length; i++) {
    const r = ordered[i];
    if (!r) continue;
    await expect(reading.getByRole('heading', { name: r.name })).toBeVisible();
    await expect(reading.getByText(/onward, year \d+ of the order\./)).toBeVisible();
    if (i === 0 || i === 19 || i === 39) await fits(page, `reading name ${i + 1}`);
    // The tightest widths for every name.
    for (const width of [320, 360]) {
      await page.setViewportSize({ width, height: 740 });
      const box = await reading.getByRole('heading', { name: r.name }).boundingBox();
      const dlg = await reading.boundingBox();
      expect(box, r.name).not.toBeNull();
      if (box && dlg) {
        expect(box.x, `${r.name} at ${width}`).toBeGreaterThanOrEqual(dlg.x);
        expect(box.x + box.width, `${r.name} at ${width}`).toBeLessThanOrEqual(dlg.x + dlg.width);
      }
    }
    await page.setViewportSize({ width: 360, height: 740 });
    if (i === 20) await shot(page, 'remembering-reading');
    if (i < ordered.length - 1) await reading.getByText('Tap for the next name.').click();
  }
  // One more tap: the Unlit's line.
  await reading.getByText('Tap for the next name.').click();
  await expect(reading.getByText(/Forty\. Known, every one/)).toBeVisible();
  await fits(page, 'the Unlit’s line');
  await shot(page, 'remembering-unlit');
  await reading.getByRole('button', { name: 'Continue' }).click();

  // The rest of the ending, card by card.
  for (let i = 0; i < 12; i++) {
    const dlg = page.getByRole('dialog');
    if (
      !(await dlg
        .first()
        .isVisible()
        .catch(() => false))
    )
      break;
    const label = await dlg.first().getAttribute('aria-label');
    await fits(page, `ending card ${label}`);
    await shot(page, `remembering-card-${i}`);
    await dlg.first().getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(150);
  }
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // After: the card's last form, the Library shelf and the Rime shelf.
  await tab(page, 'Hold').click();
  await card.scrollIntoViewIfNeeded();
  await expect(card.getByRole('button', { name: 'Read it again' })).toBeVisible();
  await fits(page, 'the card, after Remember Them');
  await shot(page, 'remembering-card-after');
  await tab(page, 'Archive').click();
  await page.getByRole('button', { name: 'Library' }).click();
  await expect(page.getByRole('button', { name: /The reading/ })).toBeVisible();
  await fits(page, 'the Library shelf');
  await shot(page, 'remembering-library');
  expect(errors).toEqual([]);
});

test('the Names view lists all 40 with their village lines and fits', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 360, height: 740 });
  await importSave(page);
  await clearSheets(page);
  await debugPress(page, 'Open the gate');
  await tab(page, 'Archive').click();
  await page.getByRole('button', { name: 'Names', exact: true }).click();
  const list = page.getByRole('region', { name: 'Names' });
  await expect(list.getByRole('listitem')).toHaveCount(40);
  await expect(list.getByText(/onward, year \d+ of the order\./)).toHaveCount(40);
  await fits(page, 'the Names view');
  await shot(page, 'remembering-names');
  expect(errors).toEqual([]);
});
