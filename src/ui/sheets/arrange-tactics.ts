import { ARRANGE_TEXT } from '../../content/v18-text';
import {
  GRID_COLS,
  GRID_ROWS,
  type ClearingBounds,
  type HoldPieceId,
} from '../../content/hold-layout';
import { inClearing, type ActivePiece } from '../../core/systems/layout';
import type {
  AdjacencyKind,
  AdjacencyLink,
  HoldTacticsSummary,
} from '../../core/systems/layout-tactics';

export interface AdjVisualStyle {
  readonly color: string;
  readonly dash: string;
  readonly shape: 'circle' | 'diamond' | 'triangle';
}

export const ADJ_STYLES: Readonly<Record<AdjacencyKind, AdjVisualStyle>> = {
  food: { color: '#b6d53c', dash: '6 3', shape: 'circle' },
  wood: { color: '#b6d53c', dash: '6 3', shape: 'circle' },
  iron: { color: '#dff6f5', dash: '6 3', shape: 'circle' },
  silver: { color: '#dff6f5', dash: '8 3', shape: 'diamond' },
  brew: { color: '#f4b41b', dash: '2 3', shape: 'triangle' },
  warmth: { color: '#f47e1b', dash: 'none', shape: 'diamond' },
  trophy: { color: '#f4cca1', dash: '10 3 2 3', shape: 'diamond' },
};

export interface FrontierSegment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export const isDefensePieceId = (id: string): boolean =>
  id.startsWith('wall-') || id.startsWith('watchtower-');

/** Counts how many active AoE adjacency links touch each placed piece. */
export const countPieceLinks = (
  links: readonly AdjacencyLink[],
): ReadonlyMap<HoldPieceId, number> => {
  const counts = new Map<HoldPieceId, number>();
  for (const link of links) {
    counts.set(link.from, (counts.get(link.from) ?? 0) + 1);
    counts.set(link.to, (counts.get(link.to) ?? 0) + 1);
  }
  return counts;
};

/** Approved short status tags for the currently selected grid piece. */
export const selectedTacticsLine = (
  pieceId: HoldPieceId,
  tactics: HoldTacticsSummary,
  linkCount: number,
): string | null => {
  const tags: string[] = [];
  if (tactics.wardedPieces.has(pieceId)) tags.push(ARRANGE_TEXT.warded);
  else if (pieceId === 'hearth-hall') tags.push(ARRANGE_TEXT.exposed);
  if (tactics.screenedTowers.has(pieceId)) tags.push(ARRANGE_TEXT.screened);
  if (linkCount > 0) tags.push(ARRANGE_TEXT.linked(linkCount));
  return tags.length > 0 ? tags.join(' · ') : null;
};

/** Pixel perimeter segments where a Warded clearing tile meets a North-reached tile. */
export const wardFrontierSegments = (
  bounds: ClearingBounds,
  northReached: readonly boolean[],
  defenseTiles: ReadonlySet<string>,
  cellPx: number,
): readonly FrontierSegment[] => {
  const segs: FrontierSegment[] = [];
  const wardedCell = (x: number, y: number): boolean =>
    inClearing(bounds, { x, y }) &&
    !northReached[y * GRID_COLS + x] &&
    !defenseTiles.has(`${x},${y}`);

  for (let y = bounds.minY; y <= bounds.maxY; y++) {
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      if (!wardedCell(x, y)) continue;
      const px = x * cellPx;
      const py = y * cellPx;
      if (y > 0 && inClearing(bounds, { x, y: y - 1 }) && northReached[(y - 1) * GRID_COLS + x]) {
        segs.push({ x1: px, y1: py, x2: px + cellPx, y2: py });
      }
      if (
        y + 1 < GRID_ROWS &&
        inClearing(bounds, { x, y: y + 1 }) &&
        northReached[(y + 1) * GRID_COLS + x]
      ) {
        segs.push({ x1: px, y1: py + cellPx, x2: px + cellPx, y2: py + cellPx });
      }
      if (x > 0 && inClearing(bounds, { x: x - 1, y }) && northReached[y * GRID_COLS + (x - 1)]) {
        segs.push({ x1: px, y1: py, x2: px, y2: py + cellPx });
      }
      if (
        x + 1 < GRID_COLS &&
        inClearing(bounds, { x: x + 1, y }) &&
        northReached[y * GRID_COLS + (x + 1)]
      ) {
        segs.push({ x1: px + cellPx, y1: py, x2: px + cellPx, y2: py + cellPx });
      }
    }
  }
  return segs;
};

export const CELL = 44;

export const cellBox = (x: number, y: number, w: number, h: number) => ({
  position: 'absolute' as const,
  left: `${x * CELL}px`,
  top: `${y * CELL}px`,
  width: `${w * CELL}px`,
  height: `${h * CELL}px`,
});

export const pieceCenter = (p: ActivePiece, cellPx: number): { cx: number; cy: number } => ({
  cx: (p.x + p.w / 2) * cellPx,
  cy: (p.y + p.h / 2) * cellPx,
});
