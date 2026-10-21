import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { readingControls, unlitLine } from '../../content/text/remembering';
import { endingWarm, endingWarmNote } from '../../content/text/remembering-ending';
import { endingSequence, type EndingStep } from '../../core/story/ending-sequence';
import { readingFrames } from '../../core/story/remembering-view';
import { game } from '../app/runtime';
import { closeSheet, openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { createReadingPlayer } from './timing';

// GDD §5.15.3, §9.19 (D464): R-03, then the reading. The names come by themselves, a tap shows the
// next at once, Skip jumps to the end. With reduced motion the names change without fading (CSS);
// the speed is the same.
const ReadingView = ({ onDone }: { onDone: () => void }) => {
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
          <button type="button" class={styles.btnPrimary} onClick={onDone}>
            {readingControls.done}
          </button>
        )}
      </div>
    </div>
  );
};

/** One card of the ending: its paragraphs, then Continue to the next step. */
const CardView = ({ step, onDone }: { step: CardStep; onDone: () => void }) => (
  <div>
    {step.card.paragraphs.map((p) => (
      <p key={p}>{p}</p>
    ))}
    {step.card.id === 'R-11' && (
      <p class={styles.small}>
        <em>Ilse: “{endingWarmNote}”</em>
      </p>
    )}
    <button type="button" class={styles.btnPrimary} style={{ width: '100%' }} onClick={onDone}>
      {readingControls.done}
    </button>
  </div>
);

type CardStep = Extract<EndingStep, { kind: 'card' }>;

const playFrom = (steps: readonly EndingStep[], i: number): void => {
  const step = steps[i];
  if (!step) return;
  const next = (): void => {
    closeSheet();
    playFrom(steps, i + 1);
  };
  if (step.kind === 'reading') openSheet('The reading', () => <ReadingView onDone={next} />);
  else openSheet(step.card.title, () => <CardView step={step} onDone={next} />);
};

/**
 * The whole ending as one stack (GDD §5.15.3): R-03, the reading, R-04, R-04b, the Orders' cards,
 * R-09, R-11. Skip works on the reading only; closing a sheet early loses nothing, because the
 * Library replays it whole (T11.13).
 */
export const playEnding = (): void => playFrom(endingSequence(game()), 0);

/** R-11 from the Rime shelf (lore §34.7): the rime and Ilse's note, nothing else. */
export const openWarmRime = (): void =>
  openSheet(endingWarm.title, () => (
    <div>
      <article class={styles.rime}>
        {endingWarm.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </article>
      <p class={styles.dim}>
        <em>{endingWarmNote}</em>
      </p>
    </div>
  ));
