import type { FamilyId } from '../../content/damage';
import type { GearId, GearSlot } from '../../content/gear';
import type { HunterId } from '../../content/hunters';
import type { BonusLineId, ItemRarity } from '../../content/items';

// Technical design §5.2 (v8, plan T8.5, D306–D317): items are the hold's weapons and armor. Every
// piece a hunter wears or Stores holds is an `ItemState`; its tier and numbers come from its base
// piece in content/gear.ts. A Common item has no lines and exactly the numbers gear always had.

/** One rolled bonus line: its size is fixed when rolled (a bane line also names its family). */
export interface ItemLine {
  readonly kind: BonusLineId;
  readonly size: number;
  readonly family?: FamilyId;
}

export interface ItemState {
  /** 'i1', 'i2', …: ids never repeat (`GameState.itemSeq`). */
  readonly id: string;
  readonly base: GearId;
  readonly rarity: ItemRarity;
  readonly lines: readonly ItemLine[];
  /** Iron and silver put into it (crafting, reworks, the base tier's crafting for loot), which Salvage returns a share of. */
  readonly paid: { readonly iron: number; readonly silver: number };
  /** Where it is: a hunter's weapon or armor slot, or null for Stores (D307). */
  readonly where: { readonly hunter: HunterId; readonly slot: GearSlot } | null;
}
