import { HUNTER_IDS, type HunterId } from '../src/content/hunters';
import { constantAt, num } from '../src/core/balance-access';
import { createNewGame } from '../src/core/state/new-game';
import type { GameState } from '../src/core/state/game-state';
import { descentInputFor } from '../src/core/systems/descent-record';
import { descentPreviewSeed } from '../src/core/systems/descent-odds';
import { runDescent, type DescentInput } from '../src/core/systems/descent-fight';
import { suggestDescentOrder } from '../src/core/systems/descent-order';
import { buildEndgameRoster } from './descent-roster';

// Plan TD.8b (GDD §5.15.10, technical design §22.7, D564): the Descent probe. From a copy of the
// Vigilant's state at its first Rising Vigil stand (gate open, Bastion), it builds the reference rosters
// (TD.8a), then fights the preview's practice runs (`descent.previewSamples`, the same dice for every
// roster and every value) for a grid of `descent.stageTiers` and `descent.unlitBaseHealth`. The values
// are set on the fight's input, not on the shipped constants, so nothing is ever changed and put back.
// MEASURING ONLY until TD.9 adds the rows.

export const PROBE_PROFILES = [
  'minimal',
  'minimal-zeroed',
  'maxed',
  'maxed-zeroed',
  'hamlet',
] as const;
export type ProbeProfile = (typeof PROBE_PROFILES)[number];

export type Tiers = readonly [number, number, number];

/** What a probe tries: stage tiers and Unlit base Health values (their product is the grid). */
export interface DescentGrid {
  readonly tiers: readonly Tiers[];
  readonly unlitHealth: readonly number[];
}

/** The judging probe: the two shipped (placeholder until TD.9) values, one cell. */
export const shippedDescentGrid = (): DescentGrid => ({
  tiers: [[...(constantAt('descent.stageTiers').value as readonly number[])] as unknown as Tiers],
  unlitHealth: [num('descent.unlitBaseHealth')],
});

export interface Spread {
  readonly median: number;
  readonly p10: number;
  readonly p90: number;
}

/** What the practice runs of one roster did at one grid point. */
export interface DescentCell {
  readonly wins: number;
  readonly samples: number;
  readonly stagesCleared: Spread;
  readonly downed: Spread;
  /** The Unlit's Health left at the end of Stage 3, over the runs that reached it (0 when beaten). */
  readonly unlitLeft: Spread & { readonly reached: number };
}

export interface DescentProbe {
  readonly samples: number;
  readonly grid: DescentGrid;
  /** `cells[profile][tierIndex][healthIndex]`. */
  readonly cells: Record<ProbeProfile, DescentCell[][]>;
}

const sorted = (xs: readonly number[]): number[] => [...xs].sort((a, b) => a - b);
/** Nearest-rank percentile of a sorted list (0 for an empty one). */
const at = (xs: readonly number[], p: number): number =>
  xs.length === 0 ? 0 : (xs[Math.min(xs.length - 1, Math.floor(p * xs.length))] ?? 0);
const spread = (xs: readonly number[]): Spread => {
  const s = sorted(xs);
  return { median: at(s, 0.5), p10: at(s, 0.1), p90: at(s, 0.9) };
};

/** The fight input of each profile, from the same hold (the dice are shared; see `fightCell`). */
export const profileInputs = (
  before: GameState,
  gameSeed = before.meta.gameSeed,
): Record<ProbeProfile, DescentInput> => {
  const inputOf = (s: GameState, order: readonly HunterId[]): DescentInput =>
    descentInputFor(s, order, { oils: {}, potions: {} }).input;
  const roster = (p: 'minimal' | 'maxed'): DescentInput => {
    const s = structuredClone(before);
    buildEndgameRoster(s, p);
    return inputOf(s, suggestDescentOrder(s));
  };
  const zeroed = (i: DescentInput): DescentInput => ({
    ...i,
    learned: { mightAndHealth: 0, taken: 0 },
    delveRelics: [],
  });
  // M9, M10: the Hamlet's starting party at level 1, with nothing learned, as a new game begins.
  const hamlet = createNewGame(`${gameSeed}:hamlet`, 0);
  const starters = hamlet.roster.active.filter((id): id is HunterId =>
    (HUNTER_IDS as readonly string[]).includes(id),
  );
  const minimal = roster('minimal');
  const maxed = roster('maxed');
  return {
    minimal,
    'minimal-zeroed': zeroed(minimal),
    maxed,
    'maxed-zeroed': zeroed(maxed),
    hamlet: inputOf(hamlet, starters),
  };
};

/** One grid point: `samples` practice runs on the preview's own seeds. */
export const fightCell = (
  input: DescentInput,
  gameSeed: string,
  attempt: number,
  samples: number,
  tiers: Tiers,
  unlitBaseHealth: number,
): DescentCell => {
  let wins = 0;
  const cleared: number[] = [];
  const downed: number[] = [];
  const left: number[] = [];
  for (let i = 0; i < samples; i++) {
    const r = runDescent({
      ...input,
      stageTiers: tiers,
      unlitBaseHealth,
      seed: descentPreviewSeed(gameSeed, attempt, i),
      log: false,
    });
    if (r.outcome === 'win') wins++;
    cleared.push(r.stagesCleared);
    downed.push(r.downedCount);
    const third = r.stages[2];
    if (third) left.push(third.monsters.reduce((n, m) => n + Math.max(0, m.health), 0));
  }
  return {
    wins,
    samples,
    stagesCleared: spread(cleared),
    downed: spread(downed),
    unlitLeft: { ...spread(left), reached: left.length },
  };
};

export const probeDescent = (
  before: GameState,
  samples: number = num('descent.previewSamples'),
  grid: DescentGrid = shippedDescentGrid(),
): DescentProbe => {
  const inputs = profileInputs(before);
  const attempt = 1;
  const cells = {} as Record<ProbeProfile, DescentCell[][]>;
  for (const p of PROBE_PROFILES)
    cells[p] = grid.tiers.map((t) =>
      grid.unlitHealth.map((h) =>
        fightCell(inputs[p], before.meta.gameSeed, attempt, samples, t, h),
      ),
    );
  return { samples, grid, cells };
};
