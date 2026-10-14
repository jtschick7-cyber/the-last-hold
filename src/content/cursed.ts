import type { ClueTag } from './clues';
import type { V05ClueTag } from './clues-v05';
import type { DamageType } from './damage';
import type { MonsterDef } from './monsters';

// GDD §8.3 (v0.5, D158): the four Cursed creatures of the ruins, originals of
// this setting (lore-secrets §12.1). Content only (plan T5.1): they join
// MONSTER_IDS, the contract candidates and the Last Stand's waves in T5.4, once
// the v4 → v5 migration (T5.3) lets the bestiary hold them. Their abilities'
// numbers live here, as every earlier ability's do (GDD §7.7).

export const CURSED_IDS = ['gloam-moths', 'ribbonshade', 'anvil-wight', 'rimewrought'] as const;
export type CursedId = (typeof CURSED_IDS)[number];

export const CURSED_FAMILY = { id: 'cursed', name: 'Cursed' } as const;

/** Every Cursed ability's numbers, exactly as GDD §8.3 words them. */
export type CursedAbility =
  /** Passive: while the swarm stands, every hunter's hit chance is this many points lower. */
  | { readonly kind: 'lightless'; readonly name: 'Lightless'; readonly hitChanceCut: number }
  /** Passive: a direct attacker takes this share of the damage dealt back as Fire, no Armor. */
  | { readonly kind: 'sealBurn'; readonly name: 'Seal-burn'; readonly reflectFraction: number }
  /** Every `every`th action, instead of attacking, heals this share of max Health. Saltburst cancels it. */
  | {
      readonly kind: 'reForge';
      readonly name: 'Re-forge';
      readonly every: number;
      readonly healFraction: number;
    }
  /** The first Fire hit in a fight strips this share of its Armor for the rest of the fight (stat%). */
  | { readonly kind: 'unthawed'; readonly name: 'Unthawed'; readonly armorStrip: number };

export interface CursedDef extends Omit<
  MonsterDef,
  'id' | 'family' | 'locations' | 'abilities' | 'clueTags'
> {
  readonly id: CursedId;
  readonly family: typeof CURSED_FAMILY.id;
  readonly locations: readonly ['ruin'];
  readonly abilities: readonly CursedAbility[];
  readonly clueTags: readonly [V05ClueTag | ClueTag, V05ClueTag | ClueTag, V05ClueTag | ClueTag];
}

const resist = (
  steel: number,
  silver: number,
  fire: number,
  frost: number,
  rune: number,
  venom: number,
): Readonly<Record<DamageType, number>> => ({ steel, silver, fire, frost, rune, venom });

export const cursed: Readonly<Record<CursedId, CursedDef>> = {
  'gloam-moths': {
    id: 'gloam-moths',
    name: 'Gloam-moths',
    family: 'cursed',
    locations: ['ruin'],
    tiers: [2, 3],
    health: 120,
    might: 6,
    armor: 0,
    speed: 15,
    attacks: 3,
    resist: resist(0.75, 1.0, 1.75, 1.0, 1.0, 1.25),
    abilities: [{ kind: 'lightless', name: 'Lightless', hitChanceCut: 0.1 }],
    clueTags: ['lightless', 'swarm', 'night'],
    drops: ['thornwood'],
  },
  ribbonshade: {
    id: 'ribbonshade',
    name: 'Ribbonshade',
    family: 'cursed',
    locations: ['ruin'],
    tiers: [2, 4],
    health: 140,
    might: 14,
    armor: 2,
    speed: 11,
    attacks: 1,
    resist: resist(1.0, 1.25, 0, 1.75, 0.75, 0),
    abilities: [{ kind: 'sealBurn', name: 'Seal-burn', reflectFraction: 0.1 }],
    clueTags: ['ribbon', 'singed', 'forge'],
    drops: ['grave-dust'],
  },
  'anvil-wight': {
    id: 'anvil-wight',
    name: 'Anvil-wight',
    family: 'cursed',
    locations: ['ruin'],
    tiers: [3, 5],
    health: 250,
    might: 21,
    armor: 11,
    speed: 6,
    attacks: 1,
    resist: resist(0.5, 1.0, 0.5, 1.0, 1.75, 0),
    abilities: [{ kind: 'reForge', name: 'Re-forge', every: 3, healFraction: 0.1 }],
    clueTags: ['hammering', 'forge', 'cold'],
    drops: ['grave-dust'],
  },
  rimewrought: {
    id: 'rimewrought',
    name: 'Rimewrought',
    family: 'cursed',
    locations: ['ruin'],
    tiers: [4, 5],
    health: 360,
    might: 24,
    armor: 14,
    speed: 5,
    attacks: 1,
    resist: resist(0.75, 0.75, 1.5, 0, 1.5, 0),
    abilities: [{ kind: 'unthawed', name: 'Unthawed', armorStrip: 0.3 }],
    clueTags: ['cold', 'iron-tread', 'forge'],
    drops: ['rime-salt'],
  },
};
