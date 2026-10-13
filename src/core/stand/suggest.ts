import { hunters, type HunterId, type RoleId } from '../../content/hunters';
import { num } from '../balance-access';
import type { GameState } from '../state/game-state';

// GDD §5.9.3 (D107): the suggested six fill the stand's slots: the highest levels,
// with at least one Vanguard and one Mender when the active roster has them. Any
// slot can be swapped on the stand screen.

const NEEDED: readonly RoleId[] = ['vanguard', 'mender'];

export const suggestSix = (state: GameState): HunterId[] => {
  const active = state.roster.active.filter((id) => state.hunters[id]);
  const level = (id: HunterId): number => state.hunters[id]?.level ?? 0;
  // Highest level first; ties keep roster order.
  const ranked = active
    .map((id, i) => ({ id, i }))
    .sort((a, b) => level(b.id) - level(a.id) || a.i - b.i)
    .map((x) => x.id);
  const pick = ranked.slice(0, num('laststand.partyMax'));
  for (const role of NEEDED) {
    if (pick.some((id) => hunters[id].role === role)) continue;
    const best = ranked.find((id) => hunters[id].role === role && !pick.includes(id));
    if (!best) continue;
    // Replace the lowest-level hunter whose role isn't the only one of a needed role.
    for (let k = pick.length - 1; k >= 0; k--) {
      const id = pick[k];
      if (id === undefined) continue;
      const r = hunters[id].role;
      const onlyOne = NEEDED.includes(r) && pick.filter((p) => hunters[p].role === r).length === 1;
      if (!onlyOne) {
        pick[k] = best;
        break;
      }
    }
  }
  return pick;
};
