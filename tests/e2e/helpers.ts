import { expect, type Page } from '@playwright/test';

// A new game opens by asking the warden's name (GDD §5.14.5); every test starts there.
export const begin = async (page: Page, name?: string): Promise<void> => {
  const sheet = page.getByRole('dialog', { name: 'Who keeps the hearth?' });
  await expect(sheet).toBeVisible();
  if (name) await sheet.getByRole('textbox').fill(name);
  await sheet.getByRole('button', { name: 'Begin' }).click();
  await expect(sheet).toHaveCount(0);
};

export const tab = (page: Page, name: string) =>
  page.getByRole('navigation').getByRole('button', { name: new RegExp(`^${name}`) });

/** Closes whichever scene sheets are open (each has an "Onward" button). */
export const onwardAll = async (page: Page): Promise<void> => {
  for (let i = 0; i < 5; i++) {
    const o = page.getByRole('button', { name: 'Onward' });
    if (!(await o.isVisible().catch(() => false))) return;
    await o.click();
  }
};
