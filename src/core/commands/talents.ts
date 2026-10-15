import { hunters, type HunterId } from '../../content/hunters';
import { legendaries } from '../../content/legendaries';
import type { GameState } from '../state/game-state';
import { owned, wornBy } from '../systems/legendaries';
import { busyReason, pickProblem, talentFor } from '../systems/talents';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.11.5, §5.11.6 (v0.8, D313, D306, D328 (6)): the talent pick, the free respec, and the
// keepsake slot. All are refused for a hunter on a contract or in a Delve, like the trait switch.

const hunterOf = (state: GameState, hunter: unknown): HunterId | null => {
  if (typeof hunter !== 'string' || !(hunter in hunters)) return null;
  return state.hunters[hunter as HunterId] ? (hunter as HunterId) : null;
};

export const pickTalent = (state: GameState, hunter: unknown, talent: unknown): ApplyResult => {
  const id = hunterOf(state, hunter);
  if (!id) return refuse('That hunter is not on your roster.');
  const def = talentFor(talent);
  if (!def) return refuse('That talent does not exist.');
  const busy = busyReason(state, id);
  if (busy) return refuse(busy);
  const problem = pickProblem(state, id, def);
  if (problem) return refuse(`${hunters[id].shortName}: ${problem}`);
  state.hunters[id]?.talents.push(def.id);
  return ok;
};

/** Free: gives every point back (GDD §5.11.5). */
export const respecTalents = (state: GameState, hunter: unknown): ApplyResult => {
  const id = hunterOf(state, hunter);
  if (!id) return refuse('That hunter is not on your roster.');
  const busy = busyReason(state, id);
  if (busy) return refuse(busy);
  const h = state.hunters[id];
  if (!h || h.talents.length === 0) return refuse('No talents to take back.');
  h.talents = [];
  return ok;
};

/** Puts a Legendary in a hunter's keepsake slot; the one they wore goes back to Stores' list. */
export const equipKeepsake = (
  state: GameState,
  hunter: unknown,
  legendary: unknown,
): ApplyResult => {
  const id = hunterOf(state, hunter);
  if (!id) return refuse('That hunter is not on your roster.');
  if (typeof legendary !== 'string' || !(legendary in legendaries))
    return refuse('That Legendary does not exist.');
  const leg = legendary as keyof typeof legendaries;
  if (!owned(state, leg)) return refuse(`${legendaries[leg].name} has not been found.`);
  const busy = busyReason(state, id);
  if (busy) return refuse(busy);
  const holder = wornBy(state, leg);
  if (holder === id) return refuse('Already worn by that hunter.');
  if (holder)
    return refuse(
      `${legendaries[leg].name} is worn by ${hunters[holder].shortName}. Take it off first.`,
    );
  const h = state.hunters[id];
  if (h) h.keepsake = leg;
  return ok;
};

export const unequipKeepsake = (state: GameState, hunter: unknown): ApplyResult => {
  const id = hunterOf(state, hunter);
  if (!id) return refuse('That hunter is not on your roster.');
  const h = state.hunters[id];
  if (!h?.keepsake) return refuse('Nothing is kept there.');
  const busy = busyReason(state, id);
  if (busy) return refuse(busy);
  h.keepsake = null;
  return ok;
};
