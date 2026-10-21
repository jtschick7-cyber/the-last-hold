import { ORDER_NAMES } from '../../content/orders';
import { ordersCardView } from '../../core/systems/orders-view';
import { now } from '../../platform/clock';
import { game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { openOpeningScene } from './OpeningScene';
import { OrderSheet } from './OrderSheet';
import { SeatChangeView, SeatStepSheet } from './SeatSheets';

// GDD §9.18 (D416): the Orders card on the Hold screen. Hidden until an Order has opened. The seat
// lines, one row per open Order, and the buttons for the load step and for changing seats.
export const OrdersCard = () => {
  void version.value;
  const v = ordersCardView(game(), now());
  if (!v) return null;
  return (
    <section class={styles.card} aria-label="Orders">
      <h2 class={styles.cardTitle}>Orders</h2>
      <p>{v.seatsLine}</p>
      <p>{v.inSeatsLine}</p>
      {v.cooldownLine && <p class={styles.dim}>{v.cooldownLine}</p>}
      <ul class={styles.list}>
        {v.rows.map((row) => (
          <li key={row.id} class={styles.divider}>
            <button
              type="button"
              class={styles.linkRow}
              onClick={() => openSheet(row.name, () => <OrderSheet id={row.id} />)}
            >
              <span class={styles.grow}>
                <strong>{row.name}</strong>
                <span class={styles.dim}>
                  {' '}
                  · {row.levelWord} · {row.standing} · {row.seated ? 'Seated' : 'Not seated'}
                </span>
              </span>
              ▸
            </button>
            {row.chapterWaits && <p class={styles.small}>A chapter waits for a seat.</p>}
            {row.gives && <p class={`${styles.small} ${styles.dim}`}>{row.gives}</p>}
          </li>
        ))}
      </ul>
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        {v.scenesWaiting[0] && (
          <button
            type="button"
            class={styles.btnPrimary}
            style={{ width: '100%' }}
            onClick={() => openOpeningScene(v.scenesWaiting[0] ?? 'moot')}
          >
            {ORDER_NAMES[v.scenesWaiting[0]]}: a scene waits ▸
          </button>
        )}
        {v.seatStepPending && (
          <button
            type="button"
            class={styles.btnPrimary}
            style={{ width: '100%' }}
            onClick={() => openSheet('Seat your Orders', () => <SeatStepSheet />)}
          >
            Seat your Orders ▸
          </button>
        )}
        <button
          type="button"
          class={styles.btn}
          style={{ width: '100%' }}
          onClick={() => openSheet('Change seats', () => <SeatChangeView />)}
        >
          Change seats ▸
        </button>
      </div>
    </section>
  );
};
