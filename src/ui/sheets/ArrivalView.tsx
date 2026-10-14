import { arrivalText } from '../../content/text/arrival';
import { arrivalCapValue } from '../../core/stand/from-state';
import { formatNumber } from '../../core/format';
import { version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { StandView } from './StandSheet';

// GDD §5.9.8 (D112): a save from before v0.4 faces its first Long Night on load, after
// the away catch-up. This takes the Hold screen's place until the stand is made, so it
// can't be put off; only More stays open (to export the save first).
export const ArrivalView = () => {
  void version.value;
  return (
    <div class={styles.card}>
      <h2 class={styles.cardTitle}>{arrivalText.title}</h2>
      <p>{arrivalText.line}</p>
      <p class={styles.small}>{arrivalText.note}</p>
      <p class={styles.small}>
        Threat is 0 for this stand. The trophies part of its Embers is capped at{' '}
        {formatNumber(Math.floor(arrivalCapValue()))}.
      </p>
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        onClick={() => openSheet('The Last Stand', () => <StandView />)}
      >
        {arrivalText.button}
      </button>
    </div>
  );
};
