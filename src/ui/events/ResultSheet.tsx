import { resultView, unlockView, type ResultView } from '../../core/systems/events-results';
import { now } from '../../platform/clock';
import { game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';
import { Sprite } from '../widgets/Sprite';
import { lastPlayback } from '../../core/systems/events-playback';
import { PlaybackLog } from '../delve/PlaybackView';

// GDD §9.17 result sheets: a boss attempt's damage, pool left, milestones with their pay, XP per
// hunter and rest times; a hunt's win or loss, points, XP and any unlock. Every number with a
// formula opens its breakdown. The Log regenerates the fight from its seed.
const Lines = ({ v }: { v: ResultView }) => (
  <ul class={styles.list}>
    {v.lines.map((l, i) => (
      <li key={`${l.label}${i}`} class={styles.divider}>
        <span class={styles.dim}>{l.label}: </span>
        {l.why ? (
          <Num text={l.text} breakdown={() => l.why ?? { label: l.label, value: 0 }} marked />
        ) : (
          l.text
        )}
      </li>
    ))}
  </ul>
);

export const UnlockSheet = () => {
  void version.value;
  const u = unlockView(game());
  if (!u) return <p class={styles.dim}>Nothing new has arrived.</p>;
  return (
    <div>
      <div class={styles.row}>
        <Sprite id={u.portraitId} scale={2} />
        <h3 class={`${styles.cardTitle} ${styles.grow}`}>{u.hunterName}</h3>
      </div>
      <p>
        <em>{u.line}</em>
      </p>
      <p class={styles.good}>{u.joins}</p>
      <p class={`${styles.small} ${styles.dim}`}>{u.arrival}</p>
    </div>
  );
};

export const ResultSheet = () => {
  void version.value;
  const s = game();
  const v = resultView(s, now());
  if (!v) return <p class={styles.dim}>Nothing has been fought yet.</p>;
  const pb = lastPlayback(s);
  return (
    <div>
      <h3 class={styles.cardTitle}>{v.title}</h3>
      <p class={v.kind === 'hunt' && v.headline === 'A loss.' ? styles.warn : styles.good}>
        <strong>{v.headline}</strong>
      </p>
      <Lines v={v} />
      {v.unlock && (
        <button
          type="button"
          class={styles.btnPrimary}
          style={{ width: '100%' }}
          onClick={() => openSheet(v.unlock?.hunterName ?? 'A hunter joins', () => <UnlockSheet />)}
        >
          {v.unlock.hunterName} joins ▸
        </button>
      )}
      {pb && (
        <button
          type="button"
          class={styles.btn}
          onClick={() => openSheet('Fight log', () => <PlaybackLog pb={pb} />)}
        >
          Log
        </button>
      )}
    </div>
  );
};

export const openResult = (): void => openSheet('Result', () => <ResultSheet />);
