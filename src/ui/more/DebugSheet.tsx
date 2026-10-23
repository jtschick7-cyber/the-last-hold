import { useState } from 'preact/hooks';
import { ORDER_IDS, ORDER_NAMES, type OrderId } from '../../content/orders';
import { RESOURCE_IDS } from '../../content/resources';
import type { Command } from '../../core/commands';
import { snapshotOf } from '../../core/systems/hunters';
import { lastOddsMs, lastSuggestMs, requestOdds, requestSuggest } from '../app/odds-client';
import { dispatch, game, lastCatchUpMs, setLastExportAge, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import { playSoundById } from '../app/sound';
import { SOUND_IDS } from '../../platform/sound/moments';
import { DocumentReader } from '../screens/ArchiveScreen';
import styles from '../styles/ui.module.css';

// GDD §9.10 / technical design §15: every action here is a debug.* command.
// Using any of them marks the save (About shows it); nothing else changes.
const fmtMs = (ms: number | null): string => (ms === null ? 'not run yet' : `${ms.toFixed(0)} ms`);
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const DebugSheet = () => {
  void version.value;
  const [minutes, setMinutes] = useState('90');
  const [order, setOrder] = useState<OrderId>('moot');
  const [amount, setAmount] = useState('10');
  const [hours, setHours] = useState('12');
  const [exportAge, setExportAge] = useState('20');
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
        <button type="button" class={styles.btn} onClick={() => run({ type: 'debug.runArrival' })}>
          Run the arrival
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => run({ type: 'debug.layoutFillBastion' })}
        >
          Fill Bastion (layout)
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => run({ type: 'debug.layoutAutoArrange' })}
        >
          Auto-arrange layout
        </button>
        <button type="button" class={styles.btn} onClick={() => run({ type: 'debug.layoutClear' })}>
          Clear layout
        </button>
        <button type="button" class={styles.btn} onClick={() => run({ type: 'debug.addToken' })}>
          +1 attempt token
        </button>
        <button type="button" class={styles.btn} onClick={() => run({ type: 'debug.fillBank' })}>
          Fill the attempt bank
        </button>
        <button type="button" class={styles.btn} onClick={() => run({ type: 'debug.endRests' })}>
          End all event rests
        </button>
        <button type="button" class={styles.btn} onClick={() => run({ type: 'debug.grantLoot' })}>
          Grant loot
        </button>
        <button type="button" class={styles.btn} onClick={() => run({ type: 'debug.readyRanks' })}>
          Ready to rank up
        </button>
        <button type="button" class={styles.btn} onClick={() => run({ type: 'debug.addArvid' })}>
          Add Arvid
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => {
            const r = dispatch({ type: 'debug.startActIII' });
            setNote(r.ok ? 'Done.' : r.reason);
            if (r.ok) openSheet('The net-mender', () => <DocumentReader id="D3-01" />);
          }}
        >
          Start Act III
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => {
            const r = dispatch({ type: 'debug.startAct', act: 4 });
            setNote(r.ok ? 'Done.' : r.reason);
            if (r.ok) openSheet('The bundle', () => <DocumentReader id="D4-01" />);
          }}
        >
          Start Act IV
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => {
            const r = dispatch({ type: 'debug.startAct', act: 5 });
            setNote(r.ok ? 'Done.' : r.reason);
            if (r.ok) openSheet('The broom', () => <DocumentReader id="D5-01" />);
          }}
        >
          Start Act V
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => {
            const r = dispatch({ type: 'debug.startAct', act: 6 });
            setNote(r.ok ? 'Done.' : r.reason);
            if (r.ok) openSheet('Frost on the floor', () => <DocumentReader id="D6-01" />);
          }}
        >
          Start Act VI
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => {
            const open = !game().delve.unlitOpen;
            const r = dispatch({ type: 'debug.unlit', open });
            setNote(
              r.ok
                ? open
                  ? 'The Unlit’s door is open: it can replace a door once a run.'
                  : 'The Unlit’s door is shut.'
                : r.reason,
            );
          }}
        >
          {game().delve.unlitOpen ? 'Shut the Unlit’s door' : 'Open the Unlit’s door'}
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => run({ type: 'debug.runV05Arrival' })}
        >
          Meet Ilse again
        </button>
      </div>
      <h3 class={styles.cardTitle} style={{ marginTop: 'var(--space-3)' }}>
        Orders
      </h3>
      <div class={styles.row} style={{ flexWrap: 'wrap' }}>
        <select
          value={order}
          onChange={(e) => setOrder((e.currentTarget as HTMLSelectElement).value as OrderId)}
        >
          {ORDER_IDS.map((id) => (
            <option key={id} value={id}>
              {ORDER_NAMES[id]}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          max="500"
          value={amount}
          onInput={(e) => setAmount((e.currentTarget as HTMLInputElement).value)}
          style={{ width: '5rem' }}
        />
      </div>
      <div class={styles.row} style={{ flexWrap: 'wrap' }}>
        <button
          type="button"
          class={styles.btn}
          onClick={() => run({ type: 'debug.ordersOpen', order })}
        >
          Open
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => run({ type: 'debug.ordersAddStanding', order, amount: Number(amount) })}
        >
          Add standing
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => run({ type: 'debug.ordersSetLevel', order, level: Number(amount) })}
        >
          Set level
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => run({ type: 'debug.ordersPlayChapter', order, chapter: Number(amount) })}
        >
          Play chapter
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => run({ type: 'debug.ordersOpenThird' })}
        >
          Open third seat
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => run({ type: 'debug.ordersClearCooldown' })}
        >
          Clear seat wait
        </button>
        <button type="button" class={styles.btn} onClick={() => run({ type: 'debug.ordersReset' })}>
          Reset Orders
        </button>
      </div>
      <h3 class={styles.cardTitle} style={{ marginTop: 'var(--space-3)' }}>
        The Remembering
      </h3>
      <p class={styles.small}>
        Finish Act VI plays Act VI's real Last Stand and Long Night (the hold resets as it does in
        play). Open the gate writes the 40 names and the Studied species without any rewards.
      </p>
      <div class={styles.row} style={{ flexWrap: 'wrap' }}>
        <button
          type="button"
          class={styles.btn}
          onClick={() => run({ type: 'debug.rememberingFinishActVI' })}
        >
          Finish Act VI
        </button>
        <button
          type="button"
          class={styles.btn}
          onClick={() => run({ type: 'debug.rememberingOpenGate' })}
        >
          Open the gate
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
      <h3 class={styles.cardTitle} style={{ marginTop: 'var(--space-3)' }}>
        Set last export age
      </h3>
      <p class={styles.small}>
        Settings key only: the save is untouched and this is not marked as debug use.
      </p>
      <div class={styles.row}>
        <input
          aria-label="Days since the last export"
          inputMode="numeric"
          size={4}
          value={exportAge}
          onInput={(e) => setExportAge(e.currentTarget.value)}
        />
        <button
          type="button"
          class={styles.btn}
          onClick={() => {
            const days = Number(exportAge);
            if (Number.isFinite(days) && days >= 0) setLastExportAge(Math.floor(days));
          }}
        >
          Set
        </button>
      </div>
      <h3 class={styles.cardTitle} style={{ marginTop: 'var(--space-3)' }}>
        Play sound
      </h3>
      <p class={styles.small}>
        Plays one of the seven, only while Sound is On. A UI-only action: it writes nothing and is
        not marked as debug use (technical design §15, D522 (6)).
      </p>
      <div class={styles.row} style={{ flexWrap: 'wrap' }}>
        {SOUND_IDS.map((id) => (
          <button
            type="button"
            key={id}
            class={styles.btn}
            aria-label={`Play ${id}`}
            data-play-sound={id}
            onClick={() => playSoundById(id)}
          >
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </button>
        ))}
      </div>
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
