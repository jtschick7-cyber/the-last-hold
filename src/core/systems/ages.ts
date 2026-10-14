import { AGE_IDS, ages, type AgeId } from '../../content/ages';
import {
  buildings,
  type BuildingDef,
  type BuildingId,
  type LevelBuilding,
} from '../../content/buildings';
import type { GameState } from '../state/game-state';
import { canAfford } from './costs';

// GDD §5.1.3: Age order, availability, and the Age-up checklist.

export const ageIndex = (age: AgeId): number => AGE_IDS.indexOf(age);

export const nextAge = (state: GameState): AgeId | null =>
  AGE_IDS[ageIndex(state.cycle.age) + 1] ?? null;

/** True once the hold has reached the Age a building needs. */
export const isAvailable = (state: GameState, def: BuildingDef): boolean =>
  ageIndex(state.cycle.age) >= ageIndex(def.availableFrom);

/**
 * A level building's cap in an Age: that Age's entry, else the latest earlier one
 * (the Barracks is max 5 in every Rank, GDD §8.1); 0 before its first entry.
 */
export const levelCapIn = (def: LevelBuilding, age: AgeId): number => {
  for (let i = ageIndex(age); i >= 0; i--) {
    const id = AGE_IDS[i];
    const cap = id === undefined ? undefined : def.maxLevel[id];
    if (cap !== undefined) return cap;
  }
  return 0;
};

/** The highest level a level building may reach in the current Age (0 = not yet). */
export const maxLevelNow = (state: GameState, id: BuildingId): number => {
  const def = buildings[id];
  return def.kind === 'level' ? levelCapIn(def, state.cycle.age) : 0;
};

export interface Requirement {
  readonly label: string;
  readonly have: number;
  readonly need: number;
  readonly met: boolean;
}

export interface AgeUpStatus {
  readonly to: AgeId;
  readonly requirements: readonly Requirement[];
  readonly affordable: boolean;
  readonly ready: boolean;
}

/** The checklist for the next Age, or null at the last Age built so far. */
export const ageUpStatus = (state: GameState): AgeUpStatus | null => {
  const to = nextAge(state);
  const up = to ? ages[to].ageUp : undefined;
  if (!to || !up) return null;
  const requirements: Requirement[] = [
    {
      label: 'Peasants',
      have: state.peasants.total,
      need: up.requires.peasants,
      met: state.peasants.total >= up.requires.peasants,
    },
    ...Object.entries(up.requires.buildings).map(([id, need = 0]) => {
      const def = buildings[id as BuildingId];
      const have = state.buildings[id as BuildingId];
      return {
        label: def.kind === 'level' ? `${def.name} level` : def.name,
        have,
        need,
        met: have >= need,
      };
    }),
  ];
  const cost = { food: 0, wood: 0, iron: 0, silver: 0, ...up.cost };
  const affordable = canAfford(state, cost);
  return { to, requirements, affordable, ready: affordable && requirements.every((r) => r.met) };
};
