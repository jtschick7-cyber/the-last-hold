import { clearingBounds } from '../src/core/systems/layout-catalog';
import {
  evaluateHoldTactics,
  tacticalBrewFactor,
  tacticalProductionFactor,
  tacticalThreatFactor,
} from '../src/core/systems/layout-tactics';
import { PIECES, type GridCoord, type HoldPieceId } from '../src/content/hold-layout';
import type { Band } from '../src/content/story/scenes';
import type { Command } from '../src/core/commands';
import { apply } from '../src/core/commands';
import { num } from '../src/core/balance-access';
import { previewInputFor } from '../src/core/stand/from-state';
import { previewStand } from '../src/core/stand/preview';
import type { GameState } from '../src/core/state/game-state';
import { bandFor } from '../src/core/story/band';
import { laneTableFor, tacticianCommands } from '../src/core/systems/breach';
import { footprint, inClearing, isPieceUnlocked } from '../src/core/systems/layout';

// GDD §6.2 v1.5 (D589 (3), plan TB.11b): the Breach probe. It takes a copy of the Tactician's state at
// the check-in where it makes its first stand at Bastion (the hold already arranged, nothing else
// differs from Standard's state), and runs the preview's practice stands (`laststand.previewSamples`,
// the same seeds for every layout) for: Auto-arrange, the Tactician's layout (the Suggest rule), a
// deliberately bad layout, and the same state under the version 5 rules. MEASURING ONLY: it changes
// a clone and nothing else. Rows A to C are judged on it at TB.13, in `sim.yml` only.

export type BreachVariant = 'auto' | 'tactician' | 'bad' | 'v5';
export const BREACH_VARIANTS: readonly BreachVariant[] = ['auto', 'tactician', 'bad', 'v5'];

export type BreachModeId = 'economy' | 'balanced' | 'fortress' | 'tactician' | 'careless';
export const BREACH_MODES: readonly BreachModeId[] = [
  'economy',
  'balanced',
  'fortress',
  'tactician',
  'careless',
];

export interface BreachModePoint {
  readonly mode: BreachModeId;
  readonly foodMult: number;
  readonly woodMult: number;
  readonly ironMult: number;
  readonly silverMult: number;
  readonly brewMult: number;
  readonly threatMult: number;
  readonly hearthWarded: boolean;
  readonly links: number;
  readonly connectedWalls: number;
  readonly screenedTowers: number;
  readonly sectorLanes: number;
  readonly waves: BreachPoint;
  readonly maxWaves: BreachPoint;
}

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
  /** v1.8 mode comparisons across tactical economy/Threat uplift and v7 Breach waves held. */
  readonly modes: readonly BreachModePoint[];
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

const orthoTouch = (a: readonly GridCoord[], b: readonly GridCoord[]): boolean =>
  a.some((ta) => b.some((tb) => Math.abs(ta.x - tb.x) + Math.abs(ta.y - tb.y) === 1));

const chebyTouch = (a: readonly GridCoord[], b: readonly GridCoord[]): boolean =>
  a.some((ta) => b.some((tb) => Math.max(Math.abs(ta.x - tb.x), Math.abs(ta.y - tb.y)) <= 1));

const avoidsAllLinks = (
  id: HoldPieceId,
  at: GridCoord,
  placed: Partial<Record<HoldPieceId, readonly GridCoord[]>>,
): boolean => {
  const tiles = [at];
  const noOrtho = (otherId: HoldPieceId): boolean => {
    const o = placed[otherId];
    return o ? orthoTouch(tiles, o) : false;
  };
  const noCheby = (otherId: HoldPieceId): boolean => {
    const o = placed[otherId];
    return o ? chebyTouch(tiles, o) : false;
  };
  if (id.startsWith('farm-') && noOrtho('mill')) return false;
  if (id === 'mill' && (['farm-1', 'farm-2', 'farm-3'] as const).some(noOrtho)) return false;
  if (id.startsWith('woodcutter-') && noOrtho('sawpit')) return false;
  if (id === 'sawpit' && (['woodcutter-1', 'woodcutter-2', 'woodcutter-3'] as const).some(noOrtho))
    return false;
  if ((id.startsWith('mine-') || id.startsWith('silver-seam-')) && noOrtho('smithy')) return false;
  if (
    id === 'smithy' &&
    (['mine-1', 'mine-2', 'mine-3', 'silver-seam-1', 'silver-seam-2'] as const).some(noOrtho)
  )
    return false;
  if (id.startsWith('herb-garden-') && noOrtho('alchemist')) return false;
  if (
    id === 'alchemist' &&
    (['herb-garden-1', 'herb-garden-2', 'herb-garden-3'] as const).some(noOrtho)
  )
    return false;
  if (id.startsWith('cottage-') && (noOrtho('hearth-hall') || noCheby('bell-tower'))) return false;
  if (id === 'bell-tower' && (['cottage-1', 'cottage-2', 'cottage-3'] as const).some(noCheby))
    return false;
  if (id === 'trophy-hall' && (noOrtho('hearth-hall') || noOrtho('barracks'))) return false;
  if (id === 'barracks' && noOrtho('trophy-hall')) return false;
  return true;
};

/**
 * v1.8 careless 8×12 layout: places `hearth-hall` exposed behind an open north lane, scatters
 * unlocked economy pieces with zero AoE links (verifying the strict 1.0× floor), clusters support
 * at the corner, and fills `BAD_TILES` with exposed unscreened defenses.
 */
export const carelessLayoutCommands = (state: GameState): Command[] => {
  const bounds = clearingBounds(state.cycle.age);
  const owned = PIECES.filter((p) => p.id !== 'hearth-hall' && isPieceUnlocked(state, p.id));
  const lift = owned
    .filter((p) => state.layout.placed[p.id])
    .map((p): Command => ({ type: 'layout.unplace', pieceId: p.id }));

  const hallDef = PIECES.find((d) => d.id === 'hearth-hall');
  const hallAt = state.layout.placed['hearth-hall'] ?? { x: 3, y: 6 };
  const occupied = new Set<string>();
  const placedMap: Partial<Record<HoldPieceId, readonly GridCoord[]>> = {};
  if (hallDef) {
    const fp = footprint(hallDef, hallAt);
    placedMap['hearth-hall'] = fp;
    for (const t of fp) occupied.add(`${t.x},${t.y}`);
  }

  // Reserve north breach corridor straight to Hearth Hall and BAD_TILES so Hearth stays unwarded.
  const reserved = new Set<string>(BAD_TILES.map((t) => `${t.x},${t.y}`));
  for (let y = bounds.minY; y < hallAt.y; y += 1) reserved.add(`${hallAt.x},${y}`);

  const nonDefense = owned.filter((p) => !isDefense(p.id));
  // Park barracks and lodge in opposite-last corner first so Sector Support only reaches corner lanes.
  const cornerFirst: HoldPieceId[] = ['barracks', 'lodge'];
  const ordered = [
    ...nonDefense.filter((p) => cornerFirst.includes(p.id)),
    ...nonDefense.filter((p) => !cornerFirst.includes(p.id)),
  ];

  const putNonDefense: Command[] = [];
  const candidateCoords: GridCoord[] = [];
  for (let y = bounds.maxY; y >= bounds.minY; y -= 1) {
    for (let x = bounds.maxX; x >= bounds.minX; x -= 1) {
      candidateCoords.push({ x, y });
    }
  }
  for (const p of ordered) {
    const chosen =
      candidateCoords.find(
        (t) =>
          !occupied.has(`${t.x},${t.y}`) &&
          !reserved.has(`${t.x},${t.y}`) &&
          avoidsAllLinks(p.id, t, placedMap),
      ) ??
      candidateCoords.find((t) => !occupied.has(`${t.x},${t.y}`) && !reserved.has(`${t.x},${t.y}`));
    if (!chosen) continue;
    occupied.add(`${chosen.x},${chosen.y}`);
    placedMap[p.id] = [chosen];
    putNonDefense.push({ type: 'layout.place', pieceId: p.id, x: chosen.x, y: chosen.y });
  }

  const defOwned = owned.filter((p) => isDefense(p.id));
  const freeBad = BAD_TILES.filter((t) => inClearing(bounds, t) && !occupied.has(`${t.x},${t.y}`));
  const defOrder = [
    ...defOwned.filter((p) => p.id.startsWith('watchtower-')),
    ...defOwned.filter((p) => p.id.startsWith('wall-')),
  ];
  const putDefenses: Command[] = defOrder.slice(0, freeBad.length).map((p, i) => ({
    type: 'layout.place',
    pieceId: p.id,
    x: freeBad[i]?.x ?? 0,
    y: freeBad[i]?.y ?? 0,
  }));

  return [...lift, ...putNonDefense, ...putDefenses];
};

/** A copy of `before` arranged under a v1.8 mode or Tactician/Careless strategy. */
export const arrangedModeState = (before: GameState, mode: BreachModeId): GameState => {
  const copy = structuredClone(before);
  const cmds: Command[] =
    mode === 'tactician'
      ? tacticianCommands(copy)
      : mode === 'careless'
        ? carelessLayoutCommands(copy)
        : [{ type: 'layout.autoArrange', mode }];
  for (const cmd of cmds) {
    const r = apply(copy, cmd, copy.time);
    if (!r.ok && mode !== 'careless')
      throw new Error(`Breach mode probe command refused (${mode}): ${r.reason}`);
  }
  return copy;
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
    modes: BREACH_MODES.map((mode): BreachModePoint => {
      const state = arrangedModeState(before, mode);
      const maxState = arrangedModeState(atMax, mode);
      const tactics = evaluateHoldTactics(state);
      const table = laneTableFor(state);
      const variantTag: BreachVariant =
        mode === 'tactician' ? 'tactician' : mode === 'careless' ? 'bad' : 'auto';
      return {
        mode,
        foodMult: tacticalProductionFactor(state, 'food')?.value ?? 1,
        woodMult: tacticalProductionFactor(state, 'wood')?.value ?? 1,
        ironMult: tacticalProductionFactor(state, 'iron')?.value ?? 1,
        silverMult: tacticalProductionFactor(state, 'silver')?.value ?? 1,
        brewMult: tacticalBrewFactor(state)?.value ?? 1,
        threatMult: tacticalThreatFactor(state)?.value ?? 1,
        hearthWarded: tactics.hearthWarded,
        links: tactics.links.length,
        connectedWalls: tactics.connectedWalls.size,
        screenedTowers: tactics.screenedTowers.size,
        sectorLanes: (table.sectorCols ?? []).filter((n) => n > 0).length,
        waves: point(variantTag, state, false),
        maxWaves: point(variantTag, maxState, false),
      };
    }),
  };
};
