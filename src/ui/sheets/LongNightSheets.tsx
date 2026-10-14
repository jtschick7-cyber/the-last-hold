import { useMemo, useState } from 'preact/hooks';
import { hunters, roleNames, type HunterId } from '../../content/hunters';
import { monsters } from '../../content/monsters';
import { relics } from '../../content/relics';
import { describeRelic } from '../../core/describe-long-night';
import { formatNumber } from '../../core/format';
import { embersPayout } from '../../core/stand/embers';
import { arrivalCapValue } from '../../core/stand/from-state';
import { RULES_VERSION } from '../../core/rules-version';
import { replayStand } from '../../core/stand/replay';
import type { GameState, StandRecord } from '../../core/state/game-state';
import { rosterCap } from '../../core/systems/hunters';
import { dispatch, game, version } from '../app/runtime';
import { closeAllSheets, openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';
import { Sprite } from '../widgets/Sprite';
import { EMBERS_ICON, relicIconId } from '../../content/assets';
import { HearthView } from './HearthView';

// GDD §5.9.7 and §9.13 (D110, D115): the Long Night sheets, in order: the stand's
// result (waves held, the Embers breakdown, any relic, each wave's log); the closing
// line; The Hearth; the new-warden sheet, where the player chooses the 3 active
// hunters. Text from setting-primer §6.8 only.

/** The most recent stand, with its cycle number. */
export const lastStand = (s: GameState): { cycle: number; stand: StandRecord } | null => {
  for (let i = s.cycles.length - 1; i >= 0; i--) {
    const c = s.cycles[i];
    if (c?.stand) return { cycle: c.number, stand: c.stand };
  }
  return null;
};

/** Technical design §5.3: a stand recorded under older rules may replay differently. */
const OlderRules = ({ stand }: { stand: StandRecord }) =>
  stand.rulesVersion === RULES_VERSION ? null : (
    <p class={`${styles.small} ${styles.warn}`}>
      Recorded with an older rules version, so this replay may differ from what happened.
    </p>
  );

const WaveLogView = ({ stand, n }: { stand: StandRecord; n: number }) => {
  const result = useMemo(() => replayStand(stand), [stand.seed, stand.at]);
  const w = result.waves[n - 1];
  if (!w) return <p>No log for this wave.</p>;
  return (
    <div>
      <p class={w.fight.result === 'win' ? styles.good : styles.warn}>
        <strong>
          Wave {n}: {monsters[w.wave.monster].name}, tier {w.wave.tier} ·{' '}
          {w.fight.result === 'win' ? 'held' : 'the walls fell'} at tick {w.fight.ticks}
        </strong>
      </p>
      <OlderRules stand={stand} />
      <ul class={styles.list} style={{ fontSize: '0.875rem' }}>
        {w.fight.log.map((l, i) => (
          <li key={i} class={styles.divider} style={{ padding: 'var(--space-1) 0' }}>
            <span class={styles.dim}>t{l.tick}</span> · {l.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Result = ({ stand }: { stand: StandRecord }) => {
  const payout = embersPayout({
    rank: stand.rank,
    waves: stand.wavesHeld,
    threat: stand.threat,
    trophies: stand.embers.trophies,
    // GDD §5.9.8: the arrival's trophies part was capped (the record keeps the capped part).
    trophyCap: stand.arrival ? arrivalCapValue() : null,
  });
  return (
    <div>
      <OlderRules stand={stand} />
      <p>
        The walls held <strong>{stand.wavesHeld}</strong> {stand.wavesHeld === 1 ? 'wave' : 'waves'}
        .
      </p>
      <p>
        <Sprite id={EMBERS_ICON} /> Embers:{' '}
        <Num text={formatNumber(stand.embers.total)} breakdown={() => payout.breakdown} marked />
      </p>
      {stand.relicsFound.length > 0 && (
        <ul class={styles.list}>
          {stand.relicsFound.map((id) => (
            <li key={id} class={styles.small}>
              <Sprite id={relicIconId(id)} /> Found: <strong>{relics[id].name}</strong>,{' '}
              {describeRelic(id)}
            </li>
          ))}
        </ul>
      )}
      <p class={styles.small}>
        <strong>Pechko:</strong> “The walls fell. The hearth didn't. Someone will come.”
      </p>
      <h3 class={styles.cardTitle}>Wave logs</h3>
      <div class={styles.row} style={{ flexWrap: 'wrap' }}>
        {Array.from({ length: stand.wavesHeld + 1 }, (_, i) => i + 1).map((n) => (
          <button
            type="button"
            key={n}
            class={styles.btn}
            onClick={() => openSheet(`Wave ${n}`, () => <WaveLogView stand={stand} n={n} />)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
};

const NewWarden = ({ s }: { s: GameState }) => {
  const [note, setNote] = useState<string | null>(null);
  const cap = rosterCap(s).value;
  const owned = Object.keys(s.hunters) as HunterId[];
  return (
    <div>
      <p>
        <em>“Seasons pass. Someone new walks up the road, hands warm in the cold.”</em>
      </p>
      <p class={styles.small}>
        Choose your {cap} active hunters ({s.roster.active.length}/{cap}); everyone else waits in
        the reserve.
      </p>
      <ul class={styles.list}>
        {owned.map((id) => {
          const on = s.roster.active.includes(id);
          return (
            <li key={id} class={styles.divider}>
              <label class={styles.row}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => {
                    const r = dispatch({ type: 'roster.set', hunter: id, active: !on });
                    setNote(r.ok ? null : r.reason);
                  }}
                />
                <span class={styles.grow}>
                  <strong>{hunters[id].shortName}</strong>{' '}
                  <span class={styles.dim}>
                    {roleNames[hunters[id].role]} · Lv {s.hunters[id]?.level}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {note && <p class={`${styles.small} ${styles.warn}`}>{note}</p>}
    </div>
  );
};

const STEPS = 4;

export const LongNightView = () => {
  void version.value;
  const s = game();
  const [step, setStep] = useState(0);
  const last = lastStand(s);
  if (!last) return <p>No Last Stand yet.</p>;
  const next = (): void => {
    if (step < STEPS - 1) setStep(step + 1);
    else {
      dispatch({ type: 'stand.seen' });
      closeAllSheets();
    }
  };
  return (
    <div>
      {step === 0 && <Result stand={last.stand} />}
      {step === 1 && (
        <p>
          <em>The story continues in a later version.</em>
        </p>
      )}
      {step === 2 && <HearthView />}
      {step === 3 && <NewWarden s={s} />}
      <button type="button" class={styles.btnPrimary} style={{ width: '100%' }} onClick={next}>
        {step < STEPS - 1 ? 'Next' : `Begin cycle ${s.cycle.number}`}
      </button>
    </div>
  );
};
