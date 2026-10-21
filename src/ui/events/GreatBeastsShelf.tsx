import { greatBeastsShelf, type ShelfEntry } from '../../core/systems/events-results';
import { game } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { Sprite } from '../widgets/Sprite';

// GDD §5.12.8, §9.17: the optional Great Beasts shelf in the Bestiary. An entry per boss and quarry,
// Identified on the first fight (its stats, resistances, abilities and "What it was" line), with no
// Studied or Mastered levels. It appears once events have opened; before that there is nothing on it.
const Entry = ({ e }: { e: ShelfEntry }) => (
  <div>
    <div class={styles.row}>
      <Sprite id={e.portraitId} scale={2} />
      <h3 class={`${styles.cardTitle} ${styles.grow}`}>{e.name}</h3>
    </div>
    <p>
      <em>{e.whatItWas}</em>
    </p>
    <p class={styles.small}>{e.stats?.join(' · ')}</p>
    <p class={`${styles.small} ${styles.dim}`}>
      weak: {e.weak}
      <br />
      resists: {e.resists}
      <br />
      {e.abilities?.join(' · ')}
    </p>
    <p class={`${styles.small} ${styles.dim}`}>
      <em>{e.notebook}</em>
    </p>
  </div>
);

export const GreatBeastsShelf = () => {
  const s = game();
  if (!s.events.opened) return null;
  const shelf = greatBeastsShelf(s);
  return (
    <section class={styles.card} aria-label="Great Beasts">
      <h2 class={styles.cardTitle}>Great Beasts</h2>
      {shelf.emptyLine && <p class={`${styles.small} ${styles.dim}`}>{shelf.emptyLine}</p>}
      <ul class={styles.tileGrid}>
        {shelf.entries.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              class={styles.tile}
              disabled={!e.identified}
              aria-label={e.identified ? e.name : 'Not yet met'}
              onClick={() => openSheet(e.name, () => <Entry e={e} />)}
            >
              {e.identified ? <Sprite id={e.portraitId} /> : <span class={styles.dim}>·</span>}
              <span class={styles.small}>{e.identified ? e.name : ''}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
