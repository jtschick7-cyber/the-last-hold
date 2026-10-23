import {
  CANONICAL_LAYOUT,
  DEFENSE_TILE_ORDER,
  GRID_SIZE,
  HALL_ANCHOR,
  HOLD_CENTER,
  PIECES,
  type GridCoord,
  type HoldPieceId,
} from '../../content/hold-layout';
import type { GameState } from '../state/game-state';
import { clearingBounds, pieceDef } from './layout-catalog';
import { footprint, inClearing, isPieceUnlocked } from './layout';

// GDD §5.1.5 and technical design §19.3 (D502, M2, S6): where pieces go. Moves by the player and
// automatic placement. Decorative in v1.1: nothing here is read by a rule (CLAUDE.md).

const key = (t: GridCoord): string => `${t.x},${t.y}`;

/** Takes a piece out of the blueprint: it waits in the tray (if built) or has no ghost (if not). */
export const dropPiece = (state: GameState, id: HoldPieceId): void => {
  state.layout.placed = Object.fromEntries(
    Object.entries(state.layout.placed).filter(([k]) => k !== id),
  );
};

/** Every tile covered by a saved coordinate, whatever that piece's state: a blueprint holds its tile. */
const covered = (state: GameState, except?: HoldPieceId): Map<string, HoldPieceId> => {
  const map = new Map<string, HoldPieceId>();
  for (const def of PIECES) {
    const at = state.layout.placed[def.id];
    if (!at || def.id === except) continue;
    for (const t of footprint(def, at)) map.set(key(t), def.id);
  }
  return map;
};

/** GDD §5.1.5 (S6): the tiles of the current clearing in the order a piece takes them. */
const tileOrder = (state: GameState, id: HoldPieceId): GridCoord[] => {
  const bounds = clearingBounds(state.cycle.age);
  if (id.startsWith('wall-') || id.startsWith('watchtower-'))
    return DEFENSE_TILE_ORDER.filter((t) => inClearing(bounds, t));
  // The defense rows are kept for defenses (the owner, 2026-10-23): other pieces never take them by themselves.
  const defenseRows = new Set(DEFENSE_TILE_ORDER.map(key));
  const tiles: GridCoord[] = [];
  for (let y = 0; y < GRID_SIZE; y++)
    for (let x = 0; x < GRID_SIZE; x++)
      if (inClearing(bounds, { x, y }) && !defenseRows.has(key({ x, y }))) tiles.push({ x, y });
  const dist = (t: GridCoord): number =>
    Math.abs(t.x - HOLD_CENTER.x) + Math.abs(t.y - HOLD_CENTER.y);
  return tiles.sort((a, b) => dist(a) - dist(b) || a.y - b.y || a.x - b.x);
};

export const unlockedPieces = (state: GameState): Set<HoldPieceId> =>
  new Set(PIECES.filter((p) => isPieceUnlocked(state, p.id)).map((p) => p.id));

/**
 * D502 (M2): blueprint protection. A saved coordinate is never overwritten here; a piece that has
 * none takes the first free tile of the clearing (and keeps it as its blueprint), or waits in the tray.
 * `already` is the set of pieces unlocked before the change that called this: those are left as they
 * are (a piece the player sent to the tray stays there). Without it, every unlocked piece without a
 * coordinate is placed (a new game, a new cycle, a Rank-up).
 */
export const autoPlaceUnlocked = (state: GameState, already?: ReadonlySet<HoldPieceId>): void => {
  const taken = covered(state);
  for (const def of PIECES) {
    if (def.w !== 1 || def.h !== 1) continue; // the Hearth Hall is always placed (the guard sees to it)
    if (!isPieceUnlocked(state, def.id) || already?.has(def.id)) continue;
    const saved = state.layout.placed[def.id];
    if (saved) {
      // A saved spot that another piece holds can't be kept; the piece waits in the tray (rule 2).
      if (taken.get(key(saved)) !== def.id) dropPiece(state, def.id);
      continue;
    }
    const free = tileOrder(state, def.id).find((t) => !taken.has(key(t)));
    if (!free) continue;
    state.layout.placed[def.id] = free;
    taken.set(key(free), def.id);
  }
};

/** Technical design §19.3: the canonical layout, with unlocked pieces whose spot is closed placed in the first free open tile. */
export const autoArrange = (state: GameState): void => {
  const bounds = clearingBounds(state.cycle.age);
  state.layout.placed = structuredClone(CANONICAL_LAYOUT);
  const homeless = PIECES.filter(
    (p) =>
      isPieceUnlocked(state, p.id) &&
      !footprint(p, CANONICAL_LAYOUT[p.id]).every((t) => inClearing(bounds, t)) &&
      p.id !== 'hearth-hall',
  );
  // They leave the blueprint first so their own old spot counts as free for the next one.
  for (const p of homeless) dropPiece(state, p.id);
  const taken = covered(state);
  for (const p of homeless) {
    const free = tileOrder(state, p.id).find((t) => !taken.has(key(t)));
    if (!free) continue;
    state.layout.placed[p.id] = free;
    taken.set(key(free), p.id);
  }
};

/** Why a move is refused, or null when it is allowed. */
export const placeRefusal = (
  state: GameState,
  id: HoldPieceId,
  x: unknown,
  y: unknown,
): string | null => {
  const def = PIECES.find((p) => p.id === id);
  if (!def) return 'layout: no such piece';
  if (!Number.isInteger(x) || !Number.isInteger(y)) return 'layout: tile must be whole numbers';
  const at = { x: x as number, y: y as number };
  if (!isPieceUnlocked(state, id)) return 'layout: piece is locked';
  if (id === 'hearth-hall') {
    const inRange = (n: number): boolean => n >= HALL_ANCHOR.min && n <= HALL_ANCHOR.max;
    if (!inRange(at.x) || !inRange(at.y)) return 'layout: hall anchor out of range';
  }
  const bounds = clearingBounds(state.cycle.age);
  if (!footprint(def, at).every((t) => inClearing(bounds, t))) return 'layout: tile is not cleared';
  const hall = state.layout.placed['hearth-hall'];
  if (id !== 'hearth-hall' && hall) {
    const hallDef = pieceDef('hearth-hall');
    if (footprint(hallDef, hall).some((t) => t.x === at.x && t.y === at.y))
      return 'layout: the Hearth Hall is there';
  }
  return null;
};

/** Moves a 1 × 1 piece: a piece on the target tile takes its old tile (a swap), or else loses its spot. */
const moveSmall = (state: GameState, id: HoldPieceId, to: GridCoord): void => {
  const from = state.layout.placed[id];
  const other = covered(state, id).get(key(to));
  if (other) {
    const otherUnlocked = isPieceUnlocked(state, other);
    const fromClosed =
      !from ||
      !inClearing(clearingBounds(state.cycle.age), from); /* the mover was dormant or new */
    // A piece that is built goes to the tray rather than to a closed tile; a blueprint may sit anywhere.
    if (from && !(otherUnlocked && fromClosed)) state.layout.placed[other] = { ...from };
    else dropPiece(state, other);
  }
  state.layout.placed[id] = { ...to };
};

/** Moves the Hearth Hall: pieces under its new tiles take the tiles it leaves (always as many as needed). */
const moveHall = (state: GameState, to: GridCoord): void => {
  const def = pieceDef('hearth-hall');
  const from = state.layout.placed['hearth-hall'];
  const inNew = new Set(footprint(def, to).map(key));
  const vacated = from ? footprint(def, from).filter((t) => !inNew.has(key(t))) : [];
  vacated.sort((a, b) => a.y - b.y || a.x - b.x);
  const taken = covered(state, 'hearth-hall');
  const displaced = PIECES.filter((p) => {
    const at = state.layout.placed[p.id];
    return p.id !== 'hearth-hall' && at && inNew.has(key(at));
  });
  state.layout.placed['hearth-hall'] = { ...to };
  displaced.forEach((p, i) => {
    const spot = vacated[i];
    if (spot && !taken.has(key(spot))) state.layout.placed[p.id] = { ...spot };
    else dropPiece(state, p.id);
  });
};

export const placePiece = (state: GameState, id: HoldPieceId, to: GridCoord): void => {
  if (id === 'hearth-hall') moveHall(state, to);
  else moveSmall(state, id, to);
};
