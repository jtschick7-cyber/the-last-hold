import { hunterPortraitId } from '../../content/assets';
import { alternateTraits } from '../../content/delves/alternate-traits';
import { delveRelics, type DelveRelicId } from '../../content/delves/relics';
import { echoes } from '../../content/delves/echoes';
import { rarityNames } from '../../content/delves/blessing-types';
import { patrons } from '../../content/delves/patrons';
import { COSMETIC_IDS, LATE_HOURS_LEVELS, shopItems } from '../../content/delves/shop';
import { hunters, type HunterId } from '../../content/hunters';
import { traits, type TraitId } from '../../content/traits';
import type { Explained } from '../breakdown/breakdown';
import type { Command } from '../commands/types';
import type { GameState } from '../state/game-state';
import { effectiveTraits } from '../systems/hunters';
import { allowanceExplained } from './riftglass';
import {
  chosenStartProblem,
  cosmeticCost,
  cosmeticProblem,
  lateHoursCost,
  lateHoursProblem,
  rerollProblem,
  switchProblem,
  traitCost,
  traitProblem,
} from './shop';
import { balance } from '../../content/balance';

// GDD §5.10.8, §9.15 (plan T7.13b): the Riftglass shop on the Rank screen, the alternate-trait
// switch on the hunter sheet, and the Echoes shelf. Whatever the screen says a purchase cannot
// do is the very sentence the command would refuse with (shop.ts `…Problem`).

export interface ShopRow {
  readonly id: string;
  readonly name: string;
  readonly text: string;
  /** What it costs now; null when there is nothing more to buy. */
  readonly cost: number | null;
  /** "level 2 of 5", "bought", or ''. */
  readonly status: string;
  readonly owned: boolean;
  /** Why it cannot be bought now, or null. */
  readonly problem: string | null;
  readonly command: Command | null;
}

export interface TraitRow {
  readonly hunter: HunterId;
  readonly hunterName: string;
  readonly portraitId: string;
  readonly altName: string;
  readonly altText: string;
  readonly bought: boolean;
  readonly cost: number;
  readonly problem: string | null;
}

export interface ShopView {
  readonly held: number;
  readonly allowance: Explained;
  readonly late: ShopRow;
  readonly delveOnly: readonly ShopRow[];
  readonly cosmetics: readonly ShopRow[];
  readonly traits: readonly TraitRow[];
  readonly relics: readonly {
    readonly id: DelveRelicId;
    readonly name: string;
    readonly line: string;
    readonly text: string;
  }[];
}

const item = (id: string) => {
  const found = shopItems.find((i) => i.id === id);
  if (!found) throw new Error(`No shop item ${id}.`);
  return found;
};

export const shopView = (state: GameState): ShopView => {
  const s = state.delve.shop;
  const late = item('late-hours');
  const lateCost = lateHoursCost(state);
  const delveRow = (id: 'chosen-start' | 'reroll'): ShopRow => {
    const it = item(id);
    const owned = id === 'chosen-start' ? s.chosenStart : s.reroll;
    const cost =
      id === 'chosen-start'
        ? balance.riftglass.shop.chosenStart.value
        : balance.riftglass.shop.reroll.value;
    return {
      id,
      name: it.name,
      text: it.text,
      cost: owned ? null : cost,
      status: owned ? 'bought' : '',
      owned,
      problem: owned
        ? null
        : id === 'chosen-start'
          ? chosenStartProblem(state)
          : rerollProblem(state),
      command: { type: 'riftglass.buy', item: id },
    };
  };
  return {
    held: state.delve.riftglass,
    allowance: allowanceExplained(state),
    late: {
      id: 'late-hours',
      name: late.name,
      text: late.text,
      cost: lateCost?.value ?? null,
      status: `level ${s.lateHours} of ${LATE_HOURS_LEVELS}`,
      owned: lateCost === null,
      problem: lateHoursProblem(state),
      command: { type: 'riftglass.buy', item: 'late-hours' },
    },
    delveOnly: [delveRow('chosen-start'), delveRow('reroll')],
    cosmetics: COSMETIC_IDS.map((id) => {
      const it = item(id);
      const owned = s.cosmetics.includes(id);
      return {
        id,
        name: it.name,
        text: it.text,
        cost: owned ? null : cosmeticCost(),
        status: owned ? 'bought' : '',
        owned,
        problem: cosmeticProblem(state, id),
        command: { type: 'riftglass.buyCosmetic', cosmetic: id },
      };
    }),
    traits: alternateTraits.flatMap((a) => {
      const id = a.hunter as HunterId;
      return state.hunters[id]
        ? [
            {
              hunter: id,
              hunterName: hunters[id].shortName,
              portraitId: hunterPortraitId(id),
              altName: a.name,
              altText: a.text,
              bought: s.traitsBought.includes(id),
              cost: traitCost(),
              problem: traitProblem(state, id),
            },
          ]
        : [];
    }),
    relics: state.delve.relics.map((r) => ({
      id: r.id,
      name: delveRelics[r.id].name,
      line: delveRelics[r.id].line,
      text: delveRelics[r.id].text,
    })),
  };
};

export interface TraitSwitchView {
  readonly hunter: HunterId;
  /** Both second traits are shown once the other is bought. */
  readonly bought: boolean;
  readonly active: boolean;
  readonly current: readonly { readonly name: string; readonly summary: string }[];
  readonly other: { readonly name: string; readonly summary: string } | null;
  /** Why they cannot be switched now, or null. */
  readonly problem: string | null;
}

const traitLine = (id: TraitId) => ({ name: traits[id].name, summary: traits[id].summary });

/** The hunter sheet's trait list and switch (§9.15); null for a hunter with no other trait. */
export const traitSwitchView = (state: GameState, id: HunterId): TraitSwitchView | null => {
  const alt = alternateTraits.find((a) => a.hunter === id);
  if (!alt) return null;
  const bought = state.delve.shop.traitsBought.includes(id);
  const active = state.delve.shop.traitsActive.includes(id);
  const own = hunters[id].traits;
  return {
    hunter: id,
    bought,
    active,
    current: effectiveTraits(state, id).map(traitLine),
    other: bought ? traitLine(active ? own[1] : (alt.id as TraitId)) : null,
    problem: bought ? switchProblem(state, id, !active) : null,
  };
};

export interface EchoView {
  readonly id: string;
  readonly patronName: string;
  readonly rarityName: string;
  readonly text: string;
  readonly cycle: number;
}

/** The Library's Echoes shelf (§9.15, D263): the echoes found, oldest first. */
export const echoesShelf = (state: GameState): EchoView[] =>
  state.delve.echoes.flatMap((found) => {
    const e = echoes.find((x) => x.id === found.id);
    return e
      ? [
          {
            id: e.id,
            patronName: patrons[e.patron].name,
            rarityName: rarityNames[e.rarity],
            text: e.text,
            cycle: found.cycle,
          },
        ]
      : [];
  });
