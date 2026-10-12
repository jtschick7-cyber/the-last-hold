import { useState } from 'preact/hooks';
import { RESOURCE_IDS } from '../../content/resources';
import type { Command } from '../../core/commands';
import { dispatch, game, lastCatchUpMs, version } from '../app/runtime';
import styles from '../styles/ui.module.css';

// GDD §9.10 / technical design §15: every action here is a debug.* command.
// Using any of them marks the save (About shows it); nothing else changes.
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const DebugSheet = () => {
  void version.value;
  const [minutes, setMinutes] = useState('90');
  const [hours, setHours] = useState('12');
  const [seed, setSeed] = useState(game().meta.gameSeed);
  const [note, setNote] = useState<string | null>(null);
  const run = (cmd: Command): void => {
    const r = dispatch(cmd);
    setNote(r.ok ? 'Done.' : r.reason);
  };
  return (
    <div>
      <h3 class={styles.cardTitle}>Time skip (offline path)</h3>
      <div class={styles.row} style={{ flexWrap: 'wrap' }}>
        {[
          ['+1 m', 1],
          ['+1 h', 60],
          ['+12 h', 720],
        ].map(([label, m]) => (
          <button
            type="button"
            key={label}
            class={styles.btn}
            onClick={() => run({ type: 'debug.skip', ms: Number(m) * MINUTE })}
          >
            {label}
          </button>
        ))}
        <input
          aria-label="Minutes to skip"
          inputMode="numeric"
          size={5}
          value={minutes}
          onInput={(e) => setMinutes(e.currentTarget.value)}
        />
        <button
          type="button"
          class={styles.btn}
          onClick={() => run({ type: 'debug.skip', ms: Number(minutes) * MINUTE })}
        >
          Skip minutes
        </button>
      </div>
      <h3 class={styles.cardTitle}>Simulator policy (GDD §6.1)</h3>
      <div class={styles.row} style={{ flexWrap: 'wrap' }}>
        <input
          aria-label="Hours to play"
          inputMode="numeric"
          size={4}
          value={hours}
          onInput={(e) => setHours(e.currentTarget.value)}
        />
        <button
          type="button"
          class={styles.btn}
          onClick={() =>
            run({ type: 'debug.runPolicy', policy: 'standard', ms: Number(hours) * HOUR })
          }
        >
          Run Standard for {hours || '?'} h
        </button>
      </div>
      <p class={`${styles.small} ${styles.dim}`}>
        Plays the simulator's Standard player over the last hours, then catches up to now.
      </p>
      <h3 class={styles.cardTitle}>Add resources</h3>
      <div class={styles.row} style={{ flexWrap: 'wrap' }}>
        {RESOURCE_IDS.map((r) => (
          <button
            type="button"
            key={r}
            class={styles.btn}
            onClick={() =>
              run({ type: 'debug.addResources', bundle: { [r]: r === 'silver' ? 100 : 1000 } })
            }
          >
            +{r === 'silver' ? '100' : '1K'} {r}
          </button>
        ))}
      </div>
      <h3 class={styles.cardTitle}>Seed and Age</h3>
      <div class={styles.row}>
        <input
          aria-label="Game seed"
          value={seed}
          onInput={(e) => setSeed(e.currentTarget.value)}
          class={styles.grow}
        />
        <button
          type="button"
          class={styles.btn}
          onClick={() => run({ type: 'debug.setSeed', seed })}
        >
          Set seed
        </button>
      </div>
      <button
        type="button"
        class={styles.btn}
        onClick={() => run({ type: 'debug.unlockAge', age: 'keep' })}
      >
        Unlock Keep
      </button>
      {note && <p class={styles.small}>{note}</p>}
      <h3 class={styles.cardTitle} style={{ marginTop: 'var(--space-3)' }}>
        Timing
      </h3>
      <p class={styles.small}>
        Last catch-up:{' '}
        {lastCatchUpMs.value === null ? 'none yet' : `${lastCatchUpMs.value.toFixed(0)} ms`}. Odds
        and Suggest timings arrive with contracts (v0.2).
      </p>
      <details>
        <summary>Raw state</summary>
        <pre style={{ fontSize: '0.7rem', overflowX: 'auto' }}>
          {JSON.stringify(game(), null, 2)}
        </pre>
      </details>
    </div>
  );
};

export const debugEnabled = (): boolean =>
  import.meta.env.DEV || new URLSearchParams(window.location.search).has('debug');
