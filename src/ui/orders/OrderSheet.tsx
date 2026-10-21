import type { OrderId } from '../../content/orders';
import { orderSheetView } from '../../core/systems/orders-sheet-view';
import { now } from '../../platform/clock';
import { game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';
import { SeatButtons } from './SeatSheets';

// GDD §9.18 (D416 (2)): an Order's sheet. Its standing and the breakdown of it, the four levels with
// their perks (the number is the real one), its chapters and why one waits, and Seat, Unseat or Swap.
export const OrderSheet = ({ id }: { id: OrderId }) => {
  void version.value;
  const v = orderSheetView(game(), id, now());
  if (!v) return <p>That Order has not come yet.</p>;
  return (
    <div>
      <p>
        <strong>{v.levelWord}</strong> · Standing{' '}
        <Num text={String(v.standing)} breakdown={() => v.standingBreakdown} marked />
        <span class={styles.dim}> · {v.nextLine}</span>
      </p>
      <p class={styles.small}>{v.row.seated ? 'Seated.' : 'Not seated.'}</p>
      {v.row.gives && <p class={`${styles.small} ${styles.dim}`}>{v.row.gives}</p>}
      <SeatButtons row={v.row} />
      {v.cooldownLine && <p class={styles.dim}>{v.cooldownLine}</p>}

      <h3 class={styles.cardTitle}>Levels</h3>
      <ul class={styles.list}>
        {v.levels.map((l) => (
          <li key={l.level} class={styles.divider}>
            <strong>
              {l.word}
              {l.current ? ' (now)' : ''}
            </strong>
            <span class={styles.dim}> · {l.threshold}</span>
            <div class={l.reached ? '' : styles.dim}>
              <Num text={l.numberLine} breakdown={() => l.number} />
            </div>
            <div class={`${styles.small} ${styles.dim}`}>{l.story}</div>
          </li>
        ))}
      </ul>

      <h3 class={styles.cardTitle}>Chapters</h3>
      <ul class={styles.list}>
        {v.chapters.map((c) => (
          <li key={c.n} class={styles.divider}>
            <strong>{c.title}</strong>{' '}
            <span class={styles.dim}>
              ·{' '}
              {c.status === 'read'
                ? 'Read'
                : c.status === 'playable'
                  ? 'Can be read now'
                  : 'Waiting'}
            </span>
            {c.line && <div class={styles.small}>{c.line}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
};
