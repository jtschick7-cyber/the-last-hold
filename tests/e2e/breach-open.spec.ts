import { expect, test } from '@playwright/test';
import { debugPress, tab } from './helpers';
import { dismiss, loadFixture, tolerantClicks } from './polish-screens';

// Plan TB.15 (technical design §23.6): the production build opens the owner's real v14 save, the same
// save after the v15 migration, and a played v15 save (a real version 6 stand). Each opens, the
// Arrange Hold sheet shows the eight-lane strip, and nothing throws.

for (const fixture of ['v14-owner', 'v15', 'v15-played']) {
  test(`the ${fixture} save opens and shows the Lanes strip`, async ({ page }) => {
    tolerantClicks(page);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await loadFixture(page, fixture);
    await debugPress(page, 'Unlock Bastion');
    await dismiss(page);
    await tab(page, 'Hold').click();
    const welcome = page.getByRole('button', { name: 'Welcome them' });
    if (await welcome.isVisible().catch(() => false)) await welcome.click();
    await dismiss(page);
    await page.locator('[data-layout-button]').click();
    await expect(page.getByRole('dialog', { name: 'Arrange Hold' })).toBeVisible();
    for (let n = 1; n <= 8; n++) await expect(page.getByTestId(`lane-${n}`)).toBeVisible();
    expect(errors).toEqual([]);
  });
}
