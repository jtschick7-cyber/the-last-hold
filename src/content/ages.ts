import type { BalanceKey } from './balance';
import type { BuildingId } from './buildings';
import type { ResourceBundle } from './resources';

// GDD §5.1.3. In v0.1 the Keep is the end of content; the Age screen shows
// Citadel as "Coming in a later milestone" (plan T1.22).
// Proper nouns used only inside text (technical design §14 name check).
export const properNouns: readonly string[] = ['Roll of Honor'];

export const AGE_IDS = ['hamlet', 'keep'] as const;
export type AgeId = (typeof AGE_IDS)[number];

export interface AgeUp {
  /** GDD §5.1.3 prerequisites: peasant count and minimum building counts or levels. */
  readonly requires: {
    readonly peasants: number;
    readonly buildings: Readonly<Partial<Record<BuildingId, number>>>;
  };
  readonly cost: ResourceBundle;
  /** Age-bucket bonus to all production except silver (G1). */
  readonly allProductionKey: BalanceKey;
  /** setting-primer §6.5: the part of old Stanholm this Age restores. */
  readonly restores: {
    readonly summary: string;
    readonly description: string;
    readonly inscription: string;
  };
}

export interface AgeDef {
  readonly id: AgeId;
  readonly name: string;
  /** How you reach this Age; the first Age has none. */
  readonly ageUp?: AgeUp;
}

export const ages: Readonly<Record<AgeId, AgeDef>> = {
  hamlet: { id: 'hamlet', name: 'Hamlet' },
  keep: {
    id: 'keep',
    name: 'Keep',
    ageUp: {
      requires: { peasants: 10, buildings: { mill: 3, smithy: 1 } },
      cost: { food: 12_000, wood: 9_000, iron: 4_000, silver: 250 }, // silver 300 → 250 (D62)
      allProductionKey: 'age.keep.allProduction',
      restores: {
        summary: 'The gatehouse and the Roll of Honor',
        description: 'A wall of names cut in bronze, under the arch of the old gatehouse.',
        inscription:
          'Here are cut the names of those who gave their warmth to the hearth, that the folk might sleep.',
      },
    },
  },
};
