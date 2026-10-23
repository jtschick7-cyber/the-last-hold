import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import type { SoundId } from '../../src/platform/sound/moments';
import { begin, closeOrdersScenes, debugPress, onwardAll, tab } from './helpers';
import { load, type Save } from './layout-helpers';
import {
  hold,
  installSoundHook,
  played,
  delveSave,
  ownerSaveEdited,
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

/** Plays a whole Delve with Skip, checking after each fight that its one sound matches the line. */
const playDelve = async (page: Page, tookSound: () => Promise<SoundId[]>): Promise<SoundId[]> => {
  const sheet = page.getByRole('dialog', { name: 'Delve' });
  let seen = 0;
  const heard: SoundId[] = [];
  for (let i = 0; i < 80; i++) {
    if (await sheet.getByRole('button', { name: 'Done' }).isVisible()) break;
    if (await sheet.getByRole('button', { name: 'Take this blessing' }).isVisible()) {
      await sheet.locator('button[aria-pressed="false"]').first().click();
      await sheet.getByRole('button', { name: 'Take this blessing' }).click();
    } else if (await sheet.getByText(/Two doors/).isVisible()) {
      await sheet.getByRole('button').filter({ hasText: 'Ahead:' }).first().click();
    } else if (await sheet.getByRole('button', { name: 'Fight', exact: true }).isVisible()) {
      await sheet.getByRole('button', { name: 'Fight', exact: true }).click();
      await sheet.getByRole('button', { name: 'Skip' }).click();
      const line = (await sheet.locator('[aria-live="polite"]').last().textContent()) ?? '';
      await hold(page);
      const all = await tookSound();
      expect(all.length, `one sound for this fight (${line})`).toBe(seen + 1);
      seen = all.length;
      const sound = all[all.length - 1] as SoundId;
      expect(sound).toBe(
        line.includes('falls') ? 'lose' : line.includes('guardian') ? 'fanfare' : 'win',
      );
      heard.push(sound);
      // The log is a replay of what was just shown: opening it plays nothing.
      await sheet.getByRole('button', { name: 'Log' }).click();
      await page
        .getByRole('dialog', { name: 'Fight log' })
        .getByRole('button', { name: 'Close' })
        .click();
      await hold(page);
      expect((await tookSound()).length).toBe(seen);
      // Closing the log re-opens the sheet on the next stage; if it did not, carry on from here.
      const next = sheet.getByRole('button', { name: 'Continue' });
      if (await next.isVisible()) await next.click();
    } else await page.waitForTimeout(150);
  }
  return heard;
};

const openDelve = async (page: Page): Promise<void> => {
  await tab(page, 'Hold').click();
  await page
    .getByRole('region', { name: 'The Rift' })
    .getByRole('button', { name: 'Delve', exact: true })
    .click();
  await page.getByRole('dialog', { name: 'Delve' }).getByRole('button', { name: 'Start' }).click();
};

test('Delve: each floor cleared plays Win, the guardian plays Fanfare; the log replays silently; Leave run is silent', async ({
  page,
}) => {
  const { save, at } = delveSave('strong');
  await page.clock.install({ time: at });
  await installSoundHook(page);
  await load(page, () => {}, save as unknown as Save);
  await soundOn(page);
  await openDelve(page);
  const heard = await playDelve(page, () => played(page));
  expect(heard.slice(0, -1).every((s) => s === 'win')).toBe(true);
  expect(heard.at(-1)).toBe('fanfare'); // a strong party reaches and beats the guardian
  expect(heard.length).toBe(7);
});

test('Delve: a lost run plays Lose once; closing a playback before its end is silent', async ({
  page,
}) => {
  const { save, at } = delveSave('frail');
  await page.clock.install({ time: at });
  await installSoundHook(page);
  await load(page, () => {}, save as unknown as Save);
  await soundOn(page);
  await openDelve(page);
  const sheet = page.getByRole('dialog', { name: 'Delve' });
  // Get to the first fight, start it, and close the sheet before it ends: not fought, so silent.
  for (let i = 0; i < 40; i++) {
    if (await sheet.getByRole('button', { name: 'Fight', exact: true }).isVisible()) break;
    if (await sheet.getByRole('button', { name: 'Take this blessing' }).isVisible()) {
      await sheet.locator('button[aria-pressed="false"]').first().click();
      await sheet.getByRole('button', { name: 'Take this blessing' }).click();
    } else if (await sheet.getByText(/Two doors/).isVisible()) {
      await sheet.getByRole('button').filter({ hasText: 'Ahead:' }).first().click();
    } else await page.waitForTimeout(150);
  }
  await sheet.getByRole('button', { name: 'Fight', exact: true }).click();
  await sheet.getByRole('button', { name: 'Close' }).first().click();
  await hold(page);
  expect(await played(page)).toEqual([]);
  await page
    .getByRole('region', { name: 'The Rift' })
    .getByRole('button', { name: /^Continue/ })
    .click();
  const heard = await playDelve(page, () => played(page));
  expect(heard.at(-1)).toBe('lose');
  expect(heard.filter((s) => s === 'lose')).toHaveLength(1);
});

const ownerSave = JSON.parse(
  readFileSync(new URL('../saves/fixtures/v8-owner.json', import.meta.url), 'utf8'),
);

const sendBossParty = async (page: Page): Promise<void> => {
  await debugPress(page, 'Fill the attempt bank');
  await tab(page, 'Hold').click();
  await page
    .getByRole('region', { name: 'Events' })
    .getByRole('button', { name: /The Great Beast/ })
    .click();
  await page
    .getByRole('dialog', { name: 'The Great Beast' })
    .getByRole('button', { name: 'Send a party' })
    .click();
  const party = page.getByRole('dialog', { name: 'Send a party' });
  await party.getByRole('button', { name: 'Suggest best' }).click();
  await expect(party.getByText(/^Expected damage: /)).toBeVisible({ timeout: 20_000 });
  await party.getByRole('button', { name: 'Send the hunters' }).click();
};

test('a Great Beast attempt that earns nothing is silent; sending is silent; the result sheet adds nothing', async ({
  page,
}) => {
  await installSoundHook(page);
  await load(page, () => {}, ownerSave);
  await soundOn(page);
  await sendBossParty(page);
  const play = page.getByRole('dialog', { name: 'The Lindworm of Velk Fjord' });
  await expect(play.getByRole('button', { name: 'Skip' })).toBeVisible();
  await play.getByRole('button', { name: 'Skip' }).click();
  await play.getByRole('button', { name: 'See the result' }).click();
  await expect(page.getByRole('dialog', { name: 'Result' })).toContainText(
    'Milestones: None this time',
  );
  await hold(page);
  expect(await played(page)).toEqual([]);
});

const lowPool = ownerSaveEdited(ownerSave, (s) => {
  Object.assign(s.events.boss, { tier: 3, pool: 10, paid: 3, attempts: 3 });
});

for (const how of ['skip', 'close'] as const) {
  test(`a Great Beast kill plays Fanfare once; ${how === 'skip' ? 'at the end of the playback' : 'at once when the sheet is closed early'}`, async ({
    page,
  }) => {
    await installSoundHook(page);
    await load(page, () => {}, lowPool as unknown as Save);
    await soundOn(page);
    await sendBossParty(page);
    const play = page.getByRole('dialog').last();
    await expect(play.getByRole('button', { name: 'Skip' })).toBeVisible();
    await hold(page);
    expect(await played(page)).toEqual([]); // not before the result is shown
    if (how === 'skip') {
      await play.getByRole('button', { name: 'Skip' }).click();
      await hold(page);
      expect(await played(page)).toEqual(['fanfare']);
      await play.getByRole('button', { name: 'See the result' }).click();
    } else {
      await play.getByRole('button', { name: 'Close' }).first().click();
    }
    await hold(page);
    expect(await played(page)).toEqual(['fanfare']);
  });
}

test('a Legendary hunter unlocked plays Fanfare once, when the result is shown', async ({
  page,
}) => {
  // One point short on every hunt: a win on the track unlocks (content/balance.ts hunt.unlockPoints).
  const almost = ownerSaveEdited(ownerSave, (s) => {
    for (const h of Object.values(s.events.hunts)) h.points = 99;
  });
  await installSoundHook(page);
  await load(page, () => {}, almost as unknown as Save);
  await soundOn(page);
  await debugPress(page, 'Fill the attempt bank');
  await tab(page, 'Hold').click();
  await page
    .getByRole('region', { name: 'Events' })
    .getByRole('button', { name: /Legendary Hunts/ })
    .click();
  await page
    .getByRole('dialog', { name: 'Legendary Hunts' })
    .getByRole('button', { name: /The Toll Road/ })
    .first()
    .click();
  const track = page.getByRole('dialog').last();
  await track.getByRole('button', { name: 'Suggest best' }).click();
  await expect(track.getByText(/^ODDS \d+%/)).toBeVisible({ timeout: 30_000 });
  await track.getByRole('button', { name: 'Send the hunters' }).click();
  const play = page.getByRole('dialog').last();
  await expect(play.getByRole('button', { name: 'Skip' })).toBeVisible();
  expect(await played(page)).toEqual([]);
  await play.getByRole('button', { name: 'Skip' }).click();
  await play.getByRole('button', { name: 'See the result' }).click();
  await hold(page);
  await expect(page.getByRole('dialog', { name: 'A hunter joins' })).toBeVisible();
  expect(await played(page)).toEqual(['fanfare']);
});

test('the Long Night plays Nightfall once, when its sheet appears; the Last Stand before it and reopening it are silent', async ({
  page,
}) => {
  await installSoundHook(page);
  await page.goto('./?debug');
  await begin(page);
  await debugPress(page, 'Unlock Bastion');
  await onwardAll(page);
  await closeOrdersScenes(page);
  await soundOn(page);
  await tab(page, 'Hold').click();
  await page.getByRole('button', { name: 'Rank ▸' }).click();
  await page.getByRole('button', { name: 'Make the Last Stand' }).click();
  await expect(page.getByText(/^Expected:/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await hold(page);
  expect(await played(page)).toEqual([]); // starting the stand is silent
  await page.getByRole('button', { name: 'Go up to the walls' }).click();
  const night = page.getByRole('dialog', { name: 'The Long Night' });
  await expect(night.getByText(/The walls held/)).toBeVisible();
  await hold(page);
  expect(await played(page)).toEqual(['nightfall']);
  // Its waves and pages are silent.
  await night.getByRole('button', { name: '1', exact: true }).click();
  await page.getByRole('dialog', { name: 'Wave 1' }).getByRole('button', { name: 'Close' }).click();
  await night.getByRole('button', { name: 'Next' }).click();
  await hold(page);
  expect(await played(page)).toEqual(['nightfall']);
  // Closed unread: the Hold's card brings it back, and that is silent.
  await night.getByRole('button', { name: 'Close' }).first().click();
  await page.getByRole('button', { name: /The Long Night: what happened/ }).click();
  await hold(page);
  expect(await played(page)).toEqual(['nightfall']);
});
