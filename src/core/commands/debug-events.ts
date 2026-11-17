import { BOSS_IDS, type BossId } from '../../content/great-beasts';
import { constantAt, num } from '../balance-access';
import { passOfVisit } from '../systems/boss';
import { citadelReached, openEvents, setBank, tokenBank } from '../systems/events';
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

/** Sets the current Great Beast to `boss` on a fresh visit within the active pass. */
export const debugSetBoss = (state: GameState, boss: BossId, now: number): ApplyResult => {
  if (!(BOSS_IDS as readonly string[]).includes(boss)) {
    return refuse('That Great Beast does not exist.');
  }
  if (!state.events.opened) {
    if (!citadelReached(state)) return refuse('Events open at the first Citadel.');
    openEvents(state, now);
  }
  const order = constantAt('boss.order').value as readonly string[];
  const visit = passOfVisit(state.events.boss.visit) * order.length + BOSS_IDS.indexOf(boss);
  state.events.boss = { visit, tier: null, pool: null, paid: 0, attempts: 0 };
  state.meta.debugUsed = true;
  return ok;
};
