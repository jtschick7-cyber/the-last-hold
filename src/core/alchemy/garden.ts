import { BUILDING_IDS, buildings } from '../../content/buildings';
import { HERB_IDS } from '../../content/ingredients';
import { constantAt } from '../balance-access';
import type { GameState } from '../state/game-state';
import { MS_PER_SECOND } from '../time';

// GDD §5.7: each Herb Garden grows one yarrow, one mugwort and one juniper every
// 10 minutes. Monster reagents come only from contracts.

const effectOf = (id: (typeof BUILDING_IDS)[number]) =>
  buildings[id].effects.find((e) => e.kind === 'herbGrowth');

/** Gardens standing. */
export const gardenCount = (state: GameState): number =>
  BUILDING_IDS.reduce((n, id) => (effectOf(id) ? n + state.buildings[id] : n), 0);

const intervalMs = (): number => {
  for (const id of BUILDING_IDS) {
    const e = effectOf(id);
    if (e?.kind === 'herbGrowth')
      return (constantAt(e.intervalKey).value as number) * MS_PER_SECOND;
  }
  return Infinity;
};

/** Starts the harvest clock when the first garden stands (a garden built later joins the next harvest). */
export const syncGarden = (state: GameState): void => {
  if (state.garden.nextAt === null && gardenCount(state) > 0)
    state.garden.nextAt = state.time + intervalMs();
};

/** When the next harvest is due, or null while no garden stands. */
export const nextGardenTime = (state: GameState): number | null =>
  gardenCount(state) > 0 ? state.garden.nextAt : null;

export interface Harvest {
  at: number;
  /** Of each herb. */
  each: number;
}

/** One harvest: each garden adds one of each herb. The clock is at its time. */
export const applyHarvest = (state: GameState): Harvest | null => {
  const at = state.garden.nextAt;
  const gardens = gardenCount(state);
  if (at === null || gardens === 0) return null;
  for (const h of HERB_IDS) state.stores[h] += gardens;
  state.garden.nextAt = at + intervalMs();
  return { at, each: gardens };
};
