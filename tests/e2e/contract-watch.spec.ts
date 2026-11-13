import { expect, test, type Browser, type Page } from '@playwright/test';
import { findFight, replayFight } from '../../src/core/contracts/playback';
import { OLDER_RULES_NOTE } from '../../src/core/replay-check';
import { makeEnvelope } from '../../src/core/save';
import { advance } from '../../src/core/sim';
import type { ContractInstance, FightRef } from '../../src/core/state/game-state';
import { give, HOUR, keepRich, run } from '../contracts/helpers';
import { begin, tab } from './helpers';
import { scanContrast } from './polish-contrast';
import { dismiss, loadFixture } from './polish-screens';
import { scanTappables } from './polish-tap';
import { hold, installSoundHook, played, soundOn } from './sound-helpers';

// v1.7 (plan VB.3, GDD §9.4, §9.12, §9.15, §9.22, D606–D608): Contract "Watch fight ▸",
// Arena floating callouts / recoil / skill & ability glows, Reduce Motion stillness,
// routine check-in tap count, and Last Stand wave-log monster facing.

const BASE = 'http://localhost:4173/the-last-hold/';

/**
 * Builds a deterministic Keep save with three finished contracts ready to collect:
 * 1. `watch-live` (Rusalka · T2): kept in `recentFights`, whose first 8 log lines include
 *    `skill`, `crit`, `hit`, and `ability` so watched steps exercise every Arena polish cue quickly.
 * 2. `watch-older` (Gaunt Wolf · T1): kept in `recentFights` with an inverted `rulesVersion: 1`
 *    result so `Watch fight ▸` shows `OLDER_RULES_NOTE`.
 * 3. `watch-evicted` (Bies · T2): evicted from `recentFights`, so neither `Watch fight ▸` nor
 *    `Fight log ▸` renders on its row.
 */
const makeWatchSave = (): { save: object; liveTitle: string; olderTitle: string } => {
  for (let i = 0; i < 80; i++) {
    const s = keepRich(`vb3-watch-${i}`);
    give(s, 'halvar', 'zora', 'toma');
    for (const id of ['toma', 'zora'] as const) {
      const h = s.hunters[id];
      if (h) {
        h.level = 6;
        h.rank = 'wright';
      }
    }
    const add = (id: string, monster: ContractInstance['monster'], tier: number): void => {
      s.board.open.push({
        id,
        village: 'mirograd',
        monster,
        tier,
        location: 'river',
        arrivedAt: s.time,
        revealed: 3,
      });
    };
    add('watch-live', 'rusalka', 3);
    add('watch-older', 'wolf', 1);
    add('watch-evicted', 'bies', 2);

    if (
      !run(s, {
        type: 'contract.launch',
        contract: 'watch-live',
        party: ['toma', 'zora', 'halvar'],
        confirmReckless: true,
      }).ok
    )
      continue;
    if (
      !run(s, {
        type: 'contract.launch',
        contract: 'watch-older',
        party: ['ostap', 'radek'],
        confirmReckless: true,
      }).ok
    )
      continue;
    if (
      !run(s, {
        type: 'contract.launch',
        contract: 'watch-evicted',
        party: ['bjarna', 'sigrun'],
        confirmReckless: true,
      }).ok
    )
      continue;

    advance(s, s.time + 6 * HOUR);
    const liveRef = findFight(s, 'watch-live');
    const olderRef = findFight(s, 'watch-older');
    if (!liveRef || !olderRef) continue;

    const headKinds = new Set(
      replayFight(liveRef)
        .log.slice(0, 10)
        .map((e) => e.kind),
    );
    if (
      !headKinds.has('skill') ||
      !headKinds.has('crit') ||
      !headKinds.has('hit') ||
      !headKinds.has('ability')
    )
      continue;

    // Flip `watch-older` to simulate a replay whose outcome differs under current rules,
    // and evict `watch-evicted` from `recentFights`.
    s.log.recentFights = s.log.recentFights
      .filter((f) => f.contractId !== 'watch-evicted')
      .map((f): FightRef => {
        if (f.contractId !== 'watch-older') return f;
        return {
          ...f,
          rulesVersion: 1,
          result: f.result === 'win' ? 'loss' : 'win',
        };
      });

    return {
      save: makeEnvelope(s, s.time),
      liveTitle: 'Rusalka · T3',
      olderTitle: 'Gaunt Wolf · T1',
    };
  }
  throw new Error('Could not find a seed with skill, crit, hit, and ability in first 10 log lines');
};

const importSave = async (page: Page, save: object): Promise<void> => {
  await page.addInitScript(() => {
    for (const prefix of ['lasthold:', 'lasthold-preview:']) {
      const key = `${prefix}settings`;
      const old = JSON.parse(localStorage.getItem(key) ?? '{}');
      localStorage.setItem(key, JSON.stringify({ ...old, firstSeenAt: Date.now() }));
    }
  });
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
};

interface ArenaObserved {
  callouts: { text: string; tone: string }[];
  recoils: number;
  glows: string[];
}

const installArenaObserver = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    const seen: ArenaObserved = { callouts: [], recoils: 0, glows: [] };
    (window as unknown as { __vb3Arena: ArenaObserved }).__vb3Arena = seen;
    const sample = (): void => {
      for (const el of document.querySelectorAll('[data-testid="arena-callout"]')) {
        const text = (el.textContent ?? '').trim();
        const tone = el.getAttribute('data-tone') ?? '';
        if (text && !seen.callouts.some((c) => c.text === text && c.tone === tone)) {
          seen.callouts.push({ text, tone });
        }
      }
      if (document.querySelectorAll('[data-recoil="true"]').length > 0) seen.recoils += 1;
      for (const el of document.querySelectorAll('[data-glow]')) {
        const g = el.getAttribute('data-glow');
        if (g && !seen.glows.includes(g)) seen.glows.push(g);
      }
    };
    sample();
    const obs = new MutationObserver(sample);
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-recoil', 'data-glow', 'data-tone'],
    });
  });
};

const readArenaObserved = (page: Page): Promise<ArenaObserved> =>
  page.evaluate(() => (window as unknown as { __vb3Arena: ArenaObserved }).__vb3Arena);

test('Watch fight ▸ plays callouts, recoil, and glows, supports Log/Skip/Done, and finishes silently', async ({
  page,
}) => {
  test.setTimeout(90_000);
  const { save, liveTitle, olderTitle } = makeWatchSave();
  await installSoundHook(page);
  await importSave(page, save);
  await soundOn(page);

  await tab(page, 'Contracts').click();
  await page.getByRole('button', { name: 'Collect' }).click();

  const resultsDlg = page.getByRole('dialog', { name: 'Contracts finished' });
  await expect(resultsDlg).toBeVisible();

  // Two kept fights render both buttons; the evicted third fight renders neither.
  const watchButtons = resultsDlg.getByRole('button', { name: 'Watch fight ▸' });
  const logButtons = resultsDlg.getByRole('button', { name: 'Fight log ▸' });
  await expect(watchButtons).toHaveCount(2);
  await expect(logButtons).toHaveCount(2);
  await expect(
    resultsDlg
      .getByRole('listitem')
      .filter({ hasText: 'Bies · T2' })
      .getByRole('button', { name: 'Watch fight ▸' }),
  ).toHaveCount(0);

  // Tap targets ≥ 44 × 44 px and WCAG contrast on Contracts finished (dark theme).
  const resultsTap = await scanTappables(page);
  expect(resultsTap.small).toEqual([]);
  expect(resultsTap.covered).toEqual([]);
  expect(resultsTap.outside).toEqual([]);
  expect((await scanContrast(page)).failing).toEqual([]);

  const beforeSound = (await played(page)).slice();
  await installArenaObserver(page);
  await resultsDlg
    .getByRole('listitem')
    .filter({ hasText: liveTitle })
    .getByRole('button', { name: 'Watch fight ▸' })
    .click();

  const pbDlg = page.getByRole('dialog', { name: liveTitle });
  await expect(pbDlg).toBeVisible();
  await expect(pbDlg.getByRole('button', { name: 'Skip' })).toBeVisible();
  await expect(pbDlg.getByRole('button', { name: 'Log' })).toBeVisible();

  // Wait for watched steps to surface hit (-{n}), crit (★ -{n}), recoil, Wright skill glow, and monster ability glow.
  await expect
    .poll(
      async () => {
        const seen = await readArenaObserved(page);
        return {
          hasHit: seen.callouts.some((c) => c.tone === 'hit' && /^-\d+$/.test(c.text)),
          hasCrit: seen.callouts.some((c) => c.tone === 'crit' && /^★ -\d+$/.test(c.text)),
          hasRecoil: seen.recoils > 0,
          hasSkillGlow: seen.glows.includes('skill'),
          hasAbilityGlow: seen.glows.includes('ability'),
        };
      },
      { timeout: 10_000 },
    )
    .toEqual({
      hasHit: true,
      hasCrit: true,
      hasRecoil: true,
      hasSkillGlow: true,
      hasAbilityGlow: true,
    });

  // Tap targets and contrast inside the active playback sheet (including any visible callout).
  const pbTap = await scanTappables(page);
  expect(pbTap.small).toEqual([]);
  expect(pbTap.covered).toEqual([]);
  expect(pbTap.outside).toEqual([]);
  expect((await scanContrast(page)).failing).toEqual([]);

  // Log opens Fight log above the playback sheet and closes back cleanly.
  await pbDlg.getByRole('button', { name: 'Log' }).click();
  const logDlg = page.getByRole('dialog', { name: 'Fight log' });
  await expect(logDlg).toBeVisible();
  await expect(logDlg.getByText(/^t\d+$/).first()).toBeVisible();
  await logDlg.getByRole('button', { name: 'Close' }).click();
  await expect(logDlg).toHaveCount(0);

  // Skip jumps to the end, shows the combat outcome line and Done, and Done returns to Contracts finished.
  const skipBtn = pbDlg.getByRole('button', { name: 'Skip' });
  if (await skipBtn.isVisible().catch(() => false)) {
    await skipBtn.click();
  }
  const doneBtn = pbDlg.getByRole('button', { name: 'Done' });
  await expect(doneBtn).toBeVisible();
  await expect(pbDlg.getByText(/^(Success|Failure) at tick \d+/)).toBeVisible();
  await doneBtn.click();
  await expect(pbDlg).toHaveCount(0);
  await expect(resultsDlg).toBeVisible();

  // D522 / D606 / D608: watched hits/crits play strike; skipping or finishing a replay fires no outcome cue.
  await hold(page);
  const watchCues = (await played(page)).slice(beforeSound.length);
  expect(watchCues.length).toBeGreaterThan(0);
  expect(watchCues.every((c) => c === 'strike')).toBe(true);

  // Second kept fight (`watch-older`) displays OLDER_RULES_NOTE when replayed.
  await resultsDlg
    .getByRole('listitem')
    .filter({ hasText: olderTitle })
    .getByRole('button', { name: 'Watch fight ▸' })
    .click();
  const olderDlg = page.getByRole('dialog', { name: olderTitle });
  await expect(olderDlg).toBeVisible();
  await expect(olderDlg.getByText(OLDER_RULES_NOTE)).toBeVisible();
  await olderDlg.getByRole('button', { name: 'Skip' }).click();
  await olderDlg.getByRole('button', { name: 'Done' }).click();
  await expect(olderDlg).toHaveCount(0);
});

test('routine check-in stays ≤ 15 taps and buttons stay ≥ 44 × 44 px at 320 px Largest text + light theme', async ({
  page,
}) => {
  const { save, liveTitle } = makeWatchSave();
  await importSave(page, save);

  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  const settingsDlg = page.getByRole('dialog', { name: 'Settings' });
  await settingsDlg
    .getByRole('group', { name: 'Theme' })
    .getByRole('button', { name: 'Light', exact: true })
    .click();
  await settingsDlg
    .getByRole('group', { name: 'Text size' })
    .getByRole('button', { name: 'Largest', exact: true })
    .click();
  await settingsDlg.getByRole('button', { name: 'Close' }).click();
  await tab(page, 'Hold').click();
  await page.setViewportSize({ width: 320, height: 740 });

  // Measure a routine check-in from Hold: collect finished contracts, send a new party, return to Hold.
  let taps = 0;
  const tapCounted = async (fn: () => Promise<void>): Promise<void> => {
    taps += 1;
    await fn();
  };

  await tapCounted(() => tab(page, 'Contracts').click());
  await tapCounted(() => page.getByRole('button', { name: 'Collect' }).click());

  const resultsDlg = page.getByRole('dialog', { name: 'Contracts finished' });
  await expect(resultsDlg).toBeVisible();

  // At 320 px Largest text in light theme, Watch fight ▸ and Fight log ▸ stay ≥ 44 × 44 px, uncovered, inside 320 px, and ≥ 4.5:1 contrast.
  const tap320 = await scanTappables(page);
  expect(tap320.small).toEqual([]);
  expect(tap320.covered).toEqual([]);
  expect(tap320.outside).toEqual([]);
  expect((await scanContrast(page)).failing).toEqual([]);

  // Also check light-theme contrast and 320 px tap targets inside Watch fight ▸ itself (not part of routine check-in tap count).
  await resultsDlg
    .getByRole('listitem')
    .filter({ hasText: liveTitle })
    .getByRole('button', { name: 'Watch fight ▸' })
    .click();
  const pbDlg = page.getByRole('dialog', { name: liveTitle });
  await expect(pbDlg).toBeVisible();
  await expect(pbDlg.getByTestId('arena-callout').first()).toBeVisible({ timeout: 5000 });
  const pbTap320 = await scanTappables(page);
  expect(pbTap320.small).toEqual([]);
  expect(pbTap320.covered).toEqual([]);
  expect(pbTap320.outside).toEqual([]);
  expect((await scanContrast(page)).failing).toEqual([]);
  await pbDlg.getByRole('button', { name: 'Skip' }).click();
  await pbDlg.getByRole('button', { name: 'Done' }).click();

  await tapCounted(() => resultsDlg.getByRole('button', { name: 'Close' }).click());
  await tapCounted(() => page.getByRole('button', { name: 'Prepare' }).first().click());
  const launchDlg = page.getByRole('dialog', { name: 'Send hunters' });
  await tapCounted(() => launchDlg.getByRole('button', { name: 'Suggest best' }).click());
  await tapCounted(() => launchDlg.getByRole('button', { name: 'Send the hunters' }).click());
  await tapCounted(() => tab(page, 'Hold').click());

  expect(taps).toBeLessThanOrEqual(15);
});

const assertReducedPlaybackStillness = async (
  browser: Browser,
  phone: 'reduce' | 'no-preference',
  switchOn: boolean,
): Promise<void> => {
  const { save, liveTitle } = makeWatchSave();
  const ctx = await browser.newContext({
    viewport: { width: 360, height: 740 },
    baseURL: BASE,
    reducedMotion: phone,
  });
  const page = await ctx.newPage();
  await importSave(page, save);
  if (switchOn) {
    await tab(page, 'More').click();
    await page.getByRole('button', { name: /^Settings/ }).click();
    await page
      .getByRole('group', { name: 'Reduce motion' })
      .getByRole('button', { name: 'On', exact: true })
      .click();
    await page.getByRole('button', { name: 'Close' }).last().click();
  }

  await tab(page, 'Contracts').click();
  await page.getByRole('button', { name: 'Collect' }).click();
  await installArenaObserver(page);
  await page
    .getByRole('dialog', { name: 'Contracts finished' })
    .getByRole('listitem')
    .filter({ hasText: liveTitle })
    .getByRole('button', { name: 'Watch fight ▸' })
    .click();

  const pbDlg = page.getByRole('dialog', { name: liveTitle });
  await expect(pbDlg).toBeVisible();
  await expect(pbDlg.getByRole('button', { name: 'Skip' })).toBeVisible();

  let maxAnimations = 0;
  for (let t = 0; t < 1800; t += 100) {
    const count = await page.evaluate(() => document.getAnimations().length);
    maxAnimations = Math.max(maxAnimations, count);
    await page.waitForTimeout(100);
  }
  expect(maxAnimations).toBe(0);

  const seen = await readArenaObserved(page);
  expect(seen.recoils).toBe(0);
  expect(seen.glows).toEqual([]);
  // Static step callouts still render so numbers remain readable without motion.
  expect(seen.callouts.length).toBeGreaterThan(0);

  await pbDlg.getByRole('button', { name: 'Skip' }).click();
  await pbDlg.getByRole('button', { name: 'Done' }).click();
  await ctx.close();
};

test('Reduce Motion (OS preference and Settings switch) suppresses all animations, recoil, and glows while keeping static callouts', async ({
  browser,
}) => {
  test.setTimeout(90_000);
  await assertReducedPlaybackStillness(browser, 'reduce', false);
  await assertReducedPlaybackStillness(browser, 'no-preference', true);
});

test('Last Stand wave-log monster sprite faces left toward the defenders without double-flip', async ({
  page,
}) => {
  await loadFixture(page, 'v14-played');
  await page.waitForTimeout(500);
  await dismiss(page);
  await tab(page, 'Hold').click();
  await page.getByRole('button', { name: /^Rank/ }).first().click();
  await page.getByRole('button', { name: 'The stand' }).first().click();
  await page.getByRole('dialog').last().getByRole('button', { name: '1', exact: true }).click();

  const waveDlg = page.getByRole('dialog', { name: 'Wave 1' });
  await expect(waveDlg).toBeVisible();
  const monsterWrap = waveDlg.getByTestId('wave-log-monster');
  await expect(monsterWrap).toBeVisible();

  const check = await monsterWrap.evaluate((el) => {
    const transforms: string[] = [];
    for (const node of [el, ...el.querySelectorAll('*')]) {
      transforms.push(getComputedStyle(node).transform);
    }
    let anc: Element | null = el.parentElement;
    while (anc && anc !== document.body) {
      transforms.push(getComputedStyle(anc).transform);
      anc = anc.parentElement;
    }
    const row = el.parentElement;
    const defenders = row?.firstElementChild;
    return {
      transforms,
      monsterLeft: el.getBoundingClientRect().left,
      defendersLeft: defenders ? defenders.getBoundingClientRect().left : 0,
    };
  });

  // Monster sits to the right of the defenders and has no horizontal scaleX(-1) (`matrix(-1, ...)`).
  expect(check.monsterLeft).toBeGreaterThan(check.defendersLeft);
  for (const t of check.transforms) {
    expect(t).not.toMatch(/matrix\(\s*-1/);
  }
});
