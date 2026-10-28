import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { begin, tab } from './helpers';
import { dismiss } from './polish-screens';
import { scanTappables } from './polish-tap';

// Plan TD.7a (GDD §9.24, §9.20): the Remembering card's forms and the Descent sheet, on a phone
// viewport at 320 px at the Largest Text size: card buttons by ending, the stages, What the Hold
// Learned and its breakdown, Suggest and tap-to-swap, the preview from the worker, tap sizes, no
// sideways scroll.

type Ending = 'remember' | 'vigil' | 'descent';

const played = JSON.parse(
  readFileSync(new URL('../saves/fixtures/v14-played.json', import.meta.url), 'utf8'),
);

const load = async (
  page: Page,
  endings: Ending[],
  age: 'bastion' | 'citadel' = 'bastion',
): Promise<void> => {
  const save = structuredClone(played);
  save.state.remembering.endings = endings.map((ending) => ({ ending, at: 1, cycle: 3 }));
  save.state.cycle.age = age;
  save.state.remembering.nearSeen = true;
  await page.addInitScript(() => {
    for (const prefix of ['lasthold:', 'lasthold-preview:'])
      localStorage.setItem(
        `${prefix}settings`,
        JSON.stringify({
          textSize: 'largest',
          backupReminder: true,
          firstSeenAt: Date.now() - 2e9,
        }),
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
  await tab(page, 'Hold').click();
};

const card = (page: Page) => page.getByRole('region', { name: 'The Remembering' });
const noSideways = async (page: Page): Promise<void> => {
  const r = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  expect(r.scroll).toBeLessThanOrEqual(r.inner);
};

test.use({ viewport: { width: 320, height: 700 } });

test('the card shows the right buttons for every ending', async ({ page }) => {
  await load(page, []);
  const c = card(page);
  await c.scrollIntoViewIfNeeded();
  for (const name of ['Remember Them', 'The Descent', 'Keep the Vigil'])
    await expect(c.getByRole('button', { name })).toBeVisible();
  await noSideways(page);
});

const cases: [Ending[], string[], string[]][] = [
  [['vigil'], ['Remember Them', 'The Descent'], ['Keep the Vigil']],
  [['remember'], ['Read it again', 'The Descent'], ['Fight the Descent again']],
  [['descent'], ['Fight the Descent again', 'Remember Them', 'Keep the Vigil'], ['The Descent']],
  [['descent', 'vigil'], ['Fight the Descent again', 'Remember Them'], ['Keep the Vigil']],
  [['descent', 'remember'], ['Fight the Descent again', 'Read it again'], ['Remember Them']],
];
for (const [endings, shown, absent] of cases)
  test(`the card with ${endings.join(' + ')}`, async ({ page }) => {
    await load(page, endings);
    const c = card(page);
    await c.scrollIntoViewIfNeeded();
    for (const name of shown)
      await expect(c.getByRole('button', { name, exact: true }), endings.join('+')).toBeVisible();
    for (const name of absent)
      await expect(c.getByRole('button', { name, exact: true }), endings.join('+')).toHaveCount(0);
    if (endings.includes('descent'))
      await expect(c.getByText('The Unlit was scattered in the Deep.')).toBeVisible();
    else await expect(c.getByText('The Unlit was scattered in the Deep.')).toHaveCount(0);
  });

test('no Descent button below Bastion', async ({ page }) => {
  await load(page, [], 'citadel');
  const c = card(page);
  await c.scrollIntoViewIfNeeded();
  await expect(c.getByRole('button', { name: 'Remember Them' })).toBeVisible();
  await expect(c.getByRole('button', { name: /Descent/ })).toHaveCount(0);
});

test('the Descent sheet: stages, learned bonus, swap, preview, tap sizes', async ({ page }) => {
  await load(page, ['descent']);
  const c = card(page);
  await c.scrollIntoViewIfNeeded();
  await c.getByRole('button', { name: 'Fight the Descent again' }).click();
  const sheet = page.getByRole('dialog', { name: 'The Descent' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText('Three stages in the Deep · all hands')).toBeVisible();
  await expect(sheet.getByTestId('descent-stage-1')).toHaveText(
    "Stage 1: The Crack — Unlit's Breath & The Forgotten",
  );
  await expect(sheet.getByTestId('descent-stage-3')).toHaveText(
    'Stage 3: Below the Seal — The Unlit',
  );
  await expect(sheet.getByTestId('descent-learned-line')).toHaveText(
    /^What the hold learned: \+[\d.]+% Might and Health · −[\d.]+% damage taken$/,
  );
  await expect(sheet.getByText('Front line (up to 6)')).toBeVisible();
  await expect(
    sheet.getByText('Thrown automatically from stores (up to 2 per stage)'),
  ).toBeVisible();

  // Tap-to-swap: two taps swap two slots.
  const first = await sheet.getByTestId('descent-slot-0').innerText();
  const second = await sheet.getByTestId('descent-slot-1').innerText();
  await sheet.getByTestId('descent-slot-0').click();
  await sheet.getByTestId('descent-slot-1').click();
  expect(await sheet.getByTestId('descent-slot-0').innerText()).toBe(second);
  expect(await sheet.getByTestId('descent-slot-1').innerText()).toBe(first);
  await sheet.getByTestId('descent-suggest').click();
  expect(await sheet.getByTestId('descent-slot-0').innerText()).toBe(first);

  // The preview arrives from the worker.
  await expect(sheet.getByTestId('descent-preview')).toContainText(/Win chance: \d+% ±\d+%/, {
    timeout: 20_000,
  });
  await expect(sheet.getByTestId('descent-preview')).toContainText(
    /Expected (stage reached|outcome)/,
  );
  await expect(sheet.getByTestId('descent-preview')).toContainText(
    'Why: based on 100 practice runs with your marching order and preparation.',
  );

  await noSideways(page);
  const scan = await scanTappables(page);
  expect(scan.scanned).toBeGreaterThan(5);
  expect(scan.small).toEqual([]);
  expect(scan.outside).toEqual([]);

  // The breakdown sheet lists the five contributors.
  await sheet.getByRole('button', { name: 'Show what the hold learned' }).click();
  const learned = page.getByTestId('descent-learned');
  await expect(learned.locator('ul').first().getByRole('listitem')).toHaveCount(5);
  await expect(learned.getByText(/^Mastered species \(\+/)).toBeVisible();
  await expect(learned.getByText(/^Owned relics \(−/)).toBeVisible();
});
