import { HUNTER_IDS, type HunterId } from '../../content/hunters';
import { num } from '../balance-access';
import type { GameState } from '../state/game-state';
import { levelCap, hunterStatus, xpToNext } from '../systems/hunters';
import { notePeak } from '../story/letters';

// GDD §5.11.5 (v0.8, D315): the yard. When a contract finishes, every hunter at the hold who isn't
// on it earns `yard.share` of the XP a hunter on it earned, active or reserve, injured or not, but
// not the dead (they are gone from the roster) and not hunters in a Delve. It never takes a hunter
// past the level of the hold's third-highest hunter (`yard.capRank`), so it only catches people up.

export const yardKey = (hunter: HunterId, level: number): string => `yard:${hunter}:${level}`;

/**
 * The level yard XP stops at: the `yard.capRank`-th highest level among the hunters at the hold
 * (the lowest, with fewer hunters than that), and never above the hold's own cap (D110).
 */
export const yardCap = (state: GameState): number => {
  const levels: number[] = [];
  for (const id of HUNTER_IDS) {
    const h = state.hunters[id];
    if (h) levels.push(h.level);
  }
  levels.sort((a, b) => b - a);
  const third = levels[num('yard.capRank') - 1] ?? levels[levels.length - 1] ?? 0;
  return Math.min(third, levelCap(state));
};

/**
 * Pays the yard for a contract in which each surviving hunter earned `xp`. Returns one found key per
 * hunter who gained a level (`yard:<hunter>:<level reached>`), and notes the new level for the
 * name letters (a yard level counts like any other, GDD §5.14.7).
 */
export const applyYard = (state: GameState, party: readonly HunterId[], xp: number): string[] => {
  if (xp <= 0) return [];
  const share = num('yard.share') * xp;
  const cap = yardCap(state);
  const keys: string[] = [];
  for (const id of HUNTER_IDS) {
    const h = state.hunters[id];
    if (!h || party.includes(id) || hunterStatus(state, id) === 'in-delve') continue;
    if (h.level >= cap) continue; // catching up only: never past the cap, and nothing banked beyond it
    h.xp += share;
    const from = h.level;
    while (h.level < cap && h.xp >= xpToNext(h.level)) {
      h.xp -= xpToNext(h.level);
      h.level += 1;
    }
    if (h.level >= cap) h.xp = 0;
    if (h.level > from) {
      keys.push(yardKey(id, h.level));
      keys.push(...notePeak(state, id, h.level));
    }
  }
  return keys;
};
