import { expect, test, type Page } from '@playwright/test';
import { begin, onwardAll, tab } from './helpers';

// Plan T6.9b: the v0.6 screens on the real production build: an experiment shows a
// property in the Book; "Start Act III" brings Arvid and D3-01; the Rank screen shows
// "What the ember remembers". Screenshots (SHOTS=dir) are for the phone-size pass.

const shot = async (page: Page, name: string): Promise<void> => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}.png` });
};

const debug = async (page: Page, ...buttons: string[]) => {
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  for (const b of buttons) await page.getByRole('button', { name: b, exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).click();
};

test('an experiment shows a property in the Book', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?debug');
  await begin(page, 'Mira');
  await debug(
    page,
    'Unlock Keep',
    '+1K wood',
    '+1K wood',
    '+1K iron',
    '+1K food',
    '+100 silver',
    '+100 silver',
  );
  await onwardAll(page);
  await tab(page, 'Hold').click();
  const buy = async (name: string) =>
    page
      .getByRole('listitem')
      .filter({ has: page.locator('strong', { hasText: new RegExp(`^${name}$`) }) })
      .getByRole('button', { name: /^(Buy|Upgrade)/ })
      .click();
  await buy("Alchemist's Hut");
  await buy('Herb Garden');
  await debug(page, '+12 h');
  await tab(page, 'Hold').click();
  await page
    .getByRole('listitem')
    .filter({ has: page.locator('strong', { hasText: /^Alchemist's Hut$/ }) })
    .getByRole('button', { name: 'Open' })
    .click();
  const hut = page.getByRole('dialog', { name: "Alchemist's Hut" });
  await hut.getByRole('button', { name: 'Book' }).click();
  await expect(hut.getByText('Properties found: 15 of 36')).toBeVisible();
  await shot(page, 'hut-book');

  // Yarrow and juniper share Hardwood Tonic, so the pair shows yarrow's hidden third property.
  await hut.getByRole('button', { name: 'Experiment', exact: true }).click();
  await hut.getByLabel('First').selectOption('yarrow');
  await hut.getByLabel('Second').selectOption('juniper');
  await shot(page, 'hut-experiment');
  await hut.getByRole('button', { name: /^Experiment · / }).click();
  await hut
    .getByRole('button', { name: 'Close' })
    .first()
    .click()
    .catch(() => undefined);
  await debug(page, '+1 h');
  await tab(page, 'Hold').click();
  await page
    .getByRole('listitem')
    .filter({ has: page.locator('strong', { hasText: /^Alchemist's Hut$/ }) })
    .getByRole('button', { name: 'Open' })
    .click();
  const again = page.getByRole('dialog', { name: "Alchemist's Hut" });
  await again.getByRole('button', { name: 'Book' }).click();
  await expect(again.getByText('Properties found: 16 of 36')).toBeVisible();
  await shot(page, 'hut-book-after');
  expect(errors).toEqual([]);
});

test('Start Act III brings Arvid and D3-01; the Rank screen shows the ember', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?debug');
  await begin(page, 'Mira');
  await debug(page, 'Unlock Keep');
  await onwardAll(page);
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByRole('button', { name: 'Start Act III', exact: true }).click();
  const scene = page.getByRole('dialog', { name: 'The net-mender' });
  await expect(scene).toBeVisible();
  await expect(scene.getByText(/Netmender. You got old./)).toBeVisible();
  await shot(page, 'act3-scene');
  await scene.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await onwardAll(page);

  await tab(page, 'Archive').click();
  await page.getByRole('button', { name: 'Library' }).click();
  await expect(page.getByRole('button', { name: /The net-mender/ })).toBeVisible();

  await tab(page, 'Hold').click();
  await page.getByRole('button', { name: 'Rank ▸' }).click();
  await expect(page.getByText('What the ember remembers')).toBeVisible();
  await page.getByText('What the ember remembers').scrollIntoViewIfNeeded();
  await expect(page.getByText('Alchemy 0')).toBeVisible();
  await shot(page, 'rank-ember');
  expect(errors).toEqual([]);
});
