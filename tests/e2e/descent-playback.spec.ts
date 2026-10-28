import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { DESCENT_CARDS } from '../../src/content/story/descent';
import { begin, tab } from './helpers';
import { dismiss } from './polish-screens';
import { installSoundHook, played, soundOn } from './sound-helpers';

// Plan TD.7b (GDD §9.24, S4, S9, D567 (6)): the Descent's playback on the real app: the story cards, the
// three stages with Skip, the sound cues, the result sheet and its log buttons, a loss, and a playback
// closed early (the result stays unread across a reload and the card offers it).

const played14 = JSON.parse(
  readFileSync(new URL('../saves/fixtures/v14-played.json', import.meta.url), 'utf8'),
);

/** The played v14 save with the Descent open to fight again; `weak` takes every hunter back to level 1. */
const load = async (page: Page, weak = false): Promise<void> => {
  const save = structuredClone(played14);
  save.state.remembering.nearSeen = true;
  // Nothing recorded yet, so the card shows its "nothing chosen" form with The Descent button.
  save.state.remembering.endings = [];
  save.state.descent = {
    attempts: 0,
    unlitMet: false,
    last: null,
    firstWin: null,
    unreadResult: false,
  };
  if (weak) {
    // Level 1, no gear, no stars, no rank: the party falls on the second stage (checked by the core).
    for (const h of Object.values(save.state.hunters) as Record<string, unknown>[])
      Object.assign(h, { level: 1, stars: 0, weapon: null, armor: null, rank: 'apprentice' });
    for (const item of save.state.items as { where: unknown }[]) item.where = null;
  }
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
  await tab(page, 'Hold').click();
};

const card = (page: Page) => page.getByRole('region', { name: 'The Remembering' });

const startDescent = async (page: Page): Promise<void> => {
  await card(page).scrollIntoViewIfNeeded();
  await card(page).getByRole('button', { name: 'The Descent', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'The Descent' });
  await expect(sheet.getByTestId('descent-preview')).toContainText(/Win chance/, {
    timeout: 20_000,
  });
  await sheet.getByTestId('descent-start').click();
};

const cardText = async (page: Page, id: keyof typeof DESCENT_CARDS): Promise<void> => {
  const view = page.getByTestId(`descent-card-${id}`);
  await expect(view).toBeVisible();
  for (const p of DESCENT_CARDS[id].paragraphs) await expect(view).toContainText(p);
  await view.getByRole('button', { name: 'Continue' }).click();
};

const playStage = async (page: Page, n: 1 | 2 | 3): Promise<void> => {
  const view = page.getByTestId(`descent-stage-play-${n}`);
  await expect(view).toBeVisible();
  await expect(view.getByRole('heading', { name: new RegExp(`^Stage ${n}:`) })).toBeVisible();
  await view.getByRole('button', { name: 'Skip' }).click();
  await view.getByRole('button', { name: 'Continue' }).click();
};

test.use({ viewport: { width: 360, height: 740 } });

test('a full win: cards, three stages, the cues, and the result sheet with its logs', async ({
  page,
}) => {
  await installSoundHook(page);
  await load(page);
  await soundOn(page);
  await tab(page, 'Hold').click();
  await startDescent(page);

  await cardText(page, 'D-01');
  await cardText(page, 'D-02');
  await playStage(page, 1);
  await cardText(page, 'D-03');
  await playStage(page, 2);
  await cardText(page, 'D-04');
  await playStage(page, 3);
  await cardText(page, 'D-05');
  await cardText(page, 'D-06');

  const result = page.getByTestId('descent-result');
  await expect(
    result.getByRole('heading', { name: 'Victory — The Unlit is scattered.' }),
  ).toBeVisible();
  await expect(result).toContainText(/Hunters standing: \d+ · Fallen on the stair: \d+/);
  // Stage 1 and 2 cleared play Win, the third plays Fanfare; the story cards were silent.
  expect(await played(page)).toEqual(['win', 'win', 'fanfare']);

  await result.getByTestId('descent-log-1').click();
  const log = page.getByRole('dialog', { name: 'Stage 1 log' });
  await expect(log.getByRole('listitem').first()).toBeVisible();
  expect(await log.getByRole('listitem').count()).toBeGreaterThan(5);
  // Opening a log is silent.
  expect(await played(page)).toEqual(['win', 'win', 'fanfare']);
  await log.getByRole('button', { name: 'Close' }).click();
  await result.getByTestId('descent-log-3').click();
  await expect(page.getByRole('dialog', { name: 'Stage 3 log' })).toBeVisible();
});

test('a loss: D-07 after the stage it fell in, the Lose cue once', async ({ page }) => {
  await installSoundHook(page);
  await load(page, true);
  await soundOn(page);
  await tab(page, 'Hold').click();
  await startDescent(page);
  await cardText(page, 'D-01');
  await cardText(page, 'D-02');
  await playStage(page, 1);
  await cardText(page, 'D-03');
  await playStage(page, 2);
  await cardText(page, 'D-07');
  const result = page.getByTestId('descent-result');
  await expect(result.getByRole('heading', { name: 'Driven back at Stage 2.' })).toBeVisible();
  await expect(result.getByTestId('descent-log-2')).toBeVisible();
  await expect(result.getByTestId('descent-log-3')).toHaveCount(0);
  // Stage 1 was cleared (Win), then the party fell (Lose); no Fanfare.
  expect(await played(page)).toEqual(['win', 'lose']);
});

test('closed early: the result stays unread across a reload and the card offers it', async ({
  page,
}) => {
  await load(page);
  await startDescent(page);
  await cardText(page, 'D-01');
  await expect(page.getByTestId('descent-card-D-02')).toBeVisible();
  // Close the playback with its X, before the result.
  await page
    .getByRole('dialog', { name: 'The Descent' })
    .getByRole('button', { name: 'Close' })
    .first()
    .click();
  await card(page).scrollIntoViewIfNeeded();
  await expect(page.getByTestId('descent-view-result')).toBeVisible();
  // A reload: the save keeps the attempt and the unread mark.
  await page.waitForTimeout(1500);
  await page.reload();
  await dismiss(page);
  await tab(page, 'Hold').click();
  await card(page).scrollIntoViewIfNeeded();
  await page.getByTestId('descent-view-result').click();
  const result = page.getByTestId('descent-result');
  await expect(result.getByRole('heading')).toBeVisible();
  await expect(result.getByTestId('descent-log-1')).toBeVisible();
  await page
    .getByRole('dialog', { name: 'The Descent' })
    .getByRole('button', { name: 'Close' })
    .first()
    .click();
  await expect(page.getByTestId('descent-view-result')).toHaveCount(0);
});
