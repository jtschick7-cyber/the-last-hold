import { ages } from '../../content/ages';
import { game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import { spoken } from '../app/lines';
import { AgeSheet } from '../sheets/AgeSheet';
import styles from '../styles/ui.module.css';
import { BuildList } from './BuildList';
import { PeasantsPanel } from './PeasantsPanel';

// GDD §9.2: the hold header, the peasants panel, and the build list. The pixel
// hold scene arrives with the art pipeline (plan T1.29).
export const HoldScreen = () => {
  void version.value;
  const s = game();
  const line = spoken.value;
  return (
    <div>
      <header class={styles.card}>
        <div class={styles.row}>
          <h1
            class={`${styles.grow} ${styles.cardTitle}`}
            style={{ fontSize: '1.1rem', color: 'var(--c-ember)' }}
          >
            Stanholm — {ages[s.cycle.age].name}
          </h1>
          <button
            type="button"
            class={styles.btn}
            onClick={() => openSheet('Age', () => <AgeSheet />)}
          >
            Age ▸
          </button>
        </div>
        {line && (
          <p class={styles.small} key={line.id} aria-live="polite">
            <strong>{line.speaker}:</strong> “{line.text}”
          </p>
        )}
      </header>
      <PeasantsPanel />
      <BuildList />
    </div>
  );
};
