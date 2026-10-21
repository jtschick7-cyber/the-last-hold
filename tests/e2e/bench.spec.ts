import { expect, test } from '@playwright/test';

// Plan T2.19 / GDD §6.5: warn at the budget, fail at 2× the budget, on a 4× CPU
// slowdown. Live odds (500 fights): budget 100 ms. Suggested party: budget 300 ms.
// Last Stand preview (100 practice stands, D114): budget 1 s.
// Boss and hunt rows (D406, GDD §6.5): set by the owner from measurements.
const BUDGET = {
  odds: 100,
  suggest: 300,
  stand: 1000,
  bossPreview: 150,
  bossSuggest: 800,
  huntOdds: 1500,
  huntSuggest: 2500,
};
type Bench = {
  odds: number;
  suggest4: number;
  oddsUnknown: number;
  suggestUnknown: number;
  stand: number;
  bossPreview: number;
  bossSuggest: number;
  huntOdds: number;
  huntSuggest: number;
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
    `hunt odds ${ms.huntOdds.toFixed(0)} ms, hunt Suggest ${ms.huntSuggest.toFixed(0)} ms`,
  );
  for (const [name, took, budget] of [
    ['odds', ms.odds, BUDGET.odds],
    ['Suggest', ms.suggest4, BUDGET.suggest],
    ['odds with 3 candidates and preparation', ms.oddsUnknown, BUDGET.odds],
    ['Suggest with 3 candidates and preparation', ms.suggestUnknown, BUDGET.suggest],
    ['the Last Stand preview (100 practice stands)', ms.stand, BUDGET.stand],
    ['the boss preview', ms.bossPreview, BUDGET.bossPreview],
    ['Suggest for a boss (14 hunters, 10 tries)', ms.bossSuggest, BUDGET.bossSuggest],
    ['hunt odds (prepared and unprepared)', ms.huntOdds, BUDGET.huntOdds],
    ['Suggest for a hunt (14 hunters, 10 tries)', ms.huntSuggest, BUDGET.huntSuggest],
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
