import { expect, test, type Page } from '@playwright/test';
import { debugPress } from './helpers';
import { dismiss, loadFixture, tolerantClicks } from './polish-screens';

// Plan KV.11: the production build opens a real v12 save (the owner's) and a played v13 save, with the
// Remembering gate closed and open. Closed: nothing of Rising Vigil exists. Open: the row is there.

// The real early saves still have Ilse at the door; welcome her so the Hold shows.
const welcome = async (page: Page): Promise<void> => {
  const b = page.getByRole('button', { name: 'Welcome them' });
  if (await b.isVisible().catch(() => false)) await b.click();
};

const openStand = async (page: Page): Promise<void> => {
  await page.getByRole('navigation').getByRole('button', { name: /^Hold/ }).click();
  await welcome(page);
  await dismiss(page);
  await page.getByRole('button', { name: /^Rank/ }).first().click();
  await page.getByRole('button', { name: 'Make the Last Stand' }).click();
  await expect(page.getByText(/^Expected:/)).toBeVisible({ timeout: 20_000 });
};

const openGate = async (page: Page): Promise<void> => {
  await debugPress(page, 'Finish Act VI');
  await dismiss(page);
  await debugPress(page, 'Open the gate', 'Unlock Bastion');
  await dismiss(page);
};

test('the owner v12 save opens with the gate closed, then open', async ({ page }) => {
  tolerantClicks(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await loadFixture(page, 'v12-owner');
  await debugPress(page, 'Unlock Bastion');
  await dismiss(page);
  await openStand(page);
  await expect(page.locator('[data-testid^="vigil"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Close' }).first().click();
  await dismiss(page);
  await openGate(page);
  await openStand(page);
  await expect(page.getByTestId('vigil-row')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a played v13 save opens with its row and its level', async ({ page }) => {
  tolerantClicks(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await loadFixture(page, 'v13-played');
  await debugPress(page, 'Unlock Bastion');
  await dismiss(page);
  await openStand(page);
  await expect(page.getByTestId('vigil-row')).toBeVisible();
  await expect(page.getByTestId('vigil-status')).toBeVisible();
  expect(errors).toEqual([]);
});
