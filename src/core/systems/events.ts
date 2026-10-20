import type { GameState } from '../state/game-state';

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
