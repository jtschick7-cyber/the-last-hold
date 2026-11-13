import { AGE_IDS, type AgeId } from '../../content/ages';
import type { HuntId } from '../../content/hunts';
import {
  GRID_COLS,
  GRID_ROWS,
  HALL_DEFAULT,
  PIECES,
  hallAnchorBounds,
  type ClearingBounds,
} from '../../content/hold-layout';
import type { CosmeticsState } from '../state/cosmetics-state';
import type { GridCoord, HoldLayoutState, HoldPieceId } from '../state/layout-state';
import { backfillCosmetics } from '../systems/cosmetics';
import { clearingBounds, pieceDef } from '../systems/layout-catalog';
import { footprint } from '../systems/layout';
import type { Migration } from './migrations';

// v15 → v16 (plan T18.2, technical design §25.1, D618, D621): expand the Hold Grid from 8 × 8
// to 8 × 12 portrait. Front defenses (walls and watchtowers) already on y = 0..2 stay anchored
// north; the Hearth Hall and all inner-ward pieces shift +3 rows south, with deterministic
// nearest-free-tile collision resolution so zero placed pieces drop off-map or overlap.
const ROW_SHIFT = 3;

const key = (c: GridCoord): string => `${c.x},${c.y}`;
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));
const inBounds = (b: ClearingBounds, c: GridCoord): boolean =>
  c.x >= b.minX && c.x <= b.maxX && c.y >= b.minY && c.y <= b.maxY;

const isFrontDefense = (id: HoldPieceId, at: GridCoord): boolean =>
  (id.startsWith('wall-') || id.startsWith('watchtower-')) && at.y >= 0 && at.y <= 2;

const nearestFreeTile = (
  target: GridCoord,
  bounds: ClearingBounds,
  taken: ReadonlySet<string>,
): GridCoord => {
  let best: GridCoord | null = null;
  let bestDist = Infinity;
  let bestOutside = 2;
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const c = { x, y };
      if (taken.has(key(c))) continue;
      const d = Math.abs(x - target.x) + Math.abs(y - target.y);
      const out = inBounds(bounds, c) ? 0 : 1;
      if (
        d < bestDist ||
        (d === bestDist &&
          (out < bestOutside ||
            (out === bestOutside && (!best || y < best.y || (y === best.y && x < best.x)))))
      ) {
        best = c;
        bestDist = d;
        bestOutside = out;
      }
    }
  }
  return best ?? target;
};

const shiftLayout = (state: HoldLayoutState, bounds: ClearingBounds): HoldLayoutState => {
  const placed: Record<string, GridCoord> = { ...state.placed };
  const taken = new Set<string>();
  const hallDef = pieceDef('hearth-hall');

  const rawHall = placed['hearth-hall'];
  const hb = hallAnchorBounds(bounds);
  const hallAt: GridCoord =
    rawHall && Number.isInteger(rawHall.x) && Number.isInteger(rawHall.y)
      ? { x: clamp(rawHall.x, hb.minX, hb.maxX), y: clamp(rawHall.y + ROW_SHIFT, hb.minY, hb.maxY) }
      : { ...HALL_DEFAULT };
  placed['hearth-hall'] = hallAt;
  for (const t of footprint(hallDef, hallAt)) taken.add(key(t));

  const deferred: { id: HoldPieceId; target: GridCoord }[] = [];
  for (const def of PIECES) {
    if (def.id === 'hearth-hall') continue;
    const raw = placed[def.id];
    if (!raw || !Number.isInteger(raw.x) || !Number.isInteger(raw.y)) continue;
    const rawTarget: GridCoord = isFrontDefense(def.id, raw)
      ? raw
      : { x: raw.x, y: raw.y + ROW_SHIFT };
    const target: GridCoord = {
      x: clamp(rawTarget.x, 0, GRID_COLS - 1),
      y: clamp(rawTarget.y, 0, GRID_ROWS - 1),
    };
    if (taken.has(key(target))) {
      deferred.push({ id: def.id, target });
    } else {
      placed[def.id] = target;
      taken.add(key(target));
    }
  }

  for (const { id, target } of deferred) {
    const resolved = nearestFreeTile(target, bounds, taken);
    placed[id] = resolved;
    taken.add(key(resolved));
  }

  return {
    showGhosts: state.showGhosts,
    placed: placed as HoldLayoutState['placed'],
    presets: state.presets ?? [null, null],
  };
};

const migrateCosmetics = (next: Record<string, unknown>): CosmeticsState => {
  const raw = next.cosmetics as Partial<CosmeticsState> | undefined;
  const cosmetics: CosmeticsState = {
    marks: raw?.marks && typeof raw.marks === 'object' ? { ...raw.marks } : {},
    hidden: Array.isArray(raw?.hidden) ? [...raw.hidden] : [],
  };
  const ev = next.events as
    | { boss?: { visit?: number }; hunts?: Partial<Record<HuntId, { unlocked?: boolean }>> }
    | undefined;
  backfillCosmetics({ cosmetics, events: ev });
  return cosmetics;
};

export const v15ToV16: Migration = (state) => {
  const next = structuredClone(state);
  const cosmetics = migrateCosmetics(next);
  const cycle = next.cycle as { age?: unknown } | undefined;
  const age = AGE_IDS.includes(cycle?.age as AgeId) ? (cycle?.age as AgeId) : 'hamlet';
  const rawLayout = next.layout as Partial<HoldLayoutState> | undefined;
  if (
    !rawLayout ||
    typeof rawLayout !== 'object' ||
    !rawLayout.placed ||
    typeof rawLayout.placed !== 'object'
  )
    return { ...next, cosmetics };
  const layout: HoldLayoutState = {
    placed: rawLayout.placed,
    showGhosts: Boolean(rawLayout.showGhosts),
    presets: rawLayout.presets ?? [null, null],
  };
  return {
    ...next,
    cosmetics,
    layout: shiftLayout(layout, clearingBounds(age)),
  };
};
