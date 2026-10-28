import { expect, test, type Page } from '@playwright/test';
import { debugPress, tab } from './helpers';
import { dismiss, loadFixture, tolerantClicks } from './polish-screens';

// Plan TD.11 (technical design §22.8): the production build opens the owner's real v13 save, the same
// save after the v14 migration, and a played v14 save (a genuine Descent win). With the gate closed
// there is no Descent anywhere; once Act VI is finished and the gate opened, the card offers it and the
// sheet opens. The played save shows its Descent and nothing throws.

const welcome = async (page: Page): Promise<void> => {
  const b = page.getByRole('button', { name: 'Welcome them' });
  if (await b.isVisible().catch(() => false)) await b.click();
};

const toHold = async (page: Page): Promise<void> => {
  await tab(page, 'Hold').click();
  await welcome(page);
  await dismiss(page);
};

const descentButton = (page: Page) =>
  page.getByRole('button', { name: /^(The Descent|Fight the Descent again)$/ });

for (const fixture of ['v13-owner', 'v14']) {
  test(`the ${fixture} save opens with the gate closed, then open`, async ({ page }) => {
    tolerantClicks(page);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await loadFixture(page, fixture);
    await debugPress(page, 'Unlock Bastion');
    await dismiss(page);
    await toHold(page);
    await expect(descentButton(page)).toHaveCount(0);
    await debugPress(page, 'Finish Act VI');
    await dismiss(page);
    await debugPress(page, 'Open the gate');
    await dismiss(page);
    await debugPress(page, 'Unlock Bastion');
    await dismiss(page);
    await toHold(page);
    const b = page.getByRole('button', { name: 'The Descent', exact: true });
    await b.scrollIntoViewIfNeeded();
    await expect(b).toBeVisible();
    await b.click();
    await expect(page.getByText('Three stages in the Deep · all hands')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('a played v14 save opens and shows its Descent', async ({ page }) => {
  tolerantClicks(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await loadFixture(page, 'v14-played');
  await debugPress(page, 'Unlock Bastion');
  await dismiss(page);
  await toHold(page);
  const b = descentButton(page).first();
  await b.scrollIntoViewIfNeeded();
  await expect(b).toBeVisible();
  await b.click();
  await expect(page.getByText('Three stages in the Deep · all hands')).toBeVisible();
  expect(errors).toEqual([]);
});
