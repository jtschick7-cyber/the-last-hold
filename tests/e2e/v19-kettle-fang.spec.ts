import { expect, test, type Page } from '@playwright/test';
import { COURTYARD_MARK_IDS } from '../../src/content/courtyard-marks';
import { COSMETIC_IDS } from '../../src/content/delves/shop';
import { begin, closeOrdersScenes, onwardAll, tab } from './helpers';
import { clearScenes, fixture } from './layout-helpers';

// Plan T19.10 (D631–D636): Targeted E2E flows for v1.9 "Kettle & Fang":
// 1. Schema 16 -> 17 migration keeping unstarted visit 3 at The Thorn-Stag without falsely
//    unlocking Courtyard Marks #7-#8;
// 2. The Thorn-Stag & The Beacon-Bane boss attempts/kills, Fire attacks & Pitch-Flare logs,
//    Emberwright Plate (-25% Fire taken) & Coldwater Draught, Bestiary Great Beasts shelf,
//    and Courtyard Marks #7-#8 unlocks across HoldGrid + HoldScene;
// 3. Alchemist's Hut brew speed scaling (Lv 3 -> Lv 5 Breakdown) & Alchemy-scaled Poppy Smoke;
// 4. PreparationPicker Saltburst Well-Prepared indicator (unidentified vs passive Lightless)
//    + Poppy Smoke Shrouded + Saltburst live Watch fight log.

const v16Owner = () => fixture('v16-owner');

interface OwnerSave {
  schemaVersion: number;
  rulesVersion?: number;
  savedAt: number;
  state: {
    time: number;
    buildings: Record<string, number>;
    stores: Record<string, number>;
    running: unknown[];
    results: unknown[];
    board: {
      open: {
        id: string;
        village: string;
        monster: string;
        tier: number;
        location: string;
        arrivedAt: number;
        revealed: number;
      }[];
      nextArrivalAt: number | null;
    };
    events: {
      rest: Record<string, number>;
      tokens: { count: number; at: number | null };
      boss: {
        visit: number;
        tier: number | null;
        pool: number | null;
        paid: number;
        attempts: number;
      };
    };
    cosmetics?: { marks: Record<string, boolean>; hidden: string[] };
    delve: { shop: { cosmetics: string[] } };
  };
}

const importSave = async (page: Page, save: OwnerSave): Promise<void> => {
  await page.addInitScript(() => {
    for (const prefix of ['lasthold:', 'lasthold-preview:']) {
      const key = `${prefix}settings`;
      const old = JSON.parse(localStorage.getItem(key) ?? '{}');
      localStorage.setItem(key, JSON.stringify({ ...old, firstSeenAt: Date.now() }));
    }
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
  await clearScenes(page);
  await tab(page, 'Hold').click();
};

const makeV17Owner = (edit: (save: OwnerSave) => void): OwnerSave => {
  const save = v16Owner() as OwnerSave;
  save.schemaVersion = 17;
  save.rulesVersion = 8;
  save.state.running = [];
  save.state.results = [];
  save.state.events.rest = {};
  save.state.events.tokens = { count: 6, at: null };
  Object.assign(save.state.stores, {
    'thornbane-oil': 4,
    'wrights-oil': 4,
    'coldwater-draught': 4,
    'owl-eye-drops': 4,
    'hardwood-tonic': 4,
    'steadfast-draught': 4,
    'poppy-smoke': 4,
    saltburst: 4,
  });
  edit(save);
  return save;
};

const debugSkip12h = async (page: Page): Promise<void> => {
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByRole('button', { name: '+12 h', exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).first().click();
  await onwardAll(page);
  await closeOrdersScenes(page);
};

test('v16 -> v17 migration keeps unstarted visit 3 at The Thorn-Stag without premature Marks #7-#8', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  const save = v16Owner() as OwnerSave;
  expect(save.schemaVersion).toBe(16);
  save.state.running = [];
  save.state.results = [];
  save.state.events.rest = {};
  save.state.events.tokens = { count: 6, at: null };
  save.state.events.boss = { visit: 3, tier: null, pool: null, paid: 0, attempts: 0 };

  await importSave(page, save);

  // Events card shows The Thorn-Stag at tier 5 (not skipped to pass 1 Lindworm).
  const card = page.getByRole('region', { name: 'Events' });
  await expect(card).toContainText('The Thorn-Stag · tier 5 · 100% left');

  // Hold Look keeps #7 Thorn-Antler Rack and #8 Beacon-Iron Urn locked (no false backfill).
  await page.locator('[data-hold-look-button="hold"]').click();
  const look = page.getByRole('dialog', { name: 'Hold Look' });
  await expect(look).toContainText('Thorn-Antler Rack');
  await expect(look).toContainText('Locked · The Thorn-Stag');
  await expect(look).toContainText('Beacon-Iron Urn');
  await expect(look).toContainText('Locked · The Beacon-Bane');
  await expect(look.locator('[data-cosmetic-locked="thorn-antler-rack"]')).toBeVisible();
  await expect(look.locator('[data-cosmetic-locked="beacon-iron-urn"]')).toBeVisible();
  await look.getByRole('button', { name: 'Close' }).click();

  // BossSheet shows The Thorn-Stag stats, abilities, and 5-boss Tier breakdown.
  await card.getByRole('button', { name: /^The Great Beast/ }).click();
  const boss = page.getByRole('dialog', { name: 'The Great Beast' });
  await expect(boss).toContainText('The Thorn-Stag');
  await expect(boss).toContainText('Field & Forest Spirits');
  await expect(boss).toContainText('weak: Steel ×1.5, Fire ×1.25');
  await expect(boss).toContainText('Thorn-Snare · Bramble-Sweep');
  await boss.getByLabel('Show breakdown').first().click();
  await expect(page.getByRole('dialog').last()).toContainText('Completed passes through the five');
  await page.getByRole('dialog').last().getByRole('button', { name: 'Close' }).click();

  await boss.getByRole('button', { name: 'Send a party' }).click();
  await expect(page.getByRole('dialog', { name: 'Send a party' })).toContainText(
    'The Thorn-Stag: weak to Steel ×1.5, Fire ×1.25.',
  );
  expect(errors).toEqual([]);
});

test('The Thorn-Stag & The Beacon-Bane kills unlock Marks #7-#8; Fire playback, Emberwright Plate & Bestiary shelf', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  const save = makeV17Owner((s) => {
    s.state.events.boss = { visit: 3, tier: 5, pool: 50, paid: 3, attempts: 0 };
  });
  await importSave(page, save);

  // 1. Emberwright Plate displays updated v1.9 −25% Fire taken on Hunter & SlotPicker sheets.
  await tab(page, 'Hunters').click();
  await page.getByRole('button', { name: /^Arvid/ }).click();
  const arvidSheet = page.getByRole('dialog', { name: /Arvid/ });
  await expect(arvidSheet).toContainText('Emberwright Plate');
  await expect(arvidSheet).toContainText('−25% Fire taken');
  await arvidSheet.getByRole('button', { name: 'Change' }).nth(1).click();
  const picker = page.getByRole('dialog', { name: /armor/ });
  await expect(picker).toContainText('Emberwright Plate');
  await expect(picker).toContainText('−25% Fire taken');
  await picker.getByRole('button', { name: 'Close' }).click();
  await arvidSheet.getByRole('button', { name: 'Close' }).click();

  // 2. Kill The Thorn-Stag with Halvar -> unlocks Thorn-Antler Rack and advances to The Beacon-Bane (keeping Arvid rested).
  await tab(page, 'Hold').click();
  const card = page.getByRole('region', { name: 'Events' });
  await card.getByRole('button', { name: /^The Great Beast/ }).click();
  await page.getByRole('button', { name: 'Send a party' }).click();
  const stagParty = page.getByRole('dialog', { name: 'Send a party' });
  await stagParty.locator('label').filter({ hasText: 'Halvar' }).check();
  await expect(stagParty.getByText(/^Expected damage:/)).toBeVisible({ timeout: 20_000 });
  await stagParty.getByRole('button', { name: 'Send the hunters' }).click();

  const stagPlay = page.getByRole('dialog', { name: 'The Thorn-Stag' });
  await stagPlay.getByRole('button', { name: 'Skip' }).click();
  await stagPlay.getByRole('button', { name: 'See the result' }).click();
  await expect(page.getByRole('dialog', { name: 'Result' })).toContainText('The Thorn-Stag fell.');
  await page.getByRole('dialog', { name: 'Result' }).getByRole('button', { name: 'Close' }).click();
  await page
    .getByRole('dialog', { name: 'The Great Beast' })
    .getByRole('button', { name: 'Close' })
    .click();

  await expect(card).toContainText('The Beacon-Bane · tier 5 · 100% left');
  await expect(
    page.locator('[data-hold-grid] [data-courtyard-mark="thorn-antler-rack"]'),
  ).toHaveCount(1);

  await page.locator('[data-hold-look-button="hold"]').click();
  const look = page.getByRole('dialog', { name: 'Hold Look' });
  await expect(look).toContainText('Earned · The Thorn-Stag');
  await expect(look.locator('[data-cosmetic-toggle="thorn-antler-rack"]')).toHaveText('Shown');
  await expect(look.locator('[data-cosmetic-locked="beacon-iron-urn"]')).toBeVisible();
  await look.getByRole('button', { name: 'Close' }).click();

  // 3. Fight The Beacon-Bane with Arvid (Emberwright Plate), Coldwater Draught, Wright's Oil & Poppy Smoke.
  await card.getByRole('button', { name: /^The Great Beast/ }).click();
  const baneBoss = page.getByRole('dialog', { name: 'The Great Beast' });
  await expect(baneBoss).toContainText('The Beacon-Bane');
  await expect(baneBoss).toContainText('Cursed');
  await expect(baneBoss).toContainText('attacks: Fire');
  await expect(baneBoss).toContainText('weak: Frost ×1.25, Rune ×1.5, Venom ×1.25');
  await expect(baneBoss).toContainText('Pitch-Flare · Curse-Brand');

  await baneBoss.getByRole('button', { name: 'Send a party' }).click();
  const baneParty = page.getByRole('dialog', { name: 'Send a party' });
  await expect(baneParty).toContainText(
    'The Beacon-Bane: deals Fire; weak to Frost ×1.25, Rune ×1.5, Venom ×1.25.',
  );
  await baneParty.locator('label').filter({ hasText: 'Arvid Netmender' }).check();
  await baneParty.getByLabel('Potion').first().selectOption('coldwater-draught');
  await baneParty.getByLabel('Bomb 1').selectOption('poppy-smoke');
  await expect(baneParty.getByText(/^Expected damage:/)).toBeVisible({ timeout: 20_000 });
  await baneParty.getByRole('button', { name: 'Why? ▸' }).click();
  await expect(page.getByRole('dialog', { name: 'Why this damage' })).toBeVisible();
  // SheetHost renders only the top sheet, so closing Why? re-mounts Send a party cleanly.
  await page
    .getByRole('dialog', { name: 'Why this damage' })
    .getByRole('button', { name: 'Close' })
    .click();

  const banePartySend = page.getByRole('dialog', { name: 'Send a party' });
  await banePartySend.locator('label').filter({ hasText: 'Arvid Netmender' }).check();
  await banePartySend.locator('label').filter({ hasText: 'Vesna' }).check();
  await banePartySend.getByLabel('Oil').first().selectOption('wrights-oil');
  await banePartySend.getByLabel('Potion').first().selectOption('coldwater-draught');
  await banePartySend.getByLabel('Bomb 1').selectOption('poppy-smoke');
  await expect(banePartySend).toContainText('Poppy Smoke:');
  await expect(banePartySend).toContainText('is Shrouded for 2 actions');
  await expect(banePartySend.getByText(/^Expected damage:/)).toBeVisible({ timeout: 20_000 });
  await banePartySend.getByRole('button', { name: 'Send the hunters' }).click();

  // Playback Log proves Coldwater, Poppy Smoke Shrouded, direct Fire attacks, and Pitch-Flare.
  const banePlay = page.getByRole('dialog', { name: 'The Beacon-Bane' });
  await expect(banePlay.getByRole('button', { name: 'Skip' })).toBeVisible();
  await banePlay.getByRole('button', { name: 'Log' }).click();
  const log = page.getByRole('dialog', { name: 'Fight log' });
  await expect(log).toContainText('Coldwater Draught');
  await expect(log).toContainText('is Shrouded for 2 actions');
  await expect(log).toContainText('Fire');
  await expect(log).toContainText('Pitch-Flare');
  await log.getByRole('button', { name: 'Close' }).click();
  await banePlay.getByRole('button', { name: 'Skip' }).click();
  await banePlay.getByRole('button', { name: 'See the result' }).click();
  await page.getByRole('dialog', { name: 'Result' }).getByRole('button', { name: 'Close' }).click();
  await baneBoss.getByRole('button', { name: 'Close' }).click();

  // 4. Bestiary Great Beasts shelf identifies both new Great Beasts & Beacon-Bane's Fire attacks.
  await tab(page, 'Archive').click();
  await page.getByRole('button', { name: 'Bestiary', exact: true }).click();
  const shelf = page.getByRole('region', { name: 'Great Beasts' });
  await expect(shelf.getByRole('button', { name: 'The Thorn-Stag' })).toBeVisible();
  await expect(shelf.getByRole('button', { name: 'The Beacon-Bane' })).toBeVisible();
  await shelf.getByRole('button', { name: 'The Beacon-Bane' }).click();
  const entry = page.getByRole('dialog', { name: 'The Beacon-Bane' });
  await expect(entry).toContainText('2 Fire attacks an action');
  await expect(entry).toContainText('Pitch-Flare · Curse-Brand');
  expect(errors).toEqual([]);
});

test('The Beacon-Bane kill unlocks Courtyard Mark #8 (Beacon-Iron Urn) on HoldGrid and HoldScene', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  const save = makeV17Owner((s) => {
    s.state.events.boss = { visit: 4, tier: 5, pool: 50, paid: 3, attempts: 1 };
    s.state.cosmetics = {
      marks: Object.fromEntries(
        COURTYARD_MARK_IDS.filter((id) => id !== 'beacon-iron-urn').map((id) => [id, true]),
      ),
      hidden: [],
    };
    s.state.delve.shop.cosmetics = [...COSMETIC_IDS];
  });
  await importSave(page, save);

  await expect(
    page.locator('[data-hold-grid] [data-courtyard-mark="beacon-iron-urn"]'),
  ).toHaveCount(0);

  await page
    .getByRole('region', { name: 'Events' })
    .getByRole('button', { name: /^The Great Beast/ })
    .click();
  await page.getByRole('button', { name: 'Send a party' }).click();
  const party = page.getByRole('dialog', { name: 'Send a party' });
  await party.getByRole('button', { name: 'Suggest best' }).click();
  await expect(party.getByText(/^Expected damage:/)).toBeVisible({ timeout: 20_000 });
  await party.getByRole('button', { name: 'Send the hunters' }).click();
  const play = page.getByRole('dialog', { name: 'The Beacon-Bane' });
  await play.getByRole('button', { name: 'Skip' }).click();
  await play.getByRole('button', { name: 'See the result' }).click();
  await expect(page.getByRole('dialog', { name: 'Result' })).toContainText('The Beacon-Bane fell.');
  await page.getByRole('dialog', { name: 'Result' }).getByRole('button', { name: 'Close' }).click();
  await page
    .getByRole('dialog', { name: 'The Great Beast' })
    .getByRole('button', { name: 'Close' })
    .click();

  // Beacon-Iron Urn now shows in HoldGrid, Hold Look, and Classic scene (HoldScene).
  await expect(
    page.locator('[data-hold-grid] [data-courtyard-mark="beacon-iron-urn"]'),
  ).toHaveCount(1);
  await page.locator('[data-hold-look-button="hold"]').click();
  const look = page.getByRole('dialog', { name: 'Hold Look' });
  await expect(look).toContainText('Earned · The Beacon-Bane');
  await expect(look.locator('[data-cosmetic-toggle="beacon-iron-urn"]')).toHaveText('Shown');
  await look.getByRole('button', { name: 'Close' }).click();

  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  await page.getByRole('button', { name: 'Classic scene', exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await tab(page, 'Hold').click();
  await expect(
    page.locator('[data-hold-scene] [data-courtyard-mark="beacon-iron-urn"]'),
  ).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("Alchemist's Hut brew speed scales Lv 3 -> Lv 5 and PreparationPicker Saltburst + Poppy Smoke Shrouded flow", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  const save = makeV17Owner((s) => {
    s.state.buildings['alchemists-hut'] = 3;
    s.state.board.open = [
      {
        id: 'v19-unid',
        village: 'velkvik',
        monster: 'gloam-moths',
        tier: 3,
        location: 'ruin',
        arrivedAt: s.state.time,
        revealed: 0,
      },
      {
        id: 'v19-moths',
        village: 'velkvik',
        monster: 'gloam-moths',
        tier: 3,
        location: 'ruin',
        arrivedAt: s.state.time,
        revealed: 3,
      },
    ];
  });
  await importSave(page, save);

  // 1. Alchemist's Hut Lv 3 -> Lv 5 brew speed breakdown & Alchemy-scaled Poppy Smoke / Saltburst recipe.
  await page.getByRole('button', { name: 'Open' }).first().click();
  const hut3 = page.getByRole('dialog', { name: "Alchemist's Hut" });
  await expect(hut3).toContainText('Level 3 · 3 kettles');
  const lv3BrewText = await hut3.getByTestId('brew-time-line').innerText();
  await hut3.getByTestId('brew-time-line').getByLabel('Show breakdown').click();
  const bd3 = page.getByRole('dialog').last();
  await expect(bd3).toContainText("Alchemist's Hut Lv 3");
  await expect(bd3).toContainText('hut.timeCutPerLevel');
  await expect(bd3).toContainText('Alchemist links (1)');
  await bd3.getByRole('button', { name: 'Close' }).click();

  const saltRow = hut3.getByRole('listitem').filter({ hasText: 'Saltburst' });
  await expect(saltRow).toContainText('1 rime salt · 1 silver');
  const poppyRow = hut3.getByRole('listitem').filter({ hasText: 'Poppy Smoke' });
  await expect(poppyRow).toContainText('is Shrouded for 2 actions');
  await poppyRow.getByLabel('Show breakdown').click();
  const poppyBd = page.getByRole('dialog').last();
  await expect(poppyBd).toContainText('Poppy Smoke');
  await expect(poppyBd).toContainText('Alchemy');
  await poppyBd.getByRole('button', { name: 'Close' }).click();
  await hut3.getByRole('button', { name: 'Close' }).click();

  // Upgrade Alchemist's Hut Lv 3 -> Lv 5 and confirm brew + experiment breakdowns update.
  const hutItem = page
    .getByRole('listitem')
    .filter({ has: page.locator('strong', { hasText: /^Alchemist's Hut$/ }) });
  await hutItem.getByRole('button', { name: 'Upgrade' }).click();
  await hutItem.getByRole('button', { name: 'Upgrade' }).click();
  await hutItem.getByRole('button', { name: 'Open' }).click();
  const hut5 = page.getByRole('dialog', { name: "Alchemist's Hut" });
  await expect(hut5).toContainText('Level 5 · 5 kettles');
  const lv5BrewText = await hut5.getByTestId('brew-time-line').innerText();
  expect(lv5BrewText).not.toBe(lv3BrewText);
  await hut5.getByTestId('brew-time-line').getByLabel('Show breakdown').click();
  const bd5 = page.getByRole('dialog').last();
  await expect(bd5).toContainText("Alchemist's Hut Lv 5");
  await expect(bd5).toContainText('max(0, 5 − 1) × 0.08');
  await bd5.getByRole('button', { name: 'Close' }).click();

  await hut5.getByRole('button', { name: 'Experiment', exact: true }).click();
  await hut5.getByTestId('experiment-time-line').getByLabel('Show breakdown').click();
  const exp5 = page.getByRole('dialog').last();
  await expect(exp5).toContainText("Alchemist's Hut Lv 5");
  await expect(exp5).toContainText('hut.timeCutPerLevel');
  await exp5.getByRole('button', { name: 'Close' }).click();
  await hut5.getByRole('button', { name: 'Close' }).click();

  // 2. PreparationPicker Saltburst Well-Prepared indicator: off when unidentified, on for passive Lightless.
  await tab(page, 'Contracts').click();
  await page
    .getByRole('listitem')
    .filter({ hasText: /\? \d+ candidate/ })
    .first()
    .getByRole('button', { name: 'Prepare' })
    .click();
  const unidLaunch = page.getByRole('dialog', { name: 'Send hunters' });
  await expect(unidLaunch).toContainText('Resistances and abilities show once it is identified.');
  await unidLaunch.getByLabel('Oil').first().selectOption('wrights-oil');
  await unidLaunch.getByLabel('Bomb 1').selectOption('saltburst');
  await expect(unidLaunch).toContainText('Saltburst: cancels the monster’s first ability');
  await expect(unidLaunch.getByText(/Well prepared:/)).toHaveCount(0);
  await unidLaunch.getByRole('button', { name: 'Close' }).click();

  await page
    .getByRole('listitem')
    .filter({ hasText: /Gloam-moths \(/ })
    .first()
    .getByRole('button', { name: 'Prepare' })
    .click();
  const mothsLaunch = page.getByRole('dialog', { name: 'Send hunters' });
  await mothsLaunch.getByLabel('Oil').first().selectOption('wrights-oil');
  await expect(mothsLaunch.getByText(/Well prepared:/)).toHaveCount(0);
  await mothsLaunch.getByLabel('Bomb 1').selectOption('saltburst');
  await expect(mothsLaunch).toContainText('Saltburst: cancels the monster’s first ability');
  await expect(mothsLaunch).toContainText('Well prepared: a win pays ×1.5 bounty and +1 trophy.');
  await mothsLaunch.getByLabel('Bomb 2').selectOption('poppy-smoke');
  await expect(mothsLaunch).toContainText('Poppy Smoke:');
  await expect(mothsLaunch).toContainText('is Shrouded for 2 actions');
  await mothsLaunch.getByLabel('Potion').first().selectOption('owl-eye-drops');
  await expect(mothsLaunch.getByText(/^ODDS \d+%/)).toBeVisible({ timeout: 20_000 });
  await mothsLaunch.getByRole('button', { name: 'Why ▸' }).click();
  await expect(page.getByRole('dialog', { name: 'Why these odds' })).toBeVisible();
  await page
    .getByRole('dialog', { name: 'Why these odds' })
    .getByRole('button', { name: 'Close' })
    .click();

  // SheetHost unmounts LaunchView under Why ▸, so re-apply prep before sending.
  const mothsSend = page.getByRole('dialog', { name: 'Send hunters' });
  await mothsSend.getByLabel('Oil').first().selectOption('wrights-oil');
  await mothsSend.getByLabel('Potion').first().selectOption('owl-eye-drops');
  await mothsSend.getByLabel('Bomb 1').selectOption('saltburst');
  await mothsSend.getByLabel('Bomb 2').selectOption('poppy-smoke');
  await expect(mothsSend.getByText(/^ODDS \d+%/)).toBeVisible({ timeout: 20_000 });
  await mothsSend.getByRole('button', { name: 'Send the hunters' }).click();
  await onwardAll(page);

  // 3. Collect and Watch fight -> live Fight log shows Poppy Smoke Shrouded & Saltburst vs Lightless.
  await debugSkip12h(page);
  await tab(page, 'Contracts').click();
  await page.getByRole('button', { name: 'Collect' }).click();
  const finished = page.getByRole('dialog', { name: 'Contracts finished' });
  await expect(finished).toContainText('Gloam-moths · T3');
  await finished
    .getByRole('listitem')
    .filter({ hasText: 'Gloam-moths · T3' })
    .getByRole('button', { name: 'Watch fight ▸' })
    .click();
  const pb = page.getByRole('dialog', { name: 'Gloam-moths · T3' });
  await pb.getByRole('button', { name: 'Log' }).click();
  const log = page.getByRole('dialog', { name: 'Fight log' });
  await expect(log).toContainText('is Shrouded for 2 actions');
  await expect(log).toContainText('The Saltburst goes off');
  await expect(log).toContainText('Lightless');
  expect(errors).toEqual([]);
});

test('Debug buttons switch directly to The Thorn-Stag and The Beacon-Bane', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  const save = makeV17Owner((s) => {
    s.state.events.boss = { visit: 0, tier: 5, pool: 1200, paid: 3, attempts: 4 };
  });
  await importSave(page, save);

  const events = page.getByRole('region', { name: 'Events' });
  await expect(events).toContainText('The Lindworm of Velk Fjord');

  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByRole('button', { name: 'Set Great Beast: Thorn-Stag' }).click();
  await expect(page.getByText('The Thorn-Stag is now the Great Beast.')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).first().click();

  await tab(page, 'Hold').click();
  await expect(events).toContainText('The Thorn-Stag · tier 5 · 100% left');

  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByRole('button', { name: 'Set Great Beast: Beacon-Bane' }).click();
  await expect(page.getByText('The Beacon-Bane is now the Great Beast.')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).first().click();

  await tab(page, 'Hold').click();
  await expect(events).toContainText('The Beacon-Bane · tier 5 · 100% left');
  expect(errors).toEqual([]);
});
