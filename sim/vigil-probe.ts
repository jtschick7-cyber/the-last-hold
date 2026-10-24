import type { Band } from '../src/content/story/scenes';
import type { BalanceKey } from '../src/content/balance';
import type { Command } from '../src/core/commands';
import { clearNumCache, constantAt, num } from '../src/core/balance-access';
import { previewInputFor } from '../src/core/stand/from-state';
import { embersPayout } from '../src/core/stand/embers';
import { previewStand } from '../src/core/stand/preview';
import type { GameState } from '../src/core/state/game-state';
import { bandFor } from '../src/core/story/band';
import { stateAtVigilLevel } from '../src/core/systems/vigil';

// GDD §6.2 v1.3 (D546 (1), plan KV.8): the Rising Vigil probe. It takes a copy of the Vigilant's state
// at the check-in where it makes its first endless stand (Bastion, Standard's stand-timing rule), and
// runs the preview's practice stands (`laststand.previewSamples`, the same seeds at every level) at
// levels 0 to 10, for a grid of values for `s` and `e`, for both kinds of step, at two Threat points.
// Waves held depend on `s` only; the Embers are worked out from the median waves with the real payout
// function, so an `e` costs no extra practice stands. MEASURING ONLY: the shipped constants stay
// as they are (the values are put back after every try).

export const PROBE_LEVELS = 10;
/** Values tried for `s` (wave strength per level) and `e` (Embers per level). */
export const S_GRID = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8] as const;
export const E_GRID = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3] as const;
export type StepKind = 'additive' | 'compounding';
export const STEP_KINDS: readonly StepKind[] = ['additive', 'compounding'];

/** What a probe tries: the values of `s` and `e` and the kinds of step (D546 (1); Q57 was answered additive). */
export interface ProbeGrid {
  readonly sGrid: readonly number[];
  readonly eGrid: readonly number[];
  readonly kinds: readonly StepKind[];
}

/** KV.8's wide grid, for reading the curve (`npm run sim:vigil`). */
export const WIDE_GRID: ProbeGrid = { sGrid: S_GRID, eGrid: E_GRID, kinds: STEP_KINDS };

/** One level at one Threat point: the waves the practice stands held. */
export interface WavePoint {
  readonly median: number;
  readonly p10: number;
  readonly p90: number;
  readonly band: Band;
}

/** The curve at one Threat point. `waves[step][sIndex][level]`, `embers[step][sIndex][eIndex][level]`. */
export interface ProbeThreat {
  readonly threat: number;
  /** Level 0 (the same for every `s`). */
  readonly base: WavePoint & { readonly embers: number; readonly trophies: number };
  readonly waves: Partial<Record<StepKind, WavePoint[][]>>;
  readonly embers: Partial<Record<StepKind, number[][][]>>;
}

export interface VigilProbe {
  readonly samples: number;
  readonly sGrid: readonly number[];
  readonly eGrid: readonly number[];
  readonly kinds: readonly StepKind[];
  readonly levels: number;
  readonly threats: readonly ProbeThreat[];
}

/** Tries a constant at another value for the length of `fn`, then puts it back. */
export const withConstant = <T>(key: BalanceKey, value: number, fn: () => T): T => {
  const c = constantAt(key) as { value: number };
  const was = c.value;
  c.value = value;
  clearNumCache();
  try {
    return fn();
  } finally {
    c.value = was;
    clearNumCache();
  }
};

/** The per-level step a kind of curve adds at `level`, as a number to give the constant: s×L or (1+s)^L − 1. */
export const stepFor = (kind: StepKind, x: number, level: number): number =>
  kind === 'additive' ? x : (Math.pow(1 + x, level) - 1) / level; // × level gives (1+x)^L − 1

/** The judging probe: the two shipped constants, the additive step (Q57 (a)). */
export const shippedGrid = (): ProbeGrid => ({
  sGrid: [num('vigil.strengthPerLevel')],
  eGrid: [num('vigil.embersPerLevel')],
  kinds: ['additive'],
});

export type StandCommand = Extract<Command, { type: 'stand.make' }>;

export const probeVigil = (
  before: GameState,
  stand: StandCommand,
  samples: number,
  threats: readonly number[],
  grid: ProbeGrid = shippedGrid(),
): VigilProbe => {
  const levels = Array.from({ length: PROBE_LEVELS + 1 }, (_, i) => i);
  const out: ProbeThreat[] = threats.map((threat) => {
    const at = structuredClone(before);
    at.threat = threat;
    const run = (level: number) => {
      const s = stateAtVigilLevel(at, level);
      return {
        s,
        preview: previewStand(
          previewInputFor(s, stand.party, stand.prep ?? { oils: {}, potions: {} }, samples),
        ),
      };
    };
    const point = (p: ReturnType<typeof run>['preview']): WavePoint => ({
      median: p.median,
      p10: p.p10,
      p90: p.p90,
      band: bandFor(p.median),
    });
    const zero = run(0);
    const base = {
      ...point(zero.preview),
      embers: zero.preview.embersNow.value,
      trophies: zero.preview.embersNow.trophies,
    };
    const waves: Partial<Record<StepKind, WavePoint[][]>> = {};
    const embers: Partial<Record<StepKind, number[][][]>> = {};
    for (const kind of grid.kinds) {
      const wavesOf: WavePoint[][] = [];
      const embersOf: number[][][] = [];
      waves[kind] = wavesOf;
      embers[kind] = embersOf;
      for (const sValue of grid.sGrid) {
        const previews = levels.map((level) =>
          level === 0
            ? zero
            : withConstant('vigil.strengthPerLevel', stepFor(kind, sValue, level), () =>
                run(level),
              ),
        );
        wavesOf.push(previews.map((r) => point(r.preview)));
        embersOf.push(
          grid.eGrid.map((eValue) =>
            levels.map((level) =>
              withConstant(
                'vigil.embersPerLevel',
                level === 0 ? 0 : stepFor(kind, eValue, level),
                () =>
                  embersPayout({
                    rank: at.cycle.age,
                    waves: previews[level]?.preview.median ?? 0,
                    threat,
                    trophies: at.stats.trophies,
                    trophyCap: null,
                    vigilLevel: level,
                  }).value,
              ),
            ),
          ),
        );
      }
    }
    return { threat, base, waves, embers };
  });
  return {
    samples,
    sGrid: grid.sGrid,
    eGrid: grid.eGrid,
    kinds: grid.kinds,
    levels: PROBE_LEVELS,
    threats: out,
  };
};
