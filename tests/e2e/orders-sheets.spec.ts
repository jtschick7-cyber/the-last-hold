import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { begin, tab } from './helpers';

// Plan T10.13 (GDD §9.18): the Orders card, the opening scenes, the "Seat your Orders" step and a
// seat change, on the real production build with the owner's save (it is past the Moot's trigger, so
// the Orders open on load). Taps are counted from the Hold screen.

const shot = async (page: Page, name: string): Promise<void> => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}.png` });
};

const owner = JSON.parse(
  readFileSync(new URL('../saves/fixtures/v8-owner.json', import.meta.url), 'utf8'),
);

const importOwner = async (page: Page): Promise<void> => {
  await page.goto('./?debug');
  await begin(page, 'Mira');
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Save/ }).first().click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(owner)),
  });
  await page.getByRole('button', { name: 'Yes, load it' }).click();
  await page.waitForTimeout(800);
};

const noSideways = async (page: Page): Promise<void> => {
  const { scroll, inner } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(inner);
};

// Closes whatever sheets and scenes come first (away sheet, events scene) until the Orders' own
// opening scene shows.
const untilOpening = async (page: Page): Promise<void> => {
  const scene = page.getByRole('dialog', { name: 'A seat at the table' });
  for (let i = 0; i < 8 && !(await scene.isVisible().catch(() => false)); i++) {
    const onward = page.getByRole('button', { name: 'Onward' });
    const close = page.getByRole('button', { name: 'Close' });
    if (await onward.isVisible().catch(() => false)) await onward.click();
    else if (
      await close
        .first()
        .isVisible()
        .catch(() => false)
    )
      await close.first().click();
    await page.waitForTimeout(400);
  }
  await expect(scene).toBeVisible();
};

test('the Order sheet, a chapter, the shelf and unseating', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await importOwner(page);
  await untilOpening(page);
  const clear = async (): Promise<void> => {
    for (let i = 0; i < 6; i++) {
      const b = page.getByRole('button', { name: /^(Not now|Continue)$/ });
      if (await b.isVisible().catch(() => false)) await b.click();
      await page.waitForTimeout(300);
    }
  };
  await clear();
  const step = page.getByRole('dialog', { name: 'Seat your Orders' });
  await expect(step).toBeVisible();

  // Seating the Moot in the step makes its first chapter playable: it opens after the step closes.
  await step.getByRole('checkbox').first().check();
  await step.getByRole('button', { name: 'Done' }).click();
  const chapter = page.getByRole('dialog', { name: 'A table at the gate' });
  await expect(chapter).toBeVisible();
  await shot(page, 'orders-chapter');
  await chapter.getByText('Close', { exact: true }).click();
  await expect(chapter).toHaveCount(0);

  // The Order sheet from the card: levels with real numbers, chapters, and the standing's breakdown.
  await tab(page, 'Hold').click();
  const card = page.getByRole('region', { name: 'Orders' });
  await card.getByRole('button', { name: /Thanes' Moot/ }).click();
  const sheet = page.getByRole('dialog', { name: "Thanes' Moot" });
  await expect(sheet.getByText('−3% food for provisions')).toBeVisible();
  await expect(sheet.getByText('−12% food for provisions')).toBeVisible();
  await expect(sheet.getByText('A table at the gate')).toBeVisible();
  await expect(sheet.getByText(/Next level at /)).toBeVisible();
  await shot(page, 'orders-sheet');
  for (const size of [
    { width: 360, height: 740 },
    { width: 900, height: 800 },
    { width: 1300, height: 800 },
  ]) {
    await page.setViewportSize(size);
    await noSideways(page);
  }
  await page.setViewportSize({ width: 360, height: 740 });
  await sheet.getByRole('button', { name: 'Unseat' }).click();
  await expect(sheet.getByText('You keep your standing and chapters.')).toBeVisible();
  await expect(sheet.getByText(/^Can change in /)).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).first().click();

  // The shelf: one entry, with the seats it was read with, and it opens again.
  await tab(page, 'Archive').click();
  const shelf = page.getByRole('region', { name: 'Orders' });
  await expect(shelf.getByText("read with Thanes' Moot")).toBeVisible();
  await shelf.getByRole('button', { name: /A table at the gate/ }).click();
  await expect(page.getByRole('dialog', { name: 'A table at the gate' })).toBeVisible();
  await noSideways(page);
  expect(errors).toEqual([]);
});
