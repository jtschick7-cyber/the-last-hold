import { expect, test, type Page } from '@playwright/test';
import { begin, onwardAll } from './helpers';

// Plan T1.38 / technical design §14: the phone-sized smoke test on the real
// production build. Load → buy a Cottage → reload → the purchase is still
// there → offline, the reload still works.

const cottageRow = (page: Page) =>
  page.getByRole('listitem').filter({ has: page.locator('strong', { hasText: /^Cottage$/ }) });

test('buy a Cottage, reload, and reload again offline', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('./');
  await begin(page);
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
  await begin(page);

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
  // The first contract plays a short scene once (setting-primer §6.6).
  await expect(page.getByRole('dialog', { name: 'Through the gate' })).toBeVisible();
  await page.getByRole('button', { name: 'Onward' }).click();
  await expect(page.getByText('⏱ Running')).toBeVisible();

  await debug('+1 h');
  // A won contract may bring Ilse (GDD §5.14.3): her scene waits to be dismissed.
  await onwardAll(page);
  await tab('Contracts').click();
  await expect(page.getByText(/Ready to collect/)).toBeVisible();
  await page.getByRole('button', { name: 'Collect' }).click();
  await expect(page.getByRole('dialog', { name: 'Contracts finished' })).toBeVisible();
  await expect(page.getByRole('dialog').getByText(/Fight log/)).toBeVisible();

  expect(errors).toEqual([]);
});

// Plan T4.11b: debug to Bastion → the Last Stand → the Long Night sheets → a new cycle.
test('make the Last Stand at Bastion and start a new cycle', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?debug');
  await begin(page);
  const tab = (name: string) =>
    page.getByRole('navigation').getByRole('button', { name: new RegExp(`^${name}`) });
  const onward = async () => {
    const o = page.getByRole('button', { name: 'Onward' });
    if (await o.isVisible().catch(() => false)) await o.click();
  };
  await tab('More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByRole('button', { name: 'Unlock Bastion', exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).first().click();
  await onward();

  await tab('Hold').click();
  await expect(page.getByText(/Stanholm — Bastion/)).toBeVisible();
  await page.getByRole('button', { name: 'Rank ▸' }).click();
  await page.getByRole('button', { name: 'Make the Last Stand' }).click();
  // The preview comes from the worker: 100 practice stands, not the quick estimate.
  await expect(page.getByText(/^Expected:/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/quick estimate/)).toHaveCount(0);
  await expect(page.getByText(/from 100 practice stands/)).toBeVisible();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Go up to the walls' }).click();

  const night = page.getByRole('dialog', { name: 'The Long Night' });
  await expect(night.getByText(/The walls held/)).toBeVisible();
  await night.getByRole('button', { name: '1', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Wave 1' })).toBeVisible();
  await page.getByRole('dialog', { name: 'Wave 1' }).getByRole('button', { name: 'Close' }).click();
  for (let i = 0; i < 3; i++) await night.getByRole('button', { name: 'Next' }).click();
  await expect(night.getByText(/Someone new walks up the road/)).toBeVisible();
  await night.getByRole('button', { name: 'Begin cycle 2' }).click();
  await onward();

  await expect(page.getByText(/Stanholm — Hamlet/)).toBeVisible();
  await expect(page.getByText(/The Long Night: what happened/)).toHaveCount(0);
  expect(errors).toEqual([]);
});

// Plan T4.10 (GDD §5.9.8): the v0.4 arrival takes the Hold's place until the stand is made.
test('the v0.4 arrival: a Keep save faces its first Long Night, then starts over', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?debug');
  await begin(page);
  const tab = (name: string) =>
    page.getByRole('navigation').getByRole('button', { name: new RegExp(`^${name}`) });
  const onward = async () => {
    const o = page.getByRole('button', { name: 'Onward' });
    if (await o.isVisible().catch(() => false)) await o.click();
  };
  await tab('More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByRole('button', { name: 'Unlock Keep', exact: true }).click();
  await page.getByRole('button', { name: 'Run the arrival', exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).first().click();
  await onward();

  await tab('Hold').click();
  await expect(page.getByRole('heading', { name: 'The Long Night' })).toBeVisible();
  await expect(page.getByText(/Everyone who can hold a spear goes up/)).toBeVisible();
  // It can't be put off: only Hold and More are left.
  await expect(page.getByRole('navigation').getByRole('button')).toHaveCount(2);
  await page.getByRole('button', { name: 'To the walls' }).click();
  await expect(page.getByText(/^Expected:/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Go up to the walls' }).click();

  const night = page.getByRole('dialog', { name: 'The Long Night' });
  await expect(night.getByText(/The walls held/)).toBeVisible();
  for (let i = 0; i < 3; i++) await night.getByRole('button', { name: 'Next' }).click();
  await night.getByRole('button', { name: 'Begin cycle 2' }).click();
  await onward();

  await expect(page.getByText(/Stanholm — Hamlet/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The Long Night' })).toHaveCount(0);
  expect(errors).toEqual([]);
});
