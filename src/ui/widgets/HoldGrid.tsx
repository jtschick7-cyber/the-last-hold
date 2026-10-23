import {
  GRID_HALL_DOOR_ID,
  GRID_HALL_LAMP_ID,
  GRID_TROPHY_HALL_ID,
  GRID_WALL_FROST_ID,
  GRID_WATCHTOWER_ID,
  forestTileId,
  ghostTileId,
  gridCosmeticId,
  gridHallFrostId,
  gridHallId,
  gridStripId,
  gridTierId,
  gridWallId,
  groundTileId,
  ruinTileId,
} from '../../content/assets';
import { buildHoldGridView, type ActivePiece } from '../../core/systems/layout';
import { inClearing } from '../../core/systems/layout';
import { game } from '../app/runtime';
import { Sprite } from './Sprite';

// GDD §9.21: the Hold screen's 8 × 8 grid header. Purely visual and non-interactive; it reads
// buildHoldGridView and decides no rule. The picture is 256 px wide (32 px tiles) with a 16 px
// border strip above and below, and scales to the card width.
const W = 256;
const H = 288;
const T = 32;
const STRIP = 16;
const pctX = (px: number): string => `${(px / W) * 100}%`;
const pctY = (px: number): string => `${(px / H) * 100}%`;

/** A fixed function of the tile's coordinates, so the ground never changes between visits. */
const mix = (x: number, y: number): number =>
  (x * 5 + y * 7 + ((x * y) % 3) * 4 + (x >> 1) * (y >> 1) * 3) % 11;
export const groundLook = (x: number, y: number): 'grass' | 'earth' | 'flags' => {
  const v = mix(x, y);
  return v === 0 ? 'earth' : v === 1 ? 'flags' : 'grass';
};
export const outsideTile = (x: number, y: number): string =>
  (x * 5 + y * 3) % 5 === 0
    ? ruinTileId(String(1 + ((x + y) % 2)))
    : forestTileId(String(1 + ((x + 2 * y) % 2)));

export const pieceImage = (p: ActivePiece, age: string): string =>
  p.id === 'hearth-hall'
    ? gridHallId(age as never)
    : p.id.startsWith('wall-')
      ? gridWallId(p.mask ?? 0)
      : p.id.startsWith('watchtower-')
        ? GRID_WATCHTOWER_ID
        : p.id === 'trophy-hall'
          ? GRID_TROPHY_HALL_ID
          : gridTierId(p.id.replace(/-\d+$/, ''), p.tier); // cottage-2 → cottage; alchemist stays

/** One layer: a picture of `w × h` tiles whose top-left tile is (x, y), or a full-width strip. */
const Layer = ({
  id,
  x = 0,
  y = 0,
  w = 1,
  h = 1,
  strip,
  ...data
}: {
  id: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  /** 'north' or 'south': a full-width strip layer at that edge. */
  strip?: 'north' | 'south';
  [k: `data-${string}`]: string | number | undefined;
}) => {
  const left = strip ? 0 : x * T;
  const top = strip === 'north' ? 0 : strip === 'south' ? STRIP + 8 * T : STRIP + y * T;
  return (
    <span
      style={{
        position: 'absolute',
        left: pctX(left),
        top: pctY(top),
        width: strip ? '100%' : pctX(w * T),
        height: pctY(strip ? STRIP : h * T),
      }}
      {...data}
    >
      <Sprite id={id} fill />
    </span>
  );
};

export const HoldGrid = () => {
  const s = game();
  const v = buildHoldGridView(s);
  const hall = v.active.find((p) => p.id === 'hearth-hall');
  const walls = v.active.filter((p) => p.id.startsWith('wall-'));
  const tower1 = v.active.find((p) => p.id === 'watchtower-1');
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) cells.push({ x, y });
  const c = v.cosmetics;
  return (
    <div
      aria-hidden="true"
      data-hold-grid="true"
      data-age={v.age}
      data-look={v.look}
      data-active-count={v.activeCount}
      data-tray-count={v.tray.length}
      data-door={String(c.door)}
      data-banners={String(c.banners)}
      data-bell={c.bell ?? 'none'}
      data-lanterns={c.lanterns ?? 'none'}
      data-ghosts={v.ghosts.length}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '320px',
        margin: '0 auto',
        aspectRatio: `${W} / ${H}`,
        lineHeight: 0,
        containerType: 'inline-size',
      }}
    >
      {cells.map(({ x, y }) => {
        const inside = inClearing(v.clearing, { x, y });
        return (
          <Layer
            key={`t${x}${y}`}
            id={inside ? groundTileId(groundLook(x, y)) : outsideTile(x, y)}
            x={x}
            y={y}
            data-tile={`${x},${y}`}
            data-ground={inside ? groundLook(x, y) : 'outside'}
          />
        );
      })}
      <Layer id={gridStripId('north')} strip="north" data-strip="north" />
      <Layer id={gridStripId('south')} strip="south" data-strip="south" />
      {c.lanterns === 'border' && (
        <Layer
          id={gridCosmeticId('lanterns-border')}
          strip="north"
          data-cosmetic="lanterns-border"
        />
      )}
      {c.banners && <Layer id={gridCosmeticId('banners')} strip="south" data-cosmetic="banners" />}
      {v.ghosts.map((g) => (
        <Layer
          key={`g${g.id}`}
          id={ghostTileId(g.status === 'locked' ? 'locked' : 'dormant')}
          x={g.x}
          y={g.y}
          data-ghost={g.id}
        />
      ))}
      {v.active.map((p) => (
        <Layer
          key={p.id}
          id={pieceImage(p, v.age)}
          x={p.x}
          y={p.y}
          w={p.w}
          h={p.h}
          data-piece={p.id}
          data-tier={p.tier}
        />
      ))}
      {/* Cosmetics, frost and the lamp sit above the pieces (GDD §9.21, §5.15.6). */}
      {hall && c.door && (
        <Layer id={GRID_HALL_DOOR_ID} x={hall.x} y={hall.y} w={2} h={2} data-cosmetic="door" />
      )}
      {c.bell === 'tower' && tower1 && (
        <Layer id={gridCosmeticId('bell-tower')} x={tower1.x} y={tower1.y} data-cosmetic="bell" />
      )}
      {/* The border bell hangs where Watchtower 1 will stand until it does. */}
      {c.bell === 'border' && (
        <Layer id={gridCosmeticId('bell-border')} x={2} y={1} data-cosmetic="bell" />
      )}
      {c.lanterns === 'walls' &&
        walls.map((p) => (
          <Layer
            key={`l${p.id}`}
            id={gridCosmeticId('lanterns-wall')}
            x={p.x}
            y={p.y}
            data-cosmetic="lanterns"
          />
        ))}
      {v.look === 'frost' && hall && (
        <Layer id={gridHallFrostId(v.age)} x={hall.x} y={hall.y} w={2} h={2} data-frost="hall" />
      )}
      {v.look === 'frost' &&
        walls.map((p) => (
          <Layer key={`f${p.id}`} id={GRID_WALL_FROST_ID} x={p.x} y={p.y} data-frost="wall" />
        ))}
      {v.look === 'lamp' && hall && (
        <Layer id={GRID_HALL_LAMP_ID} x={hall.x} y={hall.y} w={2} h={2} data-lamp="hall" />
      )}
      <span
        style={{
          position: 'absolute',
          left: '2%',
          top: 0,
          height: pctY(STRIP),
          display: 'flex',
          alignItems: 'center',
          fontSize: '4.2cqw',
          lineHeight: 1,
          color: 'var(--c-text)',
          textShadow: '0 0 2px #000, 0 0 2px #000',
        }}
      >
        ▲ The Fell Breach
      </span>
      <span
        style={{
          position: 'absolute',
          left: '2%',
          top: pctY(STRIP + 8 * T),
          height: pctY(STRIP),
          display: 'flex',
          alignItems: 'center',
          fontSize: '4.2cqw',
          lineHeight: 1,
          color: 'var(--c-text)',
          textShadow: '0 0 2px #000, 0 0 2px #000',
        }}
      >
        ▼ Lowland Gate
      </span>
    </div>
  );
};
