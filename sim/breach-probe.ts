import { PIECES } from '../src/content/hold-layout';
import type { Band } from '../src/content/story/scenes';
import type { Command } from '../src/core/commands';
import { apply } from '../src/core/commands';
import { num } from '../src/core/balance-access';
import { previewInputFor } from '../src/core/stand/from-state';
import { previewStand } from '../src/core/stand/preview';
import type { GameState } from '../src/core/state/game-state';
import { bandFor } from '../src/core/story/band';
import { laneTableFor, tacticianCommands } from '../src/core/systems/breach';
import { footprint, isPieceUnlocked } from '../src/core/systems/layout';

// GDD §6.2 v1.5 (D589 (3), plan TB.11b): the Breach probe. It takes a copy of the Tactician's state at
// the check-in where it makes its first stand at Bastion (the hold already arranged, nothing else
// differs from Standard's state), and runs the preview's practice stands (`laststand.previewSamples`,
// the same seeds for every layout) for: Auto-arrange, the Tactician's layout (the Suggest rule), a
// deliberately bad layout, and the same state under the version 5 rules. MEASURING ONLY: it changes
// a clone and nothing else. Rows A to C are judged on it at TB.13, in `sim.yml` only.

export type BreachVariant = 'auto' | 'tactician' | 'bad' | 'v5';
export const BREACH_VARIANTS: readonly BreachVariant[] = ['auto', 'tactician', 'bad', 'v5'];

export interface BreachPoint {
  readonly variant: BreachVariant;
  readonly median: number;
  readonly p10: number;
  readonly p90: number;
  readonly band: Band;
  /** Counted wall and tower pieces per lane, and the columns of the counted towers; empty for `v5`. */
  readonly pieces: readonly number[];
  readonly towerCols: readonly number[];
}

export interface BreachProbe {
  readonly samples: number;
  /** Auto-arrange and the bad layout again with Walls 15 and Watchtower 15 set on the copy (row C, D598). */
  readonly max: { readonly auto: BreachPoint; readonly bad: BreachPoint };
  /** The Tactician's own stand at this check-in: hours into the run and the cycle. */
  readonly points: readonly BreachPoint[];
}

/** D589 (3): the bad layout fills these tiles in this order. */
const BAD_TILES: readonly { x: number; y: number }[] = [
  { x: 0, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: 2 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 1, y: 2 },
];

const isDefense = (id: string): boolean => id.startsWith('wall-') || id.startsWith('watchtower-');

/**
 * D589 (3): lift every defense to the Tray, then fill the tiles above in order, towers first and then
 * walls in catalog order, skipping any tile another building holds; the rest stay in the Tray.
 */
export const badLayoutCommands = (state: GameState): Command[] => {
  const owned = PIECES.filter((p) => isDefense(p.id) && isPieceUnlocked(state, p.id));
  const lift = owned
    .filter((p) => state.layout.placed[p.id])
    .map((p): Command => ({ type: 'layout.unplace', pieceId: p.id }));
  const held = new Set<string>();
  for (const def of PIECES) {
    const at = state.layout.placed[def.id];
    if (at && !isDefense(def.id)) for (const t of footprint(def, at)) held.add(`${t.x},${t.y}`);
  }
  const free = BAD_TILES.filter((t) => !held.has(`${t.x},${t.y}`));
  const order = [
    ...owned.filter((p) => p.id.startsWith('watchtower-')),
    ...owned.filter((p) => p.id.startsWith('wall-')),
  ];
  const put = order.slice(0, free.length).map((p, i): Command => ({
    type: 'layout.place',
    pieceId: p.id,
    x: free[i]?.x ?? 0,
    y: free[i]?.y ?? 0,
  }));
  return [...lift, ...put];
};

/** A copy of `before` with the hold arranged the way a variant does it (`v5` arranges like Auto-arrange). */
export const arrangedState = (before: GameState, variant: BreachVariant): GameState => {
  const copy = structuredClone(before);
  const cmds: Command[] =
    variant === 'tactician'
      ? tacticianCommands(copy)
      : variant === 'bad'
        ? badLayoutCommands(copy)
        : [{ type: 'layout.autoArrange' }];
  for (const cmd of cmds) {
    const r = apply(copy, cmd, copy.time);
    if (!r.ok && variant !== 'bad') throw new Error(`Breach probe command refused: ${r.reason}`);
  }
  return copy;
};

type StandCommand = Extract<Command, { type: 'stand.make' }>;

/** The level point of row C (D598): Walls and Watchtower both at their top level in Bastion. */
const MAX_LEVEL = 15;

export const probeBreach = (
  before: GameState,
  stand: StandCommand,
  samples: number = num('laststand.previewSamples'),
): BreachProbe => {
  const prep = stand.prep ?? { oils: {}, potions: {} };
  const arranged = (variant: BreachVariant): GameState => arrangedState(before, variant);
  const atMax = structuredClone(before);
  atMax.buildings.walls = MAX_LEVEL;
  atMax.buildings.watchtower = MAX_LEVEL;
  const point = (variant: BreachVariant, state: GameState, v5: boolean): BreachPoint => {
    const input = previewInputFor(state, stand.party, prep, samples);
    // The version 5 rules: the same stand input without its lane table.
    const standInput = { ...input.stand };
    if (v5) delete standInput.lanes;
    const p = previewStand({ ...input, stand: standInput });
    const table = v5 ? null : laneTableFor(state);
    return {
      variant,
      median: p.median,
      p10: p.p10,
      p90: p.p90,
      band: bandFor(p.median),
      pieces: table?.pieces ?? [],
      towerCols: table?.towerCols ?? [],
    };
  };
  return {
    samples,
    max: {
      auto: point('auto', arrangedState(atMax, 'auto'), false),
      bad: point('bad', arrangedState(atMax, 'bad'), false),
    },
    points: [
      point('auto', arranged('auto'), false),
      point('tactician', arranged('tactician'), false),
      point('bad', arranged('bad'), false),
      point('v5', arranged('auto'), true),
    ],
  };
};
