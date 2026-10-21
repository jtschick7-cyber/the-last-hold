import { HUNTER_IDS, type HunterId } from '../../content/hunters';
import { num } from '../balance-access';
import type { Explained } from '../breakdown/breakdown';
import { formatDuration } from '../format';
import type { GameState } from '../state/game-state';
import { MS_PER_SECOND } from '../time';
import { hunterStatus } from './hunters';

// GDD §5.12.1–§5.12.2, technical design §5.2 (D359, D366, D387). Plan T9.1 has the opening; T9.3
// adds the token bank, rest and eligibility on top of the same event clock.

/** Folds elapsed real time into the monotone event clock: time only passes beyond the high-water mark. */
export const foldEventClock = (state: GameState, now: number): void => {
  const c = state.events.clock;
  if (now > c.high) {
    c.value += now - c.high;
    c.high = now;
  }
};

/** Event time at `now`: the clock plus whatever has passed beyond its high-water mark. */
export const eventNow = (state: GameState, now: number): number =>
  state.events.clock.value + Math.max(0, now - state.events.clock.high);

/** The Citadel has been reached this cycle (GDD §5.12.1): the Rank is Citadel or Bastion. */
export const citadelReached = (state: GameState): boolean =>
  state.cycle.age === 'citadel' || state.cycle.age === 'bastion';

/**
 * Opens events for good (D366). The load path calls it on every load, and a Rank-up calls it on
 * reaching the Citadel; both run the same function. It folds the clock, then, the first time the
 * Citadel is reached, opens events with an empty bank (D369 (1)) and the one-time scene pending.
 * Returns true if it opened them now.
 */
export const openEvents = (state: GameState, now: number): boolean => {
  foldEventClock(state, now);
  if (state.events.opened || !citadelReached(state)) return false;
  state.events.opened = true;
  state.events.sceneSeen = false;
  state.events.tokens = { count: 0, at: state.events.clock.value };
  return true;
};

// ---- Tokens, rest and eligibility (plan T9.3, GDD §5.12.2–§5.12.3, D359) ----
//
// Both are derived from stored event-time stamps and the event clock, never ticked: they are right
// at any `now`, however long the game was closed, and the offline cap does not touch them.

const intervalMs = (): number => num('boss.tokenInterval') * MS_PER_SECOND;
const restLengthMs = (): number => num('boss.hunterRest') * MS_PER_SECOND;

/** Events are open and the Citadel is reached this cycle (locked again after a Long Night). */
export const eventsUnlocked = (state: GameState): boolean =>
  state.events.opened && citadelReached(state);

export interface TokenBank {
  count: number;
  max: number;
  full: boolean;
  /** Time toward the next token (0 when full or when events have never opened). */
  progressMs: number;
  /** Time until the next token; null when full or when events have never opened. */
  nextInMs: number | null;
}

/** The bank at `now`, with its breakdown (interval, time since the last token, next in). */
export const tokenBank = (state: GameState, now: number): Explained<TokenBank> => {
  const { tokens } = state.events;
  const max = num('boss.tokenMax');
  const interval = intervalMs();
  const elapsed = tokens.at === null ? 0 : Math.max(0, eventNow(state, now) - tokens.at);
  const gained = tokens.at === null ? 0 : Math.floor(elapsed / interval);
  const raw = tokens.count >= max ? tokens.count : Math.min(max, tokens.count + gained);
  const full = raw >= max;
  const running = tokens.at !== null && !full;
  const progressMs = running ? elapsed - gained * interval : 0;
  const value: TokenBank = {
    count: raw,
    max,
    full,
    progressMs,
    nextInMs: running ? interval - progressMs : null,
  };
  const seconds = (ms: number): number => ms / MS_PER_SECOND;
  return {
    value,
    breakdown: {
      label: 'Attempt tokens',
      value: raw,
      formula: 'banked + earned since, up to the maximum',
      children: [
        { label: 'Banked at the last spend', value: tokens.count },
        {
          label: 'Earned since (one per interval)',
          value: gained,
          formula: 'floor(time since ÷ interval)',
          key: 'boss.tokenInterval',
        },
        { label: 'Time since the last token (seconds)', value: seconds(elapsed) },
        { label: 'Bank maximum', value: max, key: 'boss.tokenMax' },
        {
          label: 'Next in (seconds)',
          value: value.nextInMs === null ? 0 : seconds(value.nextInMs),
        },
      ],
    },
  };
};

/** The Hold tab's full-bank badge: only while events are open, never while locked (GDD §5.12.2). */
export const bankFullBadge = (state: GameState, now: number): boolean =>
  eventsUnlocked(state) && tokenBank(state, now).value.full;

/**
 * Takes one token. A full bank restarts its clock from now; a part-full bank keeps its progress
 * (D359 (4)). Returns false, changing nothing, if there is none.
 */
export const spendToken = (state: GameState, now: number): boolean => {
  const bank = tokenBank(state, now).value;
  if (bank.count < 1) return false;
  foldEventClock(state, now);
  state.events.tokens = {
    count: bank.count - 1,
    at: eventNow(state, now) - bank.progressMs,
  };
  return true;
};

/** Debug: sets the bank to `count` (up to the maximum) with no progress toward the next. */
export const setBank = (state: GameState, count: number, now: number): void => {
  foldEventClock(state, now);
  const max = num('boss.tokenMax');
  state.events.tokens = { count: Math.max(0, Math.min(max, count)), at: eventNow(state, now) };
};

export interface RestRemaining {
  remainingMs: number;
}

/** How long a hunter still rests from event attempts, with the rest length it came from. */
export const restRemaining = (
  state: GameState,
  id: HunterId,
  now: number,
): Explained<RestRemaining> => {
  const until = state.events.rest[id];
  const remainingMs = until === undefined ? 0 : Math.max(0, until - eventNow(state, now));
  return {
    value: { remainingMs },
    breakdown: {
      label: 'Rest remaining (seconds)',
      value: remainingMs / MS_PER_SECOND,
      formula: 'rest length − time since the attempt',
      children: [
        {
          label: 'Rest length (seconds)',
          value: restLengthMs() / MS_PER_SECOND,
          key: 'boss.hunterRest',
        },
        {
          label: 'Time since the attempt (seconds)',
          value: until === undefined ? 0 : (restLengthMs() - remainingMs) / MS_PER_SECOND,
        },
      ],
    },
  };
};

/** Puts hunters on the shared rest from event attempts (not from contracts or Delves, D359 (2)). */
export const startRests = (state: GameState, ids: readonly HunterId[], now: number): void => {
  foldEventClock(state, now);
  const until = eventNow(state, now) + restLengthMs();
  for (const id of ids) state.events.rest[id] = until;
};

export type EventBlockKind = 'not-owned' | 'on-contract' | 'in-delve' | 'recovering' | 'resting';

export interface EventBlock {
  kind: EventBlockKind;
  /** The picker's reason beside the name (GDD §9.17). */
  reason: string;
  remainingMs?: number;
}

/**
 * Why a hunter cannot attend an event attempt, or null if they can (D369 (2)). Active and reserve
 * hunters both can; injured hunters stay out of events (the Last Stand is the exception).
 */
export const eventBlock = (state: GameState, id: HunterId, now: number): EventBlock | null => {
  const status = hunterStatus(state, id);
  if (status === null) return { kind: 'not-owned', reason: 'Not in the hold' };
  if (status === 'on-contract') return { kind: 'on-contract', reason: 'On a contract' };
  if (status === 'in-delve') return { kind: 'in-delve', reason: 'In a Delve' };
  if (status === 'recovering') return { kind: 'recovering', reason: 'Recovering' };
  const { remainingMs } = restRemaining(state, id, now).value;
  if (remainingMs > 0)
    return {
      kind: 'resting',
      reason: `Rests for ${formatDuration(remainingMs / MS_PER_SECOND)}`,
      remainingMs,
    };
  return null;
};

/** Every owned hunter, active or reserve, who can attend right now; none while events are locked. */
export const eligibleHunters = (state: GameState, now: number): HunterId[] =>
  eventsUnlocked(state)
    ? HUNTER_IDS.filter(
        (id) => state.hunters[id] !== undefined && eventBlock(state, id, now) === null,
      )
    : [];
