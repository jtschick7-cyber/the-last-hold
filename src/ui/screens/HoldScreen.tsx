import { ages } from '../../content/ages';
import { holdSceneId } from '../../content/assets';
import { game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import { spoken } from '../app/lines';
import { AgeSheet } from '../sheets/AgeSheet';
import styles from '../styles/ui.module.css';
import { BuildList } from './BuildList';
import { PeasantsPanel } from './PeasantsPanel';
import { Sprite } from '../widgets/Sprite';

// GDD §9.2: the hold header (pixel hold scene, via the asset manifest), the
// peasants panel, and the build list.
export const HoldScreen = () => {
  void version.value;
  const s = game();
  const line = spoken.value;
  return (
    <div>
      <header class={styles.card}>
        <div style={{ textAlign: 'center' }}>
          <Sprite id={holdSceneId(s.cycle.age)} scale={2} />
        </div>
        <div class={styles.row}>
          <h1
            class={`${styles.grow} ${styles.cardTitle}`}
            style={{ fontSize: '1.6rem', color: 'var(--c-ember)', textTransform: 'none' }}
          >
            Stanholm — {ages[s.cycle.age].name}
          </h1>
          <button
            type="button"
            class={styles.btn}
            onClick={() => openSheet('Rank', () => <AgeSheet />)}
          >
            Rank ▸
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
