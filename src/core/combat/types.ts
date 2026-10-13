import type { DamageType, LocationId } from '../../content/damage';
import type { GearId } from '../../content/gear';
import type { HunterId, RoleId, Stats } from '../../content/hunters';
import type { MonsterAbility, MonsterId } from '../../content/monsters';
import type { TraitEffect, TraitId } from '../../content/traits';
import type { RollSource } from '../rng';

// GDD §5.5: the combat inputs, the live combatants, and the fight log.

/** A hunter frozen at launch: later level-ups never change a replayed fight (technical design §5.3). */
export interface HunterSnapshot {
  readonly id: HunterId;
  readonly name: string;
  readonly role: RoleId;
  readonly damage: DamageType;
  readonly level: number;
  /** Level-1 base stats from the hunter's content entry. */
  readonly base: Stats;
  readonly traits: readonly TraitId[];
  readonly weapon: GearId | null;
  readonly armorGear: GearId | null;
}

export interface MonsterInstance {
  readonly monster: MonsterId;
  readonly tier: number;
}

export interface FightInput {
  readonly party: readonly HunterSnapshot[];
  readonly monster: MonsterInstance;
  readonly location: LocationId;
  readonly rolls: RollSource;
}

export type Side = 'hunter' | 'monster';
type StatName = 'might' | 'armor' | 'speed';
type StatTable = Record<StatName, number>;

/** One side of the fight. Buckets follow GDD §5.0: flat, stat%, status%. */
export interface Combatant {
  readonly side: Side;
  readonly id: string;
  readonly name: string;
  readonly role: RoleId | null;
  /** Party slot order; the monster is 0. */
  readonly slot: number;
  health: number;
  readonly maxHealth: number;
  meter: number;
  /** Base after level or tier scaling, before gear and percentages. */
  readonly base: StatTable;
  readonly flat: StatTable;
  readonly statPct: StatTable;
  /** Temporary status% (Hamstring, Malice); durations count the holder's own actions. */
  readonly statusPct: StatTable;
  readonly damage: DamageType;
  readonly resist: Readonly<Record<DamageType, number>> | null;
  readonly varianceLo: number;
  readonly varianceHi: number;
  readonly critChance: number;
  readonly critMult: number;
  readonly traits: readonly TraitEffect[];
  readonly fireTakenReduction: number;
  readonly silverSubHit: boolean;
  readonly abilities: readonly MonsterAbility[];
  /** Actions taken so far, including lost ones. */
  actions: number;
  /** Actions still to lose (held, charmed, enthralled). */
  lostActions: number;
  hamstringLeft: number;
  /** Drag Under: the next hit taken counts this many times. */
  nextHitTakenMult: number;
  /** Riverhorse: monster actions left before this hunter returns; 0 = present. */
  awayLeft: number;
  secondSoulUsed: boolean;
  /** Frost Pot suppression of Noon Heat, in the monster's actions (v0.3 source). */
  noonHeatSuppressed: number;
}

export interface LogEntry {
  readonly tick: number;
  readonly actor: string;
  readonly kind: string;
  /** The line, as shown. */
  readonly text: string;
  /** Every roll this entry used, in the order drawn (shown on "show rolls"). */
  readonly rolls: readonly number[];
  readonly target?: string;
  /** Damage after resist and crit, before Armor (the golden table's "dealt before Armor"). */
  readonly dealt?: number;
  /** Final damage or healing. */
  readonly amount?: number;
  readonly targetHealth?: number;
}

export interface FightResult {
  readonly result: 'win' | 'loss';
  readonly endedBy: 'monster-down' | 'party-down' | 'retreat';
  readonly ticks: number;
  readonly log: readonly LogEntry[];
  readonly hunters: readonly {
    readonly id: string;
    readonly health: number;
    readonly maxHealth: number;
    readonly downed: boolean;
  }[];
  readonly monsterHealth: number;
  readonly monsterMaxHealth: number;
}
