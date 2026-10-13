import { useState } from 'preact/hooks';
import { RESOURCE_IDS } from '../../content/resources';
import type { Command } from '../../core/commands';
import { snapshotOf } from '../../core/systems/hunters';
import { lastOddsMs, lastSuggestMs, requestOdds, requestSuggest } from '../app/odds-client';
import { dispatch, game, lastCatchUpMs, version } from '../app/runtime';
import styles from '../styles/ui.module.css';

// GDD §9.10 / technical design §15: every action here is a debug.* command.
// Using any of them marks the save (About shows it); nothing else changes.
const fmtMs = (ms: number | null): string => (ms === null ? 'not run yet' : `${ms.toFixed(0)} ms`);
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const DebugSheet = () => {
  void version.value;
  const [minutes, setMinutes] = useState('90');
  const [hours, setHours] = useState('12');
  const [seed, setSeed] = useState(game().meta.gameSeed);
  const [note, setNote] = useState<string | null>(null);
  const [measured, setMeasured] = useState<string | null>(null);
  const measure = async (): Promise<void> => {
    // Your active hunters against a tier-3 Upyr: a typical launch.
    const s = game();
    const party = s.roster.active.slice(0, 3).map((h) => snapshotOf(s, h));
    const monster = { monster: 'upyr' as const, tier: 3 };
    const base = {
      gameSeed: s.meta.gameSeed,
      contractId: 'timing',
      monster,
      location: 'field' as const,
      rank: s.cycle.age,
    };
    setMeasured('Measuring…');
    const o = await requestOdds({ ...base, party });
    const sg = await requestSuggest({
      ...base,
      available: s.roster.active.map((h) => snapshotOf(s, h)),
      maxParty: 3,
    });
    setMeasured(
      `${o.quick ? 'Quick estimate (no worker): ' : ''}odds ${fmtMs(lastOddsMs.value)}, Suggest ${fmtMs(lastSuggestMs.value)} (${sg?.considered ?? 0} parties checked).`,
    );
  };
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
      <h3 class={styles.cardTitle}>Seed and Rank</h3>
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
      <div class={styles.row} style={{ flexWrap: 'wrap' }}>
        {(['keep', 'citadel', 'bastion'] as const).map((age) => (
          <button
            type="button"
            key={age}
            class={styles.btn}
            onClick={() => run({ type: 'debug.unlockAge', age })}
          >
            Unlock {age[0]?.toUpperCase()}
            {age.slice(1)}
          </button>
        ))}
        <button
          type="button"
          class={styles.btn}
          onClick={() => run({ type: 'debug.addEmbers', amount: 100 })}
        >
          +100 Embers
        </button>
      </div>
      {note && <p class={styles.small}>{note}</p>}
      <h3 class={styles.cardTitle} style={{ marginTop: 'var(--space-3)' }}>
        Timing
      </h3>
      <p class={styles.small}>
        Last catch-up:{' '}
        {lastCatchUpMs.value === null ? 'none yet' : `${lastCatchUpMs.value.toFixed(0)} ms`}.
        <br />
        Last odds (500 fights): {fmtMs(lastOddsMs.value)}. Last Suggest:{' '}
        {fmtMs(lastSuggestMs.value)}. GDD §6.5 budgets: odds 100 ms, Suggest 300 ms on a mid-range
        phone.
      </p>
      <button type="button" class={styles.btn} onClick={() => void measure()}>
        Measure odds and Suggest here
      </button>
      {measured && <p class={styles.small}>{measured}</p>}
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
