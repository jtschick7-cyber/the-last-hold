import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { begin, tab } from './helpers';

// Shared by the Hold grid and Arrange Hold specs (plan TL.7, TL.8): load an edited played save.
const fixture = (name: string) =>
  JSON.parse(readFileSync(new URL(`../saves/fixtures/${name}.json`, import.meta.url), 'utf8'));
export const base = fixture('v12-played');
// The v11 played save has chosen Remember Them (Act VI's stand applied); it migrates on load.
export const remembered = fixture('v11-played');
export type Save = typeof base;

// Scenes come a moment after the state that triggers them: close each until none is left.
export const clearScenes = async (page: Page): Promise<void> => {
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(400);
    const onward = page.getByRole('button', { name: 'Onward' });
    const open = (await onward.isVisible().catch(() => false))
      ? onward
      : page.getByRole('button', { name: 'Close' }).first();
    if (await open.isVisible().catch(() => false)) await open.click();
    else if (i > 2) break;
  }
};

export const load = async (
  page: Page,
  edit: (s: Save['state']) => void,
  from: Save = base,
): Promise<void> => {
  const save: Save = JSON.parse(JSON.stringify(from));
  edit(save.state);
  await page.goto('./?debug');
  await begin(page, 'Mira');
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Save/ }).first().click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(save)),
  });
  await page.getByRole('button', { name: 'Yes, load it' }).click();
  await clearScenes(page);
  await tab(page, 'Hold').click();
};
