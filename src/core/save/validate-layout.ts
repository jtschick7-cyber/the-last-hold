import {
  HOLD_PIECE_IDS,
  type GridCoord,
  type HoldLayoutState,
  type HoldPieceId,
} from '../state/layout-state';
import { GRID_SIZE, HALL_ANCHOR, HALL_DEFAULT } from '../../content/hold-layout';
import { pieceDef } from '../systems/layout-catalog';
import { bool, obj } from './guards';

// Technical design §19.2 (S13): the layout part of the save guard. Order is fixed: bounds, then the
// Hearth Hall's anchor, then overlaps in catalog order (the Hall first), then unknown keys. A piece
// that cannot keep its place goes back to the tray (it is dropped from `placed`) with a warning.
const isCoord = (v: unknown): v is GridCoord => {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Record<string, unknown>;
  return (
    Number.isInteger(c.x) &&
    Number.isInteger(c.y) &&
    (c.x as number) >= 0 &&
    (c.x as number) < GRID_SIZE &&
    (c.y as number) >= 0 &&
    (c.y as number) < GRID_SIZE
  );
};

const inHallRange = (c: GridCoord): boolean =>
  c.x >= HALL_ANCHOR.min &&
  c.x <= HALL_ANCHOR.max &&
  c.y >= HALL_ANCHOR.min &&
  c.y <= HALL_ANCHOR.max;

export const layoutFrom = (v: unknown, warnings: string[]): HoldLayoutState => {
  const o = obj(v, 'layout');
  const raw = obj(o.placed, 'layout.placed');
  const placed: HoldLayoutState['placed'] = {};
  for (const key of Object.keys(raw))
    if (!(HOLD_PIECE_IDS as readonly string[]).includes(key))
      warnings.push(`Dropped unknown layout piece "${key}".`);
  // 1. Bounds.
  for (const id of HOLD_PIECE_IDS) {
    const c = raw[id];
    if (c === undefined) continue;
    if (!isCoord(c)) warnings.push(`Dropped ${id}: its place isn't on the grid.`);
    else placed[id] = { x: c.x, y: c.y };
  }
  // 2. The Hearth Hall's anchor.
  const hall = placed['hearth-hall'];
  if (!hall || !inHallRange(hall)) {
    if (hall) warnings.push('Moved the Hearth Hall back to its default place.');
    placed['hearth-hall'] = { ...HALL_DEFAULT };
  }
  // 3. Overlaps, in catalog order.
  const kept: HoldLayoutState['placed'] = {};
  const taken = new Set<string>();
  for (const id of HOLD_PIECE_IDS) {
    const c = placed[id as HoldPieceId];
    if (!c) continue;
    const { w, h } = pieceDef(id);
    const tiles: string[] = [];
    for (let dx = 0; dx < w; dx++)
      for (let dy = 0; dy < h; dy++) tiles.push(`${c.x + dx},${c.y + dy}`);
    if (tiles.some((t) => taken.has(t))) {
      warnings.push(`Moved ${id} to the tray: another piece already stands there.`);
    } else {
      tiles.forEach((t) => taken.add(t));
      kept[id] = c;
    }
  }
  return { placed: kept, showGhosts: bool(o.showGhosts, 'layout.showGhosts') };
};
