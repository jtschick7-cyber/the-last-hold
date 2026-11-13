import type { GridCoord, HoldPieceId } from '../../content/hold-layout';

export { HOLD_PIECE_IDS } from '../../content/hold-layout';
export type { GridCoord, HoldPieceId } from '../../content/hold-layout';

export type LayoutArrangeMode = 'balanced' | 'economy' | 'fortress';
export type LayoutPresetSlot = 0 | 1;
export type PresetCoord = readonly [number, number] | null;
/** Compact catalog-ordered blueprint coordinates (`[x, y] | null` per `HOLD_PIECE_IDS` index). */
export type PresetSlot = readonly PresetCoord[];

// Technical design §19.1 (v12, D502) & §25.1 (v16, D621): the saved blueprint of the Hold's layout
// and up to 2 saved custom presets.
export interface HoldLayoutState {
  /** Blueprint coordinates for placed pieces. Unplaced pieces are omitted. */
  placed: Partial<Record<HoldPieceId, GridCoord>>;
  /** Whether dormant blueprint pieces show as stone foundation outlines. */
  showGhosts: boolean;
  /** Up to 2 player-saved layout presets (Slot 1 / Slot 2). */
  presets: [PresetSlot | null, PresetSlot | null];
}
