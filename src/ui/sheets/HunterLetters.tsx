import type { HunterId } from '../../content/hunters';
import { hunterLetters } from '../../core/story/archive';
import { letterKey } from '../../core/story/letters';
import { game, version } from '../app/runtime';
import { openLetter } from '../screens/ArchiveScreen';
import styles from '../styles/ui.module.css';
import { hunters } from '../../content/hunters';

// GDD §5.14.7, §9.14: the hunter sheet's Letters row. Each slot is a letter to read, or
// "at level N" while locked; a new one carries a badge until it is opened.
export const HunterLetters = ({ id }: { id: HunterId }) => {
  void version.value;
  const s = game();
  const rows = hunterLetters(s, id);
  return (
    <div>
      <h3 class={styles.cardTitle}>Letters</h3>
      <ul class={styles.list}>
        {rows.map((r) => {
          const letter = r.letter;
          return (
            <li key={r.slot}>
              {letter ? (
                <button
                  type="button"
                  class={styles.linkRow}
                  onClick={() =>
                    openLetter({
                      hunter: id,
                      slot: r.slot,
                      from: hunters[id].name,
                      level: r.level,
                      letter,
                      unread: false,
                    })
                  }
                >
                  <span class={styles.grow}>A letter to the warden</span>
                  {s.story.unread.includes(letterKey(id, r.slot)) && (
                    <span class={styles.badge}>new</span>
                  )}
                </button>
              ) : (
                <span class={`${styles.small} ${styles.dim}`}>at level {r.level}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
