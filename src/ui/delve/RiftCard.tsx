import { riftCardView } from '../../core/delves/view';
import { game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';
import { Sprite } from '../widgets/Sprite';
import { RIFTGLASS_ICON } from '../../content/assets';
import { DelveView } from './DelveView';
import css from './Delve.module.css';
import { EntrySheet } from './EntrySheet';

// GDD §9.15 Rift card: under the hold header from the first Keep. The allowance line (long-press
// for its breakdown), what is held, and Delve or Continue. No new tab (D264).
export const RiftCard = () => {
  void version.value;
  const v = riftCardView(game());
  if (!v) return null;
  return (
    <section class={`${styles.card} ${css.rift}`} aria-label="The Rift">
      <h2 class={styles.cardTitle}>
        <Sprite id={RIFTGLASS_ICON} scale={2} /> The Rift
        {v.badge && (
          <span class={css.badge} aria-label="Something is waiting">
            ●
          </span>
        )}
      </h2>
      <p>{v.quiet ? v.line : <Num text={v.line} breakdown={() => v.waiting.breakdown} />}</p>
      <p class={`${styles.small} ${styles.dim}`}>You hold {v.held} Riftglass.</p>
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        onClick={() =>
          v.action === 'delve'
            ? openSheet('Delve', () => <EntrySheet />)
            : openSheet('Delve', () => <DelveView />)
        }
      >
        {v.label}
      </button>
    </section>
  );
};
