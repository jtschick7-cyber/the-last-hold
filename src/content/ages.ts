import type { BalanceKey } from './balance';
import type { BuildingId, DefenseId } from './buildings';
import type { ResourceBundle } from './resources';

// GDD §5.1.3. In v0.1 the Keep is the end of content; the Age screen shows
// Citadel as "Coming in a later milestone" (plan T1.22).
// Proper nouns used only inside text (technical design §14 name check).
export const properNouns: readonly string[] = ['Roll of Honor', 'Forge Hall'];

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

// ---- v0.4: Citadel and Bastion (GDD §5.1.3, D106) ----
// Content only (plan T4.1). A new Rank id changes the saved state, so these join
// AGE_IDS and `ages` with the v3 → v4 migration (T4.3) and are wired in by T4.4.
// Every number is a tunable starting value (D44), tuned to the day-2 and day-3
// targets; the roster bonus and the tier cap are locked and live in balance.ts.
export const V04_AGE_IDS = ['citadel', 'bastion'] as const;
export type V04AgeId = (typeof V04_AGE_IDS)[number];

export interface V04AgeUp {
  readonly requires: {
    readonly peasants: number;
    readonly buildings: Readonly<Partial<Record<BuildingId | DefenseId, number>>>;
  };
  readonly cost: ResourceBundle;
  readonly allProductionKey: BalanceKey;
  /** setting-primer §6.5: neutral text only; no inscription until v0.5. */
  readonly restores: { readonly summary: string; readonly description: string };
}

export interface V04AgeDef {
  readonly id: V04AgeId;
  readonly name: string;
  readonly ageUp: V04AgeUp;
}

export const v04Ages: Readonly<Record<V04AgeId, V04AgeDef>> = {
  citadel: {
    id: 'citadel',
    name: 'Citadel',
    ageUp: {
      requires: { peasants: 50, buildings: { mill: 10, smithy: 8, barracks: 1 } },
      cost: { food: 300_000, wood: 150_000, iron: 60_000, silver: 1_000 },
      allProductionKey: 'age.citadel.allProduction',
      restores: {
        summary: 'The old Forge Hall',
        description: 'The roof is back on the old Forge Hall. Its forges are cold.',
      },
    },
  },
  bastion: {
    id: 'bastion',
    name: 'Bastion',
    ageUp: {
      requires: { peasants: 65, buildings: { mill: 15, smithy: 12, barracks: 3, walls: 1 } },
      cost: { food: 1_500_000, wood: 600_000, iron: 250_000, silver: 2_500 },
      allProductionKey: 'age.bastion.allProduction',
      restores: {
        summary: 'A sealed stair going down',
        description: 'Under the Bastion floor, a stair goes down to a sealed door.',
      },
    },
  },
};
