import type { LocationId } from '../../content/damage';
import { MONSTER_IDS, monsters, type MonsterId } from '../../content/monsters';

/** Species that can appear in a location at a tier, in content order (GDD §8.3.1). */
export const candidatesFor = (location: LocationId, tier: number): MonsterId[] =>
  MONSTER_IDS.filter((id) => {
    const m = monsters[id];
    return m.locations.includes(location) && tier >= m.tiers[0] && tier <= m.tiers[1];
  });
