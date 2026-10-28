import { expect, test } from '@playwright/test';
import { dismiss, loadFixture, tolerantClicks } from './polish-screens';

// Plan TB.4 (GDD §5.9.3, §9.25): each of the first 12 waves in the Last Stand's wave list shows its
// lane, "?" species included; the tag is "Lane {n}"; nothing shows before Bastion.

const openStand = async (page: import('@playwright/test').Page): Promise<void> => {
  await page.getByRole('button', { name: /^Rank/ }).first().click();
  await page.getByRole('button', { name: 'Make the Last Stand' }).click();
  await expect(page.getByText(/^Expected:/)).toBeVisible({ timeout: 20_000 });
};

test('at Bastion every one of the first 12 waves shows its lane, "?" waves too', async ({
  page,
}) => {
  tolerantClicks(page);
  await loadFixture(page, 'v11');
  await openStand(page);
  const tags = page.getByTestId('wave-lane');
  await expect(tags).toHaveCount(12);
  const texts = await tags.allInnerTexts();
  for (const t of texts) expect(t).toMatch(/^Lane [1-8]$/);
  // Each tag sits in its wave's row; at least one row is a "?" species and still has its tag.
  const rows = page.locator('div:has(> [data-testid="wave-lane"])');
  await expect(rows).toHaveCount(12);
  const unknown = rows.filter({ hasText: /\d+\.\s*\?\s/ });
  expect(await unknown.count()).toBeGreaterThan(0);
  await expect(unknown.first().getByTestId('wave-lane')).toHaveText(/^Lane [1-8]$/);
});

test('before Bastion no lane tag appears anywhere', async ({ page }) => {
  tolerantClicks(page);
  await loadFixture(page, 'v12');
  await dismiss(page);
  await expect(page.getByTestId('wave-lane')).toHaveCount(0);
  await expect(page.getByText(/^Lane [1-8]$/)).toHaveCount(0);
});
