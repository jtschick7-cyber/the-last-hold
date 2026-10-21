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

test('the opening scene, the load step, the card and a seat change', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await importOwner(page);
  await untilOpening(page);
  const scene = page.getByRole('dialog', { name: 'A seat at the table' });
  await expect(scene.getByText(/Marta Dubska sent this/)).toBeVisible();
  // Nothing seated itself: "Seat it" and "Not now" are both offered.
  await expect(scene.getByRole('button', { name: 'Seat it' })).toBeVisible();
  await shot(page, 'orders-opening');
  await scene.getByRole('button', { name: 'Not now' }).click();

  // Any later opening scenes, then the load step.
  const step = page.getByRole('dialog', { name: 'Seat your Orders' });
  for (let i = 0; i < 6 && !(await step.isVisible().catch(() => false)); i++) {
    const notNow = page.getByRole('button', { name: /^(Not now|Continue)$/ });
    if (await notNow.isVisible().catch(() => false)) await notNow.click();
    await page.waitForTimeout(400);
  }
  await expect(step).toBeVisible();
  for (const size of [
    { width: 360, height: 740 },
    { width: 900, height: 800 },
    { width: 1300, height: 800 },
  ]) {
    await page.setViewportSize(size);
    await noSideways(page);
  }
  await page.setViewportSize({ width: 360, height: 740 });
  await shot(page, 'orders-step');
  await step.getByRole('checkbox').first().check();
  await step.getByRole('button', { name: 'Done' }).click();
  await expect(step).toHaveCount(0);

  // The card, with the card's seat lines and the step's button gone.
  await tab(page, 'Hold').click();
  const card = page.getByRole('region', { name: 'Orders' });
  await expect(card).toBeVisible();
  await expect(card.getByText(/^Seats: 2 of 3 \(the third opens/)).toBeVisible();
  await expect(card.getByText("In seats: Thanes' Moot")).toBeVisible();
  await expect(card.getByRole('button', { name: /Seat your Orders/ })).toHaveCount(0);
  for (const size of [
    { width: 360, height: 740 },
    { width: 900, height: 800 },
    { width: 1300, height: 800 },
  ]) {
    await page.setViewportSize(size);
    await card.scrollIntoViewIfNeeded();
    await noSideways(page);
  }
  await page.setViewportSize({ width: 360, height: 740 });
  await shot(page, 'orders-card');

  // A seat change from the card: open, unseat, with the cooldown line after.
  let taps = 0;
  const tap = async (b: ReturnType<Page['getByRole']>): Promise<void> => {
    taps += 1;
    await b.click();
  };
  await tap(card.getByRole('button', { name: /Change seats/ }));
  const sheet = page.getByRole('dialog', { name: 'Change seats' });
  await tap(sheet.getByRole('button', { name: 'Unseat' }));
  await expect(sheet.getByText(/^Can change in /)).toBeVisible();
  await expect(sheet.getByText('You keep your standing and chapters.')).toBeVisible();
  await noSideways(page);
  await shot(page, 'orders-change');
  expect(taps).toBeLessThanOrEqual(6);
  expect(errors).toEqual([]);
});
