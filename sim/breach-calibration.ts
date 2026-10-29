import { PIECES } from '../src/content/hold-layout';
import { apply } from '../src/core/commands';
import { clearNumCache, constantAt, num } from '../src/core/balance-access';
import type { Command } from '../src/core/commands';
import { play } from '../src/core/policies';
import { previewInputFor } from '../src/core/stand/from-state';
import { runStand, standTaken, type StandInput } from '../src/core/stand/engine';
import type { GameState } from '../src/core/state/game-state';
import { createNewGame } from '../src/core/state/new-game';
import { bandFor } from '../src/core/story/band';
import { laneTableFor, volley, wallCut } from '../src/core/systems/breach';
import { footprint, isPieceUnlocked } from '../src/core/systems/layout';
import { arrangedState, type BreachVariant } from './breach-probe';
import { median } from './checks/helpers';
import { STARTS } from './run';

// Plan TB.12 (D583, D589 (6)): the Breach calibration. `npm run sim:breach` plays the Tactician on the
// 5 Monday seeds to its first stand at Bastion, then fights the preview's practice stands on copies of
// that state at three Walls/Watchtower level points, for every layout, and for a grid of values for
// each tunable (one at a time, from the placeholders). MEASURING ONLY: every value is put back.

type StandCommand = Extract<Command, { type: 'stand.make' }>;

export interface SeedState {
  readonly seed: string;
  readonly before: GameState;
  readonly stand: StandCommand;
}

export const SEEDS = ['sim-1', 'sim-2', 'sim-3', 'sim-4', 'sim-5'] as const;

/** The Tactician's state just before its stand number `nth` (0 is the first) at Bastion, per Monday seed. */
export const collectStates = (nth = 0): SeedState[] =>
  SEEDS.map((seed) => {
    const state = createNewGame(seed, STARTS.mon);
    let got: SeedState | null = null;
    play(state, {
      policy: 'tactician',
      startedAt: STARTS.mon,
      until: STARTS.mon + 14 * 24 * 3_600_000,
      onBreachStand: (before, stand, index) => {
        if (index === nth) got = { seed, before, stand };
      },
      stop: () => got !== null,
    });
    if (!got) throw new Error(`The Tactician made no stand at Bastion on ${seed}.`);
    return got;
  });

export interface Level {
  readonly name: 'low' | 'mid' | 'max';
  readonly walls: number;
  readonly tower: number;
}
export const LEVELS: readonly Level[] = [
  { name: 'low', walls: 1, tower: 1 },
  { name: 'mid', walls: 8, tower: 8 },
  { name: 'max', walls: 15, tower: 15 },
];

/** What one seed gave for one setup. */
interface SeedCell {
  readonly median: number;
  readonly mean: number;
  readonly p10: number;
  readonly p90: number;
  readonly capBound: number;
  readonly waveCount: number;
  readonly meanCut: number;
  readonly meanVolley: number;
  readonly pieces: number;
  readonly towers: number;
}

export interface Cell {
  readonly median: number;
  /** Mean waves held over every practice stand of every seed (finer than the median). */
  readonly mean: number;
  readonly p10: number;
  readonly p90: number;
  /** Seeds whose median reaches Held / Triumphant. */
  readonly held: number;
  readonly triumphant: number;
  /** Relics found by the median stand (milestones reached), median of the seeds. */
  readonly relics: number;
  /** Share of fought waves where the 75% cap bound. */
  readonly capShare: number;
  /** Mean wall cut over the 8 lanes, in taken%, and mean volley over the lanes. */
  readonly meanCut: number;
  readonly meanVolley: number;
  readonly pieces: number;
  readonly towers: number;
}

const quantile = (sorted: readonly number[], q: number): number =>
  sorted[Math.floor(q * (sorted.length - 1))] ?? 0;

const withValues = <T>(values: Readonly<Record<string, unknown>>, fn: () => T): T => {
  const was = Object.keys(values).map((k) => [k, constantAt(k as never).value] as const);
  const set = (k: string, v: unknown): void => {
    (constantAt(k as never) as { value: unknown }).value = v;
  };
  for (const [k, v] of Object.entries(values)) set(k, v);
  clearNumCache();
  try {
    return fn();
  } finally {
    for (const [k, v] of was) set(k, v);
    clearNumCache();
  }
};

export type Adjust = (state: GameState) => void;
/** Changes made to the state before the hold is arranged (`pre`) or after it (`post`). */
export interface Tweak {
  readonly pre?: Adjust;
  readonly post?: Adjust;
}

const measureSeed = (
  s: SeedState,
  level: Level,
  variant: BreachVariant,
  samples: number,
  tweak?: Tweak,
): SeedCell => {
  const base = structuredClone(s.before);
  base.buildings.walls = level.walls;
  base.buildings.watchtower = level.tower;
  tweak?.pre?.(base);
  const state = arrangedState(base, variant);
  tweak?.post?.(state);
  const prep = s.stand.prep ?? { oils: {}, potions: {} };
  const input = previewInputFor(state, s.stand.party, prep, samples);
  const v5 = variant === 'v5';
  const standInput: StandInput = v5 ? { ...input.stand, lanes: undefined } : input.stand;
  if (v5) delete (standInput as { lanes?: unknown }).lanes;
  const cap = num('combat.takenCap');
  const held: number[] = [];
  let capBound = 0;
  let waveCount = 0;
  for (let i = 0; i < samples; i++) {
    const r = runStand({ ...standInput, log: false, rolls: `${standInput.seed}:practice:${i}` });
    held.push(r.wavesHeld);
    for (const w of r.waves) {
      waveCount += 1;
      const taken = standTaken(
        standInput.defenses,
        standInput.relics,
        w.breach ? w.breach.wallCut.value : undefined,
      );
      if (taken > cap) capBound += 1;
    }
  }
  held.sort((a, b) => a - b);
  const table = v5 ? null : laneTableFor(state);
  const lanes = num('breach.lanes');
  const range = Array.from({ length: lanes }, (_, c) => c);
  return {
    median: quantile(held, 0.5),
    mean: held.reduce((n, h) => n + h, 0) / held.length,
    p10: quantile(held, 0.1),
    p90: quantile(held, 0.9),
    capBound,
    waveCount,
    meanCut: table
      ? (range.reduce((n, c) => n + wallCut(table, level.walls, c).value, 0) / lanes) * 100
      : level.walls * num('walls.takenPerLevel') * 100,
    meanVolley: table
      ? range.reduce((n, c) => n + volley(table, level.tower, c).value, 0) / lanes
      : level.tower * num('watchtower.volleyPerLevel'),
    pieces: table ? table.pieces.reduce((n, p) => n + p, 0) : 0,
    towers: table ? table.towerCols.length : 0,
  };
};

export const measure = (
  seeds: readonly SeedState[],
  level: Level,
  variant: BreachVariant,
  samples: number,
  tweak?: Tweak,
): Cell => {
  const cells = seeds.map((s) => measureSeed(s, level, variant, samples, tweak));
  const med = median(cells.map((c) => c.median));
  const milestones = constantAt('relics.waveMilestones').value as readonly number[];
  return {
    median: med,
    mean: cells.reduce((n, c) => n + c.mean, 0) / cells.length,
    p10: Math.min(...cells.map((c) => c.p10)),
    p90: Math.max(...cells.map((c) => c.p90)),
    held: cells.filter((c) => bandFor(c.median) !== 'broken').length,
    triumphant: cells.filter((c) => bandFor(c.median) === 'triumphant').length,
    relics: median(cells.map((c) => milestones.filter((m) => m <= c.median).length)),
    capShare:
      cells.reduce((n, c) => n + c.capBound, 0) /
      Math.max(
        1,
        cells.reduce((n, c) => n + c.waveCount, 0),
      ),
    meanCut: median(cells.map((c) => c.meanCut)),
    meanVolley: median(cells.map((c) => c.meanVolley)),
    pieces: median(cells.map((c) => c.pieces)),
    towers: median(cells.map((c) => c.towers)),
  };
};

/** One value (or set of values, for a split) tried for a tunable. */
export interface Sweep {
  readonly name: string;
  readonly label: string;
  readonly values: Readonly<Record<string, unknown>>;
}

export const SWEEPS: readonly Sweep[] = [
  ...[1, 1.5, 2, 3, 4].map((v) => ({
    name: 'volleyScale',
    label: String(v),
    values: { 'breach.volleyScale': v },
  })),
  ...[0, 0.25, 0.5].map((v) => ({
    name: 'depthStep',
    label: String(v),
    values: { 'breach.depthStep': v },
  })),
  ...[1, 2, 3].map((v) => ({
    name: 'depthMax',
    label: String(v),
    values: { 'breach.depthMax': v },
  })),
  ...(
    [
      [1, 0.5, 0.25],
      [1, 0.75, 0.5],
      [1, 0.5, 0],
      [1, 1, 1],
    ] as const
  ).map((v) => ({
    name: 'towerReach',
    label: `[${v.join(', ')}]`,
    values: { 'breach.towerReach': [...v] },
  })),
  ...(
    [
      [0.4, 0.3],
      [0.5, 0.25],
      [0.6, 0.2],
      [0.7, 0.15],
    ] as const
  ).map(([own, near]) => ({
    name: 'cover split',
    label: `own ${own} / next ${near}`,
    values: { 'breach.coverOwn': own, 'breach.coverNeighbour': near },
  })),
  ...[8, 12, 16, 24].map((v) => ({
    name: 'suggestWaves',
    label: String(v),
    values: { 'breach.suggestWaves': v },
  })),
];

export const sweepCell = (
  seeds: readonly SeedState[],
  sweep: Sweep,
  level: Level,
  variant: BreachVariant,
  samples: number,
  tweak?: Tweak,
): Cell => withValues(sweep.values, () => measure(seeds, level, variant, samples, tweak));

const lift =
  (keep: number): Adjust =>
  (state) => {
    // Keep the first `keep` towers placed; the rest go to the Tray (D582).
    const towers = PIECES.filter(
      (p) => p.id.startsWith('watchtower-') && isPieceUnlocked(state, p.id),
    ).map((p) => p.id as string);
    const out = new Set(towers.slice(keep));
    state.layout.placed = Object.fromEntries(
      Object.entries(state.layout.placed).filter(([id]) => !out.has(id)),
    ) as typeof state.layout.placed;
  };
export const towersKept = lift;

/** D581: move every economy building off the front rows to a free tile behind them, where it can. */
export const moveEconomyBack = (state: GameState): number => {
  const rows = num('breach.frontRows');
  const lanes = num('breach.lanes');
  const taken = (): Set<string> => {
    const t = new Set<string>();
    for (const d of PIECES) {
      const at = state.layout.placed[d.id];
      if (at) for (const x of footprint(d, at)) t.add(`${x.x},${x.y}`);
    }
    return t;
  };
  let moved = 0;
  for (const d of PIECES) {
    const at = state.layout.placed[d.id];
    if (!at || d.id === 'hearth-hall' || d.id.startsWith('wall-') || d.id.startsWith('watchtower-'))
      continue;
    if (!footprint(d, at).some((t) => t.y < rows)) continue;
    const used = taken();
    for (let y = rows; y < rows + 5 && d.w === 1 && d.h === 1; y++)
      for (let x = 0; x < lanes; x++) {
        if (used.has(`${x},${y}`)) continue;
        if (apply(state, { type: 'layout.place', pieceId: d.id, x, y }, state.time).ok) {
          moved += 1;
          y = rows + 5;
          break;
        }
      }
  }
  return moved;
};
