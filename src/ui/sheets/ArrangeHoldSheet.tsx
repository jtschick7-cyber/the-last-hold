import { useState } from 'preact/hooks';
import { ages } from '../../content/ages';
import { buildings } from '../../content/buildings';
import { ghostTileId, groundTileId } from '../../content/assets';
import type { HoldPieceId } from '../../content/hold-layout';
import { buildHoldGridView, inClearing } from '../../core/systems/layout';
import { laneView } from '../../core/systems/breach';
import { clearsAtAge, pieceDef } from '../../core/systems/layout-catalog';
import { dispatch, game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';
import { groundLook, outsideTile, pieceImage } from '../widgets/HoldGrid';
import { LanesStrip, litLane } from '../widgets/LanesStrip';
import { Sprite } from '../widgets/Sprite';

// GDD §9.21: the Arrange Hold sheet. Tap-only. Every rule (what fits, swaps, the Hall's anchor)
// is in core's layout.* commands; this sheet only sends them and draws the result. The only text
// is the §9.21 table's, except the tray item names and the dialog's two buttons (see progress.md).
const CELL = 44;

const nameOf = (id: HoldPieceId): string => {
  const n = id.match(/-(\d+)$/);
  return n
    ? `${buildings[pieceDef(id).building].name} ${n[1]}`
    : buildings[pieceDef(id).building].name;
};

type Pick = HoldPieceId | null;

export const ArrangeHoldSheet = () => {
  void version.value;
  const [picked, setPicked] = useState<Pick>(null);
  const [note, setNote] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const s = game();
  const v = buildHoldGridView(s);
  const lanes = laneView(s);
  const lane = litLane.value === null ? undefined : lanes.lanes[litLane.value];
  const lit = new Set<string>([...(lane?.coverPieces ?? []), ...(lane?.towerPieces ?? [])]);
  const b = v.clearing;
  const at = (x: number, y: number) =>
    v.active.find((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
  const sel = picked ? v.active.find((p) => p.id === picked) : undefined;
  const inTray = picked !== null && v.tray.includes(picked);
  const current = sel ?? (inTray && picked ? { id: picked, tier: 1 } : null);
  const send = (cmd: Parameters<typeof dispatch>[0]): void => void dispatch(cmd);

  const tapTile = (x: number, y: number): void => {
    setConfirming(false);
    if (!inClearing(b, { x, y })) {
      const a = clearsAtAge(x, y);
      setNote(a ? `Clears at ${ages[a].name}` : null);
      return;
    }
    setNote(null);
    if (!picked) {
      const p = at(x, y);
      if (p) setPicked(p.id);
      return;
    }
    const hit = at(x, y);
    // A tap on the selected piece itself lets go of it.
    if (hit?.id === picked) return setPicked(null);
    // A move or swap ends the selection, so the next tap picks a piece afresh.
    if (dispatch({ type: 'layout.place', pieceId: picked, x, y }).ok) setPicked(null);
  };

  return (
    <div data-arrange-hold="true" data-selected={picked ?? ''}>
      <p class={styles.small} data-subtitle="true">
        {ages[v.age].name} · {b.maxX - b.minX + 1}×{b.maxY - b.minY + 1} open · {v.activeCount}/
        {v.pieceCount} placed
      </p>
      <LanesStrip view={lanes} light />
      <p class={styles.small} style={{ margin: 0 }}>
        ▲ The Fell Breach
      </p>
      <div data-internal-scroll="true" style={{ overflowX: 'auto' }}>
        <div
          style={{
            position: 'relative',
            width: `${CELL * 8}px`,
            height: `${CELL * 8}px`,
            lineHeight: 0,
          }}
        >
          {Array.from({ length: 64 }, (_, i) => {
            const x = i % 8;
            const y = Math.floor(i / 8);
            const inside = inClearing(b, { x, y });
            return (
              <span key={i} style={cellBox(x, y, 1, 1)}>
                <Sprite id={inside ? groundTileId(groundLook(x, y)) : outsideTile(x, y)} fill />
              </span>
            );
          })}
          {v.ghosts.map((g) => (
            <span key={g.id} style={cellBox(g.x, g.y, 1, 1)}>
              <Sprite id={ghostTileId(g.status === 'locked' ? 'locked' : 'dormant')} fill />
            </span>
          ))}
          {v.active.map((p) => (
            <span key={p.id} style={cellBox(p.x, p.y, p.w, p.h)}>
              <Sprite id={pieceImage(p, v.age)} fill />
            </span>
          ))}
          {/* GDD §9.25: the pieces that cover the chosen lane, an outline and a corner mark (never colour alone), no animation. */}
          {lanes.shown &&
            v.active
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
          {/* N9: one high-contrast outline round the whole piece (white over black), 2 × 2 included. */}
          {sel && (
            <span
              data-selection-outline="true"
              style={{
                ...cellBox(sel.x, sel.y, sel.w, sel.h),
                boxSizing: 'border-box',
                outline: '3px solid #fff',
                outlineOffset: '-3px',
                boxShadow: 'inset 0 0 0 5px #000',
                pointerEvents: 'none',
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              gridTemplateColumns: `repeat(8, ${CELL}px)`,
              gridAutoRows: `${CELL}px`,
            }}
          >
            {Array.from({ length: 64 }, (_, i) => {
              const x = i % 8;
              const y = Math.floor(i / 8);
              const p = at(x, y);
              const on = !!sel && !!p && p.id === sel.id;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Tile ${x},${y}`}
                  aria-pressed={on}
                  data-tile={`${x},${y}`}
                  data-piece={p?.id ?? ''}
                  data-locked={String(!inClearing(b, { x, y }))}
                  data-selected={String(on)}
                  onClick={() => tapTile(x, y)}
                  style={{
                    width: `${CELL}px`,
                    height: `${CELL}px`,
                    padding: 0,
                    border: '1px solid rgb(0 0 0 / 0.18)',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
      <p class={styles.small} style={{ margin: 0 }}>
        ▼ Lowland Gate
      </p>
      <div class={styles.divider} data-info-bar="true" aria-live="polite">
        {note ? (
          <p>{note}</p>
        ) : current ? (
          <>
            <p>
              Selected: {nameOf(current.id)} (Tier {current.tier})
            </p>
            <p class={styles.small}>Tap an open tile to move or swap</p>
          </>
        ) : (
          <p>Tap an active piece or tray item to select</p>
        )}
        {sel && sel.w === 1 && sel.h === 1 && (
          <button
            type="button"
            class={styles.btn}
            onClick={() => send({ type: 'layout.unplace', pieceId: sel.id })}
          >
            Move to tray
          </button>
        )}
      </div>
      <div class={styles.divider}>
        <h3 class={styles.cardTitle} data-tray-header="true">
          TRAY (unplaced: {v.tray.length})
        </h3>
        <div class={styles.row} style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          {v.tray.map((id) => (
            <button
              key={id}
              type="button"
              class={styles.btn}
              data-tray-item={id}
              aria-pressed={picked === id}
              style={
                picked === id ? { outline: '3px solid #fff', boxShadow: '0 0 0 5px #000' } : {}
              }
              onClick={() => {
                setConfirming(false);
                setNote(null);
                setPicked(id);
              }}
            >
              {nameOf(id)}
            </button>
          ))}
        </div>
      </div>
      <div class={`${styles.row} ${styles.divider}`} style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          type="button"
          class={styles.btn}
          onClick={() => {
            setConfirming(false);
            send({ type: 'layout.autoArrange' });
          }}
        >
          Auto-arrange
        </button>
        <button type="button" class={styles.btn} onClick={() => setConfirming(true)}>
          Clear to tray…
        </button>
      </div>
      {confirming && (
        <div role="alertdialog" aria-label="Clear to tray" class={styles.divider}>
          <p>
            Move all placed buildings except the Hearth Hall to the tray? Dormant blueprint outlines
            will be cleared.
          </p>
          <div class={styles.row} style={{ gap: '0.5rem' }}>
            <button
              type="button"
              class={styles.btnPrimary}
              onClick={() => {
                setConfirming(false);
                setPicked(null);
                send({ type: 'layout.clear' });
              }}
            >
              Clear to tray
            </button>
            <button type="button" class={styles.btn} onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <div class={`${styles.row} ${styles.divider}`} style={{ flexWrap: 'wrap' }}>
        <span class={styles.grow} style={{ flexBasis: '7rem' }}>
          Blueprint ghosts:
        </span>
        <div class={styles.segmented} role="group" aria-label="Blueprint ghosts">
          {(
            [
              [true, 'On'],
              [false, 'Off'],
            ] as const
          ).map(([value, text]) => (
            <button
              type="button"
              key={text}
              class={v.showGhosts === value ? styles.segmentOn : styles.segment}
              aria-pressed={v.showGhosts === value}
              onClick={() => send({ type: 'layout.setShowGhosts', showGhosts: value })}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const cellBox = (x: number, y: number, w: number, h: number) => ({
  position: 'absolute' as const,
  left: `${x * CELL}px`,
  top: `${y * CELL}px`,
  width: `${w * CELL}px`,
  height: `${h * CELL}px`,
});
