import type { OrderId } from '../../content/orders';
import { readChapterText } from '../../core/story/orders-chapter-view';
import { playableChapters } from '../../core/story/orders-chapters';
import { dispatch, game, version } from '../app/runtime';
import { closeSheet, openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';

// GDD §5.13.6, §9.18 (D414, D419): a chapter is a scene sheet. Opening it counts it as read and saves
// the seats it was read with; it ends with Close and, if another chapter can be read, Next. The shelf
// opens the same sheet again for a chapter already read, changing nothing.

const ChapterView = ({ order, n, next }: { order: OrderId; n: number; next: boolean }) => {
  void version.value;
  const text = readChapterText(game(), order, n);
  if (!text) return <p>Nothing here.</p>;
  return (
    <div>
      {text.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {!next && text.libraryNote && (
        <p class={`${styles.small} ${styles.dim}`}>Ilse's note: {text.libraryNote}</p>
      )}
      <div class={styles.row}>
        <button type="button" class={styles.btn} onClick={closeSheet}>
          Close
        </button>
        {next && playableChapters(game()).length > 0 && (
          <button
            type="button"
            class={styles.btnPrimary}
            onClick={() => {
              closeSheet();
              openNextChapter();
            }}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

/** Opens a chapter already read (the Library's shelf); nothing is counted. */
export const reopenChapter = (order: OrderId, n: number): void => {
  const text = readChapterText(game(), order, n);
  if (text) openSheet(text.title, () => <ChapterView order={order} n={n} next={false} />);
};

/** Reads the next playable chapter (Moot, Grey Wives, Bell-Watchers, Quenchers) and shows it. */
export const openNextChapter = (): boolean => {
  const next = playableChapters(game())[0];
  if (!next || !dispatch({ type: 'orders.readChapter', order: next.order }).ok) return false;
  const text = readChapterText(game(), next.order, next.n);
  if (text) openSheet(text.title, () => <ChapterView order={next.order} n={next.n} next />);
  return text !== null;
};
