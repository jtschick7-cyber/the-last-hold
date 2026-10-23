import { expect, test } from '@playwright/test';
import { clearScenes, fixture, load } from './layout-helpers';
import { hold, installSoundHook, played } from './sound-helpers';
import { tab } from './helpers';

// Plan SF.12: the production build opens a v1.1 save (schema 12) with Sound Off, and stays silent.
test('a v1.1 save opens with Sound Off and nothing is requested or played', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const requested = await installSoundHook(page);
  await load(page, () => {}, fixture('v12-played'));
  await clearScenes(page);
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  const sound = page.getByRole('group', { name: 'Sound' });
  await expect(sound.getByRole('button', { name: 'Off' })).toHaveAttribute('aria-pressed', 'true');
  await expect(sound.getByRole('button', { name: 'On' })).toHaveAttribute('aria-pressed', 'false');
  await hold(page);
  expect(requested).toEqual([]);
  expect(await played(page)).toEqual([]);
  expect(errors).toEqual([]);
});
