import { apply } from '../commands';
import { catchUpNow, type AwaySummary } from '../sim/offline';
import type { GameState } from '../state/game-state';
import type { DelveResult } from '../state/delve-state';
import { decideCheckIn, type CheckInDecision } from './decide';
import { delveSession } from './delver';
import { eventerMoves, type EventerCheckIn } from './eventer';
import { freshMemory, type PolicyMemory } from './long-night';
import { isDelveSession, nextCheckIn, type PolicyId } from './schedules';

// Technical design §13.1: a policy plays the real core through apply() and the
// offline catch-up, check-in by check-in, on a virtual clock. The time between
// check-ins is time away, so the offline cap applies exactly as for a player.

export interface CheckInRecord extends CheckInDecision {
  readonly at: number;
  /** The time away since the last check-in, as a player's away sheet shows it. */
  readonly away: AwaySummary;
  /** Peasants before that time away (settles since then are in `away.events`). */
  readonly peasantsBefore: number;
  /** The Delve runs a Delve session finished, in order (the Delver only, D269). */
  readonly delveResults?: readonly DelveResult[];
  /** What the Eventer did with its tokens (GDD §6.1, D367); absent for every other policy. */
  readonly events?: EventerCheckIn;
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
  /** Carried between check-ins (the stand rule); a fresh one if absent. */
  readonly memory?: PolicyMemory;
}

/** Plays check-ins from the state's current time; the first one is now. */
export const play = (state: GameState, opts: PlayOptions): void => {
  let at = state.time;
  const memory = opts.memory ?? freshMemory();
  while (at <= opts.until) {
    const peasantsBefore = state.peasants.total;
    const away = catchUpNow(state, at);
    const next = nextCheckIn(opts.policy, at, opts.startedAt);
    if (isDelveSession(opts.policy, at)) {
      // GDD §6.1 (D269): a session plays Delves and nothing else.
      const session = delveSession(state, at);
      const idle: CheckInDecision = {
        commands: session.commands,
        purchases: 0,
        agedUp: false,
        hadOption: false,
        saving: false,
      };
      opts.onCheckIn?.({ ...idle, at, away, peasantsBefore, delveResults: session.results }, state);
      if (opts.stop?.(state)) return;
      at = next;
      continue;
    }
    // GDD §6.1: "within 2 check-ins" counts Standard check-ins; a Delve session is not one, so the
    // Delver decides everything outside its sessions exactly as Standard does.
    const checkInAfter = (t: number): number => {
      let n = nextCheckIn(opts.policy, t, opts.startedAt);
      while (isDelveSession(opts.policy, n)) n = nextCheckIn(opts.policy, n, opts.startedAt);
      return n;
    };
    // GDD §6.1 (D367): the Eventer spends its tokens first, then decides everything else as Standard
    // does. A rest from events never stops a contract, so the order costs the contracts nothing.
    const events =
      opts.policy === 'eventer'
        ? eventerMoves(state, at, (cmd) => apply(state, cmd, at).ok)
        : undefined;
    const decision = decideCheckIn(state, checkInAfter(checkInAfter(at)) - at, memory);
    for (const cmd of decision.commands) {
      const result = apply(state, cmd, at);
      // The decision was made on a copy of this exact state, so it can't fail.
      if (!result.ok) throw new Error(`Policy command refused: ${result.reason}`);
    }
    opts.onCheckIn?.(
      { ...decision, at, away, peasantsBefore, ...(events ? { events } : {}) },
      state,
    );
    if (opts.stop?.(state)) return;
    at = next;
  }
};
