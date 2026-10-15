import { MONSTER_IDS, monsters } from '../../content/monsters';
import { knowledgeLevels } from '../../content/knowledge';
import { LEGENDARY_IDS, legendaries, type LegendaryId } from '../../content/legendaries';
import { HUNTER_IDS, type HunterId } from '../../content/hunters';
import { isFound } from '../story/documents';
import type { GameState } from '../state/game-state';

// GDD §5.11.6, §8.12 (v0.8, D306, D314, D328 (5)): six Legendaries, each found once at a fixed
// milestone (never random, never from Delves), kept forever. A Legendary is found the moment its
// milestone is met and waits in the `legendaries` list; it is worn only by command (keepsake slot).

export const legendaryKey = (id: LegendaryId): string => `legendary:${id}`;

export const owned = (state: GameState, id: LegendaryId): boolean =>
  state.legendaries.some((l) => l.id === id);

/** Who wears it, or null. */
export const wornBy = (state: GameState, id: LegendaryId): HunterId | null =>
  HUNTER_IDS.find((h) => state.hunters[h]?.keepsake === id) ?? null;

const milestoneMet = (state: GameState, id: LegendaryId): boolean => {
  const m = legendaries[id].milestone;
  if (m.kind === 'documentFound') return isFound(state, m.id);
  const species = MONSTER_IDS.filter((s) => monsters[s].family === m.family);
  return (
    species.length > 0 &&
    species.every((s) => (state.bestiary[s]?.level ?? 0) >= knowledgeLevels.mastered.number)
  );
};

/**
 * Finds every Legendary whose milestone is met and is not yet owned. Idempotent; run on the events
 * that can meet a milestone (a won contract, the Last Stand), like the Delve relics' idle sources.
 * Returns the ones found now, in a fixed order.
 */
export const grantLegendaries = (state: GameState): LegendaryId[] => {
  const found: LegendaryId[] = [];
  for (const id of LEGENDARY_IDS) {
    if (owned(state, id) || !milestoneMet(state, id)) continue;
    state.legendaries.push({ id, cycle: state.cycle.number });
    found.push(id);
  }
  return found;
};
