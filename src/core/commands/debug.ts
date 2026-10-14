import { AGE_IDS, type AgeId } from '../../content/ages';
import { RESOURCE_IDS, type ResourceBundle } from '../../content/resources';
import { play } from '../policies/play';
import { POLICY_IDS, type PolicyId } from '../policies/schedules';
import { catchUpNow } from '../sim/offline';
import type { GameState } from '../state/game-state';
import { freshHunter } from '../state/hunters-state';
import { shiftClock } from '../state/shift';
import { sweepDocuments } from '../story/documents';
import { noteAllPeaks } from '../story/letters';
import { rosterCap } from '../systems/hunters';
import { ok, refuse, type ApplyResult } from './types';

// Technical design §15 / GDD §9.10: every debug action is a command, and any of
// them sets meta.debugUsed (shown in About, no other effect; D21).

/**
 * Time skip through the real offline path: the game behaves as if it had last
 * run `ms` earlier, then catches up to now (so the offline cap applies).
 */
export const skip = (state: GameState, ms: number, now: number): ApplyResult => {
  if (!Number.isFinite(ms) || ms <= 0) return refuse('Skip a positive amount of time.');
  shiftClock(state, -ms); // everything scheduled moves with the clock
  catchUpNow(state, Math.max(now, state.time + ms));
  state.meta.debugUsed = true;
  return ok;
};

/**
 * Plays a simulator policy (GDD §6.1) over the last `ms`, as if the game had
 * last run that long ago and the policy had been checking in since. Then
 * catches up to now. Check-in times read the clock as UTC.
 */
export const runPolicy = (
  state: GameState,
  policy: PolicyId,
  ms: number,
  now: number,
): ApplyResult => {
  if (!(POLICY_IDS as readonly string[]).includes(policy)) return refuse('Unknown policy.');
  if (!Number.isFinite(ms) || ms <= 0) return refuse('Run a policy for a positive time.');
  shiftClock(state, -ms);
  // The replayed check-ins happen before the latest time seen, so move that
  // back too, or catch-up would read them as a clock moved backward (D21).
  state.meta.clockHighWater = Math.min(state.meta.clockHighWater, state.time);
  const from = state.time;
  play(state, { policy, startedAt: from, until: from + ms });
  catchUpNow(state, Math.max(now, from + ms));
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
  if (!(AGE_IDS as readonly string[]).includes(age)) return refuse('That Rank does not exist.');
  state.cycle.age = age;
  const record = state.cycles[state.cycles.length - 1];
  if (record && record.ranks[age] === undefined) record.ranks[age] = state.time; // D113
  sweepDocuments(state);
  state.meta.debugUsed = true;
  return ok;
};

/** Adds Embers, to try The Hearth (technical design §15). */
/** GDD §5.9.8: the save faces the v0.4 arrival; Threat waits until it is over. */
export const runArrival = (state: GameState): ApplyResult => {
  if (state.arrivalDue) return refuse('The arrival is already due.');
  const record = state.cycles[state.cycles.length - 1];
  if (!record || record.stand) return refuse('This cycle has already made its stand.');
  state.arrivalDue = true;
  state.threat = 0;
  state.meta.debugUsed = true;
  return ok;
};

export const addEmbers = (state: GameState, amount: number): ApplyResult => {
  if (!Number.isInteger(amount) || amount <= 0) return refuse('A whole number of Embers, please.');
  state.embers += amount;
  state.meta.debugUsed = true;
  return ok;
};

/**
 * Plan T5.5: Arvid unlocks when Act III begins, which v0.5 can't reach, so this adds
 * him to the roster for testing: active if there's room, else in the reserve.
 */
export const addArvid = (state: GameState): ApplyResult => {
  if (state.hunters.arvid) return refuse('Arvid is already at the hold.');
  state.hunters.arvid = freshHunter();
  if (state.roster.active.length < rosterCap(state).value) state.roster.active.push('arvid');
  noteAllPeaks(state);
  state.meta.debugUsed = true;
  return ok;
};
