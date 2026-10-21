import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { readingControls, rememberScene, unlitLine } from '../../content/text/remembering';
import { readingFrames } from '../../core/story/remembering-view';
import { closeSheet, openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { createReadingPlayer } from './timing';

// GDD §5.15.3, §9.19 (D464): R-03, then the reading. The names come by themselves, a tap shows the
// next at once, Skip jumps to the end. With reduced motion the names change without fading (CSS);
// the speed is the same.
const ReadingView = () => {
  const frames = useMemo(readingFrames, []);
  const [i, setI] = useState(0);
  const player = useRef<ReturnType<typeof createReadingPlayer> | null>(null);
  useEffect(() => {
    const p = createReadingPlayer(frames.length, setI);
    player.current = p;
    p.start();
    return p.stop;
  }, [frames]);
  const finished = i >= frames.length;
  const frame = frames[Math.min(i, frames.length - 1)];
  if (!frame) return null;
  return (
    <div>
      {/* Tapping anywhere on the card shows the next name (GDD §9.19). */}
      <div
        class={styles.reading}
        onClick={() => player.current?.tap()}
        role="presentation"
        aria-live="polite"
      >
        <div>
          <h3 key={frame.n} class={styles.readingName}>
            {frame.name}
          </h3>
          <p class={styles.readingLine}>{frame.line}</p>
        </div>
        {finished ? (
          <div>
            <p class={styles.readingLine}>{unlitLine.heading}</p>
            <p class={styles.readingRime}>{unlitLine.text}</p>
          </div>
        ) : (
          <p class={styles.readingLine}>{readingControls.tap}</p>
        )}
      </div>
      <div class={styles.row}>
        {!finished && (
          <button type="button" class={styles.btn} onClick={() => player.current?.skip()}>
            {readingControls.skip}
          </button>
        )}
        <span class={styles.grow} />
        {finished && (
          <button type="button" class={styles.btnPrimary} onClick={closeSheet}>
            {readingControls.done}
          </button>
        )}
      </div>
    </div>
  );
};

export const openReading = (): void => openSheet('The reading', () => <ReadingView />);

const RememberView = () => (
  <div>
    {rememberScene.paragraphs.map((p) => (
      <p key={p}>{p}</p>
    ))}
    <button
      type="button"
      class={styles.btnPrimary}
      style={{ width: '100%' }}
      onClick={() => {
        closeSheet();
        openReading();
      }}
    >
      Continue
    </button>
  </div>
);

/** R-03 then the reading. The rest of the ending follows in T11.8 to T11.10. */
export const openRememberScene = (): void => openSheet(rememberScene.title, () => <RememberView />);
