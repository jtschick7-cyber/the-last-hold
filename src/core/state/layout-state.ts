import type { GridCoord, HoldPieceId } from '../../content/hold-layout';

export { HOLD_PIECE_IDS } from '../../content/hold-layout';
export type { GridCoord, HoldPieceId } from '../../content/hold-layout';

// Technical design §19.1 (v12, D502): the saved blueprint of the Hold's layout. Decorative in v1.1:
// no production rate, cost, Threat rate or fight calculation reads it (CLAUDE.md).
export interface HoldLayoutState {
  /** Blueprint coordinates for placed pieces. Unplaced pieces are omitted. */
  placed: Partial<Record<HoldPieceId, GridCoord>>;
  /** Whether dormant blueprint pieces show as stone foundation outlines. */
  showGhosts: boolean;
}
