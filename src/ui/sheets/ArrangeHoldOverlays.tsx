import { GRID_COLS, GRID_ROWS, type HoldPieceId } from '../../content/hold-layout';
import type { LaneView, LayoutMove } from '../../core/systems/breach';
import { inClearing, type ActivePiece, type HoldGridView } from '../../core/systems/layout';
import type { HoldTacticsSummary } from '../../core/systems/layout-tactics';
import {
  ADJ_STYLES,
  CELL,
  cellBox,
  isDefensePieceId,
  pieceCenter,
  wardFrontierSegments,
} from './arrange-tactics';

interface OverlayProps {
  readonly view: HoldGridView;
  readonly tactics: HoldTacticsSummary;
  readonly linkCounts: ReadonlyMap<HoldPieceId, number>;
  readonly lanes: LaneView;
  readonly lit: ReadonlySet<string>;
  readonly moves: readonly LayoutMove[] | null;
  readonly selected: ActivePiece | undefined;
}

const LinkMarker = ({
  shape,
  mx,
  my,
  color,
}: {
  shape: 'circle' | 'diamond' | 'triangle';
  mx: number;
  my: number;
  color: string;
}) => {
  if (shape === 'triangle') {
    return (
      <polygon
        points={`${mx},${my - 4} ${mx + 3.5},${my + 3} ${mx - 3.5},${my + 3}`}
        fill="#000"
        stroke={color}
        stroke-width="1.5"
      />
    );
  }
  if (shape === 'diamond') {
    return (
      <rect
        x={mx - 3}
        y={my - 3}
        width="6"
        height="6"
        transform={`rotate(45 ${mx} ${my})`}
        fill="#000"
        stroke={color}
        stroke-width="1.5"
      />
    );
  }
  return <circle cx={mx} cy={my} r="3.5" fill="#000" stroke={color} stroke-width="1.5" />;
};

/** Non-interactive, Reduce-Motion static tactical, lane, suggest, and selection overlays. */
export const ArrangeHoldOverlays = ({
  view,
  tactics,
  linkCounts,
  lanes,
  lit,
  moves,
  selected,
}: OverlayProps) => {
  const w = GRID_COLS * CELL;
  const h = GRID_ROWS * CELL;
  const bounds = view.clearing;
  const activeById = new Map<HoldPieceId, ActivePiece>(view.active.map((p) => [p.id, p]));
  const defenseTiles = new Set<string>(
    view.active.filter((p) => isDefensePieceId(p.id)).map((p) => `${p.x},${p.y}`),
  );
  const wardedCells: { x: number; y: number }[] = [];
  for (let y = bounds.minY; y <= bounds.maxY; y++) {
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      if (
        inClearing(bounds, { x, y }) &&
        !tactics.northReached[y * GRID_COLS + x] &&
        !defenseTiles.has(`${x},${y}`)
      ) {
        wardedCells.push({ x, y });
      }
    }
  }
  const frontier = wardFrontierSegments(bounds, tactics.northReached, defenseTiles, CELL);
  const hall = activeById.get('hearth-hall');

  return (
    <>
      <svg
        data-ward-layer="true"
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <defs>
          <pattern
            id="arrange-ward-hatch"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(182, 213, 60, 0.25)" stroke-width="2" />
          </pattern>
        </defs>
        {wardedCells.map(({ x, y }) => (
          <rect
            key={`w-${x}-${y}`}
            x={x * CELL}
            y={y * CELL}
            width={CELL}
            height={CELL}
            fill="url(#arrange-ward-hatch)"
          />
        ))}
        {frontier.map((seg, idx) => (
          <g key={`f-${idx}`}>
            <line
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke="#000"
              stroke-width="4"
              stroke-linecap="square"
            />
            <line
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke="#b6d53c"
              stroke-width="2"
              stroke-linecap="square"
            />
          </g>
        ))}
      </svg>

      {hall && (
        <span
          aria-hidden="true"
          data-hall-ward={tactics.hearthWarded ? 'warded' : 'exposed'}
          style={{
            ...cellBox(hall.x, hall.y, hall.w, hall.h),
            boxSizing: 'border-box',
            outline: tactics.hearthWarded ? '2px solid #b6d53c' : '2px dashed #f4b41b',
            outlineOffset: '-2px',
            boxShadow: 'inset 0 0 0 4px #000',
            pointerEvents: 'none',
            lineHeight: 1,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              padding: '1px 3px',
              background: '#000',
              color: tactics.hearthWarded ? '#b6d53c' : '#f4b41b',
              fontSize: '9px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {tactics.hearthWarded ? '◈ Warded' : '◇ Exposed'}
          </span>
        </span>
      )}

      <svg
        data-adj-links="true"
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        {tactics.links.map((link) => {
          const from = activeById.get(link.from);
          const to = activeById.get(link.to);
          if (!from || !to) return null;
          const a = pieceCenter(from, CELL);
          const b = pieceCenter(to, CELL);
          const st = ADJ_STYLES[link.kind];
          const mx = (a.cx + b.cx) / 2;
          const my = (a.cy + b.cy) / 2;
          return (
            <g key={`${link.from}:${link.to}:${link.kind}`}>
              <line
                x1={a.cx}
                y1={a.cy}
                x2={b.cx}
                y2={b.cy}
                stroke="#000"
                stroke-width="5"
                stroke-linecap="round"
                opacity="0.75"
              />
              <line
                data-adj-link={`${link.from}:${link.to}`}
                data-adj-kind={link.kind}
                x1={a.cx}
                y1={a.cy}
                x2={b.cx}
                y2={b.cy}
                stroke={st.color}
                stroke-width="2.5"
                stroke-dasharray={st.dash === 'none' ? undefined : st.dash}
                stroke-linecap="round"
              />
              <LinkMarker shape={st.shape} mx={mx} my={my} color={st.color} />
            </g>
          );
        })}
      </svg>

      {view.active.map((p) => {
        const count = linkCounts.get(p.id) ?? 0;
        const screened = tactics.screenedTowers.has(p.id);
        if (count === 0 && !screened) return null;
        return (
          <span
            key={`tac-${p.id}`}
            aria-hidden="true"
            style={{ ...cellBox(p.x, p.y, p.w, p.h), pointerEvents: 'none', lineHeight: 1 }}
          >
            {count > 0 && (
              <span
                data-adj-badge={p.id}
                data-adj-count={count}
                style={{
                  position: 'absolute',
                  top: '1px',
                  right: '1px',
                  padding: '1px 3px',
                  background: '#000',
                  color: '#fff',
                  border: '1px solid #fff',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                +{count}
              </span>
            )}
            {screened && (
              <span
                data-screened-tower={p.id}
                style={{
                  position: 'absolute',
                  bottom: '1px',
                  left: '1px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '1px 3px',
                  background: '#000',
                  color: '#dff6f5',
                  border: '1px solid #dff6f5',
                  fontSize: '9px',
                  fontWeight: 700,
                }}
              >
                <svg width="8" height="9" viewBox="0 0 8 9" aria-hidden="true">
                  <path d="M4 0L8 2V5C8 7 4 9 4 9C4 9 0 7 0 5V2L4 0Z" fill="#dff6f5" />
                </svg>
                S
              </span>
            )}
          </span>
        );
      })}

      {/* GDD §9.25: the pieces that cover the chosen lane, an outline and a corner mark (never colour alone), no animation. */}
      {lanes.shown &&
        view.active
          .filter((p) => lit.has(p.id))
          .map((p) => (
            <span
              key={p.id}
              data-lit-piece={p.id}
              style={{
                ...cellBox(p.x, p.y, p.w, p.h),
                boxSizing: 'border-box',
                outline: '3px dashed #fff',
                outlineOffset: '-3px',
                boxShadow: 'inset 0 0 0 5px #000',
                pointerEvents: 'none',
                lineHeight: 1,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  padding: '1px 3px',
                  background: '#000',
                  color: '#fff',
                  fontSize: '10px',
                }}
              >
                ◤
              </span>
            </span>
          ))}

      {/* GDD §9.25: the suggested target tiles, an outline and a corner mark (never colour alone), no animation. */}
      {moves &&
        moves.map((m) => (
          <span
            key={`${m.x},${m.y}`}
            data-suggest-target={`${m.x},${m.y}`}
            style={{
              ...cellBox(m.x, m.y, 1, 1),
              boxSizing: 'border-box',
              outline: '3px dotted #fff',
              outlineOffset: '-3px',
              boxShadow: 'inset 0 0 0 5px #000',
              pointerEvents: 'none',
              lineHeight: 1,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                padding: '1px 3px',
                background: '#000',
                color: '#fff',
                fontSize: '10px',
              }}
            >
              ◆
            </span>
          </span>
        ))}

      {/* N9: one high-contrast outline round the whole piece (white over black), 2 × 2 included. */}
      {selected && (
        <span
          data-selection-outline="true"
          style={{
            ...cellBox(selected.x, selected.y, selected.w, selected.h),
            boxSizing: 'border-box',
            outline: '3px solid #fff',
            outlineOffset: '-3px',
            boxShadow: 'inset 0 0 0 5px #000',
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
};
