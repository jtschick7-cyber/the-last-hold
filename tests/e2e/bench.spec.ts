import { expect, test } from '@playwright/test';

// Plan T2.19 / GDD §6.5: warn at the budget, fail at 2× the budget, on a 4× CPU
// slowdown. Live odds (500 fights): budget 120 ms (150 ms with 3 candidates, D505). Suggested party: budget 300 ms.
// Last Stand preview (100 practice stands, D114): budget 1 s.
// Boss and hunt rows (D406, GDD §6.5): set by the owner from measurements.
const BUDGET = {
  // D505: realistic budgets for a 4× throttled runner.
  odds: 120,
  oddsUnknown: 150,
  suggest: 300,
  stand: 1000,
  // v1.4 (D565): 100 three-stage practice runs, GDD §6.5.
  descentPreview: 1500,
  bossPreview: 150,
  bossSuggest: 800,
  huntOdds: 1500,
  huntSuggest: 2500,
  // Orders (v0.10, D445): set by the owner from T10.19's measurements.
  ordersCard: 16,
  ordersSheet: 50,
  ordersStanding: 5,
  ordersMigration: 100,
  // The Remembering (v0.11, D469).
  rememberingMigration: 100,
  // v1.1 (D506).
  layoutMigration: 100,
  // v1.3 (D547).
  vigilMigration: 100,
  // v1.4 (D562): the v13 → v14 migration.
  descentMigration: 100,
  holdGrid: 16,
  arrangeSheet: 50,
  // v1.5 (D590): the Lanes strip, Suggest layout and the v14 → v15 migration.
  lanesStrip: 16,
  suggestLayout: 20,
  breachMigration: 100,
};
type Bench = {
  odds: number;
  suggest4: number;
  oddsUnknown: number;
  suggestUnknown: number;
  stand: number;
  descentPreview: number;
  bossPreview: number;
  bossSuggest: number;
  huntOdds: number;
  huntSuggest: number;
  ordersCard: number;
  ordersSheet: number;
  ordersStanding: number;
  ordersMigration: number;
  rememberingMigration: number;
  layoutMigration: number;
  vigilMigration: number;
  descentMigration: number;
  holdGrid: number;
  arrangeSheet: number;
  lanesStrip: number;
  suggestLayout: number;
  breachMigration: number;
};

test('odds, Suggest and the stand preview stay within 2× their budget on a throttled CPU', async ({
  page,
}) => {
  await page.goto('http://localhost:5174/the-last-hold/tests/e2e/bench.html');
  await expect(page.locator('#out')).toHaveText('ready');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const ms = await page.evaluate(() => (window as unknown as { __bench: () => Bench }).__bench());
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  console.log(
    `bench (4× slowdown): odds ${ms.odds.toFixed(0)} ms, Suggest ${ms.suggest4.toFixed(0)} ms, ` +
      `odds (3 candidates, prepared) ${ms.oddsUnknown.toFixed(0)} ms, ` +
      `Suggest (3 candidates, prepared) ${ms.suggestUnknown.toFixed(0)} ms, ` +
      `Last Stand preview ${ms.stand.toFixed(0)} ms, boss preview ${ms.bossPreview.toFixed(0)} ms, ` +
      `boss Suggest (14 hunters, 10 tries) ${ms.bossSuggest.toFixed(0)} ms`,
  );
  console.log(
    `Orders card ${ms.ordersCard.toFixed(2)} ms, sheet ${ms.ordersSheet.toFixed(2)} ms, ` +
      `standing ${ms.ordersStanding.toFixed(3)} ms, migration ${ms.ordersMigration.toFixed(1)} ms`,
  );
  console.log(`v10 → v11 migration (played save): ${ms.rememberingMigration.toFixed(1)} ms`);
  console.log(
    `v11 → v12 migration ${ms.layoutMigration.toFixed(1)} ms, Hold grid render ${ms.holdGrid.toFixed(1)} ms, ` +
      `Arrange Hold sheet ${ms.arrangeSheet.toFixed(1)} ms`,
  );
  console.log(`v12 → v13 migration (played save): ${ms.vigilMigration.toFixed(1)} ms`);
  console.log(
    `Lanes strip render ${ms.lanesStrip.toFixed(1)} ms, Suggest layout ${ms.suggestLayout.toFixed(1)} ms, ` +
      `v14 → v15 migration (played save) ${ms.breachMigration.toFixed(1)} ms`,
  );
  console.log(`v13 → v14 migration (played save): ${ms.descentMigration.toFixed(1)} ms`);
  console.log(`Descent preview (100 practice runs): ${ms.descentPreview.toFixed(0)} ms`);
  console.log(
    `hunt odds ${ms.huntOdds.toFixed(0)} ms, hunt Suggest ${ms.huntSuggest.toFixed(0)} ms`,
  );
  for (const [name, took, budget] of [
    ['odds', ms.odds, BUDGET.odds],
    ['Suggest', ms.suggest4, BUDGET.suggest],
    ['odds with 3 candidates and preparation', ms.oddsUnknown, BUDGET.oddsUnknown],
    ['Suggest with 3 candidates and preparation', ms.suggestUnknown, BUDGET.suggest],
    ['the Last Stand preview (100 practice stands)', ms.stand, BUDGET.stand],
    ['the Descent preview (100 practice runs)', ms.descentPreview, BUDGET.descentPreview],
    ['the boss preview', ms.bossPreview, BUDGET.bossPreview],
    ['Suggest for a boss (14 hunters, 10 tries)', ms.bossSuggest, BUDGET.bossSuggest],
    ['hunt odds (prepared and unprepared)', ms.huntOdds, BUDGET.huntOdds],
    ['Suggest for a hunt (14 hunters, 10 tries)', ms.huntSuggest, BUDGET.huntSuggest],
    ['the Orders card', ms.ordersCard, BUDGET.ordersCard],
    ['an Order sheet', ms.ordersSheet, BUDGET.ordersSheet],
    ['the standing of all four Orders', ms.ordersStanding, BUDGET.ordersStanding],
    ['the v9 → v10 migration', ms.ordersMigration, BUDGET.ordersMigration],
    ['the v10 → v11 migration', ms.rememberingMigration, BUDGET.rememberingMigration],
    ['the v11 → v12 migration', ms.layoutMigration, BUDGET.layoutMigration],
    ['the v12 → v13 migration', ms.vigilMigration, BUDGET.vigilMigration],
    ['the v13 → v14 migration', ms.descentMigration, BUDGET.descentMigration],
    ['the Hold grid render', ms.holdGrid, BUDGET.holdGrid],
    ['the Arrange Hold sheet open', ms.arrangeSheet, BUDGET.arrangeSheet],
    ['the Lanes strip render', ms.lanesStrip, BUDGET.lanesStrip],
    ['Suggest layout', ms.suggestLayout, BUDGET.suggestLayout],
    ['the v14 → v15 migration', ms.breachMigration, BUDGET.breachMigration],
  ] as const) {
    if (took > budget) {
      test.info().annotations.push({
        type: 'warning',
        description: `${name} took ${took.toFixed(0)} ms (budget ${budget} ms)`,
      });
    }
    expect(took, `${name} must stay under 2× its ${budget} ms budget`).toBeLessThan(2 * budget);
  }
});
