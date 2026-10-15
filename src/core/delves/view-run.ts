import { ages } from '../../content/ages';
import { rarityFrameId, sigilIconId } from '../../content/assets';
import { families } from '../../content/damage';
import { rarityNames, type RarityId } from '../../content/delves/blessing-types';
import { blessingById } from '../../content/delves/blessings';
import { echoes } from '../../content/delves/echoes';
import { patrons, OPEN_PATRON_IDS, type PatronId } from '../../content/delves/patrons';
import { delveRelics } from '../../content/delves/relics';
import { pechkoResultLines } from '../../content/delves/rift-text';
import { ingredients } from '../../content/ingredients';
import { balance } from '../../content/balance';
import type { Breakdown } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';
import { blessingsBreakdown } from './blessing-breakdown';
import { floorFamily } from './generate';

// GDD §9.15 (plan T7.13b): what the doors, blessing cards, Your blessings and the result sheet
// show. Built here so the screens only draw it.

export interface PatronCard {
  readonly patron: PatronId;
  readonly name: string;
  readonly theme: string;
  readonly sigilId: string;
}

const patronCard = (p: PatronId): PatronCard => ({
  patron: p,
  name: patrons[p].name,
  theme: patrons[p].theme,
  sigilId: sigilIconId(p),
});

export interface BlessingCard {
  readonly id: string;
  readonly name: string;
  readonly rarity: RarityId;
  readonly rarityName: string;
  readonly frameId: string;
  /** The effect in one line; for the Unlit, only what it gives. */
  readonly text: string;
  /** The Unlit's red "but…" line (D257), or null. */
  readonly but: string | null;
}

export const blessingCard = (id: string): BlessingCard | null => {
  const b = blessingById(id);
  if (!b) return null;
  return {
    id,
    name: b.name,
    rarity: b.rarity,
    rarityName: rarityNames[b.rarity],
    frameId: rarityFrameId(b.rarity),
    text: b.gain ?? b.text,
    but: b.drawback ?? null,
  };
};

const cardsOf = (ids: readonly string[]): BlessingCard[] =>
  ids.flatMap((id) => {
    const c = blessingCard(id);
    return c ? [c] : [];
  });

const floorTitle = (floor: number): string => `Floor ${floor} of ${balance.delve.floors.value}`;

export type StageView =
  | {
      readonly kind: 'doors';
      readonly title: string;
      readonly ahead: string;
      readonly doors: readonly PatronCard[];
    }
  | {
      readonly kind: 'offer';
      readonly title: string;
      readonly patron: PatronCard;
      readonly cards: readonly BlessingCard[];
      /** Re-roll: not bought, bought and unused, or used this run. */
      readonly reroll: 'none' | 'available' | 'used';
    }
  | {
      readonly kind: 'start';
      readonly title: string;
      /** Chosen start, step one: which patron. Step two: their three Faint blessings. */
      readonly choices: readonly PatronCard[];
      readonly patron: PatronCard | null;
      readonly cards: readonly BlessingCard[];
    };

/** The door, offer or Chosen-start screen the run is on; null at a fight or with no run. */
export const stageView = (state: GameState): StageView | null => {
  const run = state.delve.run;
  if (!run) return null;
  const s = run.stage;
  if (s.kind === 'doors')
    return {
      kind: 'doors',
      title: floorTitle(run.floor),
      ahead: `Ahead: ${families[floorFamily(run.seed, run.floor)].name}`,
      doors: s.doors.map(patronCard),
    };
  if (s.kind === 'offer')
    return {
      kind: 'offer',
      title: floorTitle(run.floor),
      patron: patronCard(s.patron),
      cards: cardsOf(s.cards),
      reroll: !state.delve.shop.reroll ? 'none' : run.rerollUsed ? 'used' : 'available',
    };
  if (s.kind === 'start')
    return {
      kind: 'start',
      title: 'Chosen start',
      choices: [...OPEN_PATRON_IDS, ...(state.delve.unlitOpen ? (['unlit'] as const) : [])].map(
        patronCard,
      ),
      patron: s.patron ? patronCard(s.patron) : null,
      cards: cardsOf(s.cards),
    };
  return null;
};

export interface YourBlessingsView {
  readonly items: readonly (BlessingCard & { readonly patronName: string })[];
  /** Every blessing's numbers, built by the function that builds the effects (GDD §9.1). */
  readonly breakdown: Breakdown;
}

/** Your blessings (§9.15): every blessing taken this run, with its breakdown. */
export const yourBlessingsView = (state: GameState): YourBlessingsView => {
  const taken = state.delve.run?.blessings ?? [];
  return {
    items: taken.flatMap((id) => {
      const c = blessingCard(id);
      const b = blessingById(id);
      return c && b ? [{ ...c, patronName: patrons[b.patron].name }] : [];
    }),
    breakdown: blessingsBreakdown(taken),
  };
};

export interface ResultView {
  readonly headline: string;
  readonly floors: number;
  readonly riftglass: number;
  readonly allowanceLeft: number;
  /** "The rift is quiet tonight" when nothing was paid and nothing is left (D258). */
  readonly quiet: boolean;
  readonly reagents: readonly { readonly name: string; readonly units: number }[];
  readonly echoes: readonly {
    readonly id: string;
    readonly patronName: string;
    readonly rarityName: string;
    readonly text: string;
  }[];
  readonly relics: readonly { readonly name: string; readonly line: string }[];
  /** Pechko's line, picked by the run's seed from the set for how it ended (lore §29). */
  readonly pechko: string;
  readonly rankName: string;
}

/** The result sheet (§9.15); null when there is nothing to read. */
export const resultView = (state: GameState): ResultView | null => {
  const r = state.delve.result;
  if (!r) return null;
  const quiet = r.riftglass === 0 && r.allowanceLeft < 1;
  const set = quiet
    ? pechkoResultLines.quietTonight
    : r.outcome === 'guardian'
      ? pechkoResultLines.guardianBeaten
      : pechkoResultLines.endedEarly;
  return {
    headline:
      r.outcome === 'guardian'
        ? 'The guardian is beaten'
        : r.outcome === 'left'
          ? 'You came back up'
          : 'The party was beaten',
    floors: r.floors,
    riftglass: r.riftglass,
    allowanceLeft: Math.floor(r.allowanceLeft),
    quiet,
    reagents: Object.entries(r.reagents).flatMap(([id, units]) =>
      units && units > 0 ? [{ name: ingredients[id as keyof typeof ingredients].name, units }] : [],
    ),
    echoes: r.echoes.flatMap((id) => {
      const e = echoes.find((x) => x.id === id);
      return e
        ? [
            {
              id,
              patronName: patrons[e.patron].name,
              rarityName: rarityNames[e.rarity],
              text: e.text,
            },
          ]
        : [];
    }),
    relics: r.relics.map((id) => ({ name: delveRelics[id].name, line: delveRelics[id].line })),
    pechko: set[r.line % set.length] ?? set[0],
    rankName: ages[state.cycle.age].name,
  };
};

/** The Last Stand's confirmation adds this while a Delve is paused (§9.15, D267). */
export const standDelveLine = (state: GameState): string | null =>
  state.delve.run ? 'Your Delve ends here; you keep what it earned.' : null;
