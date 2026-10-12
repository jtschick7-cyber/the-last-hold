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
