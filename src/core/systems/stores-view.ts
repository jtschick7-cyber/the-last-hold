import { gear } from '../../content/gear';
import { hunters } from '../../content/hunters';
import { ITEM_RARITY_IDS } from '../../content/items';
import { LEGENDARY_IDS, legendaries, type LegendaryId } from '../../content/legendaries';
import { num } from '../balance-access';
import type { GameState } from '../state/game-state';
import { owned, wornBy } from './legendaries';
import { salvageValue, storesCount } from './loot';
import { itemView, type ItemView } from './slot-picker';

// GDD §5.11.7, §9.16 (v0.8, D307, D326): the Stores list under Hunters: every unequipped item
// ("23 of 40"), sortable by slot and by rarity, each with exactly what Salvage returns. The Legendaries
// found so far are listed below it with who keeps them (they can't be salvaged).

export type StoresSort = 'slot' | 'rarity';

export interface StoresRow {
  readonly item: ItemView;
  /** What Salvage returns, as words ("25 iron and 60 silver"). */
  readonly salvage: string;
  readonly iron: number;
  readonly silver: number;
}

export interface LegendaryRow {
  readonly id: LegendaryId;
  readonly name: string;
  readonly text: string;
  readonly keptBy: string | null;
}

export interface StoresView {
  readonly count: number;
  readonly cap: number;
  readonly rows: readonly StoresRow[];
  readonly legendaries: readonly LegendaryRow[];
}

const words = (iron: number, silver: number): string => {
  const parts = [iron > 0 ? `${iron} iron` : '', silver > 0 ? `${silver} silver` : ''].filter(
    (p) => p !== '',
  );
  return parts.length === 0 ? 'nothing' : parts.join(' and ');
};

export const storesView = (state: GameState, sort: StoresSort): StoresView => {
  const items = state.items.filter((i) => i.where === null);
  const slotOrder = (i: (typeof items)[number]): number => (gear[i.base].slot === 'weapon' ? 0 : 1);
  const rarity = (i: (typeof items)[number]): number => ITEM_RARITY_IDS.indexOf(i.rarity);
  // Slot sort: weapons then armor, each best first; rarity sort: rarest first, then slot.
  const sorted = [...items].sort((a, b) =>
    sort === 'slot'
      ? slotOrder(a) - slotOrder(b) ||
        gear[b.base].tier - gear[a.base].tier ||
        rarity(b) - rarity(a)
      : rarity(b) - rarity(a) ||
        slotOrder(a) - slotOrder(b) ||
        gear[b.base].tier - gear[a.base].tier,
  );
  return {
    count: storesCount(state),
    cap: num('stores.cap'),
    rows: sorted.map((i) => {
      const v = salvageValue(i);
      return { item: itemView(i), salvage: words(v.iron, v.silver), ...v };
    }),
    legendaries: LEGENDARY_IDS.filter((l) => owned(state, l)).map((l) => {
      const holder = wornBy(state, l);
      return {
        id: l,
        name: legendaries[l].name,
        text: legendaries[l].text,
        keptBy: holder ? hunters[holder].shortName : null,
      };
    }),
  };
};
