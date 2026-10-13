import { apply } from '../commands';
import { catchUpNow, type AwaySummary } from '../sim/offline';
import type { GameState } from '../state/game-state';
import { decideCheckIn, type CheckInDecision } from './decide';
import { nextCheckIn, type PolicyId } from './schedules';

// Technical design §13.1: a policy plays the real core through apply() and the
// offline catch-up, check-in by check-in, on a virtual clock. The time between
// check-ins is time away, so the offline cap applies exactly as for a player.

export interface CheckInRecord extends CheckInDecision {
  readonly at: number;
  /** The time away since the last check-in, as a player's away sheet shows it. */
  readonly away: AwaySummary;
  /** Peasants before that time away (settles since then are in `away.events`). */
  readonly peasantsBefore: number;
}

export interface PlayOptions {
  readonly policy: PolicyId;
  /** When the game was started (the Opening policy counts from here). */
  readonly startedAt: number;
  /** Play check-ins up to and including this time. */
  readonly until: number;
  /** Called after each check-in, with the state as it now stands. */
  readonly onCheckIn?: (record: CheckInRecord, state: GameState) => void;
  /** Stop early once this returns true. */
  readonly stop?: (state: GameState) => boolean;
}

/** Plays check-ins from the state's current time; the first one is now. */
export const play = (state: GameState, opts: PlayOptions): void => {
  let at = state.time;
  while (at <= opts.until) {
    const peasantsBefore = state.peasants.total;
    const away = catchUpNow(state, at);
    const next = nextCheckIn(opts.policy, at, opts.startedAt);
    const decision = decideCheckIn(state, nextCheckIn(opts.policy, next, opts.startedAt) - at);
    for (const cmd of decision.commands) {
      const result = apply(state, cmd, at);
      // The decision was made on a copy of this exact state, so it can't fail.
      if (!result.ok) throw new Error(`Policy command refused: ${result.reason}`);
    }
    opts.onCheckIn?.({ ...decision, at, away, peasantsBefore }, state);
    if (opts.stop?.(state)) return;
    at = next;
  }
};
