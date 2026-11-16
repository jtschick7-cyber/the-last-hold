import {
  HOLD_PIECE_IDS,
  type GridCoord,
  type HoldLayoutState,
  type HoldPieceId,
  type PresetCoord,
  type PresetSlot,
} from '../state/layout-state';
import { GRID_COLS, GRID_ROWS, HALL_ANCHOR, HALL_DEFAULT } from '../../content/hold-layout';
import { pieceDef } from '../systems/layout-catalog';
import { arr, bool, Invalid, obj } from './guards';

// Technical design §19.2 (S13) & §25.1 (D621): the layout part of the save guard. Order is fixed:
// bounds, then the Hearth Hall's anchor, then overlaps in catalog order (the Hall first), then
// unknown keys. A piece that cannot keep its place goes back to the tray (dropped from `placed`)
// with a warning; missing `presets` (pre-T18.4 v16 saves) defaults silently to `[null, null]`.
const inGrid = (x: number, y: number): boolean =>
  Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS;

const isCoord = (v: unknown): v is GridCoord => {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Record<string, unknown>;
  return inGrid(c.x as number, c.y as number);
};

const inHallRange = (c: GridCoord): boolean =>
  c.x >= HALL_ANCHOR.minX &&
  c.x <= HALL_ANCHOR.maxX &&
  c.y >= HALL_ANCHOR.minY &&
  c.y <= HALL_ANCHOR.maxY;

/** Validates placed coordinates and resolves overlaps cleanly via `onIssue`. */
const normalizePlaced = (
  placed: HoldLayoutState['placed'],
  onIssue: (msg: string) => void,
): HoldLayoutState['placed'] => {
  const hall = placed['hearth-hall'];
  if (!hall || !inHallRange(hall)) {
    if (hall) onIssue('Moved the Hearth Hall back to its default place.');
    placed['hearth-hall'] = { ...HALL_DEFAULT };
  }
  const kept: HoldLayoutState['placed'] = {};
  const taken = new Set<string>();
  for (const id of HOLD_PIECE_IDS) {
    const c = placed[id as HoldPieceId];
    if (!c) continue;
    const { w, h } = pieceDef(id);
    const tiles: string[] = [];
    let fitsGrid = true;
    for (let dx = 0; dx < w; dx++) {
      for (let dy = 0; dy < h; dy++) {
        if (!inGrid(c.x + dx, c.y + dy)) fitsGrid = false;
        tiles.push(`${c.x + dx},${c.y + dy}`);
      }
    }
    if (!fitsGrid) {
      onIssue(`Dropped ${id}: its footprint extends off the grid.`);
      continue;
    }
    if (tiles.some((t) => taken.has(t))) {
      onIssue(`Moved ${id} to the tray: another piece already stands there.`);
    } else {
      tiles.forEach((t) => taken.add(t));
      kept[id] = c;
    }
  }
  return kept;
};

const presetSlotFrom = (v: unknown, where: string): PresetSlot | null => {
  if (v === null) return null;
  const entries = arr(v, where);
  if (entries.length !== HOLD_PIECE_IDS.length)
    throw new Invalid(`${where} must have ${HOLD_PIECE_IDS.length} entries.`);
  const decoded: HoldLayoutState['placed'] = {};
  const tupleList: PresetCoord[] = entries.map((entry, i) => {
    const id = HOLD_PIECE_IDS[i];
    if (!id) throw new Invalid(`${where}[${i}] is out of catalog bounds.`);
    if (entry === null) return null;
    if (!Array.isArray(entry) || entry.length !== 2)
      throw new Invalid(`${where}[${i}] must be [x, y] or null.`);
    const [x, y] = entry as [unknown, unknown];
    if (typeof x !== 'number' || typeof y !== 'number' || !inGrid(x, y))
      throw new Invalid(`${where}[${i}] (${id}) is outside the grid.`);
    decoded[id] = { x, y };
    return [x, y] as const;
  });
  normalizePlaced(decoded, (msg) => {
    throw new Invalid(`${where}: ${msg}`);
  });
  return tupleList;
};

const presetsFrom = (v: unknown): [PresetSlot | null, PresetSlot | null] => {
  if (v === undefined) return [null, null];
  const slots = arr(v, 'layout.presets');
  if (slots.length !== 2) throw new Invalid('layout.presets must have 2 slots.');
  return [
    presetSlotFrom(slots[0], 'layout.presets[0]'),
    presetSlotFrom(slots[1], 'layout.presets[1]'),
  ];
};

export const layoutFrom = (v: unknown, warnings: string[]): HoldLayoutState => {
  const o = obj(v, 'layout');
  const raw = obj(o.placed, 'layout.placed');
  const placed: HoldLayoutState['placed'] = {};
  for (const key of Object.keys(raw))
    if (!(HOLD_PIECE_IDS as readonly string[]).includes(key))
      warnings.push(`Dropped unknown layout piece "${key}".`);
  for (const id of HOLD_PIECE_IDS) {
    const c = raw[id];
    if (c === undefined) continue;
    if (!isCoord(c)) warnings.push(`Dropped ${id}: its place isn't on the grid.`);
    else placed[id] = { x: c.x, y: c.y };
  }
  const kept = normalizePlaced(placed, (msg) => warnings.push(msg));
  return {
    placed: kept,
    showGhosts: bool(o.showGhosts, 'layout.showGhosts'),
    presets: presetsFrom(o.presets),
  };
};
