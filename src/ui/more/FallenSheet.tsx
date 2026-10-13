import { hunters } from '../../content/hunters';
import { formatDuration } from '../../core/format';
import { game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';

// GDD §5.3.7: dead hunters leave a memorial in the Hall of the Fallen, and come
// back as candidates three days later (before the Long Night exists).
export const FallenView = () => {
  void version.value;
  const s = game();
  if (s.fallen.length === 0) {
    return <p class={styles.dim}>No one has fallen. The Hall is quiet.</p>;
  }
  return (
    <ul class={styles.list}>
      {[...s.fallen].reverse().map((f, i) => (
        <li key={i} class={styles.divider}>
          <strong>{hunters[f.hunter].name}</strong>
          <div class={`${styles.small} ${styles.dim}`}>
            Fell {formatDuration((s.time - f.diedAt) / 1000)} ago, on contract {f.contractId}.
          </div>
        </li>
      ))}
    </ul>
  );
};
