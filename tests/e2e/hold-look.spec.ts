import { expect, test } from '@playwright/test';
import { COSMETIC_IDS } from '../../src/content/delves/shop';
import { COURTYARD_MARK_IDS } from '../../src/content/courtyard-marks';
import { tab } from './helpers';
import { clearScenes, load, remembered } from './layout-helpers';
import { scanContrast } from './polish-contrast';
import { scanTappables } from './polish-tap';
import { overflow } from './polish-text';

// Plan T18.7 (GDD §9.26, Q79–Q82): Hold Look sheet (from HoldScreen and Arrange Hold),
// Courtyard Marks + Riftglass Shop individual toggles across BOTH HoldGrid & HoldScene + reload
// persistence, single-source Breakdown lines (Rates, Threat, Hut), StandSheet/LanesStrip & WaveLog
// v7 tactical lines, 320 px Largest text size, contrast, and Reduce Motion checks.

const setLayoutPlaced = (s: { layout: { placed: Record<string, { x: number; y: number }> } }) => {
  s.layout.placed = {
    'hearth-hall': { x: 3, y: 6 },
    'farm-1': { x: 2, y: 7 },
    'farm-2': { x: 2, y: 8 },
    mill: { x: 1, y: 7 },
    'herb-garden-1': { x: 5, y: 7 },
    alchemist: { x: 5, y: 8 },
    'silver-seam-1': { x: 1, y: 9 },
    'silver-seam-2': { x: 2, y: 9 },
    smithy: { x: 2, y: 10 },
    'cottage-1': { x: 3, y: 8 },
    'cottage-2': { x: 4, y: 8 },
    'cottage-3': { x: 3, y: 5 },
    barracks: { x: 2, y: 5 },
    lodge: { x: 2, y: 4 },
    'wall-1': { x: 0, y: 1 },
    'wall-2': { x: 1, y: 1 },
    'watchtower-1': { x: 2, y: 2 },
    'wall-3': { x: 2, y: 1 },
    'wall-4': { x: 3, y: 1 },
    'wall-5': { x: 4, y: 1 },
    'watchtower-2': { x: 5, y: 1 },
    'wall-6': { x: 6, y: 1 },
    'wall-7': { x: 7, y: 1 },
  };
};

test('Hold Look opens from HoldScreen & ArrangeHold and shows locked badges cleanly', async ({
  page,
}) => {
  await load(page, (s) => {
    s.delve.shop.cosmetics = [];
    s.events.boss.visit = 0;
    for (const h of Object.values(s.events.hunts as Record<string, { unlocked?: boolean }>)) {
      if (h) h.unlocked = false;
    }
  });

  // 1. Open from HoldScreen
  const holdBtn = page.locator('[data-hold-look-button="hold"]');
  await expect(holdBtn).toHaveText('Hold Look ▸');
  await holdBtn.click();
  const sheet = page.getByRole('dialog', { name: 'Hold Look' });
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText(
    'Show or hide earned Courtyard Marks and bought Hold accents across the Grid and Scene.',
  );
  await expect(sheet.locator('[data-hold-look-row]')).toHaveCount(
    COURTYARD_MARK_IDS.length + COSMETIC_IDS.length,
  );
  await expect(sheet.locator('[data-cosmetic-toggle]')).toHaveCount(0);
  await expect(sheet.locator('[data-cosmetic-locked]')).toHaveCount(
    COURTYARD_MARK_IDS.length + COSMETIC_IDS.length,
  );
  await expect(sheet).toContainText('Locked · The Lindworm of Velk Fjord');
  await expect(sheet).toContainText('Buy in the Riftglass shop (Rank ▸)');
  await sheet.getByRole('button', { name: 'Close' }).click();

  // 2. Open stacked from ArrangeHoldSheet
  await page.locator('[data-layout-button]').click();
  const arrange = page.getByRole('dialog', { name: 'Arrange Hold' });
  await expect(arrange).toBeVisible();
  await arrange.locator('[data-hold-look-button="arrange"]').click();
  await expect(page.getByRole('dialog', { name: 'Hold Look' })).toBeVisible();
  await page
    .getByRole('dialog', { name: 'Hold Look' })
    .getByRole('button', { name: 'Close' })
    .click();
  await expect(arrange).toBeVisible();
  await arrange.getByRole('button', { name: 'Close' }).click();
});

test('Courtyard Marks and Shop Cosmetics toggle individually across HoldGrid, HoldScene, and reload', async ({
  page,
}) => {
  await load(
    page,
    (s) => {
      s.delve.shop.cosmetics = [...COSMETIC_IDS];
      s.cosmetics = {
        marks: Object.fromEntries(COURTYARD_MARK_IDS.map((id) => [id, true])),
        hidden: [],
      };
    },
    remembered,
  );

  // Initially all 6 marks + 4 cosmetics visible on HoldGrid.
  const grid = page.locator('[data-hold-grid]');
  await expect(grid).toBeVisible();
  await expect(grid.locator('[data-courtyard-mark]')).toHaveCount(COURTYARD_MARK_IDS.length);
  await expect(grid).toHaveAttribute('data-banners', 'true');

  // Toggle one mark & one shop cosmetic Hidden in Hold Look.
  await page.locator('[data-hold-look-button="hold"]').click();
  const look = page.getByRole('dialog', { name: 'Hold Look' });
  const markBtn = look.locator('[data-cosmetic-toggle="fjord-bone-standard"]');
  const bannerBtn = look.locator('[data-cosmetic-toggle="gatehouse-banners"]');
  await expect(markBtn).toHaveAttribute('aria-pressed', 'true');
  await expect(markBtn).toHaveText('Shown');
  const markBox = await markBtn.boundingBox();
  expect(markBox?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(markBox?.height ?? 0).toBeGreaterThanOrEqual(44);

  await markBtn.click();
  await bannerBtn.click();
  await expect(markBtn).toHaveAttribute('aria-pressed', 'false');
  await expect(markBtn).toHaveText('Hidden');
  await expect(bannerBtn).toHaveAttribute('aria-pressed', 'false');
  await expect(bannerBtn).toHaveText('Hidden');
  await look.getByRole('button', { name: 'Close' }).click();

  // Verify live reflection on HoldGrid.
  await expect(grid.locator('[data-courtyard-mark="fjord-bone-standard"]')).toHaveCount(0);
  await expect(grid.locator('[data-courtyard-mark]')).toHaveCount(COURTYARD_MARK_IDS.length - 1);
  await expect(grid).toHaveAttribute('data-banners', 'false');

  // Switch to Classic scene and verify mirrored visibility on HoldScene.
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  await page.getByRole('button', { name: 'Classic scene', exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await tab(page, 'Hold').click();

  const scene = page.locator('[data-hold-scene]');
  await expect(scene).toBeVisible();
  await expect(scene.locator('[data-courtyard-mark="fjord-bone-standard"]')).toHaveCount(0);
  await expect(scene.locator('[data-courtyard-mark="barrow-brazier"]')).toHaveCount(1);
  await expect(scene.locator('[data-courtyard-mark]')).toHaveCount(COURTYARD_MARK_IDS.length - 1);
  await expect(scene.locator('[data-cosmetic="gatehouse-banners"]')).toHaveCount(0);
  await expect(scene.locator('[data-cosmetic]')).toHaveCount(COSMETIC_IDS.length - 1);

  // Toggle Fjord-Bone Standard back Shown and reload -> persists on HoldScene.
  await page.locator('[data-hold-look-button="hold"]').click();
  await page
    .getByRole('dialog', { name: 'Hold Look' })
    .locator('[data-cosmetic-toggle="fjord-bone-standard"]')
    .click();
  await page
    .getByRole('dialog', { name: 'Hold Look' })
    .getByRole('button', { name: 'Close' })
    .click();
  await expect(scene.locator('[data-courtyard-mark="fjord-bone-standard"]')).toHaveCount(1);

  await page.waitForTimeout(1500);
  await page.reload();
  await clearScenes(page);
  await expect(scene.locator('[data-courtyard-mark="fjord-bone-standard"]')).toHaveCount(1);
  await expect(scene.locator('[data-cosmetic="gatehouse-banners"]')).toHaveCount(0);
});

test('Rates, Threat, Hut, StandSheet LanesStrip, and v7 WaveLog expose tactical Breakdown lines cleanly', async ({
  page,
}) => {
  await load(page, (s) => {
    s.cycle.age = 'bastion';
    s.arrivalDue = false;
    s.buildings.farm = 15;
    s.buildings['woodcutters-camp'] = 15;
    s.buildings.mine = 15;
    s.buildings['silver-seam'] = 2;
    s.buildings['herb-garden'] = 10;
    s.buildings['alchemists-hut'] = 2;
    s.buildings.cottage = 15;
    s.buildings.walls = 15;
    s.buildings.watchtower = 15;
    s.buildings.barracks = 1;
    s.buildings['hunters-lodge'] = 1;
    s.peasants.jobs = { farmer: 4, woodcutter: 4, miner: 4, 'silver-digger': 2 };
    s.peasants.total = 14;
    setLayoutPlaced(s);
  });

  // 1. Rates breakdown (Hold tactics: Mill links, Warm Cottages, Warded plots).
  await page.getByRole('button', { name: /Food.*Wood/ }).click();
  const rates = page.getByRole('dialog', { name: 'Rates' });
  await expect(rates).toBeVisible();
  await rates.locator('li').filter({ hasText: 'Food' }).getByLabel('Show breakdown').click();
  const foodBreakdown = page.getByRole('dialog').last();
  await expect(foodBreakdown).toContainText('Hold tactics');
  await expect(foodBreakdown).toContainText('Mill links (1)');
  await expect(foodBreakdown).toContainText('Warm Cottages (3)');
  await expect(foodBreakdown).toContainText('Warded plots (2)');
  await foodBreakdown.getByRole('button', { name: 'Close' }).click();
  await rates.getByRole('button', { name: 'Close' }).click();

  // 2. Threat breakdown (Warded Hearth Hall).
  const threatNums = page.locator('header p').filter({ hasText: 'Threat' }).getByRole('button');
  await threatNums.last().press('Enter');
  const threatBd = page.getByRole('dialog').last();
  await expect(threatBd).toContainText('Warded Hearth Hall');
  await threatBd.getByRole('button', { name: 'Close' }).click();

  // 3. Hut Brew & Experiment breakdowns (Hold tactics -> Alchemist links (1)).
  await page.getByRole('button', { name: 'Open' }).first().click();
  const hut = page.getByRole('dialog').last();
  await expect(hut.getByTestId('brew-time-line')).toBeVisible();
  await hut.getByTestId('brew-time-line').getByLabel('Show breakdown').click();
  const brewBd = page.getByRole('dialog').last();
  await expect(brewBd).toContainText('Brew time');
  await expect(brewBd).toContainText('Hold tactics');
  await expect(brewBd).toContainText('Alchemist links (1)');
  await brewBd.getByRole('button', { name: 'Close' }).click();

  await hut.getByRole('button', { name: 'Experiment', exact: true }).click();
  await expect(hut.getByTestId('experiment-time-line')).toBeVisible();
  await hut.getByTestId('experiment-time-line').getByLabel('Show breakdown').click();
  const expBd = page.getByRole('dialog').last();
  await expect(expBd).toContainText('Experiment time');
  await expect(expBd).toContainText('Hold tactics');
  await expect(expBd).toContainText('Alchemist links (1)');
  await expBd.getByRole('button', { name: 'Close' }).click();
  await hut.getByRole('button', { name: 'Close' }).click();

  // 4. StandSheet LanesStrip summary + List + v7 WaveLog Defenses breakdown.
  await page.getByRole('button', { name: /^Rank/ }).first().click();
  await page.getByRole('button', { name: 'Make the Last Stand' }).first().click();
  await expect(page.getByTestId('lanes-tactics-summary')).toContainText('Rampart +15%');
  await expect(page.getByTestId('lanes-tactics-summary')).toContainText('1 Screened');
  await expect(page.getByTestId('lanes-tactics-summary')).toContainText('Sector +10%');

  await page.getByTestId('lanes-switch-list').click();
  await expect(page.getByTestId('lane-line-3')).toHaveText(
    /^Lane 3: cover \d+%, tower reach \d+%, waves /,
  );
  await expect(page.getByTestId('lane-tactics-3')).toContainText('Rampart +15%');
  await expect(page.getByTestId('lane-tactics-3')).toContainText('1 Screened');
  await expect(page.getByTestId('lane-tactics-3')).toContainText('Sector +10%');
  await page.getByTestId('lanes-switch-strip').click();

  await expect(page.getByText(/^Expected:/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Go up to the walls' }).click();
  const night = page.getByRole('dialog', { name: 'The Long Night' });
  await expect(night.getByText(/The walls held|walls fell/).first()).toBeVisible();
  await night.getByRole('button', { name: '1', exact: true }).click();
  await expect(page.getByTestId('wave-log-header')).toHaveText(/^Lane [1-8] · cover \d+%$/);
  const defenses = page.getByTestId('wave-log-defenses');
  await expect(defenses).toContainText('Defenses');
  // Wave 1 could land in any lane, and watchtower/walls cover or volley always shows Breakdown nodes.
  await expect(defenses).toContainText(/damage taken in this lane|cover/);
  await expect(defenses).toContainText(/Watchtower volley in this lane:|watchtower/i);
});

test('Hold Look fits 320 px Largest text size, passes tap targets, contrast, and Reduce Motion', async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    viewport: { width: 320, height: 740 },
    reducedMotion: 'reduce',
    baseURL: 'http://localhost:4173/the-last-hold/',
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    for (const prefix of ['lasthold:', 'lasthold-preview:']) {
      localStorage.setItem(
        `${prefix}settings`,
        JSON.stringify({ textSize: 'largest', reduceMotion: true, backupReminder: true }),
      );
    }
  });
  await load(
    page,
    (s) => {
      s.delve.shop.cosmetics = [...COSMETIC_IDS];
      s.cosmetics = {
        marks: Object.fromEntries(COURTYARD_MARK_IDS.map((id) => [id, true])),
        hidden: [],
      };
    },
    remembered,
  );

  // HoldScreen buttons wrap cleanly >= 44x44 and 0 page overflow.
  const holdOverflow = await overflow(page);
  expect(holdOverflow.page).toBeNull();
  const holdTaps = await scanTappables(page);
  expect(holdTaps.small).toEqual([]);

  // Courtyard Mark SVG accents use zero animations under Reduce Motion.
  expect(
    await page.evaluate(() =>
      [...document.querySelectorAll('[data-courtyard-mark]')].every(
        (el) => getComputedStyle(el).animationName === 'none',
      ),
    ),
  ).toBe(true);

  // Open Hold Look sheet at 320 px Largest text size -> 0 overflow, >= 44x44 taps, high contrast.
  await page.locator('[data-hold-look-button="hold"]').click();
  await expect(page.getByRole('dialog', { name: 'Hold Look' })).toBeVisible();
  const sheetOverflow = await overflow(page);
  expect(sheetOverflow.page).toBeNull();
  const sheetTaps = await scanTappables(page);
  expect(sheetTaps.small).toEqual([]);
  const contrast = await scanContrast(page);
  expect(contrast.failing).toEqual([]);
  await ctx.close();
});
