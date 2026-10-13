import { useState } from 'preact/hooks';
import { monsters } from '../../content/monsters';
import { runFight } from '../../core/combat';
import { seeded } from '../../core/rng';
import { RULES_VERSION } from '../../core/rules-version';
import type { FightRef } from '../../core/state/game-state';
import styles from '../styles/ui.module.css';

// GDD §9.6: a fight log, one line per action stamped with its tick. "Show rolls"
// expands each line to the rolls it used, each with a plain label from the combat code. "Seed" shows the fight seed and a replay
// that re-runs the fight to prove the log matches (D10). Logs are never stored:
// they are regenerated from the seed (technical design §5.3).
const replay = (ref: FightRef) =>
  runFight({
    party: ref.party,
    monster: ref.monster,
    location: ref.location,
    rolls: seeded(ref.seed),
  });

const COLLAPSE_EVERY = 50;

export const FightLogView = ({ fight }: { fight: FightRef }) => {
  const [rolls, setRolls] = useState(false);
  const [seed, setSeed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [check, setCheck] = useState<string | null>(null);
  const first = replay(fight);
  const lines = first.log;
  const older = fight.rulesVersion !== RULES_VERSION;
  const name = monsters[fight.monster.monster].name;
  const buckets = new Map<number, typeof lines>();
  for (const l of lines) {
    const k = Math.floor((l.tick - 1) / COLLAPSE_EVERY);
    buckets.set(k, [...(buckets.get(k) ?? []), l]);
  }
  return (
    <div>
      <p class={first.result === 'win' ? styles.good : styles.warn}>
        <strong>
          {first.result === 'win' ? `${name} slain` : `The ${name} wins the day`} · tick{' '}
          {first.ticks}
        </strong>
      </p>
      {older && (
        <p class={`${styles.small} ${styles.warn}`}>
          Recorded with an older rules version, so this replay may differ from what happened.
        </p>
      )}
      <ul class={styles.list} style={{ fontSize: '0.875rem' }}>
        {collapsed
          ? [...buckets.entries()].map(([k, group]) => (
              <li key={k} class={styles.divider}>
                t{k * COLLAPSE_EVERY + 1}–{(k + 1) * COLLAPSE_EVERY}: {group.length} actions
              </li>
            ))
          : lines.map((l, i) => (
              <li key={i} class={styles.divider} style={{ padding: 'var(--space-1) 0' }}>
                <span class={styles.dim}>t{l.tick}</span> · {l.text}
                {rolls && l.rolls.length > 0 && (
                  <div class={`${styles.small} ${styles.dim}`}>
                    {(l.rollNotes ?? l.rolls.map((r) => r.toFixed(3))).map((note, j) => (
                      <div key={j}>{note}</div>
                    ))}
                  </div>
                )}
              </li>
            ))}
      </ul>
      <div class={styles.row}>
        <label class={styles.row}>
          <input type="checkbox" checked={rolls} onChange={() => setRolls(!rolls)} /> Show rolls
        </label>
        <label class={styles.row}>
          <input type="checkbox" checked={collapsed} onChange={() => setCollapsed(!collapsed)} />{' '}
          Collapse
        </label>
        <button type="button" class={styles.btn} onClick={() => setSeed(!seed)}>
          Seed
        </button>
      </div>
      {seed && (
        <div>
          <p class={`${styles.small} ${styles.dim}`} style={{ wordBreak: 'break-all' }}>
            {fight.seed}
          </p>
          <button
            type="button"
            class={styles.btn}
            onClick={() => {
              const again = replay(fight);
              const same =
                again.log.length === lines.length &&
                again.log.every((l, i) => l.text === lines[i]?.text);
              setCheck(same ? 'The replay matches the log, line for line.' : 'The replay differs.');
            }}
          >
            Replay fight
          </button>
          {check && <p class={styles.small}>{check}</p>}
        </div>
      )}
    </div>
  );
};
