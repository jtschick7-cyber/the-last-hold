import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { begin, closeOrdersScenes, debugPress, onwardAll, tab } from './helpers';
import { dismiss } from './polish-screens';
import { fixture } from './layout-helpers';
import {
  ambienceCreated,
  ambienceMoods,
  ambienceOff,
  ambienceOn,
  ambienceSuspends,
  delveSave,
  installAmbienceHook,
  installSoundHook,
} from './sound-helpers';

// Plan VB.7 (GDD §9.22, D609, D610): procedural Web Audio frontier ambience.
// Tests run on the real app with the recording fake engine installed before the app starts.
// Tests default Off, persistence, mood switching, Remembering & Descent silence, hidden pause,
// and independence of Sound vs Ambience toggles.

test('Ambience is Off by default; no context is created and turning Sound On does not turn Ambience On', async ({
  page,
}) => {
  const requested = await installSoundHook(page);
  await installAmbienceHook(page);
  await page.goto('./?debug');
  await begin(page);

  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Settings/ }).click();

  const soundGroup = page.getByRole('group', { name: 'Sound' });
  const ambienceGroup = page.getByRole('group', { name: 'Ambience' });

  await expect(soundGroup.getByRole('button', { name: 'Off' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(ambienceGroup.getByRole('button', { name: 'Off' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  expect(await ambienceCreated(page)).toBe(0);
  expect(await ambienceMoods(page)).toEqual([]);
  expect(requested).toEqual([]);

  // Turn Sound On: Ambience remains Off and makes no Web Audio voice
  await soundGroup.getByRole('button', { name: 'On' }).click();
  await expect(soundGroup.getByRole('button', { name: 'On' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(ambienceGroup.getByRole('button', { name: 'Off' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  expect(await ambienceCreated(page)).toBe(0);
  expect(await ambienceMoods(page)).toEqual([]);
});

test('turning Ambience On starts Hearth & Wind; turning it Off fades to silent and suspends; independent of Sound', async ({
  page,
}) => {
  await installAmbienceHook(page);
  await page.goto('./?debug');
  await begin(page);

  // Turn Ambience On
  await ambienceOn(page);
  expect(await ambienceCreated(page)).toBe(1);
  expect(await ambienceMoods(page)).toEqual(['hearth']);

  // Verify Sound switch is still Off
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  const soundGroup = page.getByRole('group', { name: 'Sound' });
  await expect(soundGroup.getByRole('button', { name: 'Off' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Close' }).first().click();

  // Turn Ambience Off: fades to silent and suspends
  await ambienceOff(page);
  expect(await ambienceMoods(page)).toEqual(['hearth', 'silent']);
  expect(await ambienceSuspends(page)).toBe(1);
});

test('persistence: Ambience On survives page reload, Reset everything, and save import', async ({
  page,
}) => {
  await installAmbienceHook(page);
  await page.goto('./?debug');
  await begin(page);
  await ambienceOn(page);
  expect(await ambienceMoods(page)).toEqual(['hearth']);

  // Reload: Ambience remains On
  await page.reload();
  await page.waitForTimeout(500);
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  const ambienceGroup = page.getByRole('group', { name: 'Ambience' });
  await expect(ambienceGroup.getByRole('button', { name: 'On' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Close' }).first().click();

  // Reset everything: preserves Ambience On in storage
  await page.getByRole('button', { name: /^Save/ }).first().click();
  await page.getByRole('button', { name: 'Reset everything…' }).click();
  await page.getByRole('button', { name: 'I understand' }).click();
  await page.getByRole('button', { name: 'Yes, start over' }).click();
  await page.waitForTimeout(500);

  const afterReset = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.endsWith(':settings'))
      .map((k) => JSON.parse(localStorage.getItem(k) ?? '{}')),
  );
  expect(afterReset[0].ambience).toBe('on');

  // Begin the fresh game
  await begin(page);

  // Save import: does not overwrite settings
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Save/ }).first().click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(fixture('v12-played'))),
  });
  await page.getByRole('button', { name: 'Yes, load it' }).click();
  await page.waitForTimeout(1000);
  await dismiss(page);

  const afterImport = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.endsWith(':settings'))
      .map((k) => JSON.parse(localStorage.getItem(k) ?? '{}')),
  );
  expect(afterImport[0].ambience).toBe('on');
});

test('mood switching: Hearth & Wind on normal tabs, shifting to Night Watch in Delve and Last Stand', async ({
  page,
}) => {
  const { save, at } = delveSave('strong');
  await page.clock.install({ time: at });
  await installAmbienceHook(page);
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
  await page.waitForTimeout(800);
  await dismiss(page);
  await tab(page, 'Hold').click();

  await ambienceOn(page);
  expect(await ambienceMoods(page)).toEqual(['hearth']);

  // Normal tabs do not re-trigger fades
  for (const t of ['Contracts', 'Hunters', 'More', 'Hold']) {
    await tab(page, t).click();
  }
  expect(await ambienceMoods(page)).toEqual(['hearth']);

  // Open Delve sheet: shifts to Night Watch
  await tab(page, 'Hold').click();
  await page
    .getByRole('region', { name: 'The Rift' })
    .getByRole('button', { name: 'Delve', exact: true })
    .click();
  await page.getByRole('dialog', { name: 'Delve' }).getByRole('button', { name: 'Start' }).click();
  await page.waitForTimeout(300);

  expect(await ambienceMoods(page)).toEqual(['hearth', 'watch']);

  // Close Delve sheet: returns to Hearth & Wind
  await page
    .getByRole('dialog', { name: 'Delve' })
    .getByRole('button', { name: 'Close' })
    .first()
    .click();
  await page.waitForTimeout(300);
  expect(await ambienceMoods(page)).toEqual(['hearth', 'watch', 'hearth']);

  // Open Last Stand: shifts to Night Watch
  await debugPress(page, 'Unlock Bastion');
  await onwardAll(page);
  await closeOrdersScenes(page);
  await tab(page, 'Hold').click();
  await page.getByRole('button', { name: 'Rank ▸' }).click();
  await page.getByRole('button', { name: 'Make the Last Stand' }).click();
  await page.waitForTimeout(300);

  expect(await ambienceMoods(page)).toEqual(['hearth', 'watch', 'hearth', 'watch']);

  // Close Last Stand sheet: returns to Hearth & Wind
  await page
    .getByRole('dialog', { name: 'The Last Stand' })
    .getByRole('button', { name: 'Close' })
    .first()
    .click();
  await page.waitForTimeout(300);
  expect(await ambienceMoods(page)).toEqual(['hearth', 'watch', 'hearth', 'watch', 'hearth']);
});

test('Remembering silence: Near scene, The reading, and Vigil scene fade to complete silence and resume after', async ({
  page,
}) => {
  const v11 = JSON.parse(
    readFileSync(new URL('../saves/fixtures/v11.json', import.meta.url), 'utf8'),
  );
  await installAmbienceHook(page);
  await page.goto('./?debug');
  await begin(page, 'Mira');
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Save/ }).first().click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(v11)),
  });
  await page.getByRole('button', { name: 'Yes, load it' }).click();
  await page.waitForTimeout(800);

  // Clear startup scenes until Hold is clean
  for (let i = 0; i < 4; i++) {
    await onwardAll(page);
    await closeOrdersScenes(page);
    const close = page.getByRole('button', { name: 'Close' }).first();
    if (!(await close.isVisible().catch(() => false))) break;
    await close.click();
  }

  await ambienceOn(page);
  expect(await ambienceMoods(page)).toEqual(['hearth']);

  // Near scene (R-01) plays: fades to complete silence
  await debugPress(page, 'Finish Act VI');
  await tab(page, 'Hold').click();
  const near = page.getByRole('dialog', { name: 'The line along the wall' });
  await expect(near).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(300);
  expect(await ambienceMoods(page)).toEqual(['hearth', 'silent']);

  // Closing Near scene returns to Hearth & Wind
  await near.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(300);
  expect(await ambienceMoods(page)).toEqual(['hearth', 'silent', 'hearth']);

  // Clear any scenes following Near scene
  for (let i = 0; i < 4; i++) {
    await onwardAll(page);
    await closeOrdersScenes(page);
    const close = page.getByRole('button', { name: 'Close' }).first();
    if (!(await close.isVisible().catch(() => false))) break;
    await close.click();
  }

  // Open the gate: Remember Them (R-03 -> The reading)
  await debugPress(page, 'Open the gate');
  await tab(page, 'Hold').click();
  const card = page.getByRole('region', { name: 'The Remembering' });
  await card.scrollIntoViewIfNeeded();
  await card.getByRole('button', { name: 'Remember Them' }).click();

  const roller = page.getByRole('dialog', { name: 'The roll' });
  await expect(roller).toBeVisible();
  await page.waitForTimeout(300);
  expect(await ambienceMoods(page)).toEqual(['hearth', 'silent', 'hearth', 'silent']);

  // Continue through the reading
  await roller.getByRole('button', { name: 'Continue' }).click();
  const reading = page.getByRole('dialog', { name: 'The reading' });
  await expect(reading).toBeVisible();
  await page.waitForTimeout(300);
  expect(await ambienceMoods(page)).toEqual(['hearth', 'silent', 'hearth', 'silent']);

  // Skip the reading and finish ending cards
  await reading.getByRole('button', { name: 'Skip' }).click();
  await reading.getByRole('button', { name: 'Continue' }).click();

  // Step through ending cards until closed
  for (let i = 0; i < 12; i++) {
    const dlg = page.getByRole('dialog');
    if (
      await dlg
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      const btn = dlg.first().getByRole('button', { name: 'Continue' });
      if (await btn.isVisible().catch(() => false)) await btn.click();
      await page.waitForTimeout(150);
    } else break;
  }
  await page.waitForTimeout(400);
  // Returned to Hold: Hearth & Wind resumes
  expect((await ambienceMoods(page)).at(-1)).toBe('hearth');
});

test('Descent silence: Story cards D-01 to D-07 are silent, cross-fading to Night Watch during arena fights', async ({
  page,
}) => {
  const played14 = JSON.parse(
    readFileSync(new URL('../saves/fixtures/v14-played.json', import.meta.url), 'utf8'),
  );
  const save = structuredClone(played14);
  save.state.remembering.nearSeen = true;
  save.state.remembering.endings = [];
  save.state.descent = {
    attempts: 0,
    unlitMet: false,
    last: null,
    firstWin: null,
    unreadResult: false,
  };

  await page.addInitScript(() => {
    for (const prefix of ['lasthold:', 'lasthold-preview:'])
      localStorage.setItem(
        `${prefix}settings`,
        JSON.stringify({ backupReminder: true, firstSeenAt: Date.now() - 2e9 }),
      );
  });

  await installAmbienceHook(page);
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
  await page.waitForTimeout(1000);
  await dismiss(page);
  await tab(page, 'Hold').click();

  await ambienceOn(page);
  expect(await ambienceMoods(page)).toEqual(['hearth']);

  // Go to Hold tab
  await tab(page, 'Hold').click();

  // Start Descent
  const card = page.getByRole('region', { name: 'The Remembering' });
  await card.scrollIntoViewIfNeeded();
  await card.getByRole('button', { name: 'The Descent', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'The Descent' });
  await expect(sheet.getByTestId('descent-preview')).toContainText(/Win chance/, {
    timeout: 20_000,
  });
  await sheet.getByTestId('descent-start').click();

  // Story card D-01 appears: silent
  await expect(page.getByTestId('descent-card-D-01')).toBeVisible();
  await page.waitForTimeout(300);
  expect(await ambienceMoods(page)).toEqual(['hearth', 'silent']);

  // Story card D-02 appears: still silent
  await page.getByTestId('descent-card-D-01').getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('descent-card-D-02')).toBeVisible();
  await page.waitForTimeout(300);
  expect(await ambienceMoods(page)).toEqual(['hearth', 'silent']);

  // Stage 1 fight begins: cross-fades to Night Watch
  await page.getByTestId('descent-card-D-02').getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('descent-stage-play-1')).toBeVisible();
  await page.waitForTimeout(300);
  expect(await ambienceMoods(page)).toEqual(['hearth', 'silent', 'watch']);

  // Skip Stage 1, continue to D-03: fades back to silent
  await page.getByTestId('descent-stage-play-1').getByRole('button', { name: 'Skip' }).click();
  await page.getByTestId('descent-stage-play-1').getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByTestId('descent-card-D-03')).toBeVisible();
  await page.waitForTimeout(300);
  expect(await ambienceMoods(page)).toEqual(['hearth', 'silent', 'watch', 'silent']);

  // Close Descent playback: resumes Hearth & Wind
  await page
    .getByRole('dialog', { name: 'The Descent' })
    .getByRole('button', { name: 'Close' })
    .first()
    .click();
  await page.waitForTimeout(300);
  expect((await ambienceMoods(page)).at(-1)).toBe('hearth');
});

test('hidden-tab pause: hides to silence and suspends, resumes active mood on return', async ({
  page,
}) => {
  await installAmbienceHook(page);
  await page.goto('./?debug');
  await begin(page);
  await ambienceOn(page);
  expect(await ambienceMoods(page)).toEqual(['hearth']);

  // Hide page: immediately silenced and suspended
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(300);
  expect(await ambienceSuspends(page)).toBe(1);
  expect((await ambienceMoods(page)).at(-1)).toBe('silent');

  // Return to visible: resumes and restores Hearth & Wind
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(300);
  expect((await ambienceMoods(page)).at(-1)).toBe('hearth');
});

test('debug panel preview control overrides mood without marking debugUsed', async ({ page }) => {
  await installAmbienceHook(page);
  await page.goto('./?debug');
  await begin(page);
  await ambienceOn(page);
  expect(await ambienceMoods(page)).toEqual(['hearth']);

  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Debug/ }).click();

  // Test preview buttons
  const preview = (mood: string) => page.locator(`[data-preview-ambience="${mood}"]`);
  await preview('watch').click();
  await page.waitForTimeout(200);
  expect((await ambienceMoods(page)).at(-1)).toBe('watch');

  await preview('silent').click();
  await page.waitForTimeout(200);
  expect((await ambienceMoods(page)).at(-1)).toBe('silent');

  await preview('hearth').click();
  await page.waitForTimeout(200);
  expect((await ambienceMoods(page)).at(-1)).toBe('hearth');

  await preview('auto').click();
  await page.waitForTimeout(200);
  expect((await ambienceMoods(page)).at(-1)).toBe('hearth');

  // Verify debugUsed is still false (UI-only preview does not mark GameState)
  await page.getByText('Raw state').click();
  await expect(page.locator('pre')).toContainText('"debugUsed": false');
});
