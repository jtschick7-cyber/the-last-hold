import { monsterPortraitId } from '../../content/assets';
import { families } from '../../content/damage';
import { monsters } from '../../content/monsters';
import { bestiaryFamilies } from '../../core/investigation/view';
import { game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import { bestiaryLegend, levelName } from '../app/knowledge-text';
import { GreatBeastsShelf } from '../events/GreatBeastsShelf';
import { BestiaryEntryView } from '../sheets/BestiaryEntrySheet';
import styles from '../styles/ui.module.css';
import { Sprite } from '../widgets/Sprite';

// GDD §9.8: the grid, by family. [?] is a species the player has seen listed but not
// identified; [·] is one they have not met. The bestiary is never reset by the Long Night.
export const BestiaryScreen = () => {
  void version.value;
  const s = game();
  const rows = bestiaryFamilies(s);
  return (
    <div>
      {rows.map((row) => (
        <section key={row.family} class={styles.card} aria-label={families[row.family].name}>
          <h2 class={styles.cardTitle}>
            <span class={styles.grow}>{families[row.family].name}</span>
            <span class={styles.dim}>
              {row.known}/{row.total}
            </span>
          </h2>
          <ul class={styles.tileGrid}>
            {row.entries.map((e) => (
              <li key={e.monster}>
                <button
                  type="button"
                  class={styles.tile}
                  disabled={e.level === 0}
                  aria-label={
                    e.level >= 2
                      ? monsters[e.monster].name
                      : e.level === 1
                        ? 'Unidentified'
                        : 'Not yet met'
                  }
                  onClick={() =>
                    openSheet(e.level >= 2 ? monsters[e.monster].name : 'Unidentified', () => (
                      <BestiaryEntryView monster={e.monster} />
                    ))
                  }
                >
                  {e.level === 0 ? (
                    <span class={styles.dim}>·</span>
                  ) : e.level === 1 ? (
                    <span class={styles.unknownBox}>?</span>
                  ) : (
                    <Sprite id={monsterPortraitId(e.monster)} />
                  )}
                  <span class={styles.small}>
                    {e.level >= 2 ? monsters[e.monster].name : e.level === 1 ? '?' : ''}
                  </span>
                  {e.level >= 2 && (
                    <span class={`${styles.small} ${styles.dim}`}>{levelName(e.level)}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <GreatBeastsShelf />
      <p class={`${styles.small} ${styles.dim}`}>{bestiaryLegend()}</p>
    </div>
  );
};
