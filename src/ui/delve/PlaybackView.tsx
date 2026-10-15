import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { SpriteFrameName } from '../../content/assets';
import type { FloorPlayback } from '../../core/delves/view';
import { reducedMotion } from '../app/motion';
import { dispatch } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { Arena } from './Arena';
import css from './Delve.module.css';

// GDD §9.15 Floor: the fight plays back in about 10–20 s with Skip and Log. The result is already
// decided by the seed (the core worked the same fight out); this only shows it, then asks the
// core to move the run on. Closing the sheet before the end leaves the floor unfought, to be
// played again. Reduced motion shows the end at once, in still frames (GDD §9.1).
const TOTAL_MS = 14_000;
const STEP_MIN_MS = 250;
const STEP_MAX_MS = 900;
const ATTACKS: ReadonlySet<string> = new Set(['hit', 'crit', 'miss', 'sub-hit', 'ability']);
const HURTS: ReadonlySet<string> = new Set(['hit', 'crit', 'sub-hit', 'ability']);

export const PlaybackLog = ({ pb }: { pb: FloorPlayback }) => (
  <div>
    <p class={pb.result === 'win' ? styles.good : styles.warn}>
      <strong>{pb.title}</strong>
    </p>
    <ul class={styles.list} style={{ fontSize: '0.875rem' }}>
      {pb.log.map((l, i) => (
        <li key={i} class={styles.divider} style={{ padding: 'var(--space-1) 0' }}>
          <span class={styles.dim}>t{l.tick}</span> · {l.text}
        </li>
      ))}
    </ul>
  </div>
);

const outcomeLine = (pb: FloorPlayback): string =>
  pb.result === 'loss'
    ? 'The party falls.'
    : pb.guardian
      ? 'The guardian is beaten.'
      : 'The floor is cleared.';

export const PlaybackView = ({ pb, onContinue }: { pb: FloorPlayback; onContinue: () => void }) => {
  const still = useMemo(reducedMotion, []);
  const last = pb.steps.length - 1;
  const [i, setI] = useState(still ? last : -1);
  const finished = i >= last;
  const moved = useRef(false);

  useEffect(() => {
    if (finished) return;
    const ms = Math.max(
      STEP_MIN_MS,
      Math.min(STEP_MAX_MS, TOTAL_MS / Math.max(1, pb.steps.length)),
    );
    const timer = setInterval(() => setI((x) => Math.min(last, x + 1)), ms);
    return () => clearInterval(timer);
  }, [finished, last, pb.steps.length]);

  // The floor is fought once the playback has reached its end (or was skipped to it).
  useEffect(() => {
    if (!finished || moved.current) return;
    moved.current = true;
    dispatch({ type: 'delve.fight' });
  }, [finished]);

  const step = i >= 0 ? pb.steps[i] : undefined;
  const before = i > 0 ? pb.steps[i - 1]?.bars : undefined;
  const bars: Record<string, number> = finished
    ? { ...pb.end }
    : step
      ? { ...step.bars }
      : Object.fromEntries(pb.combatants.map((c) => [c.id, c.start]));
  const frames: Record<string, SpriteFrameName> = {};
  if (step && !finished) {
    if (step.actor && ATTACKS.has(step.kind)) frames[step.actor] = 'lunge';
    if (
      step.target &&
      HURTS.has(step.kind) &&
      (step.bars[step.target] ?? 1) < (before?.[step.target] ?? 1)
    )
      frames[step.target] = 'hit';
  }

  return (
    <div>
      <h3 class={styles.cardTitle}>{pb.title}</h3>
      <Arena combatants={pb.combatants} bars={bars} frames={frames} />
      <p class={css.line} aria-live="polite">
        {finished ? <strong>{outcomeLine(pb)}</strong> : (step?.text ?? 'The fight begins.')}
      </p>
      <div class={styles.row}>
        {!finished && (
          <button type="button" class={styles.btn} onClick={() => setI(last)}>
            Skip
          </button>
        )}
        <button
          type="button"
          class={styles.btn}
          onClick={() => openSheet('Fight log', () => <PlaybackLog pb={pb} />)}
        >
          Log
        </button>
        <span class={styles.grow} />
        {finished && (
          <button type="button" class={styles.btnPrimary} onClick={onContinue}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
};
