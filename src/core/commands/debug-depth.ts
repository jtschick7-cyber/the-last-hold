import { gear } from '../../content/gear';
import { HUNTER_IDS } from '../../content/hunters';
import { seeded } from '../rng';
import type { GameState } from '../state/game-state';
import { rollLines, takeLoot } from '../systems/loot';
import { ok, type ApplyResult } from './types';

// Plan T8.13b: two debug actions so the smoke test (and the owner's playtest) can reach the v0.8
// screens without waiting for a drop or for level 5. Like every debug action they set
// meta.debugUsed and nothing else (D21).

/**
 * Puts a Rare Iron Blade into Stores the way a won contract's loot would (so a full Stores
 * salvages it). Its lines come from a seeded stream, so the same save gets the same blade.
 */
export const debugGrantLoot = (state: GameState): ApplyResult => {
  const rng = seeded(`${state.meta.gameSeed}:debug-loot:${state.itemSeq}`);
  takeLoot(state, { base: gear['iron-blade'], rarity: 'rare', lines: rollLines(rng, 'rare') });
  state.meta.debugUsed = true;
  return ok;
};

/** Every hunter has "reached" level 10 and the hold has 100 more trophies on hand: ready to rank up. */
export const debugReadyRanks = (state: GameState): ApplyResult => {
  for (const id of HUNTER_IDS) {
    if (!state.hunters[id]) continue;
    state.story.peakLevels[id] = Math.max(state.story.peakLevels[id] ?? 0, 10);
  }
  state.stats.trophies += 100;
  state.meta.debugUsed = true;
  return ok;
};
