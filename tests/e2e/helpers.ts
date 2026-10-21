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

/**
 * Closes whichever scene sheets are open (each has an "Onward" button). Scenes appear a
 * moment after the state that triggers them, so it waits briefly before each look.
 */
export const onwardAll = async (page: Page): Promise<void> => {
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(400);
    const o = page.getByRole('button', { name: 'Onward' });
    if (!(await o.isVisible().catch(() => false))) return;
    await o.click();
  }
};

/** Opens More → Debug, presses each button, and closes the panel. Needs `?debug`. */
export const debugPress = async (page: Page, ...buttons: string[]): Promise<void> => {
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  for (const b of buttons) await page.getByRole('button', { name: b, exact: true }).click();
  await page.getByRole('button', { name: 'Close' }).click();
};

/**
 * The on-load card helper (plan T8.13b, D323): imports a save file through More → Save & Data,
 * then checks the card that takes the Hold's place (Arvid's or Pechko's), uses its button, and
 * checks the scene's sheet opens. One helper for both cards, so they are tested the same way.
 */
export const meetOnLoadCard = async (
  page: Page,
  save: object,
  card: { title: string; line: string | RegExp; button: string; sheet: string; text: RegExp },
): Promise<void> => {
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Save/ }).first().click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(save)),
  });
  await page.getByRole('button', { name: 'Yes, load it' }).click();
  // The away sheet may open over the new game; close it, then go back to the Hold.
  await page.waitForTimeout(800);
  for (let i = 0; i < 4; i++) {
    const close = page.getByRole('button', { name: 'Close' });
    if (
      !(await close
        .first()
        .isVisible()
        .catch(() => false))
    )
      break;
    await close.first().click();
  }
  await tab(page, 'Hold').click();
  // The card takes the Hold's place; only Hold and More stay in the tab bar.
  await expect(page.getByRole('heading', { name: card.title })).toBeVisible();
  await expect(page.getByText(card.line)).toBeVisible();
  await expect(tab(page, 'Hunters')).toHaveCount(0);
  await expect(tab(page, 'More')).toBeVisible();
  await page.getByRole('button', { name: card.button }).click();
  const sheet = page.getByRole('dialog', { name: card.sheet });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText(card.text)).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  // Once it has played, the card is gone and the Hold is back.
  await expect(page.getByRole('heading', { name: card.title })).toHaveCount(0);
  await expect(tab(page, 'Hold')).toBeVisible();
};

/**
 * Closes the Orders' opening scenes if any is showing (v0.10): each ends with "Seat it" and "Not now",
 * or "Continue" when no seat is free, and nothing seats itself, so "Not now" leaves the seats as they
 * were. It waits briefly, as scenes appear a moment after the state that triggers them.
 */
export const closeOrdersScenes = async (page: Page): Promise<void> => {
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(400);
    const b = page.getByRole('button', { name: /^(Not now|Continue)$/ });
    if (
      !(await b
        .first()
        .isVisible()
        .catch(() => false))
    )
      return;
    await b.first().click();
  }
};
