import { BREACH_TEXT } from '../../content/breach-text';
import { PIECES, type HoldPieceId } from '../../content/hold-layout';
import { constantAt, num } from '../balance-access';
import type { Breakdown, Explained } from '../breakdown/breakdown';
import { seeded } from '../rng';
import { standSeed } from '../stand/waves';
import type { GameState } from '../state/game-state';
import type { LaneTable } from '../state/lane-table';
import { getPieceStatus } from './layout';

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

/** The table a stand freezes when Start is pressed: the only place the layout is read for combat. */
export const laneTableFor = (state: Hold): LaneTable => {
  const pieces = new Array<number>(num('breach.lanes')).fill(0);
  const towerCols: number[] = [];
  for (const p of countedPieces(state)) {
    pieces[p.x] = (pieces[p.x] ?? 0) + 1;
    if (p.tower) towerCols.push(p.x);
  }
  towerCols.sort((a, b) => a - b);
  return {
    pieces,
    towerCols,
    k: {
      coverOwn: num('breach.coverOwn'),
      coverNeighbour: num('breach.coverNeighbour'),
      depthStep: num('breach.depthStep'),
      depthMax: num('breach.depthMax'),
      towerReach: [...(constantAt('breach.towerReach').value as number[])],
      volleyScale: num('breach.volleyScale'),
    },
  };
};

const percent = (v: number): number => Math.round(100 * v);

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

/** Extra counted pieces in column c that add depth: 0 for an empty column, at most `depthMax` (D581). */
export const extra = (table: LaneTable, c: number): number =>
  Math.min(table.k.depthMax, Math.max(0, (table.pieces[c] ?? 0) - 1));

/**
 * The Walls' share of damage not taken in lane c (D581): Walls constant × level × cover × (1 + depth).
 * With full cover and no depth it is today's 2% per level, bit for bit.
 */
export const wallCut = (table: LaneTable, wallsLevel: number, c: number): Explained => {
  const perLevel = num('walls.takenPerLevel');
  const base = perLevel * wallsLevel;
  const covered = cover(table, c);
  const stacking = table.k.depthStep * extra(table, c);
  const value = base * covered.value * (1 + stacking);
  const children: Breakdown[] = [covered.breakdown];
  if ((table.pieces[c] ?? 0) > 1)
    children.push({
      label: BREACH_TEXT.stacked(percent(stacking)),
      value: stacking,
      formula: `${table.k.depthStep} × ${extra(table, c)}`,
      key: 'breach.depthStep',
    });
  return {
    value,
    breakdown: {
      label: BREACH_TEXT.walls(percent(value)),
      value,
      formula: `${perLevel} × level ${wallsLevel} × cover × (1 + stacked)`,
      key: 'walls.takenPerLevel',
      children,
    },
  };
};

/** A tower's share of its volley for a wave d columns away, in hundredths (a whole percent). */
const reachShare = (table: LaneTable, d: number): number =>
  Math.round(100 * (table.k.towerReach[d] ?? 0));

/**
 * The tick-1 Steel volley in lane c (D582): the volley per level × level × scale, shared among the
 * counted towers, each reaching the lane by distance. 0 when no tower counts, and at level 0.
 */
export const volley = (table: LaneTable, towerLevel: number, c: number): Explained => {
  const perLevel = num('watchtower.volleyPerLevel');
  const towers = table.towerCols.length;
  const shares = table.towerCols.map((col) => reachShare(table, Math.abs(col - c)));
  const total = shares.reduce((sum, s) => sum + s, 0);
  const scale = Math.round(100 * table.k.volleyScale);
  const value =
    towers === 0 || towerLevel === 0
      ? 0
      : Math.floor((perLevel * towerLevel * scale * total) / (100 * 100 * towers));
  const children: Breakdown[] = table.towerCols.map((col, i) => ({
    label: BREACH_TEXT.tower(col + 1, shares[i] ?? 0),
    value: (shares[i] ?? 0) / 100,
    key: 'breach.towerReach',
  }));
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
}

export interface LaneView {
  readonly lanes: readonly LaneInfo[];
  /** No piece counts: only the ruined edge gives cover. */
  readonly none: boolean;
}

const build = (state: GameState): LaneView => {
  const counted = countedPieces(state);
  const table = laneTableFor(state);
  const seed = standSeed(state);
  const firstWaves = lanesFor(seed, num('breach.suggestWaves'));
  const towers = table.towerCols.length;
  const lanes = table.pieces.map((_, c): LaneInfo => {
    const covered = cover(table, c);
    const shares = table.towerCols.map((col) => reachShare(table, Math.abs(col - c)));
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
    };
  });
  return { lanes, none: counted.length === 0 };
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
