import { expect, test, type Page } from '@playwright/test';
import { tab } from './helpers';
import { dismiss, loadFixture } from './polish-screens';

// Plan TV.7 (GDD §9.20): the backup reminder on the away sheet, in the browser.
const BASE = 'http://localhost:4173/the-last-hold/';
const DAY = 86_400_000;
const LINE = /You haven't saved a copy of your game outside this browser in the last \d+ days\./;

const settingsKey = (page: Page) =>
  page.evaluate(() => {
    const k = Object.keys(localStorage).find((x) => x.endsWith(':settings'));
    return k ? JSON.parse(localStorage.getItem(k) ?? '{}') : {};
  });
/** The saved game as stored, without what every autosave moves (D462): the times and clocks. */
const savedGame = (page: Page) =>
  page.evaluate(() => {
    const k = Object.keys(localStorage).find((x) => x.endsWith(':save'));
    const save = JSON.parse(localStorage.getItem(k ?? '') ?? '{}');
    delete save.savedAt;
    if (save.state?.meta) {
      delete save.state.meta.lastSeen;
      delete save.state.meta.clockHighWater;
    }
    if (save.state?.events) delete save.state.events.clock;
    return save;
  });

test.use({ baseURL: BASE });

test('the reminder shows on the away sheet, fits at 320 px at Largest and its buttons are 44 px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addInitScript(() => {
    for (const prefix of ['lasthold:', 'lasthold-preview:'])
      localStorage.setItem(`${prefix}settings`, JSON.stringify({ textSize: 'largest' }));
  });
  let checked = false;
  await loadFixture(page, 'v11', async (label) => {
    // Closing the sheet can bring it round again once snoozed; look only the first time.
    if (label !== 'While you were away' || checked) return;
    checked = true;
    const dlg = page.getByRole('dialog').last();
    await expect(dlg.getByText(LINE)).toBeVisible();
    for (const name of ['Back up now', 'Not now']) {
      const box = await dlg.getByRole('button', { name }).boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    const fits = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(fits).toBe(true);
  });
  expect(checked).toBe(true);
});

test('Not now hides it for 7 days', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await loadFixture(page, 'v11', async (label) => {
    if (label !== 'While you were away') return;
    const dlg = page.getByRole('dialog').last();
    await expect(dlg.getByText(LINE)).toBeVisible();
    await dlg.getByRole('button', { name: 'Not now' }).click();
    await expect(page.getByText(LINE)).toHaveCount(0);
  });
  const s = await settingsKey(page);
  expect(s.snoozeUntil - Date.now()).toBeGreaterThan(6.9 * DAY);
  expect(s.snoozeUntil - Date.now()).toBeLessThan(7.1 * DAY);
});

test('Back up now opens Save & Data and hides the line for 1 day', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  let opened = false;
  await loadFixture(page, 'v11', async (label) => {
    if (label === 'While you were away' && !opened) {
      await page.getByRole('dialog').last().getByRole('button', { name: 'Back up now' }).click();
      await expect(
        page
          .getByRole('dialog')
          .last()
          .getByText(/^Last exported:/),
      ).toBeVisible();
      opened = true;
    }
  });
  expect(opened).toBe(true);
  const s = await settingsKey(page);
  expect(s.snoozeUntil - Date.now()).toBeGreaterThan(0.9 * DAY);
  expect(s.snoozeUntil - Date.now()).toBeLessThan(1.1 * DAY);
});

test('Copy save code counts as an export; the debug action sets the age without marking debug use', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 360, height: 740 });
  await loadFixture(page, 'new');
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Save/ }).first().click();
  await expect(page.getByText('Last exported: not recorded')).toBeVisible();
  await page.getByRole('button', { name: 'Copy save code' }).click();
  await expect(page.getByText('Save code copied.')).toBeVisible();
  await expect(page.getByText('Last exported: just now')).toBeVisible();
  expect((await settingsKey(page)).lastExportAt).toBeGreaterThan(Date.now() - 60_000);
  await dismiss(page);

  const saveBefore = await savedGame(page);
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByLabel('Days since the last export').fill('9');
  await page.getByRole('button', { name: 'Set', exact: true }).click();
  const s = await settingsKey(page);
  expect(Math.round((Date.now() - s.lastExportAt) / DAY)).toBe(9);
  const saveAfter = await savedGame(page);
  // The game keeps running, so only the debug mark is compared; the settings code never touches the save.
  expect(saveBefore.state.meta.debugUsed).toBe(false);
  expect(saveAfter.state.meta.debugUsed).toBe(false);
});

test('the Settings switch writes the choice, and with it Off the away sheet has no line', async ({
  page,
  browser,
}) => {
  await loadFixture(page, 'v11');
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  await page
    .getByRole('group', { name: 'Backup reminder' })
    .getByRole('button', { name: 'Off', exact: true })
    .click();
  expect((await settingsKey(page)).backupReminder).toBe(false);

  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, baseURL: BASE });
  const off = await ctx.newPage();
  await off.addInitScript(() => {
    for (const prefix of ['lasthold:', 'lasthold-preview:'])
      localStorage.setItem(`${prefix}settings`, JSON.stringify({ backupReminder: false }));
  });
  let sawAway = false;
  await loadFixture(off, 'v11', async (label) => {
    if (label !== 'While you were away') return;
    sawAway = true;
    await expect(off.getByText(LINE)).toHaveCount(0);
  });
  expect(sawAway).toBe(true);
  await ctx.close();
});
