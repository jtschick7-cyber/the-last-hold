import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { begin, closeOrdersScenes, onwardAll } from './helpers';
import { clearScenes, fixture, load } from './layout-helpers';

// Plan T1.38 / technical design §14: the phone-sized smoke test on the real
// production build. Load → buy a Cottage → reload → the purchase is still
// there → offline, the reload still works.

const cottageRow = (page: Page) =>
  page.getByRole('listitem').filter({ has: page.locator('strong', { hasText: /^Cottage$/ }) });

const tab = (page: Page, name: string) =>
  page.getByRole('navigation').getByRole('button', { name: new RegExp(`^${name}`) });

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

  // Plan TV.12 (a): still offline, the game takes commands and keeps their result across a reload.
  // Named commands: Buy Cottage, Buy Cottage, then (debug panel) +1K wood and Buy Cottage again.
  await page.goto('./?debug');
  const offlineRow = cottageRow(page);
  await expect(offlineRow).toContainText('×1');
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByRole('button', { name: '+1K wood', exact: true }).click();
  await page.getByRole('button', { name: '+1K food', exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await tab(page, 'Hold').click();
  for (const n of [2, 3]) {
    await offlineRow.getByRole('button', { name: 'Buy' }).click();
    await expect(offlineRow).toContainText(`×${n}`);
  }
  await page.waitForTimeout(1500); // the save is written on a timer
  await page.reload();
  await expect(cottageRow(page)).toContainText('×3');
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
  await closeOrdersScenes(page);
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
  const onward = () => onwardAll(page);
  await tab('More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByRole('button', { name: 'Unlock Bastion', exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).first().click();
  await onward();
  await closeOrdersScenes(page);

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
  const onward = () => onwardAll(page);
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

// Plan T10.16: the Orders on the phone viewport, from the played fixture (the owner's save, migrated
// and played 72 h, with every Order open and none seated): seat the Moot in the step, read its first
// chapter, change a seat from the card, and find both still there after a reload.
test('seat an Order, read a chapter, change a seat, and reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const played = JSON.parse(
    readFileSync(new URL('../saves/fixtures/v10-played.json', import.meta.url), 'utf8'),
  );
  const tab = (name: string) =>
    page.getByRole('navigation').getByRole('button', { name: new RegExp(`^${name}`) });
  await page.goto('./?debug');
  await begin(page, 'Mira');
  await tab('More').click();
  await page.getByRole('button', { name: /^Save/ }).first().click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(played)),
  });
  await page.getByRole('button', { name: 'Yes, load it' }).click();

  // Sheets that come first (the away sheet, scenes) are closed until the load step is up.
  const step = page.getByRole('dialog', { name: 'Seat your Orders' });
  for (let i = 0; i < 30 && !(await step.isVisible().catch(() => false)); i++) {
    await page.waitForTimeout(400);
    // 'Close' is the sheet's ✕ button, found by its label, not by text (the away sheet has no other button).
    for (const name of ['Onward', 'Not now', 'Continue', 'Close']) {
      const b =
        name === 'Close'
          ? page.getByRole('button', { name })
          : page.getByText(name, { exact: true });
      if (
        await b
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await b.first().click();
        break;
      }
    }
  }
  await expect(step).toBeVisible();
  await step.getByRole('checkbox').first().check(); // the Moot
  await step.getByRole('button', { name: 'Done' }).click();

  // Its first chapter opens by itself, and is read.
  const chapter = page.getByRole('dialog', { name: 'A table at the gate' });
  await expect(chapter).toBeVisible();
  await chapter.getByText('Close', { exact: true }).click();
  await expect(chapter).toHaveCount(0);

  // A seat change from the card, which starts the wait.
  await tab('Hold').click();
  const card = page.getByRole('region', { name: 'Orders' });
  await expect(card.getByText("In seats: Thanes' Moot")).toBeVisible();
  await card.getByRole('button', { name: /Change seats/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Change seats' });
  await sheet.getByRole('button', { name: 'Seat', exact: true }).first().click();
  await expect(sheet.getByText(/^Can change in /)).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).first().click();
  await expect(card.getByText(/^In seats: Thanes' Moot, /)).toBeVisible();

  // Saved: after a reload the seats are still there, and nothing has been read again.
  await page.waitForTimeout(1500);
  await page.reload();
  await expect(
    page.getByRole('region', { name: 'Orders' }).getByText(/^In seats: Thanes' Moot, /),
  ).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'A table at the gate' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

// Plan TL.12 (S11): the owner's v11 save loads and becomes v12; then, on the grid, open Arrange Hold,
// move a building, Auto-arrange, switch the Hold view, and reload offline with every choice kept.
test('the v11 owner save, Arrange Hold, Auto-arrange, Hold view, and an offline reload', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await load(page, () => {}, fixture('v11-owner'));
  // It migrated: the grid header is up with pieces on it.
  await expect(page.locator('[data-hold-grid]')).toBeVisible();
  await expect(page.locator('[data-hold-grid] [data-piece]').first()).toBeVisible();

  await page.locator('[data-layout-button]').click();
  const sheet = page.getByRole('dialog', { name: 'Arrange Hold' });
  const at = async (id: string) =>
    sheet.locator(`[data-piece="${id}"]`).first().getAttribute('data-tile');
  const before = await at('mill');
  await sheet.locator(`[data-tile="${before}"]`).click();
  const free = await sheet
    .locator('[data-piece=""][data-locked="false"]')
    .first()
    .getAttribute('data-tile');
  await sheet.locator(`[data-tile="${free}"]`).click();
  expect(await at('mill')).toBe(free);
  await sheet.getByRole('button', { name: 'Auto-arrange' }).click();
  expect(await at('mill')).not.toBe(free);
  const arranged = await at('mill');
  await page.getByRole('button', { name: 'Close' }).click();

  // Hold view: Classic scene, then back to the grid at the end.
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  await page.getByRole('button', { name: 'Classic scene', exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await tab(page, 'Hold').click();
  await expect(page.locator('[data-hold-grid]')).toHaveCount(0);
  await page.waitForTimeout(1500); // the save is written on a timer

  // Offline: the service worker serves the app, and both choices are still there.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await clearScenes(page);
  await expect(page.locator('[data-hold-grid]')).toHaveCount(0);
  await expect(page.locator('[data-layout-button]')).toBeVisible();
  await page.locator('[data-layout-button]').click();
  const again = page.getByRole('dialog', { name: 'Arrange Hold' });
  await expect(again.locator(`[data-tile="${arranged}"]`)).toHaveAttribute('data-piece', 'mill');
  await context.setOffline(false);
  expect(errors).toEqual([]);
});
