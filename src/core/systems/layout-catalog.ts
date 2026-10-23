import { AGE_IDS, type AgeId } from '../../content/ages';
import {
  CANONICAL_LAYOUT,
  CLEARING_BOUNDS,
  HALL_DEFAULT,
  PIECES,
  type ClearingBounds,
  type HoldPieceId,
  type PieceDef,
} from '../../content/hold-layout';
import type { HoldLayoutState } from '../state/layout-state';

// GDD §5.1.5 and technical design §19.2 (D500, D501): reads of the layout catalog, which lives in
// src/content/hold-layout.ts.
export const pieceDef = (id: HoldPieceId): PieceDef => {
  const found = PIECES.find((p) => p.id === id);
  if (!found) throw new Error(`No piece definition for ${id}`);
  return found;
};

export const clearingBounds = (age: AgeId): ClearingBounds => CLEARING_BOUNDS[age];

/** The first Rank whose clearing holds this tile, for the "Clears at {Rank}" line (GDD §9.21). */
export const clearsAtAge = (x: number, y: number): AgeId | null =>
  AGE_IDS.find((a) => {
    const b = CLEARING_BOUNDS[a];
    return x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY;
  }) ?? null;

export const canonicalLayout = (): HoldLayoutState => ({
  placed: structuredClone(CANONICAL_LAYOUT),
  showGhosts: true,
});

/** D502 (M3): a brand-new game places only the Hearth Hall; the rest arrives as buildings are built. */
export const newLayoutState = (): HoldLayoutState => ({
  placed: { 'hearth-hall': { ...HALL_DEFAULT } },
  showGhosts: true,
});
