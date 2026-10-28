import type { ConsumableId } from '../../content/consumables';
import type { DelveRelicId } from '../../content/delves/relics';
import type { HunterId } from '../../content/hunters';
import type { HunterSnapshot } from '../combat';

// Technical design §22.1 (v14, D562): everything the Descent keeps. No raw log lines are stored:
// `rebuildDescentLogs` re-runs the three stages from a DescentRecord alone, so a record freezes
// everything the engine reads. Nothing outside the Descent reads this block (CLAUDE.md, D561).

/**
 * The monsters of the three stages (GDD §5.15.10, §8.3), by the ids the repo uses: Unlit's Breath,
 * the Forgotten and the Dross-Tide (Delve guardians), the Anvil-wight and Rimewrought (contract
 * smiths), and The Unlit. Their knowledge levels are frozen on the record (M3).
 */
export const DESCENT_MONSTER_IDS = [
  'unlits-breath',
  'the-forgotten',
  'dross-tide',
  'anvil-wight',
  'rimewrought',
  'unlit',
] as const;
export type DescentMonsterId = (typeof DESCENT_MONSTER_IDS)[number];

/** Most hunters in a marching order: up to 6 in the front line and up to 8 waiting (D558). */
export const DESCENT_ORDER_MAX = 14;

/** The oil and potion each hunter in the order was given at launch (bombs are thrown from stores). */
export interface PrepSnapshot {
  oils: Partial<Record<HunterId, ConsumableId>>;
  potions: Partial<Record<HunterId, ConsumableId>>;
}

export interface DescentStageSummary {
  stage: 1 | 2 | 3;
  won: boolean;
  ticks: number;
  /** Hunters downed during this stage. */
  downedIds: HunterId[];
  /** Reserve hunters who stepped in during or before this stage. */
  steppedInIds: HunterId[];
}

export interface DescentRecord {
  /** 1-based attempt number (part of the stage seeds). */
  attempt: number;
  /** The cycle number when fought; the Roll of Wardens reads it from `firstWin`. */
  cycle: number;
  warden: string | null;
  /** `${gameSeed}:descent:${attempt}`. */
  seed: string;
  /** The marching order at launch: front line first (up to 6), then the reserve (up to 8). */
  order: HunterSnapshot[];
  prep: PrepSnapshot;
  /** Bomb stores at launch, sparse: only the ids held (up to 2 are thrown per stage). */
  bombs: Partial<Record<ConsumableId, number>>;
  /** The frozen learned bonus: Might and Health in stat%, damage taken in taken% (D559). */
  learned: { mightAndHealth: number; taken: number };
  /** Combat Delve relics owned at launch. */
  delveRelics: DelveRelicId[];
  /** Frozen knowledge level, 0 to 4, of the stage monsters present (M3). */
  bestiaryKnowledge: Partial<Record<DescentMonsterId, number>>;
  stageTiers: [number, number, number];
  unlitBaseHealth: number;
  /** The Alchemy skill level at launch. */
  alchemy: number;
  rulesVersion: number;
  outcome: 'win' | 'loss';
  stagesCleared: 0 | 1 | 2 | 3;
  standingCount: number;
  downedCount: number;
  /** One to three entries. */
  stages: DescentStageSummary[];
}

export interface DescentState {
  /** Counts attempts; 0 at the start. */
  attempts: number;
  /** True once Stage 3 has been reached (win or loss): The Unlit shows on the Great Beasts shelf. */
  unlitMet: boolean;
  /** The latest attempt, won or lost. */
  last: DescentRecord | null;
  /** The first winning Descent, kept for the Roll mark and the Library replay. */
  firstWin: DescentRecord | null;
  /** A finished Descent has not been viewed yet (S9). */
  unreadResult: boolean;
}

export const newDescentState = (): DescentState => ({
  attempts: 0,
  unlitMet: false,
  last: null,
  firstWin: null,
  unreadResult: false,
});
