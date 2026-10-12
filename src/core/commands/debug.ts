import { AGE_IDS, type AgeId } from '../../content/ages';
import { RESOURCE_IDS, type ResourceBundle } from '../../content/resources';
import { catchUpNow } from '../sim/offline';
import type { GameState } from '../state/game-state';
import { ok, refuse, type ApplyResult } from './types';

// Technical design §15 / GDD §9.10: every debug action is a command, and any of
// them sets meta.debugUsed (shown in About, no other effect; D21).

/**
 * Time skip through the real offline path: the game behaves as if it had last
 * run `ms` earlier, then catches up to now (so the offline cap applies).
 */
export const skip = (state: GameState, ms: number, now: number): ApplyResult => {
  if (!Number.isFinite(ms) || ms <= 0) return refuse('Skip a positive amount of time.');
  state.time -= ms;
  state.meta.lastSeen -= ms;
  state.peasants.lastSettleAt -= ms;
  catchUpNow(state, Math.max(now, state.time + ms));
  state.meta.debugUsed = true;
  return ok;
};

export const addResources = (state: GameState, bundle: ResourceBundle): ApplyResult => {
  const entries = Object.entries(bundle ?? {});
  const valid =
    entries.length > 0 &&
    entries.every(
      ([r, v]) =>
        (RESOURCE_IDS as readonly string[]).includes(r) &&
        typeof v === 'number' &&
        Number.isFinite(v) &&
        v > 0,
    );
  if (!valid) return refuse('Add positive amounts of known resources.');
  for (const [r, v] of entries) state.resources[r as keyof typeof state.resources] += v as number;
  state.meta.debugUsed = true;
  return ok;
};

export const setSeed = (state: GameState, seed: string): ApplyResult => {
  if (typeof seed !== 'string' || seed.trim() === '') return refuse('The seed needs some text.');
  state.meta.gameSeed = seed.trim();
  state.meta.debugUsed = true;
  return ok;
};

/** Jumps to an Age without its requirements or cost. */
export const unlockAge = (state: GameState, age: AgeId): ApplyResult => {
  if (!(AGE_IDS as readonly string[]).includes(age)) return refuse('That Age does not exist.');
  state.cycle.age = age;
  state.meta.debugUsed = true;
  return ok;
};
