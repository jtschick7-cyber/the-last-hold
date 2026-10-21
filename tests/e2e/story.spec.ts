import { expect, test } from '@playwright/test';
import { begin, onwardAll, tab } from './helpers';

// Plan T5.11b3: the story across the game, on the real production build.

// A won contract brings Ilse and the Archive: the Standard player plays the first
// hours (debug), Ilse walks up with the first document, and the Library opens it.
test('a won contract brings Ilse, and the Archive opens her first document', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?debug');
  await begin(page, 'Mira');

  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByRole('button', { name: /^Run Standard for/ }).click();
  await page.getByRole('button', { name: 'Close' }).first().click();

  // The scenes play one after another: the first contract's, then Ilse's.
  await expect(page.getByRole('dialog', { name: 'Through the gate' })).toBeVisible({
    timeout: 45_000,
  });
  await page.getByRole('button', { name: 'Onward' }).click();
  await expect(page.getByRole('dialog', { name: 'Ilse Marrow' })).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText(/Where do you want the archive/)).toBeVisible();
  await onwardAll(page);

  await tab(page, 'Archive').click();
  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByRole('button', { name: /To the warden, from Dubno Ford/ }).click();
  const reader = page.getByRole('dialog', { name: 'To the warden, from Dubno Ford' });
  await expect(reader).toBeVisible();
  await expect(reader.getByText(/^Found:/)).toBeVisible();
  expect(errors).toEqual([]);
});

// The stand has a band; the testament and the closing scene follow; the new warden is named;
// the Roll of Wardens shows both.
test('the stand’s band, the testament, naming the new warden, and the Roll', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?debug');
  await begin(page, 'Mira');

  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByRole('button', { name: 'Unlock Bastion', exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).first().click();
  await onwardAll(page);

  await tab(page, 'Hold').click();
  await page.getByRole('button', { name: 'Rank ▸' }).click();
  await page.getByRole('button', { name: 'Make the Last Stand' }).click();
  await expect(page.getByText(/Held from 12 waves · Triumphant from 15/)).toBeVisible();
  await expect(page.getByText(/^Expected:/)).toBeVisible({ timeout: 45_000 });
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Go up to the walls' }).click();

  const night = page.getByRole('dialog', { name: 'The Long Night' });
  await expect(night.getByText(/The walls held/)).toBeVisible();
  await expect(night.getByText(/^(Broken|Held|Triumphant)$/)).toBeVisible();
  await expect(night.getByText('Brana:')).toBeVisible();
  await night.getByRole('button', { name: 'Next' }).click();
  // Act I's testament.
  await expect(night.getByText(/I find I don't know who kept that window lit/)).toBeVisible();
  await night.getByRole('button', { name: 'Next' }).click();
  await night.getByRole('button', { name: 'Next' }).click();
  await night.getByRole('textbox').fill('Tamsin');
  await expect(night.getByText(/Welcome back. Different face. Same warmth./)).toBeVisible();
  await expect(night.getByText(/Ilse is back from Velkvik with the archive/)).toBeVisible();
  await night.getByRole('button', { name: 'Begin cycle 2' }).click();
  await onwardAll(page);

  await tab(page, 'Hold').click();
  await page.getByRole('button', { name: 'Rank ▸' }).click();
  const roll = page.getByRole('heading', { name: 'Roll of Wardens' });
  await expect(roll).toBeVisible();
  await expect(page.getByText('Tamsin')).toBeVisible();
  await expect(page.getByText('Mira')).toBeVisible();
  await expect(page.getByText(/keeping the hearth/)).toBeVisible();
  expect(errors).toEqual([]);
});

// A save from before v0.5 meets Ilse on load and names its earlier wardens (GDD §5.14.1).
test('an old save meets Ilse, names its wardens, and starts Act I', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?debug');
  await begin(page);
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByRole('button', { name: 'Meet Ilse again', exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).first().click();

  await tab(page, 'Hold').click();
  await expect(page.getByRole('heading', { name: 'Ilse Marrow' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('button')).toHaveCount(2);
  await page.getByRole('textbox').first().fill('Brenna');
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  const handed = page.getByRole('dialog', { name: 'Ilse Marrow' });
  await expect(handed.getByText(/To the warden, from Dubno Ford/)).toBeVisible();
  await handed.getByRole('button', { name: 'Onward' }).click();
  await expect(
    page.getByRole('navigation').getByRole('button', { name: /^Archive/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
