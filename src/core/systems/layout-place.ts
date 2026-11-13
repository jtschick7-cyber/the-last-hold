import {
  ARRANGE_PATTERNS,
  CANONICAL_LAYOUT,
  DEFENSE_TILE_ORDER,
  GRID_COLS,
  GRID_ROWS,
  HALL_DEFAULT,
  HOLD_CENTER,
  PIECES,
  hallAnchorBounds,
  type GridCoord,
  type HoldPieceId,
} from '../../content/hold-layout';
import type { GameState } from '../state/game-state';
import type { HoldLayoutState, LayoutArrangeMode, LayoutPresetSlot } from '../state/layout-state';
import { clearingBounds, decodePresetSlot, encodePresetSlot, pieceDef } from './layout-catalog';
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
  for (let y = 0; y < GRID_ROWS; y++)
    for (let x = 0; x < GRID_COLS; x++)
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
  const bounds = clearingBounds(state.cycle.age);
  const hallDef = pieceDef('hearth-hall');
  const hallAt = state.layout.placed['hearth-hall'];
  if (!hallAt || !footprint(hallDef, hallAt).every((t) => inClearing(bounds, t))) {
    const hb = hallAnchorBounds(bounds);
    const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));
    const target = hallAt
      ? { x: clamp(hallAt.x, hb.minX, hb.maxX), y: clamp(hallAt.y, hb.minY, hb.maxY) }
      : { ...HALL_DEFAULT };
    moveHall(state, target);
  }
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

const ARRANGE_MODES: readonly LayoutArrangeMode[] = ['balanced', 'economy', 'fortress'];
const ORTHO: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];
const CHEBYSHEV_RING: readonly (readonly [number, number])[] = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

export const isArrangeMode = (v: unknown): v is LayoutArrangeMode =>
  typeof v === 'string' && (ARRANGE_MODES as readonly string[]).includes(v);

export const isPresetSlot = (v: unknown): v is LayoutPresetSlot => v === 0 || v === 1;

export const savePresetSlot = (state: GameState, slot: LayoutPresetSlot): void => {
  const next: [(typeof state.layout.presets)[0], (typeof state.layout.presets)[1]] = [
    state.layout.presets[0],
    state.layout.presets[1],
  ];
  next[slot] = encodePresetSlot(state.layout.placed);
  state.layout.presets = next;
};

export const applyPresetSlot = (state: GameState, slot: LayoutPresetSlot): string | null => {
  const saved = state.layout.presets[slot];
  if (!saved) return 'layout: preset slot is empty';
  const decoded = decodePresetSlot(saved);
  const nextPlaced: HoldLayoutState['placed'] = {};
  const bounds = clearingBounds(state.cycle.age);
  for (const def of PIECES) {
    const at = decoded[def.id];
    if (!at) continue;
    if (
      def.id !== 'hearth-hall' &&
      isPieceUnlocked(state, def.id) &&
      !footprint(def, at).every((t) => inClearing(bounds, t))
    ) {
      continue;
    }
    nextPlaced[def.id] = at;
  }
  state.layout.placed = nextPlaced;
  autoPlaceUnlocked(state);
  return null;
};

interface GridPlacer {
  readonly bounds: ReturnType<typeof clearingBounds>;
  readonly placed: Partial<Record<HoldPieceId, GridCoord>>;
  readonly taken: Set<string>;
}

const makePlacer = (bounds: ReturnType<typeof clearingBounds>): GridPlacer => ({
  bounds,
  placed: {},
  taken: new Set<string>(),
});

const canPut = (p: GridPlacer, id: HoldPieceId, c: GridCoord, requireClearing = true): boolean => {
  const def = pieceDef(id);
  for (const t of footprint(def, c)) {
    if (t.x < 0 || t.x >= GRID_COLS || t.y < 0 || t.y >= GRID_ROWS) return false;
    if (requireClearing && !inClearing(p.bounds, t)) return false;
    if (p.taken.has(key(t))) return false;
  }
  return true;
};

const putPiece = (
  p: GridPlacer,
  id: HoldPieceId,
  c: GridCoord,
  requireClearing = true,
): boolean => {
  if (!canPut(p, id, c, requireClearing)) return false;
  p.placed[id] = { ...c };
  for (const t of footprint(pieceDef(id), c)) p.taken.add(key(t));
  return true;
};

const placeCluster = (
  p: GridPlacer,
  hubId: HoldPieceId,
  satIds: readonly HoldPieceId[],
  unlocked: ReadonlySet<HoldPieceId>,
  minY: number,
  offsets: readonly (readonly [number, number])[] = ORTHO,
): void => {
  const activeSats = satIds.filter((id) => unlocked.has(id) && !p.placed[id]);
  if (!unlocked.has(hubId) || p.placed[hubId]) return;
  let best: GridCoord | null = null;
  let bestFree = -1;
  const want = activeSats.length;
  for (let y = Math.max(p.bounds.minY, minY); y <= p.bounds.maxY; y++) {
    for (let x = p.bounds.minX; x <= p.bounds.maxX; x++) {
      const c = { x, y };
      if (!canPut(p, hubId, c, true)) continue;
      let free = 0;
      for (const [dx, dy] of offsets) {
        const nc = { x: x + dx, y: y + dy };
        if (inClearing(p.bounds, nc) && !p.taken.has(key(nc))) free += 1;
      }
      if (Math.min(want, free) > Math.min(want, bestFree)) {
        bestFree = free;
        best = c;
      }
    }
  }
  if (!best) {
    for (let y = p.bounds.minY; y <= p.bounds.maxY && !best; y++)
      for (let x = p.bounds.minX; x <= p.bounds.maxX && !best; x++)
        if (canPut(p, hubId, { x, y }, true)) best = { x, y };
  }
  if (!best) return;
  putPiece(p, hubId, best, true);
  let idx = 0;
  for (const [dx, dy] of offsets) {
    const sat = activeSats[idx];
    if (!sat) break;
    if (putPiece(p, sat, { x: best.x + dx, y: best.y + dy }, true)) idx += 1;
  }
};

const placeBalanced = (state: GameState): void => {
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

const finishArrange = (
  state: GameState,
  p: GridPlacer,
  unlocked: ReadonlySet<HoldPieceId>,
): void => {
  // Any unlocked small piece still waiting goes into the first free clearing tile.
  for (const def of PIECES) {
    if (!unlocked.has(def.id) || p.placed[def.id]) continue;
    const free = tileOrder(state, def.id).find((t) => canPut(p, def.id, t, true));
    if (free) putPiece(p, def.id, free, true);
  }
  // Keep locked blueprint ghosts on their canonical tile if free, else first open grid tile.
  for (const def of PIECES) {
    if (p.placed[def.id]) continue;
    const canon = CANONICAL_LAYOUT[def.id];
    if (putPiece(p, def.id, canon, false)) continue;
    outer: for (let y = GRID_ROWS - 1; y >= 0; y--) {
      for (let x = 0; x < GRID_COLS; x++) {
        if (putPiece(p, def.id, { x, y }, false)) break outer;
      }
    }
  }
  state.layout.placed = p.placed;
};

const placeSharedDistricts = (
  p: GridPlacer,
  unlocked: ReadonlySet<HoldPieceId>,
  minY: number,
): void => {
  placeCluster(p, 'mill', ['farm-1', 'farm-2', 'farm-3'], unlocked, minY);
  placeCluster(p, 'sawpit', ['woodcutter-1', 'woodcutter-2', 'woodcutter-3'], unlocked, minY);
  placeCluster(
    p,
    'smithy',
    ['silver-seam-1', 'silver-seam-2', 'mine-1', 'mine-2', 'mine-3'],
    unlocked,
    minY,
  );
  placeCluster(p, 'alchemist', ['herb-garden-1', 'herb-garden-2', 'herb-garden-3'], unlocked, minY);
  placeCluster(
    p,
    'bell-tower',
    ['cottage-1', 'cottage-2', 'cottage-3'],
    unlocked,
    minY,
    CHEBYSHEV_RING,
  );
  // If Bell Tower isn't unlocked, park unlocked cottages beside Hearth Hall for warmth links.
  if (!unlocked.has('bell-tower') && p.placed['hearth-hall']) {
    for (const cId of ['cottage-1', 'cottage-2', 'cottage-3'] as const) {
      if (!unlocked.has(cId) || p.placed[cId]) continue;
      outerCot: for (const tile of footprint(pieceDef('hearth-hall'), p.placed['hearth-hall'])) {
        for (const [dx, dy] of ORTHO) {
          if (putPiece(p, cId, { x: tile.x + dx, y: tile.y + dy }, true)) break outerCot;
        }
      }
    }
  }
  // Park Trophy Hall adjacent to Hearth Hall or Barracks when free.
  if (unlocked.has('trophy-hall') && !p.placed['trophy-hall']) {
    for (const anchorId of ['hearth-hall', 'barracks'] as const) {
      const anchor = p.placed[anchorId];
      if (!anchor) continue;
      for (const tile of footprint(pieceDef(anchorId), anchor)) {
        for (const [dx, dy] of ORTHO) {
          if (putPiece(p, 'trophy-hall', { x: tile.x + dx, y: tile.y + dy }, true)) return;
        }
      }
    }
  }
};

const placeHallSafely = (p: GridPlacer, preferX: number, preferY: number): void => {
  const hb = hallAnchorBounds(p.bounds);
  const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));
  if (
    putPiece(
      p,
      'hearth-hall',
      { x: clamp(preferX, hb.minX, hb.maxX), y: clamp(preferY, hb.minY, hb.maxY) },
      true,
    )
  )
    return;
  for (let y = hb.maxY; y >= hb.minY; y--) {
    for (let x = hb.minX; x <= hb.maxX; x++) {
      if (putPiece(p, 'hearth-hall', { x, y }, true)) return;
    }
  }
};

const arrangeEconomy = (state: GameState): void => {
  const bounds = clearingBounds(state.cycle.age);
  const unlocked = unlockedPieces(state);
  const p = makePlacer(bounds);
  const walls = PIECES.filter((d) => d.id.startsWith('wall-') && unlocked.has(d.id)).map(
    (d) => d.id,
  );
  const towers = PIECES.filter((d) => d.id.startsWith('watchtower-') && unlocked.has(d.id)).map(
    (d) => d.id,
  );
  // If we have enough walls/towers to seal row 0, form a pure north curtain (y = 0) so the entire courtyard behind is Warded.
  let minEconY = bounds.minY;
  const width = bounds.maxX - bounds.minX + 1;
  if (bounds.minY === 0 && walls.length + towers.length >= width) {
    const barrier = [...walls, ...towers];
    let idx = 0;
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      const id = barrier[idx];
      if (!id) break;
      if (putPiece(p, id, { x, y: 0 }, true)) idx += 1;
    }
    minEconY = 1;
  }
  placeHallSafely(p, HALL_DEFAULT.x, Math.max(minEconY, bounds.maxY - 2));
  placeSharedDistricts(p, unlocked, minEconY);
  // Park any extra economy-mode defenses at side outer rows (y >= 2..4 or rear) rather than Screened row 1.
  for (const id of [...walls, ...towers]) {
    if (p.placed[id]) continue;
    outerExtra: for (
      let y = Math.min(bounds.maxY, Math.max(bounds.minY, 2));
      y <= bounds.maxY;
      y++
    ) {
      for (const x of ARRANGE_PATTERNS.edgeToCenterCols) {
        if (x >= bounds.minX && x <= bounds.maxX && putPiece(p, id, { x, y }, true))
          break outerExtra;
      }
    }
  }
  finishArrange(state, p, unlocked);
};

const arrangeFortress = (state: GameState): void => {
  const bounds = clearingBounds(state.cycle.age);
  const unlocked = unlockedPieces(state);
  const p = makePlacer(bounds);
  const walls = PIECES.filter((d) => d.id.startsWith('wall-') && unlocked.has(d.id)).map(
    (d) => d.id,
  );
  const towers = PIECES.filter((d) => d.id.startsWith('watchtower-') && unlocked.has(d.id)).map(
    (d) => d.id,
  );
  const frontY = bounds.minY;
  const maxFrontY = Math.min(bounds.maxY, ARRANGE_PATTERNS.frontRowMaxY);
  const centerOrder = ARRANGE_PATTERNS.centerToEdgeCols.filter(
    (x) => x >= bounds.minX && x <= bounds.maxX,
  );
  const fullOrder = (bounds.minX <= 0 ? ARRANGE_PATTERNS.westToEastCols : centerOrder).filter(
    (x) => x >= bounds.minX && x <= bounds.maxX,
  );
  let wIdx = 0;
  // Row 0 (or minY): fill connected wall rampart across clearing width first when 8+ walls exist, else connected center strip.
  const row0Order = walls.length >= fullOrder.length ? fullOrder : centerOrder;
  for (const x of row0Order) {
    const id = walls[wIdx];
    if (!id) break;
    if (putPiece(p, id, { x, y: frontY }, true)) wIdx += 1;
  }
  // Row minY + 1 (if in frontRows 0..4): spread Screened Watchtowers behind connected row-0 walls.
  const screenY = frontY + 1;
  if (screenY <= maxFrontY) {
    for (const x of ARRANGE_PATTERNS.towerScreenCols) {
      const tId = towers.find((id) => !p.placed[id]);
      if (!tId) break;
      if (x >= bounds.minX && x <= bounds.maxX) putPiece(p, tId, { x, y: screenY }, true);
    }
    // Extra walls add depth + maintain connectivity immediately south of row 0.
    while (wIdx < walls.length) {
      const id = walls[wIdx];
      if (!id) break;
      let placedExtra = false;
      for (let y = screenY; y <= maxFrontY && !placedExtra; y++) {
        for (const x of centerOrder) {
          if (putPiece(p, id, { x, y }, true)) {
            placedExtra = true;
            break;
          }
        }
      }
      wIdx += 1;
      if (!placedExtra) break;
    }
  }
  // Any remaining watchtowers in front clearing rows if minY + 1 was full or unavailable.
  for (const tId of towers) {
    if (p.placed[tId]) continue;
    for (let y = frontY; y <= maxFrontY && !p.placed[tId]; y++) {
      for (const x of ARRANGE_PATTERNS.towerScreenCols) {
        if (x >= bounds.minX && x <= bounds.maxX && putPiece(p, tId, { x, y }, true)) break;
      }
    }
  }
  // Sector Support: position Barracks and Lodge covering center+side Breach lanes behind front zone.
  const supportY = Math.min(bounds.maxY, Math.max(bounds.minY, ARRANGE_PATTERNS.supportStartY));
  for (const [sId, prefCols] of ARRANGE_PATTERNS.supportPrefCols) {
    if (!unlocked.has(sId) || p.placed[sId]) continue;
    outerSupport: for (let y = supportY; y <= bounds.maxY; y++) {
      for (const x of prefCols) {
        if (x >= bounds.minX && x <= bounds.maxX && putPiece(p, sId, { x, y }, true))
          break outerSupport;
      }
    }
  }
  const innerMinY = Math.min(bounds.maxY, Math.max(bounds.minY, 2));
  placeHallSafely(p, HALL_DEFAULT.x, Math.max(innerMinY, bounds.maxY - 2));
  placeSharedDistricts(p, unlocked, innerMinY);
  finishArrange(state, p, unlocked);
};

/** Technical design §19.3 & §25.1: arranges unlocked pieces by mode ('balanced' | 'economy' | 'fortress'). */
export const autoArrange = (state: GameState, mode: LayoutArrangeMode = 'balanced'): void => {
  if (mode === 'economy') {
    arrangeEconomy(state);
    return;
  }
  if (mode === 'fortress') {
    arrangeFortress(state);
    return;
  }
  placeBalanced(state);
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
  const bounds = clearingBounds(state.cycle.age);
  displaced.forEach((p, i) => {
    const spot = vacated[i];
    const spotClosed = spot ? !inClearing(bounds, spot) : true;
    if (spot && !taken.has(key(spot)) && !(isPieceUnlocked(state, p.id) && spotClosed))
      state.layout.placed[p.id] = { ...spot };
    else dropPiece(state, p.id);
  });
};

export const placePiece = (state: GameState, id: HoldPieceId, to: GridCoord): void => {
  if (id === 'hearth-hall') moveHall(state, to);
  else moveSmall(state, id, to);
};
