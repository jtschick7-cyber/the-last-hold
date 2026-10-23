import type { Page } from '@playwright/test';
import type { SoundTestHook } from '../../src/platform/sound/browser';
import type { SoundId } from '../../src/platform/sound/moments';
import { loadEnvelope, makeEnvelope } from '../../src/core/save';
import type { GameState } from '../../src/core/state/game-state';
import { advance } from '../../src/core/sim';
import { give, hamletWithMine, run, T0 } from '../contracts/helpers';
import { frailKeep, strongKeep } from '../delves/helpers';
import { tab } from './helpers';

// Plan SF.7 (D522 (7)): the sound tests run on the real app with the recording fake engine
// installed before the app starts. It replaces only the audio output: files are still fetched and
// every readiness rule still runs.
export const installSoundHook = async (page: Page): Promise<string[]> => {
  const requested: string[] = [];
  await page.addInitScript(() => {
    (window as unknown as { __lastholdSoundTest: SoundTestHook }).__lastholdSoundTest = {
      state: 'suspended',
      played: [],
    };
  });
  // Stand-in files: the fake engine never decodes them. SF.10 tests the real files.
  await page.route('**/assets/audio/*.mp3', (route) => {
    requested.push(new URL(route.request().url()).pathname);
    return route.fulfill({ body: Buffer.alloc(64), contentType: 'audio/mpeg' });
  });
  return requested;
};

export const played = (page: Page): Promise<SoundId[]> =>
  page.evaluate(
    () => (window as unknown as { __lastholdSoundTest: SoundTestHook }).__lastholdSoundTest.played,
  );

/** Sets the fake audio's state (a call, a lock) and returns what has played so far. */
export const setAudioState = (page: Page, state: SoundTestHook['state'], resumable = true) =>
  page.evaluate(
    ([s, r]) => {
      const hook = (window as unknown as { __lastholdSoundTest: SoundTestHook })
        .__lastholdSoundTest;
      hook.state = s as SoundTestHook['state'];
      hook.resumable = r as boolean;
    },
    [state, resumable] as const,
  );

/** More ▸ Settings ▸ Sound [On]: the tap that starts the audio. */
export const soundOn = async (page: Page): Promise<void> => {
  await tab(page, 'More').click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  await page.getByRole('group', { name: 'Sound' }).getByRole('button', { name: 'On' }).click();
  await page.getByRole('button', { name: 'Close' }).first().click();
};

export const hold = (page: Page): Promise<void> => page.waitForTimeout(400); // longer than the 150 ms hold

/**
 * A save with one contract running (a Hamlet hold, a Mine, one hunter sent), made by the core itself.
 * The seed decides the fight, so this looks for the first one that ends as asked (deterministic).
 * `T0` is the game's time; the page's clock is set to it so the contract finishes in a live tick.
 */
export const runningContractSave = (
  outcome: 'win' | 'lose',
): { save: object; endsAt: number; at: number } => {
  const lose = outcome === 'lose';
  for (let i = 0; i < 200; i++) {
    const s = hamletWithMine(`sound-${outcome}-${i}`);
    s.board.open = [
      {
        id: 'sound-a',
        village: lose ? 'velkvik' : 'dubno-ford',
        monster: lose ? 'nix' : 'kikimora',
        tier: lose ? 5 : 1, // a lone hunter against a tier-5 water spirit: a reckless send
        location: lose ? 'river' : 'field',
        arrivedAt: T0,
        revealed: 3,
      },
    ];
    s.resources.food = 100_000; // the provisions
    give(s, 'halvar');
    if (
      !run(s, {
        type: 'contract.launch',
        contract: 'sound-a',
        party: ['halvar'],
        confirmReckless: true,
      }).ok
    )
      continue;
    const endsAt = s.running[0]?.endsAt ?? 0;
    const probe = structuredClone(s);
    advance(probe, endsAt + 1000);
    if (probe.results[0]?.success !== (outcome === 'win')) continue;
    return { save: makeEnvelope(s, T0), endsAt, at: T0 };
  }
  throw new Error(`no seed gave a ${outcome}`);
};

/** A Keep ready to Delve (a strong or a frail party), made by the core's own test helper. */
export const delveSave = (kind: 'strong' | 'frail'): { save: object; at: number } => {
  const s = kind === 'strong' ? strongKeep(`sound-${kind}`) : frailKeep(`sound-${kind}`);
  return { save: makeEnvelope(s, s.time), at: s.time };
};

/** The owner's real v8 save, migrated by the core, with `edit` applied to the migrated state. */
export const ownerSaveEdited = (raw: unknown, edit: (s: GameState) => void): object => {
  const r = loadEnvelope(raw);
  if (!r.ok) throw new Error(r.error);
  const s = r.value.state;
  edit(s);
  return makeEnvelope(s, s.time);
};
