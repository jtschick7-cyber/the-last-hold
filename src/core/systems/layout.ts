import type { AgeId } from '../../content/ages';
import type { CosmeticId } from '../../content/delves/shop';
import {
  CONNECTION_BITS,
  HOLD_PIECE_IDS,
  PIECES,
  type ClearingBounds,
  type GridCoord,
  type HoldPieceId,
  type PieceDef,
} from '../../content/hold-layout';
import { holdLook, type HoldLookState } from '../story/remembering-view';
import type { GameState } from '../state/game-state';
import { clearingBounds, pieceDef } from './layout-catalog';

// GDD §5.1.5 and technical design §19.3 (D500–D502, plan TL.2): what each piece of the Hold's layout
// is, derived from the saved blueprint and the buildings. Pure, and read only by the Hold screen:
// no production rate, cost, Threat rate or fight calculation reads any of this (CLAUDE.md).

export type PieceStatus = 'locked' | 'active' | 'dormant-ring' | 'tray';

type LayoutInputs = Pick<GameState, 'layout' | 'buildings' | 'cycle'>;

/** Every tile a piece covers when its top-left tile is `at`. */
export const footprint = (def: PieceDef, at: GridCoord): GridCoord[] => {
  const tiles: GridCoord[] = [];
  for (let dx = 0; dx < def.w; dx++)
    for (let dy = 0; dy < def.h; dy++) tiles.push({ x: at.x + dx, y: at.y + dy });
  return tiles;
};

export const inClearing = (b: ClearingBounds, tile: GridCoord): boolean =>
  tile.x >= b.minX && tile.x <= b.maxX && tile.y >= b.minY && tile.y <= b.maxY;

/** The Hearth Hall always stands; the rest need the copies or level their definition names. */
export const isPieceUnlocked = (state: Pick<GameState, 'buildings'>, id: HoldPieceId): boolean => {
  const def = pieceDef(id);
  return state.buildings[def.building] >= def.unlockAt;
};

/** D502 (M2): the four states are exclusive; a saved coordinate is never moved by this. */
export const getPieceStatus = (state: LayoutInputs, id: HoldPieceId): PieceStatus => {
  if (!isPieceUnlocked(state, id)) return 'locked';
  const at = state.layout.placed[id];
  if (!at) return 'tray';
  const bounds = clearingBounds(state.cycle.age);
  return footprint(pieceDef(id), at).every((t) => inClearing(bounds, t))
    ? 'active'
    : 'dormant-ring';
};

/** The look of a piece, 1 to 3: its tier (level buildings) or its density (plots). */
export const pieceTier = (state: Pick<GameState, 'buildings'>, id: HoldPieceId): number => {
  const def = pieceDef(id);
  if (!def.tierFrom) return 1;
  const n = state.buildings[def.building];
  return 1 + (n >= def.tierFrom[0] ? 1 : 0) + (n >= def.tierFrom[1] ? 1 : 0);
};

/** The tiles of the active defenses (walls and watchtowers), "x,y" → true. */
export type DefenseGrid = ReadonlySet<string>;
const key = (x: number, y: number): string => `${x},${y}`;
const isDefense = (id: HoldPieceId): boolean =>
  id.startsWith('wall-') || id.startsWith('watchtower-');

/** GDD §5.1.5: bit N=1, E=2, S=4, W=8 for each side that touches another active wall or watchtower. */
export const wallConnectionMask = (grid: DefenseGrid, x: number, y: number): number =>
  (grid.has(key(x, y - 1)) ? CONNECTION_BITS.n : 0) |
  (grid.has(key(x + 1, y)) ? CONNECTION_BITS.e : 0) |
  (grid.has(key(x, y + 1)) ? CONNECTION_BITS.s : 0) |
  (grid.has(key(x - 1, y)) ? CONNECTION_BITS.w : 0);

export interface ActivePiece {
  id: HoldPieceId;
  x: number;
  y: number;
  w: number;
  h: number;
  /** The building it shows. */
  building: PieceDef['building'];
  tier: number;
  /** Walls and watchtowers only: which sides connect (0 to 15). */
  mask: number | null;
}
export interface GhostPiece {
  id: HoldPieceId;
  x: number;
  y: number;
  /** `locked`: not built yet; `dormant-ring`: built, waiting for a Rank to clear its ground. */
  status: 'locked' | 'dormant-ring';
}
/** GDD §9.21 cosmetics (S7): where each one shows. */
export interface HoldCosmetics {
  door: boolean;
  banners: boolean;
  /** `tower` once Watchtower 1 stands on the grid; until then it hangs on the border header. */
  bell: 'tower' | 'border' | null;
  /** `walls` once any Wall segment stands on the grid; until then on the border pillars. */
  lanterns: 'walls' | 'border' | null;
}
export interface HoldGridView {
  age: AgeId;
  clearing: ClearingBounds;
  active: ActivePiece[];
  ghosts: GhostPiece[];
  tray: HoldPieceId[];
  look: HoldLookState;
  cosmetics: HoldCosmetics;
  showGhosts: boolean;
  /** Pieces standing on the grid now, and every piece there can be. */
  activeCount: number;
  pieceCount: number;
}

const bought = (state: GameState, c: CosmeticId): boolean => state.delve.shop.cosmetics.includes(c);

const build = (state: GameState): HoldGridView => {
  const active: ActivePiece[] = [];
  const ghosts: GhostPiece[] = [];
  const tray: HoldPieceId[] = [];
  for (const def of PIECES) {
    const status = getPieceStatus(state, def.id);
    const at = state.layout.placed[def.id];
    if (status === 'tray') tray.push(def.id);
    else if (status === 'active' && at)
      active.push({
        id: def.id,
        ...at,
        w: def.w,
        h: def.h,
        building: def.building,
        tier: pieceTier(state, def.id),
        mask: null,
      });
    else if (at && state.layout.showGhosts)
      ghosts.push({ id: def.id, ...at, status: status === 'locked' ? 'locked' : 'dormant-ring' });
  }
  const defenses = new Set(active.filter((p) => isDefense(p.id)).map((p) => key(p.x, p.y)));
  for (const p of active) if (isDefense(p.id)) p.mask = wallConnectionMask(defenses, p.x, p.y);
  const hasTower = active.some((p) => p.id === 'watchtower-1');
  const hasWall = active.some((p) => p.id.startsWith('wall-'));
  return {
    age: state.cycle.age,
    clearing: clearingBounds(state.cycle.age),
    active,
    ghosts,
    tray,
    look: holdLook(state),
    cosmetics: {
      door: bought(state, 'carved-hearth-hall-door'),
      banners: bought(state, 'gatehouse-banners'),
      bell: bought(state, 'watchtower-bell') ? (hasTower ? 'tower' : 'border') : null,
      lanterns: bought(state, 'wall-lanterns') ? (hasWall ? 'walls' : 'border') : null,
    },
    showGhosts: state.layout.showGhosts,
    activeCount: active.length,
    pieceCount: HOLD_PIECE_IDS.length,
  };
};

/** Everything the view reads, as one string: the view is rebuilt only when it changes (N6). */
const signature = (state: GameState): string =>
  [
    state.cycle.age,
    holdLook(state),
    state.delve.shop.cosmetics.join(),
    state.layout.showGhosts,
    JSON.stringify(state.layout.placed),
    PIECES.map((p) => state.buildings[p.building]).join(),
  ].join('|');

let memo: { key: string; view: HoldGridView } | null = null;

/** The Hold screen's grid (GDD §9.21), memoized on what it reads (N6). Treat the result as read-only. */
export const buildHoldGridView = (state: GameState): HoldGridView => {
  const k = signature(state);
  if (memo?.key === k) return memo.view;
  const view = build(state);
  memo = { key: k, view };
  return view;
};
