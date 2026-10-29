import { BREACH_TEXT } from '../../content/breach-text';
import { PIECES, type HoldPieceId } from '../../content/hold-layout';
import { constantAt, num } from '../balance-access';
import type { Breakdown, Explained } from '../breakdown/breakdown';
import { seeded } from '../rng';
import { standPoolOf } from '../stand/pool';
import { standSeed, waveList, type Wave } from '../stand/waves';
import type { GameState } from '../state/game-state';
import type { LaneTable } from '../state/lane-table';
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
});

/** The table for counted pieces at these columns: how many in each column, and where the towers are. */
const tableOf = (cols: readonly { x: number; tower: boolean }[], k: LaneTable['k']): LaneTable => {
  const pieces = new Array<number>(num('breach.lanes')).fill(0);
  const towerCols: number[] = [];
  for (const p of cols) {
    pieces[p.x] = (pieces[p.x] ?? 0) + 1;
    if (p.tower) towerCols.push(p.x);
  }
  towerCols.sort((a, b) => a - b);
  return { pieces, towerCols, k };
};

/** The table a stand freezes when Start is pressed: the only place the layout is read for combat. */
export const laneTableFor = (state: Hold): LaneTable => tableOf(countedPieces(state), numbersNow());

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
  /** Lanes exist from Bastion on; before it the strip does not appear (GDD §9.25). */
  readonly shown: boolean;
  /** `breach.suggestWaves`: how many upcoming waves the dots and the list look at. */
  readonly waveCount: number;
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
  return {
    shown: state.cycle.age === 'bastion',
    waveCount: num('breach.suggestWaves'),
    lanes,
    none: counted.length === 0,
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
  let sum = 0;
  for (let c = 0; c < table.pieces.length; c++) {
    const w = waves[c] ?? 0;
    if (w === 0) continue;
    const shares = table.towerCols.reduce((s, col) => s + reachShare(table, Math.abs(col - c)), 0);
    const reach = towers === 0 ? 0 : shares / (100 * towers);
    sum += w * (coverValue(table, c) * (1 + table.k.depthStep * extra(table, c)) + reach);
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

/** Suggest layout for a given list of lanes (the first waves of the stand, or a fixed fixture). Changes nothing. */
export const suggestLayoutFor = (state: GameState, lanes: readonly number[]): LayoutSuggestion => {
  const rows = num('breach.frontRows');
  const k = numbersNow();
  const waves = Array.from(
    { length: num('breach.lanes') },
    (_, c) => lanes.filter((l) => l === c).length,
  );
  // Tiles another building holds, wherever that building is in its states (a blueprint holds its tile).
  const held = new Set<string>();
  for (const def of PIECES) {
    const at = state.layout.placed[def.id];
    if (at && !isDefense(def.id)) for (const t of footprint(def, at)) held.add(`${t.x},${t.y}`);
  }
  const bounds = clearingBounds(state.cycle.age);
  const free: SuggestTile[] = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < num('breach.lanes'); x++)
      if (inClearing(bounds, { x, y }) && !held.has(`${x},${y}`)) free.push({ x, y });
  const owned = PIECES.filter((p) => isDefense(p.id) && isPieceUnlocked(state, p.id)).map((p) => ({
    id: p.id,
    tower: p.id.startsWith('watchtower-'),
  }));
  const scored = (cols: readonly { x: number; tower: boolean }[]): number =>
    layoutScore(tableOf(cols, k), waves);
  const greedy = greedyPlacement(owned, free, scored);
  // Auto-arrange's defense positions, on the tiles Suggest may use, worked out on a copy.
  const probe = { ...state, layout: { ...state.layout } } as GameState;
  autoArrange(probe);
  const freeKeys = new Set(free.map((t) => `${t.x},${t.y}`));
  const auto = countedPieces(probe).filter((p) => freeKeys.has(`${p.x},${p.y}`));
  const greedyScore = scored(greedy);
  const autoScore = scored(auto);
  const chosen =
    autoScore > greedyScore
      ? auto.map((p) => ({ pieceId: p.id, x: p.x, y: p.y }))
      : greedy.map((p) => ({ pieceId: p.id as HoldPieceId, x: p.x, y: p.y }));
  return { moves: chosen, score: Math.max(greedyScore, autoScore), autoScore };
};

/** Suggest layout from the stand's own lanes: the first `breach.suggestWaves` waves (GDD §5.9.11). */
export const suggestLayout = (state: GameState): LayoutSuggestion =>
  suggestLayoutFor(state, lanesFor(standSeed(state), num('breach.suggestWaves')));

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
