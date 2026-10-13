import { expect, test } from '@playwright/test';

// Plan T2.19 / GDD §6.5: warn at the budget, fail at 2× the budget, on a 4× CPU
// slowdown. Live odds (500 fights): budget 100 ms. Suggested party: budget 300 ms.
const BUDGET = { odds: 100, suggest: 300 };
type Bench = { odds: number; suggest4: number; oddsUnknown: number; suggestUnknown: number };

test('odds and Suggest stay within 2× their budget on a throttled CPU', async ({ page }) => {
  await page.goto('http://localhost:5174/the-last-hold/tests/e2e/bench.html');
  await expect(page.locator('#out')).toHaveText('ready');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const ms = await page.evaluate(() => (window as unknown as { __bench: () => Bench }).__bench());
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  console.log(
    `bench (4× slowdown): odds ${ms.odds.toFixed(0)} ms, Suggest ${ms.suggest4.toFixed(0)} ms, ` +
      `odds (3 candidates, prepared) ${ms.oddsUnknown.toFixed(0)} ms, ` +
      `Suggest (3 candidates, prepared) ${ms.suggestUnknown.toFixed(0)} ms`,
  );
  for (const [name, took, budget] of [
    ['odds', ms.odds, BUDGET.odds],
    ['Suggest', ms.suggest4, BUDGET.suggest],
    ['odds with 3 candidates and preparation', ms.oddsUnknown, BUDGET.odds],
    ['Suggest with 3 candidates and preparation', ms.suggestUnknown, BUDGET.suggest],
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
