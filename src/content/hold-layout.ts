import type { AgeId } from './ages';
import type { BuildingId } from './buildings';

// GDD §5.1.5 and technical design §19.2 (D500, D501, D503): the data of the Hold's layout. The
// 8 × 8 grid, every piece with its size and what unlocks it, the clearing each Rank opens, the
// Hearth Hall's anchor range, and the canonical Auto-arrange layout. Decorative in v1.1: nothing
// here changes a rate, a cost, a Threat figure or a fight.
export const GRID_SIZE = 8;

export const HOLD_PIECE_IDS = [
  'hearth-hall',
  'mill',
  'sawpit',
  'smithy',
  'bell-tower',
  'barracks',
  'trophy-hall',
  'lodge',
  'alchemist',
  'cottage-1',
  'cottage-2',
  'cottage-3',
  'farm-1',
  'farm-2',
  'farm-3',
  'woodcutter-1',
  'woodcutter-2',
  'woodcutter-3',
  'mine-1',
  'mine-2',
  'mine-3',
  'herb-garden-1',
  'herb-garden-2',
  'herb-garden-3',
  'silver-seam-1',
  'silver-seam-2',
  'watchtower-1',
  'watchtower-2',
  'watchtower-3',
  'wall-1',
  'wall-2',
  'wall-3',
  'wall-4',
  'wall-5',
  'wall-6',
  'wall-7',
  'wall-8',
  'wall-9',
  'wall-10',
  'wall-11',
] as const;
export type HoldPieceId = (typeof HOLD_PIECE_IDS)[number];

export interface GridCoord {
  /** Integer 0..7 (2..4 for the 2 × 2 Hearth Hall's top-left anchor). */
  x: number;
  /** Integer 0..7 (2..4 for the 2 × 2 Hearth Hall's top-left anchor). */
  y: number;
}

export interface PieceDef {
  readonly id: HoldPieceId;
  readonly w: 1 | 2;
  readonly h: 1 | 2;
  /** The building it shows, and the copies (count buildings) or level (level buildings) it needs. */
  readonly building: BuildingId;
  readonly unlockAt: number;
  /**
   * Where the second and third look start: the level (level buildings) or the copies owned
   * (count buildings) at which it changes. GDD §5.1.5: level buildings show three tiers, plots three
   * densities (a Silver Seam only two). A piece with none always shows its first look.
   */
  readonly tierFrom?: readonly [number, number];
}

const def = (
  id: HoldPieceId,
  building: BuildingId,
  unlockAt: number,
  tierFrom?: readonly [number, number],
): PieceDef => ({
  id,
  w: 1,
  h: 1,
  building,
  unlockAt,
  ...(tierFrom ? { tierFrom } : {}),
});

/** GDD §5.1.5: Tier I Lv 1–4, II Lv 5–10, III Lv 11+; for a 3-level cap one tier a level; for a 5-level cap 1–2, 3–4, 5. */
const FREE_LEVELS = [5, 11] as const;
const CAP_THREE = [2, 3] as const;
const CAP_FIVE = [3, 5] as const;
/** Plots: 1–4 owned a single structure, 5–14 a pair, 15+ a cluster. */
const PLOT_DENSITY = [5, 15] as const;
/** Silver Seams: one seam, then twin seams. */
const SEAM_DENSITY = [2, 3] as const;

/** In catalog order (the Hearth Hall first): the order overlaps are settled in (S13). Plots unlock at 1, 5, 15 owned (Silver Seams 1, 2); towers at Lv 1, 8, 15; four wall segments at Lv 1, then one more at Lv 3, 5, 7, 9, 11, 13, 15. */
export const PIECES: readonly PieceDef[] = [
  { id: 'hearth-hall', w: 2, h: 2, building: 'hearth-hall', unlockAt: 1 },
  def('mill', 'mill', 1, FREE_LEVELS),
  def('sawpit', 'sawpit', 1, FREE_LEVELS),
  def('smithy', 'smithy', 1, FREE_LEVELS),
  def('bell-tower', 'bell-tower', 1, CAP_THREE),
  def('barracks', 'barracks', 1, CAP_FIVE),
  def('trophy-hall', 'trophy-hall', 1),
  def('lodge', 'hunters-lodge', 1, CAP_THREE),
  def('alchemist', 'alchemists-hut', 1, CAP_FIVE),
  def('cottage-1', 'cottage', 1, PLOT_DENSITY),
  def('cottage-2', 'cottage', 5, PLOT_DENSITY),
  def('cottage-3', 'cottage', 15, PLOT_DENSITY),
  def('farm-1', 'farm', 1, PLOT_DENSITY),
  def('farm-2', 'farm', 5, PLOT_DENSITY),
  def('farm-3', 'farm', 15, PLOT_DENSITY),
  def('woodcutter-1', 'woodcutters-camp', 1, PLOT_DENSITY),
  def('woodcutter-2', 'woodcutters-camp', 5, PLOT_DENSITY),
  def('woodcutter-3', 'woodcutters-camp', 15, PLOT_DENSITY),
  def('mine-1', 'mine', 1, PLOT_DENSITY),
  def('mine-2', 'mine', 5, PLOT_DENSITY),
  def('mine-3', 'mine', 15, PLOT_DENSITY),
  def('herb-garden-1', 'herb-garden', 1, PLOT_DENSITY),
  def('herb-garden-2', 'herb-garden', 5, PLOT_DENSITY),
  def('herb-garden-3', 'herb-garden', 15, PLOT_DENSITY),
  def('silver-seam-1', 'silver-seam', 1, SEAM_DENSITY),
  def('silver-seam-2', 'silver-seam', 2, SEAM_DENSITY),
  def('watchtower-1', 'watchtower', 1),
  def('watchtower-2', 'watchtower', 8),
  def('watchtower-3', 'watchtower', 15),
  def('wall-1', 'walls', 1),
  def('wall-2', 'walls', 1),
  def('wall-3', 'walls', 1),
  def('wall-4', 'walls', 1),
  def('wall-5', 'walls', 3),
  def('wall-6', 'walls', 5),
  def('wall-7', 'walls', 7),
  def('wall-8', 'walls', 9),
  def('wall-9', 'walls', 11),
  def('wall-10', 'walls', 13),
  def('wall-11', 'walls', 15),
];

export interface ClearingBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

/** D500: the open ground each Rank clears inside the 8 × 8 grid. */
export const CLEARING_BOUNDS: Readonly<Record<AgeId, ClearingBounds>> = {
  hamlet: { minX: 2, maxX: 5, minY: 2, maxY: 5 },
  keep: { minX: 1, maxX: 6, minY: 1, maxY: 6 },
  citadel: { minX: 0, maxX: 7, minY: 1, maxY: 6 },
  bastion: { minX: 0, maxX: 7, minY: 0, maxY: 7 },
};

/** D501 (M4): the Hearth Hall's top-left anchor stays here, always inside the Hamlet clearing. */
export const HALL_ANCHOR = { min: 2, max: 4 } as const;
export const HALL_DEFAULT: GridCoord = { x: 3, y: 3 };

/** GDD §5.1.5 "Canonical Auto-arrange layout" (D503, M1). */
export const CANONICAL_LAYOUT: Readonly<Record<HoldPieceId, GridCoord>> = {
  'hearth-hall': { x: 3, y: 3 },
  'silver-seam-2': { x: 2, y: 2 },
  smithy: { x: 3, y: 2 },
  'silver-seam-1': { x: 4, y: 2 },
  'mine-1': { x: 5, y: 2 },
  mill: { x: 2, y: 3 },
  sawpit: { x: 5, y: 3 },
  'farm-1': { x: 2, y: 4 },
  'woodcutter-1': { x: 5, y: 4 },
  'cottage-1': { x: 2, y: 5 },
  'cottage-2': { x: 3, y: 5 },
  'farm-2': { x: 4, y: 5 },
  'woodcutter-2': { x: 5, y: 5 },
  alchemist: { x: 1, y: 2 },
  'herb-garden-1': { x: 1, y: 3 },
  'herb-garden-2': { x: 1, y: 4 },
  'herb-garden-3': { x: 1, y: 5 },
  'mine-2': { x: 6, y: 2 },
  'mine-3': { x: 6, y: 3 },
  lodge: { x: 6, y: 4 },
  barracks: { x: 6, y: 5 },
  'trophy-hall': { x: 1, y: 6 },
  'bell-tower': { x: 2, y: 6 },
  'cottage-3': { x: 3, y: 6 },
  'farm-3': { x: 4, y: 6 },
  'woodcutter-3': { x: 5, y: 6 },
  'wall-1': { x: 0, y: 1 },
  'wall-2': { x: 1, y: 1 },
  'watchtower-1': { x: 2, y: 1 },
  'wall-3': { x: 3, y: 1 },
  'wall-4': { x: 4, y: 1 },
  'watchtower-2': { x: 5, y: 1 },
  'wall-5': { x: 6, y: 1 },
  'wall-6': { x: 7, y: 1 },
  'wall-7': { x: 0, y: 2 },
  'wall-8': { x: 7, y: 2 },
  'wall-9': { x: 2, y: 0 },
  'watchtower-3': { x: 3, y: 0 },
  'wall-10': { x: 4, y: 0 },
  'wall-11': { x: 5, y: 0 },
};

/** Which sides of a defense tile touch another defense tile (GDD §5.1.5): bits for the 16 connection looks. */
export const CONNECTION_BITS = { n: 1, e: 2, s: 4, w: 8 } as const;

/** GDD §5.1.5 auto-placement (S6): other pieces take the free tile nearest this point, then lowest y, then lowest x. */
export const HOLD_CENTER = { x: 3.5, y: 3.5 } as const;

/** GDD §5.1.5 auto-placement (S6): defenses take row 1 west to east, then the row 2 wings, then row 0. */
export const DEFENSE_TILE_ORDER: readonly GridCoord[] = [
  ...Array.from({ length: GRID_SIZE }, (_, x) => ({ x, y: 1 })),
  { x: 0, y: 2 },
  { x: GRID_SIZE - 1, y: 2 },
  ...Array.from({ length: GRID_SIZE }, (_, x) => ({ x, y: 0 })),
];
