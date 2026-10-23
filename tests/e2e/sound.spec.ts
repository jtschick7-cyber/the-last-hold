import { expect, test, type Page } from '@playwright/test';
import { begin, debugPress, onwardAll, tab } from './helpers';
import { load, type Save } from './layout-helpers';
import {
  hold,
  installSoundHook,
  played,
  runningContractSave,
  setAudioState,
  soundOn,
} from './sound-helpers';

// Plan SF.7 (GDD §9.22, D520–D522): each moment plays its one sound, and the silent list plays none.
// The recording fake replaces only the audio output; the readiness rules still run.

test('Sound Off: nothing is requested and a buy is silent', async ({ page }) => {
  const requested = await installSoundHook(page);
  await page.goto('./?debug');
  await begin(page);
  await debugPress(page, '+1K wood', '+1K food');
  await tab(page, 'Hold').click();
  await page
    .getByRole('listitem')
    .filter({ has: page.locator('strong', { hasText: /^Cottage$/ }) })
    .getByRole('button', { name: 'Buy' })
    .click();
  await hold(page);
  expect(await played(page)).toEqual([]);
  expect(requested).toEqual([]);
});

test('turning Sound On loads the seven files in that tap; a buy then plays Build once', async ({
  page,
}) => {
  const requested = await installSoundHook(page);
  await page.goto('./?debug');
  await begin(page);
  await debugPress(page, '+1K wood', '+1K food');
  await soundOn(page);
  await expect.poll(() => requested.length).toBe(7);
  expect(requested.map((p) => p.split('/').pop()).sort()).toEqual(
    ['build', 'fanfare', 'launch', 'lose', 'nightfall', 'place', 'win'].map((n) => `${n}.mp3`),
  );
  await tab(page, 'Hold').click();
  await page
    .getByRole('listitem')
    .filter({ has: page.locator('strong', { hasText: /^Cottage$/ }) })
    .getByRole('button', { name: 'Buy' })
    .click();
  await hold(page);
  expect(await played(page)).toEqual(['build']);
});

const row = (page: Page, name: string) =>
  page
    .getByRole('listitem')
    .filter({ has: page.locator('strong', { hasText: new RegExp(`^${name}$`) }) });

test('a new building and a bulk buy each play Build once; a launch plays Launch; the silent list plays none', async ({
  page,
}) => {
  await installSoundHook(page);
  await page.goto('./?debug');
  await begin(page);
  await debugPress(page, '+1K wood', '+1K food');
  await soundOn(page);
  await tab(page, 'Hold').click();

  // The silent list first: tabs, the Rank sheet, a plain tap on the list.
  for (const t of ['More', 'Hold']) await tab(page, t).click();
  await page.getByRole('button', { name: '×10', exact: true }).click();
  await hold(page);
  expect(await played(page)).toEqual([]);

  // A bulk buy is one command, so one sound.
  await row(page, 'Cottage')
    .getByRole('button', { name: /^Buy ×/ })
    .click();
  await hold(page);
  expect(await played(page)).toEqual(['build']);

  // The Mine is a new building: Build, once. It opens the board.
  await page.getByRole('button', { name: '×1', exact: true }).click();
  await row(page, 'Mine').getByRole('button', { name: 'Buy' }).click();
  await hold(page);
  expect(await played(page)).toEqual(['build', 'build']);

  await tab(page, 'Contracts').click();
  await page.getByRole('button', { name: 'Prepare' }).first().click({ timeout: 15_000 });
  await expect(page.getByText(/^ODDS/)).toBeVisible();
  await page.getByRole('button', { name: 'Send the hunters' }).click();
  await hold(page);
  expect(await played(page)).toEqual(['build', 'build', 'launch']);
});

test('two moments inside the 150 ms hold play only the stronger; the debug row plays each of the seven without touching the save', async ({
  page,
}) => {
  await installSoundHook(page);
  await page.goto('./?debug');
  await begin(page);
  await soundOn(page);
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  const play = (id: string) => page.locator(`[data-play-sound="${id}"]`);
  for (const id of ['build', 'launch', 'place', 'win', 'lose', 'fanfare', 'nightfall']) {
    await play(id).click();
    await hold(page);
  }
  expect(await played(page)).toEqual([
    'build',
    'launch',
    'place',
    'win',
    'lose',
    'fanfare',
    'nightfall',
  ]);
  // Two inside the hold: the stronger plays, once.
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('[data-play-sound="place"]')?.click();
    document.querySelector<HTMLElement>('[data-play-sound="win"]')?.click();
    document.querySelector<HTMLElement>('[data-play-sound="build"]')?.click();
  });
  await hold(page);
  expect((await played(page)).slice(7)).toEqual(['win']);
  // Playing a sound is not debug use.
  await page.getByText('Raw state').click();
  await expect(page.locator('pre')).toContainText('"debugUsed": false');
});

test('nothing plays while the page is hidden or the audio is paused, and nothing is replayed later', async ({
  page,
}) => {
  await installSoundHook(page);
  await page.goto('./?debug');
  await begin(page);
  await debugPress(page, '+1K wood', '+1K food');
  await soundOn(page);
  await tab(page, 'Hold').click();

  // Hidden: skipped.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
  });
  await row(page, 'Cottage').getByRole('button', { name: 'Buy' }).click();
  await hold(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
  });
  expect(await played(page)).toEqual([]);

  // Interrupted (a call) and the phone will not resume it: skipped, and not replayed afterwards.
  await setAudioState(page, 'interrupted', false);
  await row(page, 'Cottage').getByRole('button', { name: 'Buy' }).click();
  await hold(page);
  expect(await played(page)).toEqual([]);

  // The next tap resumes it; only the new sound plays.
  await setAudioState(page, 'interrupted', true);
  await row(page, 'Cottage').getByRole('button', { name: 'Buy' }).click();
  await hold(page);
  expect(await played(page)).toEqual(['build']);
});

test('Arrange Hold: a completed move or swap plays Place; Move to tray, Clear to tray and Auto-arrange are silent', async ({
  page,
}) => {
  await installSoundHook(page);
  await load(page, () => {});
  await soundOn(page);
  await tab(page, 'Hold').click();
  await page.locator('[data-layout-button]').click();
  const sheet = page.getByRole('dialog', { name: 'Arrange Hold' });
  const where = async (id: string): Promise<string[]> =>
    sheet
      .locator(`[data-piece="${id}"]`)
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-tile') ?? ''));
  const [smithyAt] = await where('smithy');
  const free =
    (await sheet
      .locator('[data-piece=""][data-locked="false"]')
      .first()
      .getAttribute('data-tile')) ?? '';

  // Selecting is silent; the completed move plays Place once.
  await sheet.locator(`[data-tile="${smithyAt}"]`).click();
  await hold(page);
  expect(await played(page)).toEqual([]);
  await sheet.locator(`[data-tile="${free}"]`).click();
  await hold(page);
  expect(await played(page)).toEqual(['place']);

  // A swap is also one completed move.
  const [millAt] = await where('mill');
  const [sawAt] = await where('sawpit');
  await sheet.locator(`[data-tile="${millAt}"]`).click();
  await sheet.locator(`[data-tile="${sawAt}"]`).click();
  await hold(page);
  expect(await played(page)).toEqual(['place', 'place']);

  // A tile outside the clearing places nothing and is silent.
  await sheet.locator('[data-tile="0,0"]').click();
  await hold(page);
  expect(await played(page)).toEqual(['place', 'place']);

  // The silent list: Move to tray, Clear to tray, Auto-arrange.
  const [lodgeAt] = await where('lodge');
  await sheet.locator(`[data-tile="${lodgeAt}"]`).click();
  await sheet.getByRole('button', { name: 'Move to tray' }).click();
  await sheet.getByRole('button', { name: 'Clear to tray…' }).click();
  await sheet.getByRole('button', { name: 'Clear to tray', exact: true }).click();
  await sheet.getByRole('button', { name: 'Auto-arrange' }).click();
  await hold(page);
  expect(await played(page)).toEqual(['place', 'place']);

  // A tray item placed on the grid is a completed move.
  await sheet.getByRole('button', { name: 'Clear to tray…' }).click();
  await sheet.getByRole('button', { name: 'Clear to tray', exact: true }).click();
  await sheet.locator('[data-tray-item="lodge"]').click();
  const free2 =
    (await sheet
      .locator('[data-piece=""][data-locked="false"]')
      .first()
      .getAttribute('data-tile')) ?? '';
  await sheet.locator(`[data-tile="${free2}"]`).click();
  await hold(page);
  expect(await played(page)).toEqual(['place', 'place', 'place']);
});

for (const outcome of ['win', 'lose'] as const) {
  test(`a contract that finishes in the live tick plays ${outcome === 'win' ? 'Win' : 'Lose'} once`, async ({
    page,
  }) => {
    const { save, at } = runningContractSave(outcome);
    await page.clock.install({ time: at });
    await installSoundHook(page);
    await load(page, () => {}, save as unknown as Save);
    await soundOn(page);
    await tab(page, 'Hold').click();
    expect(await played(page)).toEqual([]);
    // The app stays open and the time passes: a live tick finishes the contract.
    await page.clock.fastForward('13:00:00');
    await expect.poll(() => played(page)).toEqual([outcome]);
    await hold(page);
    expect(await played(page)).toEqual([outcome]);
  });

  test(`${outcome}: the same finish caught up on return is silent`, async ({ page }) => {
    const { save, at } = runningContractSave(outcome);
    await page.clock.install({ time: at });
    await installSoundHook(page);
    await load(page, () => {}, save as unknown as Save);
    await soundOn(page);
    // The phone was away: the clock jumps with no timer running, then the app returns.
    await page.clock.setSystemTime(at + 13 * 3_600_000);
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect(page.getByRole('dialog', { name: /While you were away/ })).toBeVisible();
    await hold(page);
    expect(await played(page)).toEqual([]);
  });
}

test('a hunter rank-up plays Fanfare once; getting ready for it is silent', async ({ page }) => {
  await installSoundHook(page);
  await page.goto('./?debug');
  await begin(page, 'Mira');
  await debugPress(page, '+1K wood', '+1K food', '+1K iron', '+1K wood', '+1K iron', '+1K iron');
  await tab(page, 'Hold').click();
  await row(page, 'Mine').getByRole('button', { name: 'Buy' }).click();
  await onwardAll(page);
  await debugPress(page, 'Ready to rank up');
  await soundOn(page);
  await tab(page, 'Hunters').click();
  await page.locator('li button', { hasText: /Lv \d/ }).first().click();
  const sheet = page.getByRole('dialog');
  await hold(page);
  expect(await played(page)).toEqual([]);
  await sheet.getByRole('button', { name: 'Rank up to Wright' }).click();
  await hold(page);
  expect(await played(page)).toEqual(['fanfare']);
});

test("the Hold's own Rank-up plays Fanfare once", async ({ page }) => {
  await installSoundHook(page);
  await load(page, (s) => {
    // Everything the Bastion asks for (content/ages.ts), so the button is on.
    s.resources = { food: 2e6, wood: 2e6, iron: 2e6, silver: 5_000 };
    s.peasants.total = 80;
    Object.assign(s.buildings, { mill: 12, smithy: 9, barracks: 3, walls: 1 });
  });
  await soundOn(page);
  await tab(page, 'Hold').click();
  await page.getByRole('button', { name: 'Rank ▸' }).click();
  await hold(page);
  expect(await played(page)).toEqual([]);
  await page.getByRole('button', { name: 'Rank up to Bastion' }).click();
  await hold(page);
  expect(await played(page)).toEqual(['fanfare']);
});
