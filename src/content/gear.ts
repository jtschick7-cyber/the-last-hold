import type { BuildingId } from './buildings';
import type { ResourceBundle } from './resources';

// GDD §5.3.6: gear is upgraded in place. Each hunter has a weapon slot and an
// armor slot, and the Smithy upgrades the slot directly. No inventory until v0.8.

export const GEAR_IDS = [
  'iron-blade',
  'steel-blade',
  'silvered-blade',
  'hide-armor',
  'mail',
  'emberwright-plate',
] as const;
export type GearId = (typeof GEAR_IDS)[number];

export type GearSlot = 'weapon' | 'armor';

export interface GearDef {
  readonly id: GearId;
  readonly name: string;
  readonly slot: GearSlot;
  /** Tier within its slot, 1 = first upgrade. Each tier replaces the one below. */
  readonly tier: number;
  readonly might: number;
  readonly armor: number;
  /** Silvered Blade: each hit also deals a separate Silver sub-hit (GDD §5.3.6, B3). */
  readonly silverSubHit: boolean;
  /** Fraction less Fire damage taken (Emberwright Plate). */
  readonly fireTakenReduction: number;
  readonly cost: ResourceBundle;
  readonly requires: { readonly building: BuildingId; readonly level: number };
}

const smithy = (level: number): GearDef['requires'] => ({ building: 'smithy', level });
const none = { silverSubHit: false, fireTakenReduction: 0 } as const;

export const gear: Readonly<Record<GearId, GearDef>> = {
  'iron-blade': {
    id: 'iron-blade',
    name: 'Iron Blade',
    slot: 'weapon',
    tier: 1,
    might: 4,
    armor: 0,
    ...none,
    cost: { iron: 60 },
    requires: smithy(1),
  },
  'steel-blade': {
    id: 'steel-blade',
    name: 'Steel Blade',
    slot: 'weapon',
    tier: 2,
    might: 9,
    armor: 0,
    ...none,
    cost: { iron: 250, wood: 50 },
    requires: smithy(3),
  },
  'silvered-blade': {
    id: 'silvered-blade',
    name: 'Silvered Blade',
    slot: 'weapon',
    tier: 3,
    might: 9,
    armor: 0,
    silverSubHit: true,
    fireTakenReduction: 0,
    cost: { iron: 250, silver: 120 },
    requires: smithy(5),
  },
  'hide-armor': {
    id: 'hide-armor',
    name: 'Hide Armor',
    slot: 'armor',
    tier: 1,
    might: 0,
    armor: 2,
    ...none,
    cost: { wood: 40, food: 30 },
    requires: smithy(1),
  },
  mail: {
    id: 'mail',
    name: 'Mail',
    slot: 'armor',
    tier: 2,
    might: 0,
    armor: 5,
    ...none,
    cost: { iron: 300 },
    requires: smithy(3),
  },
  'emberwright-plate': {
    id: 'emberwright-plate',
    name: 'Emberwright Plate',
    slot: 'armor',
    tier: 3,
    might: 0,
    armor: 8,
    silverSubHit: false,
    fireTakenReduction: 0.1,
    cost: { iron: 600, silver: 150 },
    requires: smithy(6),
  },
};
