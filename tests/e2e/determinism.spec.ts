import { expect, test } from '@playwright/test';
import { runScenario } from '../determinism/scenario';

// Technical design §14: the determinism suite in each browser engine. The
// browser's result must equal Node's, byte for byte.
test('the determinism scenario matches Node in this engine', async ({ page }) => {
  await page.goto('http://localhost:5174/the-last-hold/tests/e2e/determinism.html');
  const result = await page.waitForFunction(
    () => (window as unknown as { __scenario?: string }).__scenario,
    undefined,
    { timeout: 30_000 },
  );
  const inBrowser = (await result.jsonValue()) as string;
  expect(inBrowser.length).toBeGreaterThan(1000);
  expect(inBrowser).toBe(runScenario());
});
