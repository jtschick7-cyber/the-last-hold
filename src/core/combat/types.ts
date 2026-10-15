import type { ConsumableEffect, ConsumableId } from '../../content/consumables';
import type { DamageType, FamilyId, LocationId } from '../../content/damage';
import type { GearId } from '../../content/gear';
import type { HunterId, RoleId, Stats } from '../../content/hunters';
import type { MonsterAbility, MonsterId } from '../../content/monsters';
import type { GuardianId } from '../../content/delves/guardians';
import type { DelveRelicId } from '../../content/delves/relics';
import type { TraitEffect, TraitId } from '../../content/traits';
import type { RollSource } from '../rng';
import type { Preparation } from '../state/game-state';
import type { ItemLine } from '../state/item-state';

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
  /** Stars, which add to the Health and Might growth per level (v0.8, D310); absent at 0. */
  readonly stars?: number;
  /** The bonus lines of the worn items (v0.8, D305); absent when there are none. */
  readonly lines?: readonly ItemLine[];
}

export interface MonsterInstance {
  readonly monster: MonsterId;
  readonly tier: number;
  /**
   * The species' knowledge level when the party set out, 0–4 (GDD §5.6.2): Studied and
   * Mastered add to the damage the hunters deal. Frozen at launch; absent means 0.
   */
  readonly knowledge?: number;
  /** A Delve group member (GDD §5.10.4, D250): Health × this, 1 if absent. */
  readonly healthMult?: number;
  /** A Delve group member: Might × this, 1 if absent. */
  readonly mightMult?: number;
}

/**
 * A Last Stand wave (GDD §5.9.3, D107). A contract fight passes none of this, and
 * the fight is exactly the contract rules (`rulesVersion` 1).
 */
export interface StandWaveOptions {
  /** Each hunter's Health at the start of the wave (carried over); absent means full. */
  readonly health: Readonly<Partial<Record<HunterId, number>>>;
  /** The monster's Health and Might × this (Threat, GDD §5.9.1). */
  readonly monsterStrength: number;
  /** Extra taken% for every hunter (Walls, the Iron Shutter), inside `combat.takenCap`. */
  readonly partyTaken: number;
  /** Watchtower: Steel damage at tick 1 that ignores Armor, like a bomb; 0 for none. */
  readonly volley: number;
}

/**
 * A Deep guardian (GDD §5.10.4, D252): fights alone at the end of a Delve run. Its tier scales it
 * like any monster's (past tier 5 too); `healthMult` is `delve.guardianHealth` and the Salt Ring.
 */
export interface GuardianInstance {
  readonly guardian: GuardianId;
  readonly tier: number;
  readonly knowledge?: number;
  readonly healthMult?: number;
  readonly mightMult?: number;
}

/** What a fight is against: a contract species or a Deep guardian. */
export type FightMonster = MonsterInstance | GuardianInstance;

/** A Delve floor's fight (GDD §5.10, D254, D255): what the run brings into it. */
export interface DelveFightOptions {
  /** Blessing ids taken so far this run. */
  readonly blessings: readonly string[];
  /** Delve relics owned: their effects work only here (D261). */
  readonly relics: readonly DelveRelicId[];
  /** Each hunter's Health carried in, as a share of max Health; 0 is down for the run (D253). Absent means full. */
  readonly health: Readonly<Partial<Record<HunterId, number>>>;
  /** Monsters killed earlier in the run (the Pack Grows). */
  readonly kills: number;
  /** The Long Vigil has been used this run. */
  readonly vigilUsed: boolean;
}

export interface FightInput {
  readonly party: readonly HunterSnapshot[];
  readonly monster: FightMonster;
  /**
   * The rest of a Delve group (GDD §5.10.4, D251), after `monster`, in group order. The fight
   * is won when every monster is down. Absent or empty: the one-monster fight of §5.5.
   */
  readonly companions?: readonly MonsterInstance[];
  /** A Delve floor: blessings, relics and carried Health (GDD §5.10). Absent: a contract fight or a stand. */
  readonly delve?: DelveFightOptions;
  /** How many of the 16 contract species are not yet Studied: the Forgotten's Nameless (GDD §8.3). */
  readonly nameless?: number;
  /** Null in the Last Stand: the hold isn't a contract location, so location traits don't apply. */
  readonly location: LocationId | null;
  readonly rolls: RollSource;
  /** Default true. Odds previews pass false: same fight, no log. */
  readonly log?: boolean;
  /** What the party carries (GDD §5.7); absent means nothing. */
  readonly prep?: Preparation;
  readonly stand?: StandWaveOptions;
  /** The warden's Alchemy level, frozen at launch (GDD §5.8.6, D206): brews are 3% stronger per level. Absent means 0. */
  readonly alchemy?: number;
}

/** A potion a hunter carries (GDD §5.7). `used` is true once it has fired or been ruined. */
export interface HunterPotion {
  readonly id: ConsumableId;
  readonly name: string;
  readonly effect: Extract<
    ConsumableEffect,
    {
      kind:
        'heal' | 'armorUntilAction' | 'speedWholeFight' | 'fireTaken' | 'hitChance' | 'steadfast';
    }
  >;
  /** 0.25 more power with Herbwise (potionPower). */
  readonly power: number;
  used: boolean;
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
  /** A monster's family (null for hunters), so a hunter's family bonuses read the monster hit. */
  readonly family: FamilyId | 'deep' | null;
  /** Attacks per action: a monster's `Atk`, 1 for a hunter. */
  readonly attacks: number;
  /** Party slot order; the monsters take 0, 1, 2… in group order (D251). */
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
  /** speedEff, kept current: it only changes when a status (Hamstring) starts or ends. */
  speed: number;
  readonly traits: readonly TraitEffect[];
  readonly fireTakenReduction: number;
  readonly silverSubHit: boolean;
  readonly runeSubHit: boolean;
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
  /** Oil on the weapon: +oil.familyBonus damage vs this family, for the whole fight. */
  readonly oilFamily: FamilyId | null;
  potion: HunterPotion | null;
  /** Hardwood Tonic: the holder's own actions it still covers. */
  tonicLeft: number;
  /** Spoil has already had its first hit on this hunter. */
  spoiled: boolean;
  /** Fire Pot: Fire damage on each of the monster's next actions. */
  burnLeft: number;
  burnAmount: number;
  /** Frost Pot: −Speed% for the monster's next actions. */
  chillLeft: number;
  /** Chill (Deep guardian): healing received is cut by `healCut` for this many of the holder's own actions. */
  healCutLeft: number;
  healCut: number;
  /** Saltburst: the monster's next actions in which abilities do nothing. */
  abilitiesBlocked: number;
  /** Owl-Eye Drops (v0.6): added to the hunter's hit chance for the whole fight. */
  hitBonus: number;
  /** Coldwater Draught (v0.6): taken% against Fire for the whole fight. */
  fireTakenPotion: number;
  /** Steadfast Draught (v0.6): ability-caused lost actions still to be kept. */
  steadfastLeft: number;
  /** Last Stand taken% (Walls, Iron Shutter); 0 in every contract fight. */
  extraTaken: number;
  // ---- Delve blessings and relics (v0.7, GDD §8.8); all neutral outside a Delve ----
  /** outgoing%: added to the hunter's damage bonuses. */
  dealtBonus: number;
  /** outgoing% against one contract family, from bane lines on worn items (v0.8); empty elsewhere. */
  baneVs: Readonly<Partial<Record<FamilyId, number>>>;
  /** taken% against one damage type only (Cooled Iron). */
  takenByType: Readonly<Partial<Record<DamageType, number>>>;
  /** A monster's knowledge level (0–4): the hunters' Studied and Mastered bonus against it (GDD §5.0). */
  knowledgeLevel: number;
  /** Warp and Weft: taken% for this hunter while another Vanguard stands. */
  vanguardShield: number;
  /** The Mender's heals are this much stronger (Shared Bread, Goose-Grease). */
  healBonus: number;
  /** The Mender heals anyone below this share of max Health. */
  healThreshold: number;
  /** Blood in the Snow: +Might (stat%) while below this share of Health. */
  lowHealth: { readonly below: number; readonly amount: number } | null;
  /** The Smith's Mark: a Rune sub-hit of this share on every direct hit (0 = none). */
  runeMark: number;
  /** Forge-Welded: Armor also reduces ability damage and burns, to a minimum of 1. */
  forgeWelded: boolean;
  /** What Was Burned: nothing restores this hunter's Health. */
  noHealing: boolean;
  /** No Name: false stops the Mender healing. */
  menderHeals: boolean;
  /** Smoke-Lunged (alternate trait): damage taken from monster abilities is halved. */
  abilityHalved: boolean;
  /** Drawn Thin: Health lost, as a share of max, after each of this hunter's own actions. */
  actionDrain: number;
  /** Rimewrought's Unthawed has stripped its Armor (GDD §8.3, v0.5). */
  unthawed: boolean;
}

export interface LogEntry {
  readonly tick: number;
  readonly actor: string;
  readonly kind: string;
  /** The line, as shown. */
  readonly text: string;
  /** Every roll this entry used, in the order drawn (shown on "show rolls"). */
  readonly rolls: readonly number[];
  /** One plain-language label per roll, same order and length as `rolls`; built by the code that draws the roll, so it cannot disagree with the fight. */
  readonly rollNotes?: readonly string[];
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
  /** The monsters' Health added together (one monster's, in a one-monster fight). */
  readonly monsterHealth: number;
  readonly monsterMaxHealth: number;
  /** Each monster of the group, in group order (D251). */
  readonly monsters: readonly {
    readonly id: string;
    readonly name: string;
    readonly health: number;
    readonly maxHealth: number;
  }[];
  /** A Saltburst went off and cancelled an ability (part of "well prepared", GDD §5.7). */
  readonly saltburstCancelled: boolean;
  /** A Delve floor: what the run carries on (kills, the Long Vigil). */
  readonly delve?: { readonly kills: number; readonly vigilUsed: boolean };
  /** Hunters whose potion fired or was ruined in this fight (the stand's once-per-stand rule). */
  readonly potionsUsed: readonly string[];
}
