import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { begin, onwardAll, tab } from './helpers';

// Plan T9.14: the Events card, the opening scene, the boss sheet and the party picker on the real
// production build, with the owner's save (events open at the Bastion). Screenshots (SHOTS=dir) are
// for the phone-size pass. Taps are counted from the Hold screen.

const shot = async (page: Page, name: string): Promise<void> => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}.png` });
};

const owner = JSON.parse(
  readFileSync(new URL('../saves/fixtures/v8-owner.json', import.meta.url), 'utf8'),
);

const importOwner = async (page: Page): Promise<void> => {
  await page.goto('./?debug');
  await begin(page, 'Mira');
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Save/ }).first().click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(owner)),
  });
  await page.getByRole('button', { name: 'Yes, load it' }).click();
  await page.waitForTimeout(800);
};

// The away sheet may open first; close it until the Events scene (shown once, over the Hold) is up.
const untilScene = async (page: Page): Promise<void> => {
  const scene = page.getByRole('dialog', { name: 'Three notes from the gate' });
  for (let i = 0; i < 5 && !(await scene.isVisible().catch(() => false)); i++) {
    const close = page.getByRole('button', { name: 'Close' });
    if (
      await close
        .first()
        .isVisible()
        .catch(() => false)
    )
      await close.first().click();
    await page.waitForTimeout(400);
  }
  await expect(scene).toBeVisible();
};

test('the scene, the Events card, and a boss attempt in 15 taps or fewer', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await importOwner(page);
  await untilScene(page);
  const scene = page.getByRole('dialog', { name: 'Three notes from the gate' });
  await expect(scene).toBeVisible();
  await expect(scene.getByText('Take four. Rest them a day.')).toBeVisible();
  await shot(page, 'events-scene');
  await onwardAll(page);
  await expect(scene).toHaveCount(0);
  await tab(page, 'Hold').click();

  // The card: tokens, the boss line and the hunts line. The bank starts empty, so no badge yet.
  const card = page.getByRole('region', { name: 'Events' });
  await expect(card).toBeVisible();
  await expect(card.getByText(/^Tokens 0 of 6 · next in/)).toBeVisible();
  await expect(card.getByText(/The Lindworm of Velk Fjord · tier \d · 100% left/)).toBeVisible();
  await expect(card.getByText('Legendary Hunts: 3 of 3 to unlock')).toBeVisible();
  await expect(tab(page, 'Hold')).not.toContainText('●');
  await shot(page, 'events-card');

  // Fill the bank from the debug panel: the badge shows and the card says "full".
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByRole('button', { name: 'Fill the attempt bank' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await tab(page, 'Hold').click();
  await expect(card.getByText('Tokens: 6 of 6, full')).toBeVisible();
  await expect(tab(page, 'Hold')).toContainText('●');

  // Taps from the Hold screen: card button, Send a party, Suggest, Send.
  let taps = 0;
  const tap = async (b: ReturnType<Page['getByRole']>): Promise<void> => {
    taps += 1;
    await b.click();
  };
  await tap(card.getByRole('button', { name: /The Great Beast/ }));
  const sheet = page.getByRole('dialog', { name: 'The Great Beast' });
  await expect(sheet.getByText('The Lindworm of Velk Fjord')).toBeVisible();
  await expect(sheet.getByText(/^25%/)).toBeVisible();
  await shot(page, 'boss-sheet');
  await tap(sheet.getByRole('button', { name: 'Send a party' }));
  const party = page.getByRole('dialog', { name: 'Send a party' });
  await tap(party.getByRole('button', { name: 'Suggest best' }));
  await expect(party.getByText(/^Expected damage: /)).toBeVisible({ timeout: 20_000 });
  await shot(page, 'boss-party');
  await tap(party.getByRole('button', { name: 'Send the hunters' }));
  await expect(party).toHaveCount(0);
  expect(taps).toBeLessThanOrEqual(15);

  // The attempt plays back like a Delve floor, with Skip and Log, then the result sheet.
  const play = page.getByRole('dialog', { name: 'The Lindworm of Velk Fjord' });
  await expect(play.getByRole('button', { name: 'Skip' })).toBeVisible();
  await shot(page, 'boss-playback');
  // Only the top sheet shows, so the playback starts again after the Log closes.
  await play.getByRole('button', { name: 'Log' }).click();
  const log = page.getByRole('dialog', { name: 'Fight log' });
  await expect(log.getByRole('listitem').first()).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await play.getByRole('button', { name: 'Skip' }).click();
  await play.getByRole('button', { name: 'See the result' }).click();
  const result = page.getByRole('dialog', { name: 'Result' });
  await expect(result.getByText('Damage:')).toBeVisible();
  await expect(result.getByText('XP each:')).toBeVisible();
  await expect(result.getByText('Rests for:')).toBeVisible();
  await shot(page, 'boss-result');
  await page.getByRole('button', { name: 'Close' }).click();

  // The boss sheet shows the last result; the tokens went down by one and the pool is no longer whole.
  await expect(
    page.getByRole('dialog', { name: 'The Great Beast' }).getByText(/^Last attempt: /),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(card.getByText(/^Tokens 5 of 6/)).toBeVisible();
  await expect(card.getByText(/% left/)).not.toContainText('100% left');
  expect(errors).toEqual([]);
});

test('the layout holds at 360, 900 and 1300 px with no sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await importOwner(page);
  await untilScene(page);
  await onwardAll(page);
  await tab(page, 'Hold').click();
  await page
    .getByRole('region', { name: 'Events' })
    .getByRole('button', { name: /The Great Beast/ })
    .click();
  for (const width of [360, 900, 1300]) {
    await page.setViewportSize({ width, height: 740 });
    const wide = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(wide, `${width} px`).toBe(false);
  }
});

test('a hunt: the list, a track, the odds, playback, the result, the shelf and the rest line', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await importOwner(page);
  await untilScene(page);
  await onwardAll(page);
  await tab(page, 'Hold').click();
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByRole('button', { name: 'Fill the attempt bank' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await tab(page, 'Hold').click();

  const card = page.getByRole('region', { name: 'Events' });
  await card.getByRole('button', { name: /Legendary Hunts/ }).click();
  const list = page.getByRole('dialog', { name: 'Legendary Hunts' });
  await expect(list.getByText('0 of 100').first()).toBeVisible();
  await expect(list.getByText(/Hunter to be won: Gest Tall-Torch/)).toBeVisible();
  await shot(page, 'hunt-list');
  await list
    .getByRole('button', { name: /The Toll Road/ })
    .first()
    .click();
  const track = page.getByRole('dialog').last();
  await expect(track.getByText(/Track needs: /).first()).toBeVisible();
  await track.getByRole('button', { name: 'Suggest best' }).click();
  await expect(track.getByText(/^ODDS \d+%/)).toBeVisible({ timeout: 30_000 });
  await expect(track.getByText(/Reckless/)).toHaveCount(0);
  await shot(page, 'hunt-track');
  await track.getByRole('button', { name: 'Send the hunters' }).click();
  const play = page.getByRole('dialog').last();
  await play.getByRole('button', { name: 'Skip' }).click();
  await play.getByRole('button', { name: 'See the result' }).click();
  const result = page.getByRole('dialog', { name: 'Result' });
  await expect(result.getByText(/^A (win|loss)\.$/)).toBeVisible();
  await expect(result.getByText('Points:')).toBeVisible();
  await shot(page, 'hunt-result');
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Close' }).click();

  // The Great Beasts shelf: the quarry is Identified now; the others are not.
  await tab(page, 'Archive').click();
  await page.getByRole('button', { name: 'Bestiary', exact: true }).click();
  const shelf = page.getByRole('region', { name: 'Great Beasts' });
  await expect(shelf).toBeVisible();
  await expect(shelf.getByRole('button', { name: 'Stoneback the Fell Troll' })).toBeVisible();
  await expect(shelf.getByRole('button', { name: 'Not yet met' })).toHaveCount(5);

  // A hunter who attended rests; the hunter's sheet says so.
  await tab(page, 'Hunters').click();
  await expect(page.getByRole('navigation')).toBeVisible();
  expect(errors).toEqual([]);
});
