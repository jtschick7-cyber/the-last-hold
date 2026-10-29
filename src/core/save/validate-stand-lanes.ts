import {
  LANE_COUNT,
  MAX_PIECES_PER_COLUMN,
  MAX_TOWER_COLUMNS,
  type LaneNumbers,
  type LaneTable,
} from '../state/lane-table';
import { arr, count, finite, Invalid, obj } from './guards';

// Technical design §23.6 (D585): the lane table part of the save guard. A table that fails refuses
// the load, as a Delve that cannot be trusted does (§5.2): dropping it would replay the stand under
// different rules. Only an unknown field is dropped, with a warning.
const MAX_DEPTH = 8; // sane range for the whole number of extra pieces that count
const MAX_STEP = 4; // sane range for the depth step
const MAX_SCALE = 10; // sane range for the volley scale
const REACH_LENGTH = 3; // own column, one away, two away

const inRange = (n: number, lo: number, hi: number, where: string): number => {
  if (n < lo || n > hi) throw new Invalid(`${where} is out of range.`);
  return n;
};

/** A number that must be a whole multiple of 1/`per` (quarters, hundredths). */
const multipleOf = (n: number, per: number, where: string): number => {
  if (Math.round(n * per) !== n * per)
    throw new Invalid(`${where} isn't a whole number of 1/${per}.`);
  return n;
};

const numbersFrom = (v: unknown, where: string, warnings: string[]): LaneNumbers => {
  const o = obj(v, where);
  for (const key of Object.keys(o))
    if (!KEYS.includes(key)) warnings.push(`Dropped unknown ${where}.${key}.`);
  const reach = arr(o.towerReach, `${where}.towerReach`);
  if (reach.length !== REACH_LENGTH) throw new Invalid(`${where}.towerReach is the wrong length.`);
  return {
    coverOwn: inRange(finite(o.coverOwn, `${where}.coverOwn`), 0, 1, `${where}.coverOwn`),
    coverNeighbour: inRange(
      finite(o.coverNeighbour, `${where}.coverNeighbour`),
      0,
      1,
      `${where}.coverNeighbour`,
    ),
    depthStep: inRange(
      finite(o.depthStep, `${where}.depthStep`),
      0,
      MAX_STEP,
      `${where}.depthStep`,
    ),
    depthMax: inRange(count(o.depthMax, `${where}.depthMax`), 0, MAX_DEPTH, `${where}.depthMax`),
    towerReach: reach.map((r, i) => {
      const w = `${where}.towerReach[${i}]`;
      return multipleOf(inRange(finite(r, w), 0, 1, w), 4, w);
    }),
    volleyScale: multipleOf(
      inRange(finite(o.volleyScale, `${where}.volleyScale`), 0, MAX_SCALE, `${where}.volleyScale`),
      100,
      `${where}.volleyScale`,
    ),
  };
};
const KEYS = ['coverOwn', 'coverNeighbour', 'depthStep', 'depthMax', 'towerReach', 'volleyScale'];

export const laneTableFrom = (v: unknown, where: string, warnings: string[]): LaneTable => {
  const o = obj(v, where);
  for (const key of Object.keys(o))
    if (key !== 'pieces' && key !== 'towerCols' && key !== 'k')
      warnings.push(`Dropped unknown ${where}.${key}.`);
  const pieces = arr(o.pieces, `${where}.pieces`);
  if (pieces.length !== LANE_COUNT)
    throw new Invalid(`${where}.pieces must have ${LANE_COUNT} entries.`);
  const counts = pieces.map((p, i) =>
    inRange(count(p, `${where}.pieces[${i}]`), 0, MAX_PIECES_PER_COLUMN, `${where}.pieces[${i}]`),
  );
  const cols = arr(o.towerCols, `${where}.towerCols`);
  if (cols.length > MAX_TOWER_COLUMNS)
    throw new Invalid(`${where}.towerCols has too many columns.`);
  const towerCols = cols.map((c, i) =>
    inRange(count(c, `${where}.towerCols[${i}]`), 0, LANE_COUNT - 1, `${where}.towerCols[${i}]`),
  );
  const towersIn = new Array<number>(LANE_COUNT).fill(0);
  towerCols.forEach((c, i) => {
    if (i > 0 && c < (towerCols[i - 1] ?? 0))
      throw new Invalid(`${where}.towerCols isn't ascending.`);
    towersIn[c] = (towersIn[c] ?? 0) + 1;
  });
  // A tower is a counted piece, so its column holds at least as many pieces as towers.
  towersIn.forEach((n, c) => {
    if (n > (counts[c] ?? 0)) throw new Invalid(`${where}.towerCols names a column with no piece.`);
  });
  return { pieces: counts, towerCols, k: numbersFrom(o.k, `${where}.k`, warnings) };
};
