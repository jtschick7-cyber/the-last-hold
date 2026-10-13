import { DAMAGE_TYPES } from '../../content/damage';
import { monsters, type MonsterId } from '../../content/monsters';
import { villages } from '../../content/villages';
import type { ContractInstance } from '../../core/state/game-state';

// Plain wording for contracts and monsters, from content (GDD §9.4–9.5).

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const times = (x: number): string => `×${x}`;

export const pct = (p: number): string => `${Math.round(p * 100)}%`;

export const placeName = (c: ContractInstance): string =>
  `${villages[c.village].name} · ${c.location}`;

/** "weak: Silver ×1.5, Fire ×1.25" and "resists: Frost ×0.25, Venom ×0" (GDD §9.5). */
export const resistLines = (id: MonsterId): { weak: string; resists: string } => {
  const r = monsters[id].resist;
  const weak = DAMAGE_TYPES.filter((t) => r[t] >= 1.25).map((t) => `${cap(t)} ${times(r[t])}`);
  const resists = DAMAGE_TYPES.filter((t) => r[t] < 1).map((t) => `${cap(t)} ${times(r[t])}`);
  return {
    weak: weak.length ? weak.join(', ') : 'nothing in particular',
    resists: resists.length ? resists.join(', ') : 'nothing',
  };
};

export const abilityLines = (id: MonsterId): string[] => monsters[id].abilities.map((a) => a.name);
