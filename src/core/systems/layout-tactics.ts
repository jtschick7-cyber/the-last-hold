import type { BalanceKey } from '../../content/balance';
import type { BuildingId } from '../../content/buildings';
import {
  GRID_COLS,
  GRID_ROWS,
  PIECES,
  type GridCoord,
  type HoldPieceId,
} from '../../content/hold-layout';
import { MAX_PIECES_PER_COLUMN } from '../state/lane-table';
import { RESOURCE_IDS, type ResourceId } from '../../content/resources';
import { num } from '../balance-access';
import type { Breakdown, Explained } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';
import { footprint, getPieceStatus, wallConnectionMask } from './layout';
import { pieceDef } from './layout-catalog';

// GDD §5.1.5, §7.16 & technical design §25.2 (D619, D625): pure AoE + North-Reach Warded analyzer.
// One-way boundary: this module reads state.layout cleanly while economy, threat, and alchemy consume
// only the scalar modifiers below (never reading state.layout directly).

export type AdjacencyKind = 'food' | 'wood' | 'iron' | 'silver' | 'brew' | 'warmth' | 'trophy';

export interface AdjacencyLink {
  readonly from: HoldPieceId;
  readonly to: HoldPieceId;
  readonly kind: AdjacencyKind;
}

export interface HoldTacticsSummary {
  readonly links: readonly AdjacencyLink[];
  readonly foodLinked: readonly HoldPieceId[];
  readonly woodLinked: readonly HoldPieceId[];
  readonly ironLinked: readonly HoldPieceId[];
  readonly silverLinked: readonly HoldPieceId[];
  readonly brewLinked: readonly HoldPieceId[];
  /** Active cottages touching hearth-hall orthogonally or inside bell-tower 3x3 ring (once each). */
  readonly warmCottages: readonly HoldPieceId[];
  readonly trophyLinked: boolean;
  /** Row-major (y * GRID_COLS + x) flags: true when reached from open y = 0 Breach edge. */
  readonly northReached: readonly boolean[];
  /** True iff hearth-hall is active and all 4 tiles of its 2x2 footprint are unreached. */
  readonly hearthWarded: boolean;
  /** Active non-defense pieces whose entire footprint is unreached by North-Reach BFS. */
  readonly wardedPieces: ReadonlySet<HoldPieceId>;
  readonly wardedPlots: Readonly<Record<ResourceId, readonly HoldPieceId[]>>;
  /** Active wall-* segments that orthogonally touch >= 1 other active defense piece. */
  readonly connectedWalls: ReadonlySet<HoldPieceId>;
  /** Active front-zone (y = 0..4) watchtowers standing directly south (y - 1) of a connected wall. */
  readonly screenedTowers: ReadonlySet<HoldPieceId>;
  /** Per-column (0..7) count of distinct active support types (`barracks`, `lodge`) across x +/- 1. */
  readonly sectorSupport: readonly number[];
  readonly wardedThreatCut: number;
  readonly brewCut: number;
  readonly productionBonus: Readonly<Record<ResourceId, number>>;
}

interface DistrictSpec {
  readonly kind: 'food' | 'wood' | 'iron' | 'silver' | 'brew';
  readonly building: BuildingId;
  readonly hubId: HoldPieceId;
  readonly key: BalanceKey;
  readonly label: string;
  readonly resource?: ResourceId;
}

const DISTRICT_SPECS: readonly DistrictSpec[] = [
  {
    kind: 'food',
    building: 'farm',
    hubId: 'mill',
    key: 'layout.adjFood',
    label: 'Mill',
    resource: 'food',
  },
  {
    kind: 'wood',
    building: 'woodcutters-camp',
    hubId: 'sawpit',
    key: 'layout.adjWood',
    label: 'Sawpit',
    resource: 'wood',
  },
  {
    kind: 'iron',
    building: 'mine',
    hubId: 'smithy',
    key: 'layout.adjIron',
    label: 'Smithy',
    resource: 'iron',
  },
  {
    kind: 'silver',
    building: 'silver-seam',
    hubId: 'smithy',
    key: 'layout.adjSilver',
    label: 'Smithy',
    resource: 'silver',
  },
  {
    kind: 'brew',
    building: 'herb-garden',
    hubId: 'alchemist',
    key: 'layout.adjBrew',
    label: 'Alchemist',
  },
];

const PLOT_RESOURCE: Readonly<Partial<Record<BuildingId, ResourceId>>> = {
  farm: 'food',
  'woodcutters-camp': 'wood',
  mine: 'iron',
  'silver-seam': 'silver',
};

const ORTHOGONAL_DIRS: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

const NORTH_START_Y = 0;

const isDefensePiece = (id: HoldPieceId): boolean =>
  id.startsWith('wall-') || id.startsWith('watchtower-');

const tileIdx = (x: number, y: number): number => y * GRID_COLS + x;
const coordKey = (x: number, y: number): string => `${x},${y}`;

const touchesOrthogonally = (a: readonly GridCoord[], b: readonly GridCoord[]): boolean => {
  for (const ta of a) {
    for (const tb of b) {
      if (Math.abs(ta.x - tb.x) + Math.abs(ta.y - tb.y) === 1) return true;
    }
  }
  return false;
};

const touchesChebyshevOne = (a: readonly GridCoord[], b: readonly GridCoord[]): boolean => {
  for (const ta of a) {
    for (const tb of b) {
      if (Math.max(Math.abs(ta.x - tb.x), Math.abs(ta.y - tb.y)) <= 1) return true;
    }
  }
  return false;
};

interface HoldGeometry {
  readonly links: readonly AdjacencyLink[];
  readonly byKind: Readonly<Record<DistrictSpec['kind'], readonly HoldPieceId[]>>;
  readonly warmCottages: readonly HoldPieceId[];
  readonly trophyLinked: boolean;
  readonly northReached: readonly boolean[];
  readonly hearthWarded: boolean;
  readonly wardedPieces: ReadonlySet<HoldPieceId>;
  readonly wardedPlots: Readonly<Record<ResourceId, readonly HoldPieceId[]>>;
  readonly connectedWalls: ReadonlySet<HoldPieceId>;
  readonly screenedTowers: ReadonlySet<HoldPieceId>;
  readonly sectorSupport: readonly number[];
}

const computeNorthReach = (blocked: readonly boolean[]): boolean[] => {
  const reached = new Array<boolean>(GRID_COLS * GRID_ROWS).fill(false);
  const queue: GridCoord[] = [];
  for (let x = 0; x < GRID_COLS; x += 1) {
    const idx = tileIdx(x, NORTH_START_Y);
    if (blocked[idx]) continue;
    reached[idx] = true;
    queue.push({ x, y: NORTH_START_Y });
  }
  for (let head = 0; head < queue.length; head += 1) {
    const cur = queue[head];
    if (!cur) continue;
    for (const dir of ORTHOGONAL_DIRS) {
      const nx = cur.x + dir[0];
      const ny = cur.y + dir[1];
      if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) continue;
      const nIdx = tileIdx(nx, ny);
      if (blocked[nIdx] || reached[nIdx]) continue;
      reached[nIdx] = true;
      queue.push({ x: nx, y: ny });
    }
  }
  return reached;
};

const analyzeDistrictLinks = (
  activeTiles: ReadonlyMap<HoldPieceId, readonly GridCoord[]>,
): Pick<HoldGeometry, 'links' | 'byKind' | 'warmCottages' | 'trophyLinked'> => {
  const links: AdjacencyLink[] = [];
  const byKind: Record<DistrictSpec['kind'], HoldPieceId[]> = {
    food: [],
    wood: [],
    iron: [],
    silver: [],
    brew: [],
  };

  for (const spec of DISTRICT_SPECS) {
    const hubTiles = activeTiles.get(spec.hubId);
    if (!hubTiles) continue;
    for (const def of PIECES) {
      if (def.building !== spec.building) continue;
      const tiles = activeTiles.get(def.id);
      if (!tiles || !touchesOrthogonally(tiles, hubTiles)) continue;
      byKind[spec.kind].push(def.id);
      links.push({ from: def.id, to: spec.hubId, kind: spec.kind });
    }
  }

  const warmCottages: HoldPieceId[] = [];
  const hearthTiles = activeTiles.get('hearth-hall');
  const bellTiles = activeTiles.get('bell-tower');
  for (const def of PIECES) {
    if (def.building !== 'cottage') continue;
    const tiles = activeTiles.get(def.id);
    if (!tiles) continue;
    const byHearth = hearthTiles ? touchesOrthogonally(tiles, hearthTiles) : false;
    const byBell = bellTiles ? touchesChebyshevOne(tiles, bellTiles) : false;
    if (byHearth) links.push({ from: def.id, to: 'hearth-hall', kind: 'warmth' });
    if (byBell) links.push({ from: def.id, to: 'bell-tower', kind: 'warmth' });
    if (byHearth || byBell) warmCottages.push(def.id);
  }

  let trophyLinked = false;
  const trophyTiles = activeTiles.get('trophy-hall');
  const barracksTiles = activeTiles.get('barracks');
  if (trophyTiles) {
    if (hearthTiles && touchesOrthogonally(trophyTiles, hearthTiles)) {
      links.push({ from: 'trophy-hall', to: 'hearth-hall', kind: 'trophy' });
      trophyLinked = true;
    }
    if (barracksTiles && touchesOrthogonally(trophyTiles, barracksTiles)) {
      links.push({ from: 'trophy-hall', to: 'barracks', kind: 'trophy' });
      trophyLinked = true;
    }
  }

  return { links, byKind, warmCottages, trophyLinked };
};

const computeGeometry = (state: GameState): HoldGeometry => {
  const activeTiles = new Map<HoldPieceId, readonly GridCoord[]>();
  const blocked = new Array<boolean>(GRID_COLS * GRID_ROWS).fill(false);
  const defenses = new Set<string>();

  for (const def of PIECES) {
    if (getPieceStatus(state, def.id) !== 'active') continue;
    const at = state.layout.placed[def.id];
    if (!at) continue;
    const tiles = footprint(pieceDef(def.id), at);
    activeTiles.set(def.id, tiles);
    if (isDefensePiece(def.id)) {
      for (const t of tiles) {
        blocked[tileIdx(t.x, t.y)] = true;
        defenses.add(coordKey(t.x, t.y));
      }
    }
  }

  const northReached = computeNorthReach(blocked);
  const wardedPieces = new Set<HoldPieceId>();
  const wardedPlots: Record<ResourceId, HoldPieceId[]> = {
    food: [],
    wood: [],
    iron: [],
    silver: [],
  };
  const connectedWalls = new Set<HoldPieceId>();
  const connectedWallTiles = new Set<string>();
  const screenedTowers = new Set<HoldPieceId>();
  const sectorSupport = new Array<number>(GRID_COLS).fill(0);
  const sectorMask = new Array<number>(GRID_COLS).fill(0);

  for (const def of PIECES) {
    const tiles = activeTiles.get(def.id);
    if (!tiles) continue;
    if (def.id === 'barracks' || def.id === 'lodge') {
      const bit = def.id === 'barracks' ? 1 : 2;
      for (const tile of tiles) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const cx = tile.x + dx;
          if (cx >= 0 && cx < GRID_COLS && ((sectorMask[cx] ?? 0) & bit) === 0) {
            sectorMask[cx] = (sectorMask[cx] ?? 0) | bit;
            sectorSupport[cx] = (sectorSupport[cx] ?? 0) + 1;
          }
        }
      }
    }
    if (isDefensePiece(def.id)) {
      if (
        def.id.startsWith('wall-') &&
        tiles[0] &&
        wallConnectionMask(defenses, tiles[0].x, tiles[0].y) !== 0
      ) {
        connectedWalls.add(def.id);
        connectedWallTiles.add(coordKey(tiles[0].x, tiles[0].y));
      }
      continue;
    }
    const isWarded = tiles.every((t) => !northReached[tileIdx(t.x, t.y)]);
    if (!isWarded) continue;
    wardedPieces.add(def.id);
    const plotResource = PLOT_RESOURCE[def.building];
    if (plotResource) wardedPlots[plotResource].push(def.id);
  }

  for (const def of PIECES) {
    if (!def.id.startsWith('watchtower-')) continue;
    const t = activeTiles.get(def.id)?.[0];
    if (
      t &&
      t.y > 0 &&
      t.y < MAX_PIECES_PER_COLUMN &&
      connectedWallTiles.has(coordKey(t.x, t.y - 1))
    ) {
      screenedTowers.add(def.id);
    }
  }

  const hearthWarded = wardedPieces.has('hearth-hall');
  const district = analyzeDistrictLinks(activeTiles);
  return {
    ...district,
    northReached,
    hearthWarded,
    wardedPieces,
    wardedPlots,
    connectedWalls,
    screenedTowers,
    sectorSupport,
  };
};

const geometrySignature = (state: GameState): string =>
  [
    state.cycle.age,
    JSON.stringify(state.layout.placed),
    PIECES.map((p) => state.buildings[p.building]).join(),
  ].join('|');

let memo: { key: string; geom: HoldGeometry } | null = null;

const memoGeometry = (state: GameState): HoldGeometry => {
  const key = geometrySignature(state);
  if (memo?.key === key) return memo.geom;
  const geom = computeGeometry(state);
  memo = { key, geom };
  return geom;
};

const productionLines = (geom: HoldGeometry, resource: ResourceId): Breakdown[] => {
  const lines: Breakdown[] = [];
  const spec = DISTRICT_SPECS.find((d) => d.resource === resource);
  if (spec) {
    const count = geom.byKind[spec.kind].length;
    if (count > 0) {
      const per = num(spec.key);
      lines.push({
        label: `${spec.label} links (${count})`,
        value: count * per,
        formula: `${count} × ${per}`,
        key: spec.key,
      });
    }
  }
  if (resource !== 'silver') {
    if (geom.warmCottages.length > 0) {
      const per = num('layout.adjCottage');
      const count = geom.warmCottages.length;
      lines.push({
        label: `Warm Cottages (${count})`,
        value: count * per,
        formula: `${count} × ${per}`,
        key: 'layout.adjCottage',
      });
    }
    if (geom.trophyLinked) {
      const val = num('layout.adjTrophy');
      lines.push({
        label: 'Trophy Hall link',
        value: val,
        formula: `1 × ${val}`,
        key: 'layout.adjTrophy',
      });
    }
  }
  const wardedCount = geom.wardedPlots[resource].length;
  if (wardedCount > 0) {
    const per = num('layout.wardedBonus');
    lines.push({
      label: `Warded plots (${wardedCount})`,
      value: wardedCount * per,
      formula: `${wardedCount} × ${per}`,
      key: 'layout.wardedBonus',
    });
  }
  return lines;
};

/** Full tactical evaluation of active Hold piece positions, adjacency links, and Warded flood. */
export const evaluateHoldTactics = (state: GameState): HoldTacticsSummary => {
  const geom = memoGeometry(state);
  const productionBonus = Object.fromEntries(
    RESOURCE_IDS.map((r) => [
      r,
      productionLines(geom, r).reduce((sum, item) => sum + item.value, 0),
    ]),
  ) as Record<ResourceId, number>;
  return {
    links: geom.links,
    foodLinked: geom.byKind.food,
    woodLinked: geom.byKind.wood,
    ironLinked: geom.byKind.iron,
    silverLinked: geom.byKind.silver,
    brewLinked: geom.byKind.brew,
    warmCottages: geom.warmCottages,
    trophyLinked: geom.trophyLinked,
    northReached: geom.northReached,
    hearthWarded: geom.hearthWarded,
    wardedPieces: geom.wardedPieces,
    wardedPlots: geom.wardedPlots,
    connectedWalls: geom.connectedWalls,
    screenedTowers: geom.screenedTowers,
    sectorSupport: geom.sectorSupport,
    wardedThreatCut: geom.hearthWarded ? num('layout.wardedThreatCut') : 0,
    brewCut: Math.min(1, Math.max(0, geom.byKind.brew.length * num('layout.adjBrew'))),
    productionBonus,
  };
};

/** Post-bucket tactical production multiplier (>= 1.0x floor) for resource `r`, or null at 1.0x baseline. */
export const tacticalProductionFactor = (
  state: GameState,
  resource: ResourceId,
): Explained | null => {
  const lines = productionLines(memoGeometry(state), resource);
  if (lines.length === 0) return null;
  const sum = lines.reduce((acc, item) => acc + item.value, 0);
  if (sum <= 0) return null;
  const value = 1 + sum;
  return {
    value,
    breakdown: {
      label: 'Hold tactics',
      value,
      formula: '1 + Σ tactics',
      children: lines,
    },
  };
};

/** Multiplicative Threat slow factor when Hearth Hall is Warded (1 - wardedThreatCut), or null at 1.0x. */
export const tacticalThreatFactor = (state: GameState): Explained | null => {
  const geom = memoGeometry(state);
  if (!geom.hearthWarded) return null;
  const cut = Math.min(1, Math.max(0, num('layout.wardedThreatCut')));
  if (cut <= 0) return null;
  const value = 1 - cut;
  return {
    value,
    breakdown: {
      label: 'Warded Hearth Hall',
      value,
      formula: `1 − ${cut}`,
      key: 'layout.wardedThreatCut',
    },
  };
};

/** Brew & experiment duration cut in [0, 1] from active herb-garden links beside Alchemist's Hut. */
export const tacticalBrewCut = (state: GameState): number => {
  const geom = memoGeometry(state);
  return Math.min(1, Math.max(0, geom.byKind.brew.length * num('layout.adjBrew')));
};
