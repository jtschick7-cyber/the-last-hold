import { useState } from 'preact/hooks';
import { ORDER_NAMES, type OrderId } from '../../content/orders';
import { ordersCardView, seatStepOrders } from '../../core/systems/orders-view';
import type { OrderRow } from '../../core/systems/orders-view';
import { seatCount } from '../../core/systems/orders-seats';
import { now } from '../../platform/clock';
import { dispatch, game, version } from '../app/runtime';
import { closeSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';

// GDD §5.13.4, §9.18 (D412, D422): the "Seat your Orders" step and the mid-cycle seat change. The
// screens only ask; the rules (the seat limit, the cooldown) are the commands'.

/** The step's toggles. Each change is the free set-all command, so it clears the cooldown (D412 (3)). */
export const SeatStep = () => {
  void version.value;
  const s = game();
  const [note, setNote] = useState<string | null>(null);
  const open = seatStepOrders(s);
  if (open.length === 0) return null;
  const seated = s.orders.seats;
  const toggle = (id: OrderId): void => {
    const next = seated.includes(id) ? seated.filter((x) => x !== id) : [...seated, id];
    const r = dispatch({ type: 'orders.setSeats', orders: next });
    setNote(r.ok ? null : r.reason);
  };
  return (
    <div>
      <p class={styles.small}>
        Seats: {seated.length} of {seatCount(s)}. Changes here are free. A seated Order gives its
        perks and tells its story; an Order with no seat keeps its standing.
      </p>
      <ul class={styles.list}>
        {open.map((id) => {
          const on = seated.includes(id);
          const full = !on && seated.length >= seatCount(s);
          return (
            <li key={id} class={styles.divider}>
              <label class={styles.row}>
                <input type="checkbox" checked={on} disabled={full} onChange={() => toggle(id)} />
                <span class={styles.grow}>{ORDER_NAMES[id]}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {note && <p class={`${styles.small} ${styles.warn}`}>{note}</p>}
    </div>
  );
};

/** The sheet on load, and from the Orders card until it is used. */
export const SeatStepSheet = () => (
  <div>
    <SeatStep />
    <div class={styles.row}>
      <button
        type="button"
        class={styles.btn}
        onClick={() => {
          dispatch({ type: 'orders.skipSeatStep' });
          closeSheet();
        }}
      >
        Skip
      </button>
      <button
        type="button"
        class={styles.btnPrimary}
        onClick={() => {
          dispatch({ type: 'orders.skipSeatStep' });
          closeSheet();
        }}
      >
        Done
      </button>
    </div>
  </div>
);

/** One Order's Seat, Unseat or Swap in button, and the swap's "Instead of:" choice (D412). */
export const SeatButtons = ({ row, keptNote = true }: { row: OrderRow; keptNote?: boolean }) => {
  const [swapping, setSwapping] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const run = (cmd: Parameters<typeof dispatch>[0], kept = false): void => {
    const r = dispatch(cmd);
    setNote(r.ok ? (kept && keptNote ? 'You keep your standing and chapters.' : null) : r.reason);
    if (r.ok) setSwapping(false);
  };
  return (
    <div>
      <div class={styles.row} style={{ flexWrap: 'wrap' }}>
        {row.action === 'seat' && (
          <button
            type="button"
            class={styles.btn}
            onClick={() => run({ type: 'orders.seat', order: row.id })}
          >
            Seat
          </button>
        )}
        {row.action === 'unseat' && (
          <button
            type="button"
            class={styles.btn}
            onClick={() => run({ type: 'orders.unseat', order: row.id }, true)}
          >
            Unseat
          </button>
        )}
        {row.action === 'swap' && (
          <button type="button" class={styles.btn} onClick={() => setSwapping(!swapping)}>
            Swap in
          </button>
        )}
        {row.action === 'swap' && swapping && (
          <>
            <span class={styles.small}>Instead of:</span>
            {row.swapOut.map((out) => (
              <button
                key={out}
                type="button"
                class={styles.btn}
                onClick={() => run({ type: 'orders.swap', out, in: row.id })}
              >
                {ORDER_NAMES[out]}
              </button>
            ))}
          </>
        )}
      </div>
      {note && <p class={`${styles.small} ${styles.warn}`}>{note}</p>}
    </div>
  );
};

/** Mid-cycle: Seat, Unseat or Swap for every open Order, with the cooldown line (D412). */
export const SeatChangeView = () => {
  void version.value;
  const v = ordersCardView(game(), now());
  if (!v) return <p>No Order has come yet.</p>;
  return (
    <div>
      <p>{v.seatsLine}</p>
      <p>{v.inSeatsLine}</p>
      {v.cooldownLine && <p class={styles.warn}>{v.cooldownLine}</p>}
      <ul class={styles.list}>
        {v.rows.map((row) => (
          <li key={row.id} class={styles.divider}>
            <div class={styles.row}>
              <span class={styles.grow}>
                <strong>{row.name}</strong>{' '}
                <span class={styles.dim}>{row.seated ? 'Seated' : 'Not seated'}</span>
              </span>
            </div>
            <SeatButtons row={row} keptNote={false} />
          </li>
        ))}
      </ul>
      <p class={styles.small}>You keep your standing and chapters.</p>
    </div>
  );
};
