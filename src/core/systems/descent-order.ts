import { HUNTER_IDS, hunters, type HunterId } from '../../content/hunters';
import { num } from '../balance-access';
import type { GameState } from '../state/game-state';
import { eligibleForDescent } from './descent-record';

// Technical design §22.2 (D558): Suggest marching order. Pure and deterministic: the same hold always
// gives the same order. It only proposes; the player's own command seats the order (CLAUDE.md).

const levelOf = (state: GameState, id: HunterId): number => state.hunters[id]?.level ?? 0;

/**
 * Everyone who can march, with at least one Vanguard and one Mender in the front line when the hold has
 * them. Highest level first, ties in roster order; the rest wait in the reserve, also by level.
 */
export const suggestDescentOrder = (state: GameState): HunterId[] => {
  const slots = num('laststand.partyMax');
  const rosterAt = (id: HunterId): number => HUNTER_IDS.indexOf(id);
  const byLevel = (a: HunterId, b: HunterId): number =>
    levelOf(state, b) - levelOf(state, a) || rosterAt(a) - rosterAt(b);
  const ranked = eligibleForDescent(state).sort(byLevel);

  // The best of each needed role take their places first; the other slots go to the highest levels.
  const must = (['vanguard', 'mender'] as const)
    .map((role) => ranked.find((id) => hunters[id].role === role))
    .filter((id): id is HunterId => id !== undefined)
    .slice(0, slots);
  const front = new Set<HunterId>(must);
  for (const id of ranked) if (front.size < slots) front.add(id);

  const inFront = ranked.filter((id) => front.has(id));
  return [...inFront, ...ranked.filter((id) => !front.has(id))];
};
