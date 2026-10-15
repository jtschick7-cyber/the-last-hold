import type { FamilyId } from '../../content/damage';
import type { BlessingRuleId, RarityId } from '../../content/delves/blessing-types';
import type { GuardianId } from '../../content/delves/guardians';
import type { PatronId } from '../../content/delves/patrons';
import type { DelveRelicId } from '../../content/delves/relics';
import type { CosmeticId } from '../../content/delves/shop';
import type { HunterId } from '../../content/hunters';
import type { IngredientId } from '../../content/ingredients';
import type { SpeciesKnowledge } from './game-state';

// Technical design §5.2 (v7, plan T7.5, D267): the Delves' part of the save (GDD §5.10).
// Riftglass, relics, echoes, the shop and the Deep bestiary are kept forever (the Long Night
// resets none of it). A run is saved at every floor and pauses when the app closes (D248).

/** What a run has earned so far, or earned in the end (GDD §5.10.7). */
export interface DelveEarned {
  /** Floors cleared (the guardian counts as a seventh once beaten). */
  floors: number;
  riftglass: number;
  reagents: Partial<Record<IngredientId, number>>;
  /** Ember-echo ids found this run. */
  echoes: string[];
  relics: DelveRelicId[];
  /** Monsters killed this run. */
  kills: number;
  guardianBeaten: boolean;
}

/** What is on screen between fights, so a paused run resumes exactly there (D248). */
export type DelveStage =
  | { kind: 'doors'; doors: [PatronId, PatronId] }
  | { kind: 'offer'; patron: PatronId; cards: string[] }
  /** The next fight (floor `run.floor`, or the guardian when it is 7) is about to be worked out. */
  | { kind: 'fight' };

export interface DelveRun {
  /** `${gameSeed}:delve:${runs}`; every fight is sub-seeded from it (GDD §5.10.2). */
  seed: string;
  /** The floors' base tier, fixed when the run starts from the Rank (D249). */
  baseTier: number;
  /** 1 to 6, or 7 for the guardian. */
  floor: number;
  /** The three hunters who went down (`delve.partySize`). */
  party: HunterId[];
  /** Current Health of each hunter in the party; 0 = down for the rest of the run (D253). */
  health: Partial<Record<HunterId, number>>;
  /** Blessing ids taken this run, in order (D255). */
  blessings: string[];
  stage: DelveStage;
  /** The doors the last floor showed, so the next pair is never the same (D256). */
  lastDoors: [PatronId, PatronId] | null;
  unlitDoorsUsed: number;
  /** The Re-roll upgrade has been used this run (D259). */
  rerollUsed: boolean;
  /** Bookkeeping for the ★ rules (kills for the Pack Grows, once-per-run flags, …). */
  rules: Partial<Record<BlessingRuleId, number>>;
  earned: DelveEarned;
}

/** A finished run waiting for its result sheet (GDD §9.15). */
export interface DelveResult extends DelveEarned {
  outcome: 'guardian' | 'defeated' | 'left';
  at: number;
  /** The allowance left after paying out (the sheet shows "The rift is quiet tonight" at 0). */
  allowanceLeft: number;
  /** Index of Pechko's line, picked by the run's seed. */
  line: number;
}

export interface DelveShop {
  /** Levels of Late hours bought, 0 to 5 (D259). */
  lateHours: number;
  /** Hunters whose alternate second trait is bought (D260). */
  traitsBought: HunterId[];
  /** Of those, the hunters currently using the alternate. */
  traitsActive: HunterId[];
  cosmetics: CosmeticId[];
  chosenStart: boolean;
  reroll: boolean;
}

export interface DelveState {
  run: DelveRun | null;
  result: DelveResult | null;
  /** Runs started, ever; the next run's seed uses it. */
  runs: number;
  /** Riftglass on hand. Kept forever; earned Riftglass has no cap (D258). */
  riftglass: number;
  /** The banked allowance (D258): grows with time in `advance()`, drawn down by earning. */
  allowance: number;
  /** When the allowance last grew; null until Delves open at the first Keep. */
  allowanceAt: number | null;
  /** The way-down scene has been shown (D266). */
  sceneSeen: boolean;
  /** The Unlit's door: after Act V's Last Stand, or the debug switch (D257). */
  unlitOpen: boolean;
  shop: DelveShop;
  /** What the hunters know of the Deep guardians (GDD §5.6.2); Delve-only, not in the bestiary count. */
  deep: Partial<Record<GuardianId, SpeciesKnowledge>>;
  relics: { id: DelveRelicId; cycle: number }[];
  /** Ember-echoes found (lore §29, D263). */
  echoes: { id: string; cycle: number; at: number }[];
  /** Rarities ever taken from each patron, which finds the echoes (D263). */
  taken: Partial<Record<PatronId, RarityId[]>>;
  /** Kills in Delves per family, and guardians beaten, recorded for v0.8 (D278). No reward in v0.7. */
  kills: Partial<Record<FamilyId | 'deep', number>>;
  guardiansBeaten: Partial<Record<GuardianId, number>>;
}

export const startingDelve = (): DelveState => ({
  run: null,
  result: null,
  runs: 0,
  riftglass: 0,
  allowance: 0,
  allowanceAt: null,
  sceneSeen: false,
  unlitOpen: false,
  shop: {
    lateHours: 0,
    traitsBought: [],
    traitsActive: [],
    cosmetics: [],
    chosenStart: false,
    reroll: false,
  },
  deep: {},
  relics: [],
  echoes: [],
  taken: {},
  kills: {},
  guardiansBeaten: {},
});
