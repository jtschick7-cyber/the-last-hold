import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { DESCENT_CARDS } from '../../src/content/story/descent';
import { begin, tab } from './helpers';
import { dismiss } from './polish-screens';

// Plan TD.7c (GDD §5.12.8, §5.14.5, §9.24): the Roll of Wardens mark, the Library's "The Descent"
// (cards D-01 to D-06 and the three stage logs) and The Unlit on the Great Beasts shelf, on the real
// app at a phone width, from the played v14 save (The Descent won in cycle 3).

const played = JSON.parse(
  readFileSync(new URL('../saves/fixtures/v14-played.json', import.meta.url), 'utf8'),
);

const load = async (page: Page): Promise<void> => {
  const save = structuredClone(played);
  save.state.remembering.nearSeen = true;
  await page.addInitScript(() => {
    for (const prefix of ['lasthold:', 'lasthold-preview:'])
      localStorage.setItem(
        `${prefix}settings`,
        JSON.stringify({ backupReminder: true, firstSeenAt: Date.now() - 2e9 }),
      );
  });
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
  await page.waitForTimeout(1000);
  await dismiss(page);
};

test.use({ viewport: { width: 360, height: 740 } });

test('the Roll of Wardens marks the warden of the first win', async ({ page }) => {
  await load(page);
  await tab(page, 'Hold').click();
  await page.getByRole('button', { name: /^Rank/ }).first().click();
  const marks = page.getByTestId('descent-roll');
  await expect(marks).toHaveCount(1);
  await expect(marks).toContainText('Led the Descent.');
  await expect(marks.locator('svg')).toHaveCount(1);
});

test('the Library replays The Descent: D-01 to D-06, then the three logs', async ({ page }) => {
  await load(page);
  await tab(page, 'Archive').click();
  await page.getByRole('button', { name: /^Library/ }).click();
  const shelf = page.getByRole('region', { name: 'The Remembering' });
  await shelf.scrollIntoViewIfNeeded();
  await shelf.getByRole('button', { name: 'The Descent' }).click();
  for (const id of ['D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-06'] as const) {
    const view = page.getByTestId(`descent-replay-${id}`);
    await expect(view).toBeVisible();
    await expect(view).toContainText(DESCENT_CARDS[id].paragraphs[0] ?? '');
    await view.getByRole('button', { name: 'Continue' }).click();
  }
  await page.getByTestId('descent-replay-log-2').click();
  const log = page.getByRole('dialog', { name: 'Stage 2 log' });
  await expect(log.getByRole('listitem').first()).toBeVisible();
  await log.getByRole('button', { name: 'Close' }).click();
  // The replay is still there, on its log list, and is not an attempt: the card still has no result to view.
  await expect(page.getByTestId('descent-replay-logs')).toBeVisible();
});

test('The Unlit is on the Great Beasts shelf once Stage 3 has been reached', async ({ page }) => {
  await load(page);
  await tab(page, 'Archive').click();
  await page.getByRole('button', { name: /^Bestiary/ }).click();
  const shelf = page.getByRole('region', { name: 'Great Beasts' });
  await shelf.scrollIntoViewIfNeeded();
  await shelf.getByRole('button', { name: 'The Unlit' }).click();
  const sheet = page.getByRole('dialog', { name: 'The Unlit' });
  await expect(sheet).toContainText('What was under the hill');
  await expect(sheet).toContainText('First Cold');
  await expect(sheet).toContainText('Heavy Dark');
  await expect(sheet).toContainText('Rune ×1.5');
});
