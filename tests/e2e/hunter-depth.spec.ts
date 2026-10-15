import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { begin, debugPress, meetOnLoadCard, onwardAll, tab } from './helpers';

// Plan T8.13b: the v0.8 screens on the real production build. A won contract's loot → Stores →
// worn → reworked; debug to Wright → Rank up → a talent; debug "Start Act V" → D5-01; and the two
// on-load cards (Arvid's, Act V's) through one helper (D323). Screenshots (SHOTS=dir) are for the
// phone-size pass.

const shot = async (page: Page, name: string): Promise<void> => {
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${name}.png` });
};

interface Env {
  state: {
    cycles: { act: number | null }[];
    hunters: Record<string, unknown>;
    roster: { active: string[] };
    story: { acts: { act: number }[]; documents: { id: string }[] };
  };
}
const fixture = (f: string): Env =>
  JSON.parse(readFileSync(new URL(`../saves/fixtures/${f}`, import.meta.url), 'utf8')) as Env;

/** The hold with the Mine bought, so the Contracts and Hunters tabs are open. */
const openBoard = async (page: Page): Promise<void> => {
  await debugPress(page, '+1K wood', '+1K food', '+1K iron', '+1K wood', '+1K iron', '+1K iron');
  await tab(page, 'Hold').click();
  await page
    .getByRole('listitem')
    .filter({ has: page.locator('strong', { hasText: /^Mine$/ }) })
    .getByRole('button', { name: 'Buy' })
    .click();
  await onwardAll(page);
};

const firstHunter = async (page: Page): Promise<void> => {
  await tab(page, 'Hunters').click();
  await page.locator('li button', { hasText: /Lv \d/ }).first().click();
};

test('loot lands in Stores, is worn from the picker and reworked', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?debug');
  await begin(page, 'Mira');
  await openBoard(page);
  await debugPress(page, 'Grant loot');

  // Three Smithy levels, which the Rare Iron Blade's rework to Steel needs.
  await tab(page, 'Hold').click();
  const smithy = page
    .getByRole('listitem')
    .filter({ has: page.locator('strong', { hasText: /^Smithy$/ }) });
  for (let i = 0; i < 3; i++) await smithy.getByRole('button', { name: 'Upgrade' }).click();

  await tab(page, 'Hunters').click();
  await expect(page.getByRole('heading', { name: 'Stores 1 of 40' })).toBeVisible();
  await expect(page.getByText('Rare Iron Blade')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvage Rare Iron Blade' })).toContainText('+');
  await shot(page, 'stores');

  await firstHunter(page);
  await page.getByRole('button', { name: 'Change' }).first().click(); // the weapon slot
  const picker = page.getByRole('dialog', { name: /weapon/ });
  await expect(picker.getByText('Rare Iron Blade')).toBeVisible();
  await expect(picker.getByText(/Might/).first()).toBeVisible();
  await shot(page, 'picker');
  await picker.getByRole('button', { name: 'Wear' }).click();
  await expect(picker.getByText('Now worn:')).toBeVisible();
  await expect(picker.getByText('Nothing in Stores fits this slot.')).toBeVisible();

  // Rework one tier up: the worn Rare Iron Blade becomes a Rare Steel Blade, lines kept.
  await picker.getByRole('button', { name: 'Rework' }).click();
  await expect(picker.getByText('Rare Steel Blade')).toBeVisible();
  expect(errors).toEqual([]);
});

test('debug to Wright, Rank up, and pick a talent', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?debug');
  await begin(page, 'Mira');
  await openBoard(page);
  await debugPress(page, 'Ready to rank up');

  await firstHunter(page);
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByText('Apprentice')).toBeVisible();
  await sheet.getByRole('button', { name: 'Rank up to Wright' }).click();
  await expect(sheet.getByText('Wright', { exact: true })).toBeVisible();
  await expect(sheet.getByText('3 points to spend')).toBeVisible();
  // The next rank is offered at once (highest level 10 and 60 trophies are on hand).
  await expect(sheet.getByRole('button', { name: 'Rank up to Master-Wright' })).toBeEnabled();
  await shot(page, 'hunter-sheet');

  await sheet
    .getByRole('button', { name: 'Pick' })
    .filter({ hasNot: page.locator('[disabled]') })
    .first()
    .click();
  await expect(sheet.getByText('2 points to spend')).toBeVisible();
  await expect(sheet.getByText(/^✔ Tier 1/)).toBeVisible();
  await sheet.getByRole('button', { name: 'Respec (free)' }).click();
  await expect(sheet.getByText('3 points to spend')).toBeVisible();
  expect(errors).toEqual([]);
});

test('debug "Start Act V" opens D5-01', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./?debug');
  await begin(page, 'Mira');
  await debugPress(page, 'Unlock Keep');
  await onwardAll(page);
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();
  await page.getByRole('button', { name: 'Start Act V', exact: true }).click();
  const scene = page.getByRole('dialog', { name: 'The broom' });
  await expect(scene).toBeVisible();
  await expect(scene.getByText(/Pechko is on his knees at the crack/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('the Act V on-load card: a story-less cycle meets Pechko at the crack', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // The owner's real v0.7 save, as the migration test makes it: a cycle after Act IV's stand.
  const env = fixture('v7-owner.json');
  const last = env.state.cycles[env.state.cycles.length - 1];
  if (last) last.act = 5;
  const four = env.state.story.acts.find((a) => a.act === 4);
  if (four) four.act = 5;
  await page.goto('./');
  await begin(page, 'Mira');
  await meetOnLoadCard(page, env, {
    title: 'Pechko',
    line: /calls you over to the crack/,
    button: 'Go and look',
    sheet: 'The broom',
    text: /Pechko is on his knees at the crack/,
  });
  expect(errors).toEqual([]);
});

test('the Arvid on-load card: a save whose cycle began Act III meets him', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // The owner's real v0.6 save, rewound to before Arvid's arrival (as tests/story/act3-arrival does).
  const env = fixture('v6-owner.json');
  delete env.state.hunters.arvid;
  env.state.roster.active = env.state.roster.active.filter((h) => h !== 'arvid');
  env.state.story.documents = env.state.story.documents.filter((d) => !d.id.startsWith('D3-'));
  await page.goto('./');
  await begin(page, 'Mira');
  await meetOnLoadCard(page, env, {
    title: 'Ilse Marrow',
    line: /an old man carrying a net-needle and an axe/,
    button: 'Welcome them',
    sheet: 'The net-mender',
    text: /Arvid Netmender has joined your roster/,
  });
  expect(errors).toEqual([]);
});
