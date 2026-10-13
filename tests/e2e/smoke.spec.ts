import { expect, test, type Page } from '@playwright/test';

// Plan T1.38 / technical design §14: the phone-sized smoke test on the real
// production build. Load → buy a Cottage → reload → the purchase is still
// there → offline, the reload still works.

const cottageRow = (page: Page) =>
  page.getByRole('listitem').filter({ has: page.locator('strong', { hasText: /^Cottage$/ }) });

test('buy a Cottage, reload, and reload again offline', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('./');
  const row = cottageRow(page);
  await expect(row).toContainText('×0');
  await row.getByRole('button', { name: 'Buy' }).click();
  await expect(row).toContainText('×1');

  await page.reload();
  await expect(cottageRow(page)).toContainText('×1');

  // Offline after the service worker has taken over (technical design §11.1).
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload(); // the page is now controlled by the service worker
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(cottageRow(page)).toContainText('×1');
  await context.setOffline(false);

  expect(errors).toEqual([]);
});

// Plan T2.22: launch a contract → skip time → collect. Uses the debug panel
// (?debug) for resources and the time skip, the real screens for everything else.
test('send hunters on a contract, skip time, and collect', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?debug');

  // The Contracts tab shows an unread count, e.g. "Contracts (1)".
  const tab = (name: string) =>
    page.getByRole('navigation').getByRole('button', { name: new RegExp(`^${name}`) });
  const debug = async (...buttons: string[]) => {
    await tab('More').click();
    await page.getByRole('button', { name: /^Debug/ }).click();
    for (const b of buttons) await page.getByRole('button', { name: b, exact: true }).click();
    await page.getByRole('button', { name: 'Close' }).click();
  };

  await debug('+1K wood', '+1K food');
  await tab('Hold').click();
  await page
    .getByRole('listitem')
    .filter({ has: page.locator('strong', { hasText: /^Mine$/ }) })
    .getByRole('button', { name: 'Buy' })
    .click();

  // The board opens with the Mine, and its first contract arrives on the next tick.
  await tab('Contracts').click();
  await expect(page.getByRole('button', { name: 'Prepare' }).first()).toBeVisible({
    timeout: 10_000,
  });
  await page.getByRole('button', { name: 'Prepare' }).first().click();
  await expect(page.getByText(/^ODDS/)).toBeVisible();
  // The worker answered: this is the full 500-fight odds, not the main-thread quick estimate.
  await expect(page.getByText(/Quick estimate/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Send the hunters' }).click();
  await expect(page.getByText('⏱ Running')).toBeVisible();

  await debug('+1 h');
  await tab('Contracts').click();
  await expect(page.getByText(/Ready to collect/)).toBeVisible();
  await page.getByRole('button', { name: 'Collect' }).click();
  await expect(page.getByRole('dialog', { name: 'Contracts finished' })).toBeVisible();
  await expect(page.getByRole('dialog').getByText(/Fight log/)).toBeVisible();

  expect(errors).toEqual([]);
});
