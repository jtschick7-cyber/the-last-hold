import { BREACH_TEXT } from '../../content/breach-text';
import { V18_TEXT } from '../../content/v18-text';
import {
  GRID_COLS,
  GRID_ROWS,
  HOLD_CENTER,
  PIECES,
  WARD_SUGGEST_WEIGHTS,
  type GridCoord,
  type HoldPieceId,
} from '../../content/hold-layout';
import { constantAt, num } from '../balance-access';
import type { Breakdown, Explained } from '../breakdown/breakdown';
import type { Command } from '../commands/types';
import { seeded } from '../rng';
import { standPoolOf } from '../stand/pool';
import { standSeed, waveList, type Wave } from '../stand/waves';
import type { GameState } from '../state/game-state';
import type { LaneTable } from '../state/lane-table';
import type { LayoutArrangeMode } from '../state/layout-state';
import { greedyPlacement, type SuggestTile } from './breach-suggest';
import { footprint, getPieceStatus, inClearing, isPieceUnlocked } from './layout';
import { clearingBounds } from './layout-catalog';
import { autoArrange } from './layout-place';

// GDD §5.9.11, §7.15 and technical design §23.2 (v1.5, D580–D583): the lanes of the Last Stand, the
// pieces that count, cover, depth, the wall cut and the shared volley. Each number is worked out here
// and nowhere else, with its breakdown built by the same function, so the number and its
// explanation cannot disagree. This is the only core module that reads the hold's layout for combat
// (`laneTableFor`); the fight and the log rebuild read only the frozen lane table (CLAUDE.md).
//
// The volley is worked in whole numbers in the order of §23.2: reach and scale in hundredths,
// every product first, one division, then floor. Reach in quarters (the written order) gives the same
// integers, because multiplying both sides by 25 changes nothing.

/** The lane of wave n (counted from 1, as the species picks count): floor(roll × lanes). */
export const laneOf = (seed: string, n: number): number =>
  Math.floor(seeded(`${seed}:lane:${n}`).next() * num('breach.lanes'));

/** The lanes of waves 1 to `count`. */
export const lanesFor = (seed: string, count: number): number[] =>
  Array.from({ length: count }, (_, i) => laneOf(seed, i + 1));

/** A wave of the stand's list with its lane; `null` below Bastion, where no lane is shown (GDD §5.9.3). */
export interface LaneWave extends Wave {
  readonly lane: number | null;
}

/**
 * The first `count` waves with each one's lane (TB.4). The species and tiers are `waveList`'s, unchanged;
 * the lane is `laneOf` of the stand seed, so it is fixed with the list and never touched by the layout.
 */
export const standWaves = (state: GameState, count: number): LaneWave[] => {
  const seed = standSeed(state);
  const shown = state.cycle.age === 'bastion';
  return waveList(seed, count, standPoolOf(state)).map((w) => ({
    ...w,
    lane: shown ? laneOf(seed, w.n) : null,
  }));
};

export interface CountedPiece {
  readonly id: HoldPieceId;
  readonly x: number;
  readonly y: number;
  readonly tower: boolean;
}

type Hold = Pick<GameState, 'layout' | 'buildings' | 'cycle'>;

/** Walls and Watchtower pieces that are `active` and on the grid in the front rows (D581). Defenses are one tile. */
export const countedPieces = (state: Hold): CountedPiece[] => {
  const rows = num('breach.frontRows');
  const out: CountedPiece[] = [];
  for (const def of PIECES) {
    const tower = def.id.startsWith('watchtower-');
    if (!tower && !def.id.startsWith('wall-')) continue;
    if (getPieceStatus(state, def.id) !== 'active') continue;
    const at = state.layout.placed[def.id];
    if (at && at.y < rows) out.push({ id: def.id, x: at.x, y: at.y, tower });
  }
  return out;
};

/** The `breach.*` numbers in force now. */
const numbersNow = (): LaneTable['k'] => ({
  coverOwn: num('breach.coverOwn'),
  coverNeighbour: num('breach.coverNeighbour'),
  depthStep: num('breach.depthStep'),
  depthMax: num('breach.depthMax'),
  towerReach: [...(constantAt('breach.towerReach').value as number[])],
  volleyScale: num('breach.volleyScale'),
  rampartBonus: num('breach.rampartBonus'),
  screenedBonus: num('breach.screenedBonus'),
  sectorBonus: num('breach.sectorBonus'),
});

interface PlacedCoord {
  readonly x: number;
  readonly y: number;
  readonly tower: boolean;
}

const behindDefenses = (state: Hold): PlacedCoord[] => {
  const rows = num('breach.frontRows');
  const out: PlacedCoord[] = [];
  for (const def of PIECES) {
    const tower = def.id.startsWith('watchtower-');
    if (!tower && !def.id.startsWith('wall-')) continue;
    if (getPieceStatus(state, def.id) !== 'active') continue;
    const at = state.layout.placed[def.id];
    if (at && at.y >= rows) out.push({ x: at.x, y: at.y, tower });
  }
  return out;
};

const activeSectorCols = (state: Hold, lanes: number): number[] => {
  const sectorCols = new Array<number>(lanes).fill(0);
  const mask = new Array<number>(lanes).fill(0);
  for (const [id, bit] of [
    ['barracks', 1],
    ['lodge', 2],
  ] as const) {
    if (getPieceStatus(state, id) !== 'active') continue;
    const at = state.layout.placed[id];
    if (!at) continue;
    for (let dx = -1; dx <= 1; dx += 1) {
      const c = at.x + dx;
      if (c >= 0 && c < lanes && ((mask[c] ?? 0) & bit) === 0) {
        mask[c] = (mask[c] ?? 0) | bit;
        sectorCols[c] = (sectorCols[c] ?? 0) + 1;
      }
    }
  }
  return sectorCols;
};

const gridIndex = (x: number, y: number, cols: number): number => y * cols + x;

/** The table for counted pieces and v7 tactical topology (ramparts, screened towers, sector support). */
const tableOf = (
  front: readonly PlacedCoord[],
  k: LaneTable['k'],
  sectorCols: readonly number[],
  behind: readonly PlacedCoord[] = [],
  lanes = num('breach.lanes'),
  occ = new Uint8Array(lanes * GRID_ROWS),
  connWall = new Uint8Array(lanes * GRID_ROWS),
): LaneTable => {
  const pieces = new Array<number>(lanes).fill(0);
  const rampartCols = new Array<boolean>(lanes).fill(false);
  occ.fill(0);
  connWall.fill(0);
  for (const p of front) occ[gridIndex(p.x, p.y, lanes)] = 1;
  for (const p of behind) occ[gridIndex(p.x, p.y, lanes)] = 1;

  const markConnectedWalls = (list: readonly PlacedCoord[]): void => {
    for (const p of list) {
      if (p.tower) continue;
      const idx = gridIndex(p.x, p.y, lanes);
      const linked =
        (p.x > 0 && occ[idx - 1] === 1) ||
        (p.x + 1 < lanes && occ[idx + 1] === 1) ||
        (p.y > 0 && occ[idx - lanes] === 1) ||
        (p.y + 1 < GRID_ROWS && occ[idx + lanes] === 1);
      if (linked) connWall[idx] = 1;
    }
  };
  markConnectedWalls(front);
  markConnectedWalls(behind);

  const frontTowers: PlacedCoord[] = [];
  for (const p of front) {
    pieces[p.x] = (pieces[p.x] ?? 0) + 1;
    if (p.tower) {
      frontTowers.push(p);
    } else if (connWall[gridIndex(p.x, p.y, lanes)] === 1) {
      rampartCols[p.x] = true;
    }
  }
  frontTowers.sort((a, b) => a.x - b.x || a.y - b.y);
  const towerCols = frontTowers.map((t) => t.x);
  const screened = frontTowers.map(
    (t) => t.y > 0 && connWall[gridIndex(t.x, t.y - 1, lanes)] === 1,
  );
  return { pieces, towerCols, rampartCols, screened, sectorCols: [...sectorCols], k };
};

/** The table a stand freezes when Start is pressed: the only place the layout is read for combat. */
export const laneTableFor = (state: Hold): LaneTable =>
  tableOf(
    countedPieces(state),
    numbersNow(),
    activeSectorCols(state, num('breach.lanes')),
    behindDefenses(state),
  );

const percent = (v: number): number => Math.round(100 * v);

/** Cover of lane c as a plain number, for the Suggest rule's many trials; equals `cover(...).value` (a test checks every pattern). */
export const coverValue = (table: LaneTable, c: number): number => {
  const last = table.pieces.length - 1;
  const has = (i: number): boolean => (table.pieces[i] ?? 0) > 0;
  let value = has(c) ? table.k.coverOwn : 0;
  if (c === 0 || has(c - 1)) value += table.k.coverNeighbour;
  if (c === last || has(c + 1)) value += table.k.coverNeighbour;
  return value;
};

/** Cover of lane c: own column, plus each neighbouring column; the ruined edge counts as walled (D581). */
export const cover = (table: LaneTable, c: number): Explained => {
  const last = table.pieces.length - 1;
  const has = (i: number): boolean => (table.pieces[i] ?? 0) > 0;
  const lines: Breakdown[] = [];
  if (has(c))
    lines.push({
      label: BREACH_TEXT.ownColumn(percent(table.k.coverOwn)),
      value: table.k.coverOwn,
      key: 'breach.coverOwn',
    });
  const neighbour = (label: (p: number) => string, there: boolean): void => {
    if (there)
      lines.push({
        label: label(percent(table.k.coverNeighbour)),
        value: table.k.coverNeighbour,
        key: 'breach.coverNeighbour',
      });
  };
  if (c === 0) neighbour(BREACH_TEXT.ruinedEdge, true);
  else neighbour(BREACH_TEXT.westNeighbour, has(c - 1));
  if (c === last) neighbour(BREACH_TEXT.ruinedEdge, true);
  else neighbour(BREACH_TEXT.eastNeighbour, has(c + 1));
  const value = lines.reduce((sum, l) => sum + l.value, 0);
  return {
    value,
    breakdown: { label: BREACH_TEXT.cover(percent(value)), value, children: lines },
  };
};

/** The header line of a version 6 wave log: the wave's lane (1 to 8) and its cover (GDD §9.25). */
export const logHeader = (table: LaneTable, c: number): string =>
  BREACH_TEXT.logHeader(c + 1, percent(cover(table, c).value));

/** Extra counted pieces in column c that add depth: 0 for an empty column, at most `depthMax` (D581). */
export const extra = (table: LaneTable, c: number): number =>
  Math.min(table.k.depthMax, Math.max(0, (table.pieces[c] ?? 0) - 1));

/**
 * The Walls' share of damage not taken in lane c (D581): Walls constant × level × cover × (1 + depth).
 * With full cover and no depth it is today's 2% per level, bit for bit.
 */
/** Sector Support damage-taken reduction factor for lane `c` (`0` when unsupported or v6). */
export const sectorCut = (table: LaneTable, c: number): number =>
  (table.sectorCols?.[c] ?? 0) * (table.k.sectorBonus ?? 0);

export const wallCut = (table: LaneTable, wallsLevel: number, c: number): Explained => {
  const perLevel = num('walls.takenPerLevel');
  const base = perLevel * wallsLevel;
  const covered = cover(table, c);
  const stacking = table.k.depthStep * extra(table, c);
  const rampart = table.rampartCols?.[c] && table.k.rampartBonus ? table.k.rampartBonus : 0;
  const value = base * covered.value * (1 + stacking) * (1 + rampart);
  const children: Breakdown[] = [covered.breakdown];
  if ((table.pieces[c] ?? 0) > 1)
    children.push({
      label: BREACH_TEXT.stacked(percent(stacking)),
      value: stacking,
      formula: `${table.k.depthStep} × ${extra(table, c)}`,
      key: 'breach.depthStep',
    });
  if (rampart > 0)
    children.push({
      label: V18_TEXT.connectedRampart(percent(rampart)),
      value: rampart,
      formula: `1 + ${rampart}`,
      key: 'breach.rampartBonus',
    });
  return {
    value,
    breakdown: {
      label: BREACH_TEXT.walls(percent(value)),
      value,
      formula:
        rampart > 0
          ? `${perLevel} × level ${wallsLevel} × cover × (1 + stacked) × (1 + rampart)`
          : `${perLevel} × level ${wallsLevel} × cover × (1 + stacked)`,
      key: 'walls.takenPerLevel',
      children,
    },
  };
};

/** A tower's share of its volley for a wave d columns away, in hundredths (a whole percent). */
const reachShare = (table: LaneTable, d: number): number =>
  Math.round(100 * (table.k.towerReach[d] ?? 0));

/**
 * The tick-1 Steel volley in lane c (D582, D620): the volley per level × level × scale, shared
 * among the counted towers, weighted by distance, Screened Volley (v7), and Sector Support (v7).
 */
export const volley = (table: LaneTable, towerLevel: number, c: number): Explained => {
  const perLevel = num('watchtower.volleyPerLevel');
  const towers = table.towerCols.length;
  const shares = table.towerCols.map((col) => reachShare(table, Math.abs(col - c)));
  const scale = Math.round(100 * table.k.volleyScale);
  const isV7 = table.screened !== undefined || table.sectorCols !== undefined;
  let value = 0;
  const screenPct = Math.round(100 * (table.k.screenedBonus ?? 0));
  const sectorCount = table.sectorCols?.[c] ?? 0;
  const sectorPct = Math.round(100 * (table.k.sectorBonus ?? 0));
  if (towers > 0 && towerLevel > 0) {
    if (!isV7) {
      const total = shares.reduce((sum, s) => sum + s, 0);
      value = Math.floor((perLevel * towerLevel * scale * total) / (100 * 100 * towers));
    } else {
      const totalWeighted = shares.reduce(
        (sum, s, i) => sum + s * (table.screened?.[i] ? 100 + screenPct : 100),
        0,
      );
      const sectorScale = 100 + sectorCount * sectorPct;
      value = Math.floor(
        (perLevel * towerLevel * scale * totalWeighted * sectorScale) /
          (100 * 100 * towers * 100 * 100),
      );
    }
  }
  const children: Breakdown[] = table.towerCols.map((col, i) => {
    const share = shares[i] ?? 0;
    const isScreened = Boolean(table.screened?.[i]) && screenPct > 0;
    const mult = isScreened ? (100 + screenPct) / 100 : 1;
    return {
      label: BREACH_TEXT.tower(col + 1, share),
      value: (share * mult) / 100,
      key: isScreened ? 'breach.screenedBonus' : 'breach.towerReach',
      ...(isScreened
        ? {
            formula: `${share}% × (1 + ${table.k.screenedBonus ?? 0})`,
            children: [
              {
                label: V18_TEXT.screenedBonus(screenPct),
                value: table.k.screenedBonus ?? 0,
                key: 'breach.screenedBonus',
              },
            ],
          }
        : {}),
    };
  });
  if (isV7 && sectorCount > 0 && sectorPct > 0) {
    children.push({
      label: V18_TEXT.sectorSupport(sectorCount * sectorPct),
      value: (sectorCount * sectorPct) / 100,
      formula: `${sectorCount} × ${table.k.sectorBonus}`,
      key: 'breach.sectorBonus',
    });
  }
  return {
    value,
    breakdown: {
      label: BREACH_TEXT.volley(value),
      value,
      formula: `${perLevel} × level ${towerLevel} × scale ${table.k.volleyScale} × shared reach`,
      key: 'watchtower.volleyPerLevel',
      children,
    },
  };
};

export interface LaneInfo {
  /** 1 to 8, west to east. */
  readonly lane: number;
  readonly cover: Explained;
  readonly coverPercent: number;
  /** The share of the volley that reaches this lane, in whole percent (0 with no tower). */
  readonly towerReachPercent: number;
  /** Which of the first `breach.suggestWaves` waves come down this lane (wave numbers, from 1). */
  readonly waves: readonly number[];
  readonly wallCut: Explained;
  readonly volley: Explained;
  /** Counted pieces in this lane's column and its two neighbours, for the lit tiles. */
  readonly coverPieces: readonly HoldPieceId[];
  /** Counted towers whose volley reaches this lane. */
  readonly towerPieces: readonly HoldPieceId[];
  /** v7 connected-rampart wall cut bonus percent in this lane (0 when inactive). */
  readonly rampartPercent: number;
  /** v7 count of Screened Watchtowers whose volley reaches this lane. */
  readonly screenedTowers: number;
  /** v7 Sector Support volley & cut bonus percent in this lane (0 when inactive). */
  readonly sectorPercent: number;
}

export interface LaneView {
  /** Lanes exist from Bastion on; before it the strip does not appear (GDD §9.25). */
  readonly shown: boolean;
  /** `breach.suggestWaves`: how many upcoming waves the dots and the list look at. */
  readonly waveCount: number;
  readonly lanes: readonly LaneInfo[];
  /** No piece counts: only the ruined edge gives cover. */
  readonly none: boolean;
  /** Unlocked walls and towers waiting in the Tray, which give nothing (the Start confirmation's line). */
  readonly trayDefenses: number;
  /** Total active Screened Watchtowers across the yard. */
  readonly screenedCount: number;
}

const build = (state: GameState): LaneView => {
  const counted = countedPieces(state);
  const table = laneTableFor(state);
  const seed = standSeed(state);
  const firstWaves = lanesFor(seed, num('breach.suggestWaves'));
  const towers = table.towerCols.length;
  const rampartPct = percent(table.k.rampartBonus ?? 0);
  const sectorPct = percent(table.k.sectorBonus ?? 0);
  const screenedCount = (table.screened ?? []).filter(Boolean).length;
  const lanes = table.pieces.map((_, c): LaneInfo => {
    const covered = cover(table, c);
    const shares = table.towerCols.map((col) => reachShare(table, Math.abs(col - c)));
    let screenedTowers = 0;
    for (let i = 0; i < table.towerCols.length; i++) {
      if (table.screened?.[i] && (shares[i] ?? 0) > 0) screenedTowers += 1;
    }
    return {
      lane: c + 1,
      cover: covered,
      coverPercent: percent(covered.value),
      towerReachPercent:
        towers === 0 ? 0 : Math.round(shares.reduce((sum, s) => sum + s, 0) / towers),
      waves: firstWaves.flatMap((lane, i) => (lane === c ? [i + 1] : [])),
      wallCut: wallCut(table, state.buildings.walls, c),
      volley: volley(table, state.buildings.watchtower, c),
      coverPieces: counted.filter((p) => Math.abs(p.x - c) <= 1).map((p) => p.id),
      towerPieces: counted
        .filter((p) => p.tower && reachShare(table, Math.abs(p.x - c)) > 0)
        .map((p) => p.id),
      rampartPercent: table.rampartCols?.[c] ? rampartPct : 0,
      screenedTowers,
      sectorPercent: (table.sectorCols?.[c] ?? 0) * sectorPct,
    };
  });
  return {
    shown: state.cycle.age === 'bastion',
    waveCount: num('breach.suggestWaves'),
    lanes,
    none: counted.length === 0,
    trayDefenses: PIECES.filter(
      (p) => isDefense(p.id) && isPieceUnlocked(state, p.id) && !state.layout.placed[p.id],
    ).length,
    screenedCount,
  };
};

/** Everything the view reads, as one string: the view is rebuilt only when it changes (like the grid view, N6). */
const signature = (state: GameState): string =>
  [
    state.meta.gameSeed,
    state.cycle.number,
    state.cycle.age,
    JSON.stringify(state.layout.placed),
    state.buildings.walls,
    state.buildings.watchtower,
  ].join('|');

let memo: { key: string; view: LaneView } | null = null;

/**
 * The Lanes strip, its text list and its breakdown sheet (GDD §9.25), from the layout as it is now.
 * Treat the result as read-only. It changes nothing in the state.
 */
export const laneView = (state: GameState): LaneView => {
  const key = signature(state);
  if (memo?.key === key) return memo.view;
  const view = build(state);
  memo = { key, view };
  return view;
};

/**
 * The score Suggest layout maximizes (technical design §23.2): for each lane, its number of waves
 * times its cover (with depth) plus its tower reach. Cover and tower reach weigh the same, a fixed
 * design choice and not a tuned one.
 */
export const layoutScore = (table: LaneTable, waves: readonly number[]): number => {
  const towers = table.towerCols.length;
  const screenPct = Math.round(100 * (table.k.screenedBonus ?? 0));
  let sum = 0;
  for (let c = 0; c < table.pieces.length; c++) {
    const w = waves[c] ?? 0;
    if (w === 0) continue;
    const shares = table.towerCols.reduce(
      (s, col, i) =>
        s +
        reachShare(table, Math.abs(col - c)) * (table.screened?.[i] ? (100 + screenPct) / 100 : 1),
      0,
    );
    const sectorMult = 1 + (table.sectorCols?.[c] ?? 0) * (table.k.sectorBonus ?? 0);
    const reach = towers === 0 ? 0 : (shares / (100 * towers)) * sectorMult;
    const rampartMult =
      table.rampartCols?.[c] && table.k.rampartBonus ? 1 + table.k.rampartBonus : 1;
    const wallTerm = coverValue(table, c) * (1 + table.k.depthStep * extra(table, c)) * rampartMult;
    sum += w * (wallTerm + reach);
  }
  return sum;
};

/** One defense to put on one front-row tile; a list of these is what Suggest layout returns. */
export interface LayoutMove {
  readonly pieceId: HoldPieceId;
  readonly x: number;
  readonly y: number;
}

export interface LayoutSuggestion {
  /** In the order they were chosen. Empty when no wall or tower is owned. */
  readonly moves: readonly LayoutMove[];
  readonly score: number;
  /** The score of Auto-arrange's defense positions that stand on free tiles (what the rule had to beat). */
  readonly autoScore: number;
}

const isDefense = (id: string): boolean => id.startsWith('wall-') || id.startsWith('watchtower-');

const ECON_PLOTS = new Set<string>(['farm', 'woodcutters-camp', 'mine', 'silver-seam']);

const northWardScore = (
  front: readonly PlacedCoord[],
  baseBlocked: Uint8Array,
  blocked: Uint8Array,
  reached: Uint8Array,
  queue: Int8Array,
  hallIndices: readonly number[],
  plotIndices: readonly number[],
  clearIndices: readonly number[],
): number => {
  blocked.set(baseBlocked);
  for (const p of front) blocked[p.y * GRID_COLS + p.x] = 1;
  reached.fill(0);
  let head = 0;
  let tail = 0;
  for (let x = 0; x < GRID_COLS; x += 1) {
    if (blocked[x]) continue;
    reached[x] = 1;
    queue[tail++] = x;
  }
  while (head < tail) {
    const idx = queue[head++];
    if (idx === undefined) continue;
    const x = idx % GRID_COLS;
    if (x > 0 && !blocked[idx - 1] && !reached[idx - 1]) {
      reached[idx - 1] = 1;
      queue[tail++] = idx - 1;
    }
    if (x + 1 < GRID_COLS && !blocked[idx + 1] && !reached[idx + 1]) {
      reached[idx + 1] = 1;
      queue[tail++] = idx + 1;
    }
    if (idx >= GRID_COLS && !blocked[idx - GRID_COLS] && !reached[idx - GRID_COLS]) {
      reached[idx - GRID_COLS] = 1;
      queue[tail++] = idx - GRID_COLS;
    }
    if (
      idx + GRID_COLS < GRID_COLS * GRID_ROWS &&
      !blocked[idx + GRID_COLS] &&
      !reached[idx + GRID_COLS]
    ) {
      reached[idx + GRID_COLS] = 1;
      queue[tail++] = idx + GRID_COLS;
    }
  }
  let hearthWarded = hallIndices.length > 0 ? 1 : 0;
  for (let i = 0; i < hallIndices.length; i++) {
    const hIdx = hallIndices[i];
    if (hIdx !== undefined && reached[hIdx] !== 0) {
      hearthWarded = 0;
      break;
    }
  }
  let wardedPlots = 0;
  for (let i = 0; i < plotIndices.length; i++) {
    const pIdx = plotIndices[i];
    if (pIdx !== undefined && reached[pIdx] === 0) wardedPlots += 1;
  }
  let unreachedClear = 0;
  for (let i = 0; i < clearIndices.length; i++) {
    const cIdx = clearIndices[i];
    if (cIdx !== undefined && reached[cIdx] === 0) unreachedClear += 1;
  }
  return (
    hearthWarded * WARD_SUGGEST_WEIGHTS.hearthWarded +
    wardedPlots * WARD_SUGGEST_WEIGHTS.wardedPlot +
    unreachedClear * WARD_SUGGEST_WEIGHTS.unreachedClear
  );
};

/** Suggest layout for a given list of lanes (the first waves of the stand, or a fixed fixture). Changes nothing. */
export const suggestLayoutFor = (
  state: GameState,
  lanes: readonly number[],
  mode: LayoutArrangeMode = 'balanced',
): LayoutSuggestion => {
  const rows = num('breach.frontRows');
  const laneCount = num('breach.lanes');
  const k = numbersNow();
  const waves = Array.from({ length: laneCount }, (_, c) => lanes.filter((l) => l === c).length);
  // Tiles another building holds, wherever that building is in its states (a blueprint holds its tile).
  const held = new Set<string>();
  const hallIndices: number[] = [];
  const plotIndices: number[] = [];
  for (const def of PIECES) {
    const at = state.layout.placed[def.id];
    if (!at || isDefense(def.id)) continue;
    const fp = footprint(def, at);
    for (const t of fp) held.add(`${t.x},${t.y}`);
    if (getPieceStatus(state, def.id) === 'active') {
      if (def.id === 'hearth-hall') {
        for (const t of fp) hallIndices.push(gridIndex(t.x, t.y, GRID_COLS));
      } else if (ECON_PLOTS.has(def.building) && fp[0]) {
        plotIndices.push(gridIndex(fp[0].x, fp[0].y, GRID_COLS));
      }
    }
  }
  const bounds = clearingBounds(state.cycle.age);
  const free: SuggestTile[] = [];
  const clearIndices: number[] = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < laneCount; x++) {
      if (!inClearing(bounds, { x, y })) continue;
      if (y > 0) clearIndices.push(gridIndex(x, y, GRID_COLS));
      if (y < rows && !held.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  const owned = PIECES.filter((p) => isDefense(p.id) && isPieceUnlocked(state, p.id)).map((p) => ({
    id: p.id,
    tower: p.id.startsWith('watchtower-'),
  }));
  const behind = behindDefenses(state);
  const sectorCols = activeSectorCols(state, laneCount);
  const occScratch = new Uint8Array(laneCount * GRID_ROWS);
  const connScratch = new Uint8Array(laneCount * GRID_ROWS);
  const breachScore = (cols: readonly PlacedCoord[]): number =>
    layoutScore(tableOf(cols, k, sectorCols, behind, laneCount, occScratch, connScratch), waves);
  const baseBlocked = new Uint8Array(GRID_COLS * GRID_ROWS);
  for (const p of behind) baseBlocked[gridIndex(p.x, p.y, GRID_COLS)] = 1;
  const blockedScratch = new Uint8Array(GRID_COLS * GRID_ROWS);
  const reachedScratch = new Uint8Array(GRID_COLS * GRID_ROWS);
  const queueScratch = new Int8Array(GRID_COLS * GRID_ROWS);
  const objective =
    mode === 'economy'
      ? (cols: readonly PlacedCoord[]): number =>
          northWardScore(
            cols,
            baseBlocked,
            blockedScratch,
            reachedScratch,
            queueScratch,
            hallIndices,
            plotIndices,
            clearIndices,
          ) + breachScore(cols)
      : breachScore;
  const greedy = greedyPlacement(owned, free, objective);
  // Auto-arrange's defense positions, on the tiles Suggest may use, worked out on a copy.
  const probe = {
    ...state,
    layout: { ...state.layout, placed: { ...state.layout.placed } },
  } as GameState;
  autoArrange(probe, mode);
  const freeKeys = new Set(free.map((t) => `${t.x},${t.y}`));
  const auto = countedPieces(probe).filter((p) => freeKeys.has(`${p.x},${p.y}`));
  const greedyObj = objective(greedy);
  const autoObj = objective(auto);
  const autoScore = breachScore(auto);
  const greedyScore = breachScore(greedy);
  const useAuto = autoObj > greedyObj;
  const chosen = useAuto
    ? auto.map((p) => ({ pieceId: p.id, x: p.x, y: p.y }))
    : greedy.map((p) => ({ pieceId: p.id as HoldPieceId, x: p.x, y: p.y }));
  return { moves: chosen, score: useAuto ? autoScore : greedyScore, autoScore };
};

/** Suggest layout from the stand's own lanes: the first `breach.suggestWaves` waves (GDD §5.9.11). */
export const suggestLayout = (
  state: GameState,
  mode: LayoutArrangeMode = 'balanced',
): LayoutSuggestion =>
  suggestLayoutFor(state, lanesFor(standSeed(state), num('breach.suggestWaves')), mode);

const known = (id: unknown): id is HoldPieceId =>
  typeof id === 'string' && PIECES.some((p) => p.id === id);

/**
 * Applies a Suggest layout list in one step (technical design §23.3, the command `layout.setDefenses`).
 * Atomic: it checks everything first and returns the reason, with nothing changed, when any move is
 * refused. It touches only walls and towers: unlocked front-row defenses that are not in the list go
 * to the Tray, then each listed defense takes its target; defenses behind the front rows stay.
 */
export const setDefenses = (state: GameState, moves: unknown): string | null => {
  if (!Array.isArray(moves)) return 'layout: the moves must be a list';
  const rows = num('breach.frontRows');
  const lanes = num('breach.lanes');
  const bounds = clearingBounds(state.cycle.age);
  const listed = new Set<string>();
  const targets = new Set<string>();
  for (const m of moves as { pieceId: unknown; x: unknown; y: unknown }[]) {
    if (!m || !known(m.pieceId) || !isDefense(m.pieceId))
      return 'layout: only walls and towers can be set';
    if (!isPieceUnlocked(state, m.pieceId)) return 'layout: piece is locked';
    if (listed.has(m.pieceId)) return 'layout: a piece is listed twice';
    const { x, y } = m;
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      y < 0 ||
      y >= rows ||
      x < 0 ||
      x >= lanes ||
      !inClearing(bounds, { x, y })
    )
      return 'layout: a target is not a front-row tile';
    if (targets.has(`${x},${y}`)) return 'layout: two pieces on one tile';
    listed.add(m.pieceId);
    targets.add(`${x},${y}`);
  }
  // A target must hold no other building (a blueprint holds its tile).
  for (const def of PIECES) {
    const at = state.layout.placed[def.id];
    if (!at || isDefense(def.id)) continue;
    if (footprint(def, at).some((t) => targets.has(`${t.x},${t.y}`)))
      return 'layout: a target is held by another building';
  }
  // The other pieces keep their order and their spots.
  const placed: Record<string, { x: number; y: number }> = {};
  for (const [id, at] of Object.entries(state.layout.placed)) {
    // Built front-row defenses leave for the Tray; a locked blueprint is only moved off a target.
    const lifted =
      isDefense(id) &&
      !listed.has(id) &&
      ((at.y < rows && isPieceUnlocked(state, id as HoldPieceId)) ||
        targets.has(`${at.x},${at.y}`));
    if (!lifted) placed[id] = at;
  }
  for (const m of moves as LayoutMove[]) placed[m.pieceId] = { x: m.x, y: m.y };
  state.layout.placed = placed as GameState['layout']['placed'];
  return null;
};

/**
 * The lane table the hold would give if a Suggest layout list were applied (GDD §9.25: the line under
 * the suggestion). Works on a copy; changes nothing. Returns null when the list would be refused.
 */
export const laneTableAfter = (
  state: GameState,
  moves: readonly LayoutMove[],
): LaneTable | null => {
  const copy = { ...state, layout: structuredClone(state.layout) } as GameState;
  if (
    setDefenses(
      copy,
      moves.map((m) => ({ ...m })),
    )
  )
    return null;
  return laneTableFor(copy);
};

/** The debug panel's line for `debug.breach.freeze`: the table a stand started now would freeze. Saves nothing. */
export const describeFreeze = (state: GameState): string => {
  if (state.cycle.age !== 'bastion') return 'No lanes before Bastion.';
  const table = laneTableFor(state);
  return `Counted pieces per lane ${JSON.stringify(table.pieces)}; towers in columns ${JSON.stringify(table.towerCols)}.`;
};

const SUPPORT_IDS = ['barracks', 'lodge'] as const;
type SupportId = (typeof SUPPORT_IDS)[number];

/** Picks support tiles (`barracks`, `lodge`) that maximize Sector Support coverage over weighted Breach lanes. */
const chooseSupportMoves = (
  state: GameState,
  laneWeights: readonly number[],
  rows: number,
  lanes: number,
): Partial<Record<SupportId, GridCoord>> => {
  const bounds = clearingBounds(state.cycle.age);
  const unlockedSupport = SUPPORT_IDS.filter((id) => isPieceUnlocked(state, id));
  if (unlockedSupport.length === 0) return {};

  const blocked = new Set<string>();
  for (const def of PIECES) {
    if (isDefense(def.id)) continue;
    if ((SUPPORT_IDS as readonly string[]).includes(def.id) && isPieceUnlocked(state, def.id))
      continue;
    const at = state.layout.placed[def.id];
    if (!at) continue;
    for (const t of footprint(def, at)) blocked.add(`${t.x},${t.y}`);
  }

  const freeSupportTiles = (id: SupportId): GridCoord[] => {
    const out: GridCoord[] = [];
    const seenCol = new Set<number>();
    const cur = state.layout.placed[id];
    if (cur && inClearing(bounds, cur) && !blocked.has(`${cur.x},${cur.y}`)) {
      out.push(cur);
      seenCol.add(cur.x);
    }
    for (let y = Math.max(bounds.minY, rows); y <= bounds.maxY; y += 1) {
      for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
        if (seenCol.has(x) || blocked.has(`${x},${y}`)) continue;
        out.push({ x, y });
        seenCol.add(x);
      }
    }
    if (out.length === 0) {
      for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
        for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
          if (!blocked.has(`${x},${y}`)) out.push({ x, y });
        }
      }
    }
    return out;
  };

  const overlapMult = 1 + numbersNow().coverNeighbour;
  const scoreSupport = (b?: GridCoord, l?: GridCoord): number => {
    let total = 0;
    for (let c = 0; c < lanes; c += 1) {
      const hasB = b && Math.abs(c - b.x) <= 1;
      const hasL = l && Math.abs(c - l.x) <= 1;
      const mult = hasB && hasL ? overlapMult : hasB || hasL ? 1 : 0;
      total += mult * (laneWeights[c] ?? 1);
    }
    return total;
  };

  const bUnlocked = unlockedSupport.includes('barracks');
  const lUnlocked = unlockedSupport.includes('lodge');
  const bOpts = bUnlocked ? freeSupportTiles('barracks') : [undefined];
  const lOpts = lUnlocked ? freeSupportTiles('lodge') : [undefined];
  let bestScore = -1;
  let bestB: GridCoord | undefined;
  let bestL: GridCoord | undefined;
  for (const b of bOpts) {
    for (const l of lOpts) {
      if (b && l && b.x === l.x && b.y === l.y) continue;
      const s = scoreSupport(b, l);
      if (s > bestScore) {
        bestScore = s;
        bestB = b;
        bestL = l;
      }
    }
  }
  return {
    ...(bUnlocked && bestB ? { barracks: bestB } : {}),
    ...(lUnlocked && bestL ? { lodge: bestL } : {}),
  };
};

/** Builds a connected row-`minY` rampart centered on peak lanes, Screened Watchtowers behind it, and extra walls. */
const rampartScreenCandidate = (
  state: GameState,
  free: readonly SuggestTile[],
  laneWeights: readonly number[],
  evalPlaced: (coords: readonly PlacedCoord[]) => number,
): LayoutMove[] => {
  const bounds = clearingBounds(state.cycle.age);
  const owned = PIECES.filter((p) => isDefense(p.id) && isPieceUnlocked(state, p.id));
  const walls = owned.filter((p) => !p.id.startsWith('watchtower-')).map((p) => p.id);
  const towers = owned.filter((p) => p.id.startsWith('watchtower-')).map((p) => p.id);
  if (walls.length === 0 && towers.length === 0) return [];

  const freeSet = new Set(free.map((t) => `${t.x},${t.y}`));
  const used = new Set<string>();
  const coords: PlacedCoord[] = [];
  const moves: LayoutMove[] = [];
  const take = (id: HoldPieceId, x: number, y: number, tower: boolean): boolean => {
    const key = `${x},${y}`;
    if (!freeSet.has(key) || used.has(key)) return false;
    used.add(key);
    coords.push({ x, y, tower });
    moves.push({ pieceId: id, x, y });
    return true;
  };

  // Cover as many contiguous northmost columns (minY) as total owned defenses allow before stacking behind.
  const minY = bounds.minY;
  const k = numbersNow();
  const northCols = free.filter((t) => t.y === minY).map((t) => t.x);
  const pickContiguous = (cols: readonly number[], len: number): number[] => {
    if (len <= 0) return [];
    let bestSlice: number[] = [];
    let bestSpanScore = -Infinity;
    for (let i = 0; i <= cols.length - len; i += 1) {
      const slice = cols.slice(i, i + len);
      const contiguous = slice.every((col, idx) => {
        const prev = slice[idx - 1];
        return idx === 0 || (prev !== undefined && col === prev + 1);
      });
      if (!contiguous) continue;
      let score = 0;
      for (const c of slice) {
        score +=
          (laneWeights[c] ?? 0) +
          k.coverNeighbour * ((laneWeights[c - 1] ?? 0) + (laneWeights[c + 1] ?? 0));
      }
      if (score > bestSpanScore) {
        bestSpanScore = score;
        bestSlice = slice;
      }
    }
    if (bestSlice.length > 0) return bestSlice;
    return [...cols]
      .sort((a, b) => (laneWeights[b] ?? 0) - (laneWeights[a] ?? 0) || a - b)
      .slice(0, len);
  };

  const targetCols = Math.min(walls.length + towers.length, northCols.length);
  const chosenNorth = pickContiguous(northCols, targetCols);
  const wallSpan = Math.min(walls.length, chosenNorth.length);
  const wallCols = pickContiguous(chosenNorth, wallSpan);
  const wallColSet = new Set(wallCols);
  let wIdx = 0;
  for (const x of wallCols) {
    const wId = walls[wIdx];
    if (!wId) break;
    if (take(wId, x, minY, false)) wIdx += 1;
  }

  // Put front-line towers on any remaining chosenNorth columns first (preferring interior columns)
  // so every column has cover, then place remaining watchtowers directly south of a connected north
  // wall in distinct interior columns when available (Screened Volley + full-lane reach).
  const towerNorthCols = chosenNorth
    .filter((x) => !wallColSet.has(x))
    .sort((a, b) => Math.abs(a - HOLD_CENTER.x) - Math.abs(b - HOLD_CENTER.x) || a - b);
  let tIdx = 0;
  for (const x of towerNorthCols) {
    if (tIdx >= towers.length) break;
    const tId = towers[tIdx];
    if (tId && take(tId, x, minY, true)) tIdx += 1;
  }
  while (tIdx < towers.length) {
    const tId = towers[tIdx];
    if (!tId) break;
    const northWalls = new Set(coords.filter((p) => !p.tower && p.y === minY).map((p) => p.x));
    const screenedOptions = free.filter(
      (t) => t.y === minY + 1 && northWalls.has(t.x) && !used.has(`${t.x},${t.y}`),
    );
    const distinctScreened = screenedOptions.filter(
      (t) => !coords.some((p) => p.tower && p.x === t.x),
    );
    const pool =
      distinctScreened.length > 0
        ? distinctScreened
        : screenedOptions.length > 0
          ? screenedOptions
          : free.filter((t) => !used.has(`${t.x},${t.y}`));
    let bestTile: SuggestTile | null = null;
    let bestScore = -Infinity;
    for (const tile of pool) {
      const s = evalPlaced([...coords, { x: tile.x, y: tile.y, tower: true }]);
      if (s > bestScore) {
        bestScore = s;
        bestTile = tile;
      }
    }
    if (!bestTile) break;
    take(tId, bestTile.x, bestTile.y, true);
    tIdx += 1;
  }

  // Spread remaining walls evenly across columns (fewest placed pieces first) to build depth without over-stacking.
  while (wIdx < walls.length) {
    const wId = walls[wIdx];
    if (!wId) break;
    const avail = free.filter((t) => !used.has(`${t.x},${t.y}`));
    if (avail.length === 0) break;
    const colCount = (x: number): number => coords.filter((p) => p.x === x).length;
    const minDepth = Math.min(...avail.map((t) => colCount(t.x)));
    const wallPool = avail.filter((t) => colCount(t.x) === minDepth);
    let bestTile: SuggestTile | null = null;
    let bestScore = -Infinity;
    for (const tile of wallPool) {
      const s = evalPlaced([...coords, { x: tile.x, y: tile.y, tower: false }]);
      if (s > bestScore) {
        bestScore = s;
        bestTile = tile;
      }
    }
    if (!bestTile) break;
    take(wId, bestTile.x, bestTile.y, false);
    wIdx += 1;
  }

  return moves;
};

/**
 * GDD §6.1 & v1.8 (D589, T18.12): the commands the Tactician sends to arrange the hold for v7 Breach
 * tactics: spreads `barracks` / `lodge` for Sector Support, compares balanced/fortress Suggest and
 * Auto-arrange plus connected Screened Ramparts across opening + uniform lane weights, and emits
 * `layout.unplace` then `layout.place` commands.
 */
export const tacticianCommands = (state: GameState): Command[] => {
  const rows = num('breach.frontRows');
  const laneCount = num('breach.lanes');
  const bounds = clearingBounds(state.cycle.age);
  const k = numbersNow();
  const waves12 = lanesFor(standSeed(state), num('breach.suggestWaves'));
  const tailWeight = 1 + waves12.length / Math.max(1, laneCount);
  const combinedWeights = Array.from(
    { length: laneCount },
    (_, c) => waves12.filter((l) => l === c).length + tailWeight,
  );

  const supportMoves = chooseSupportMoves(state, combinedWeights, rows, laneCount);
  const probe = {
    ...state,
    layout: { ...state.layout, placed: { ...state.layout.placed } },
  } as GameState;
  for (const [id, at] of Object.entries(supportMoves)) {
    if (at) probe.layout.placed[id as HoldPieceId] = at;
  }

  const held = new Set<string>();
  for (const def of PIECES) {
    if (isDefense(def.id)) continue;
    const at = probe.layout.placed[def.id];
    if (!at) continue;
    for (const t of footprint(def, at)) held.add(`${t.x},${t.y}`);
  }
  const free: SuggestTile[] = [];
  for (let y = bounds.minY; y <= Math.min(bounds.maxY, rows - 1); y += 1) {
    for (let x = bounds.minX; x <= Math.min(bounds.maxX, laneCount - 1); x += 1) {
      if (!held.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  const freeKeys = new Set(free.map((t) => `${t.x},${t.y}`));
  const behind = behindDefenses(probe);
  const sectorCols = activeSectorCols(probe, laneCount);
  const occScratch = new Uint8Array(laneCount * GRID_ROWS);
  const connScratch = new Uint8Array(laneCount * GRID_ROWS);
  const evalPlaced = (coords: readonly PlacedCoord[]): number =>
    layoutScore(
      tableOf(coords, k, sectorCols, behind, laneCount, occScratch, connScratch),
      combinedWeights,
    );

  const autoDefenses = (mode: LayoutArrangeMode): LayoutMove[] => {
    const copy = {
      ...probe,
      layout: { ...probe.layout, placed: { ...probe.layout.placed } },
    } as GameState;
    autoArrange(copy, mode);
    const moves = countedPieces(copy)
      .filter((p) => freeKeys.has(`${p.x},${p.y}`))
      .map((p) => ({ pieceId: p.id, x: p.x, y: p.y }));
    for (let i = 0; i < moves.length; i += 1) {
      const m = moves[i];
      if (!m || !m.pieceId.startsWith('watchtower-')) continue;
      const alreadyScreened = moves.some(
        (w) => w.x === m.x && !w.pieceId.startsWith('watchtower-') && w.y === m.y - 1,
      );
      if (alreadyScreened) continue;
      const southWalls = moves
        .filter((w) => w.x === m.x && !w.pieceId.startsWith('watchtower-') && w.y > m.y)
        .sort((a, b) => a.y - b.y);
      const targetWall = southWalls[0];
      if (!targetWall) continue;
      const wallIdx = moves.indexOf(targetWall);
      if (wallIdx !== -1) {
        moves[i] = { ...m, y: targetWall.y };
        moves[wallIdx] = { ...targetWall, y: m.y };
      }
    }
    return moves;
  };

  const candidates: LayoutMove[][] = [
    [...suggestLayoutFor(probe, waves12, 'balanced').moves],
    [...suggestLayoutFor(probe, waves12, 'fortress').moves],
    autoDefenses('balanced'),
    autoDefenses('fortress'),
    rampartScreenCandidate(probe, free, combinedWeights, evalPlaced),
  ];

  const ownedDefenseCount = PIECES.filter(
    (p) => isDefense(p.id) && isPieceUnlocked(probe, p.id),
  ).length;
  const targetCols = Math.min(laneCount, ownedDefenseCount);
  const targetDepth2 = Math.max(0, Math.min(laneCount, ownedDefenseCount - laneCount));
  let bestMoves = candidates[0] ?? [];
  let bestRank: readonly number[] | null = null;
  const beats = (next: readonly number[], cur: readonly number[] | null): boolean => {
    if (!cur) return true;
    for (let i = 0; i < next.length; i += 1) {
      const a = next[i] ?? 0;
      const b = cur[i] ?? 0;
      if (a !== b) return a > b;
    }
    return false;
  };
  for (const cand of candidates) {
    const coords: PlacedCoord[] = cand.map((m) => ({
      x: m.x,
      y: m.y,
      tower: m.pieceId.startsWith('watchtower-'),
    }));
    const table = tableOf(coords, k, sectorCols, behind, laneCount, occScratch, connScratch);
    const coveredCols = Math.min(targetCols, table.pieces.filter((n) => n > 0).length);
    const depth2Cols = Math.min(targetDepth2, table.pieces.filter((n) => n >= 2).length);
    const distinctTowers = new Set(table.towerCols).size;
    const interiorTowers = table.towerCols.filter((c) => c >= 2 && c < laneCount - 2).length;
    const screenedCount = (table.screened ?? []).filter(Boolean).length;
    const rank = [
      coveredCols,
      depth2Cols,
      distinctTowers,
      interiorTowers,
      screenedCount,
      layoutScore(table, combinedWeights),
    ];
    if (beats(rank, bestRank)) {
      bestRank = rank;
      bestMoves = cand;
    }
  }

  const movedSupport = SUPPORT_IDS.filter((id) => {
    const next = supportMoves[id];
    const cur = state.layout.placed[id];
    return next !== undefined && (!cur || cur.x !== next.x || cur.y !== next.y);
  });

  const lift: Command[] = [
    ...PIECES.filter(
      (p) => isDefense(p.id) && isPieceUnlocked(state, p.id) && state.layout.placed[p.id],
    ).map((p): Command => ({ type: 'layout.unplace', pieceId: p.id })),
    ...movedSupport
      .filter((id) => state.layout.placed[id])
      .map((id): Command => ({ type: 'layout.unplace', pieceId: id })),
  ];
  const putSupport: Command[] = movedSupport.flatMap((id): Command[] => {
    const at = supportMoves[id];
    return at ? [{ type: 'layout.place', pieceId: id, x: at.x, y: at.y }] : [];
  });
  const putDefenses: Command[] = bestMoves.map((m): Command => ({
    type: 'layout.place',
    pieceId: m.pieceId,
    x: m.x,
    y: m.y,
  }));
  return [...lift, ...putSupport, ...putDefenses];
};

/**
 * GDD §6.1 (D589): the simulated players' one arrangement, sent through whatever `act` they use. It
 * lives here because only this module (with the layout modules) may name the layout in core. Every
 * player sends Auto-arrange; the Tactician passes the state it is playing and sends the Suggest rule.
 */
export const arrangeHold = (act: (cmd: Command) => boolean, tactician?: GameState): boolean =>
  tactician
    ? tacticianCommands(tactician).every((cmd) => act(cmd))
    : act({ type: 'layout.autoArrange' });
