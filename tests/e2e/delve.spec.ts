import { expect, test, type Page } from '@playwright/test';
import { begin, onwardAll, tab } from './helpers';

// Plan T7.13b: the v0.7 screens on the real production build. Debug to the Keep: the way-down
// scene, the Rift card, the entry sheet, a whole Delve (a door, a blessing, the floor played and
// skipped, on to the result), the Riftglass shop on the Rank screen; and debug "Start Act IV"
// brings D4-01. Screenshots (SHOTS=dir) are for the phone-size pass.

const shot = async (page: Page, name: string): Promise<void> => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}.png` });
};

const debug = async (page: Page, ...buttons: string[]) => {
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  for (const b of buttons) await page.getByRole('button', { name: b, exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).click();
};

test('the rift scene, the Rift card, a whole Delve, the result and the shop', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?debug');
  await begin(page, 'Mira');
  await debug(page, 'Unlock Keep', 'Add Arvid');
  // The way-down scene plays once, and is kept in the Library afterwards.
  const scene = page.getByRole('dialog', { name: 'The way down' });
  // The vow plays first (it is the Keep's own scene); the way down follows it.
  for (let i = 0; i < 6 && !(await scene.isVisible()); i++) {
    await page.waitForTimeout(400);
    if (await scene.isVisible()) break;
    const onward = page.getByRole('button', { name: 'Onward' });
    if (await onward.isVisible().catch(() => false)) await onward.click();
  }
  await expect(scene).toBeVisible();
  await expect(scene.getByText(/crack in the Hearth Hall floor/)).toBeVisible();
  await shot(page, 'delve-scene');
  await onwardAll(page);

  await tab(page, 'Hold').click();
  const card = page.getByRole('region', { name: 'The Rift' });
  await expect(card).toBeVisible();
  await shot(page, 'delve-card');
  await card.getByRole('button', { name: 'Delve', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Delve' });
  await expect(sheet.getByText(/Keep: floors tier 2–3, guardian tier 4/)).toBeVisible();
  await shot(page, 'delve-entry');
  await sheet.getByRole('button', { name: 'Start' }).click();

  // Doors, a blessing, then the floor: play it by skipping, and on, until the result.
  await expect(sheet.getByText(/Two doors/)).toBeVisible();
  await shot(page, 'delve-doors');
  let tookBlessing = false;
  for (let i = 0; i < 60; i++) {
    if (await sheet.getByRole('button', { name: 'Done' }).isVisible()) break;
    if (await sheet.getByRole('button', { name: 'Take this blessing' }).isVisible()) {
      await sheet.locator('button[aria-pressed="false"]').first().click();
      if (!tookBlessing) await shot(page, 'delve-blessings');
      await sheet.getByRole('button', { name: 'Take this blessing' }).click();
      tookBlessing = true;
    } else if (await sheet.getByText(/Two doors/).isVisible()) {
      await sheet.getByRole('button').filter({ hasText: 'Ahead:' }).first().click();
    } else if (await sheet.getByRole('button', { name: 'Fight', exact: true }).isVisible()) {
      if (tookBlessing) {
        await sheet.getByRole('button', { name: 'Your blessings' }).click();
        const mine = page.getByRole('dialog', { name: 'Your blessings' });
        await expect(mine.getByText('How it adds up')).toBeVisible();
        await shot(page, 'delve-your-blessings');
        await mine.getByRole('button', { name: 'Close' }).click();
      }
      await sheet.getByRole('button', { name: 'Fight', exact: true }).click();
      await sheet.getByRole('button', { name: 'Skip' }).click();
      await shot(page, 'delve-floor-done');
      await sheet.getByRole('button', { name: 'Continue' }).click();
    } else await page.waitForTimeout(150);
  }
  expect(tookBlessing).toBe(true);
  await expect(sheet.getByRole('button', { name: 'Done' })).toBeVisible();
  await expect(sheet.getByText(/Floors cleared/)).toBeVisible();
  await shot(page, 'delve-result');
  await sheet.getByRole('button', { name: 'Done' }).click();

  // The Riftglass shop sits on the Rank screen beside The Hearth.
  await page.getByRole('button', { name: 'Rank ▸' }).click();
  await expect(page.getByText('The Riftglass shop')).toBeVisible();
  await page.getByText('The Riftglass shop').scrollIntoViewIfNeeded();
  await shot(page, 'delve-shop');
  expect(errors).toEqual([]);
});

test('Start Act IV plays D4-01 (Pechko brings the bundle)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?debug');
  await begin(page, 'Mira');
  await debug(page, 'Unlock Keep');
  await onwardAll(page);
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByRole('button', { name: 'Start Act IV', exact: true }).click();
  const scene = page.getByRole('dialog', { name: 'The bundle' });
  await expect(scene).toBeVisible();
  await expect(scene.getByText(/oilcloth/).first()).toBeVisible();
  await shot(page, 'act4-scene');
  expect(errors).toEqual([]);
});
