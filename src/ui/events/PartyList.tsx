import type { HunterId } from '../../content/hunters';
import type { PartyRow } from '../../core/systems/events-view';
import styles from '../styles/ui.module.css';
import css from './Events.module.css';

// GDD §9.17: the party rows shared by the boss and hunt pickers. Each row has its rank badge, level,
// role, damage and, when the hunter cannot go, the reason beside the name.
export const PartyList = ({
  rows,
  party,
  onToggle,
}: {
  rows: readonly PartyRow[];
  party: readonly HunterId[];
  onToggle: (id: HunterId) => void;
}) => (
  <ul class={styles.list}>
    {rows.map((r) => (
      <li key={r.id} class={`${styles.divider} ${r.reason ? css.rowDisabled : ''}`}>
        <label class={styles.row}>
          <input
            type="checkbox"
            checked={party.includes(r.id)}
            disabled={r.reason !== null}
            onChange={() => onToggle(r.id)}
          />
          <span class={styles.grow}>
            <span class={css.rank}>{r.rank}</span>
            {r.name}{' '}
            <span class={`${styles.small} ${styles.dim}`}>
              {r.role} · {r.damage} · Lv {r.level}
            </span>
            {r.reason && <div class={`${styles.small} ${css.reason}`}>{r.reason}</div>}
          </span>
        </label>
      </li>
    ))}
  </ul>
);
