// Technical design §23.1 (v15, D585, D591, D592): the lane table frozen on a stand's record when
// Start is pressed. Its presence is what makes the stand a version 6 stand; absent means version 5.
// The shape sizes below are the save format's, and equal the locked `breach.lanes` and
// `breach.frontRows` (a test keeps them equal), so a table can be checked without reading balance.
export const LANE_COUNT = 8;
/** At most one counted piece per front-row tile: `breach.frontRows` (3) tiles in a column. */
export const MAX_PIECES_PER_COLUMN = 3;
export const MAX_TOWER_COLUMNS = 3;

/** The `breach.*` numbers in force at Start, so later tuning never changes an old replay. */
export interface LaneNumbers {
  coverOwn: number;
  coverNeighbour: number;
  depthStep: number;
  depthMax: number;
  /** Own column, one away, two away; multiples of 0.25. */
  towerReach: number[];
  /** In hundredths. */
  volleyScale: number;
}

export interface LaneTable {
  /** Counted wall and tower pieces in each of the 8 columns, 0 to 3. */
  pieces: number[];
  /** The columns (0 to 7) of the counted towers, ascending, at most 3. */
  towerCols: number[];
  k: LaneNumbers;
}
