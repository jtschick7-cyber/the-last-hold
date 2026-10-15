import { FAMILY_IDS } from '../../content/damage';
import { gear, type GearDef, type GearId } from '../../content/gear';
import {
  BONUS_LINE_IDS,
  itemRarities,
  LOOT_RARITY_IDS,
  lootBases,
  type BonusLineId,
  type LootRarity,
} from '../../content/items';
import { constantAt, num } from '../balance-access';
import { roundHalfUp } from '../combat/build';
import type { RollSource } from '../rng';
import type { GameState } from '../state/game-state';
import type { ItemLine, ItemState } from '../state/item-state';
import { makeItem } from './items';

// GDD §5.11.2 and §5.11.7 (v0.8, D305, D307, D328): contract loot, Stores and Salvage. Every roll
// comes from one seeded stream per contract (`${gameSeed}:loot:${contractId}`, technical design
// §7.2), so loot is fixed at launch like the fight. Rolls are drawn in a fixed order: whether
// anything drops, weapon or armor, the rarity, then the lines.

/** The chance a contract won drops an item: `loot.chanceBase` + `loot.chancePerTier` × tier. */
export const lootChance = (tier: number): number =>
  num('loot.chanceBase') + num('loot.chancePerTier') * tier;

export type RarityWeights = Readonly<Record<LootRarity, number>>;

/** One draw from weights (fine, rare, heroic). */
export const pickRarity = (rng: RollSource, weights: RarityWeights): LootRarity => {
  const total = LOOT_RARITY_IDS.reduce((a, r) => a + weights[r], 0);
  let roll = rng.next() * total;
  for (const r of LOOT_RARITY_IDS) {
    if (roll < weights[r]) return r;
    roll -= weights[r];
  }
  return 'fine';
};

/** The lines of an item of this rarity: distinct kinds, sizes from `loot.lines`, a bane line rolling its family (D328 (2)). */
export const rollLines = (rng: RollSource, rarity: LootRarity): ItemLine[] => {
  const sizes = constantAt('loot.lines').value as Readonly<Record<BonusLineId, number>>;
  const pool: BonusLineId[] = [...BONUS_LINE_IDS];
  const lines: ItemLine[] = [];
  for (let i = 0; i < itemRarities[rarity].lines; i++) {
    const kind = pool.splice(Math.floor(rng.next() * pool.length), 1)[0] ?? 'might';
    if (kind === 'bane') {
      const family = FAMILY_IDS[Math.floor(rng.next() * FAMILY_IDS.length)] ?? FAMILY_IDS[0];
      lines.push({ kind, size: sizes[kind], family });
    } else lines.push({ kind, size: sizes[kind] });
  }
  return lines;
};

export interface LootDrop {
  readonly base: GearDef;
  readonly rarity: LootRarity;
  readonly lines: readonly ItemLine[];
}

/** What a won contract of this tier drops, or null (GDD §5.11.2). */
export const rollContractLoot = (rng: RollSource, tier: number): LootDrop | null => {
  if (rng.next() >= lootChance(tier)) return null;
  const bases = lootBases.find((b) => b.tier === tier) ?? lootBases[lootBases.length - 1];
  if (!bases) return null;
  const halves = [bases.weapon, bases.armor]; // weapon or armor, half each (D328 (1))
  const base = gear[halves[Math.floor(rng.next() * halves.length)] ?? bases.weapon];
  const weights = constantAt('loot.rarityWeights').value as RarityWeights;
  const rarity = pickRarity(rng, weights);
  return { base, rarity, lines: rollLines(rng, rarity) };
};

/** Iron and silver in the crafting steps up to a piece, which a looted piece counts as having cost (D307). */
export const stepsPaid = (id: GearId): ItemState['paid'] => {
  const g = gear[id];
  let iron = 0;
  let silver = 0;
  for (const other of Object.values(gear))
    if (other.slot === g.slot && other.tier <= g.tier) {
      iron += other.cost.iron ?? 0;
      silver += other.cost.silver ?? 0;
    }
  return { iron, silver };
};

/** Items in Stores: the ones nobody wears. */
export const storesCount = (state: GameState): number =>
  state.items.filter((i) => i.where === null).length;

export const storesFull = (state: GameState): boolean => storesCount(state) >= num('stores.cap');

/** What Salvage returns: a share of the iron and silver put in, plus silver per bonus line (D307). */
export const salvageValue = (item: ItemState): { iron: number; silver: number } => ({
  iron: roundHalfUp(item.paid.iron * num('salvage.share')),
  silver:
    roundHalfUp(item.paid.silver * num('salvage.share')) +
    item.lines.length * num('salvage.perLine'),
});

export type LootOutcome =
  | { readonly kind: 'kept'; readonly item: ItemState }
  | {
      readonly kind: 'salvaged';
      readonly rarity: LootRarity;
      readonly base: GearId;
      readonly iron: number;
      readonly silver: number;
    };

/**
 * Takes a drop into Stores; when Stores is full it is salvaged on the spot and the hold gets what
 * Salvage would have paid (D307).
 */
export const takeLoot = (state: GameState, drop: LootDrop): LootOutcome => {
  const paid = stepsPaid(drop.base.id);
  if (storesFull(state)) {
    const value = salvageValue({
      id: '',
      base: drop.base.id,
      rarity: drop.rarity,
      lines: drop.lines,
      paid,
      where: null,
    });
    state.resources.iron += value.iron;
    state.resources.silver += value.silver;
    return { kind: 'salvaged', rarity: drop.rarity, base: drop.base.id, ...value };
  }
  return { kind: 'kept', item: makeItem(state, drop.base, drop.rarity, drop.lines, paid) };
};

/** The result key a drop leaves (found lines): `loot:fine:steel-blade`, or `salvaged:…:iron:silver`. */
export const lootKey = (outcome: LootOutcome): string =>
  outcome.kind === 'kept'
    ? `loot:${outcome.item.rarity}:${outcome.item.base}`
    : `salvaged:${outcome.rarity}:${outcome.base}:${outcome.iron}:${outcome.silver}`;
