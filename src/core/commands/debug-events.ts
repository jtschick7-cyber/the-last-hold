import { num } from '../balance-access';
import { setBank, tokenBank } from '../systems/events';
import type { GameState } from '../state/game-state';
import { ok, refuse, type ApplyResult } from './types';

// Plan T9.3 (technical design §15): debug actions for events, so the playtest can reach a boss or a
// hunt without waiting for tokens or rests. Like every debug action they set meta.debugUsed.

const needsEvents = (state: GameState): ApplyResult | null =>
  state.events.opened ? null : refuse('Events open at the first Citadel.');

/** One more token in the bank, up to the maximum. */
export const debugAddToken = (state: GameState, now: number): ApplyResult => {
  const closed = needsEvents(state);
  if (closed) return closed;
  setBank(state, tokenBank(state, now).value.count + 1, now);
  state.meta.debugUsed = true;
  return ok;
};

/** A full bank. */
export const debugFillBank = (state: GameState, now: number): ApplyResult => {
  const closed = needsEvents(state);
  if (closed) return closed;
  setBank(state, num('boss.tokenMax'), now);
  state.meta.debugUsed = true;
  return ok;
};

/** Ends every rest from event attempts. */
export const debugEndRests = (state: GameState): ApplyResult => {
  state.events.rest = {};
  state.meta.debugUsed = true;
  return ok;
};
