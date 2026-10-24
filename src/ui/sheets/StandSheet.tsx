import { useEffect, useState } from 'preact/hooks';
import { CONSUMABLE_IDS, consumables, type ConsumableId } from '../../content/consumables';
import { hunters, roleNames, type HunterId } from '../../content/hunters';
import { num } from '../../core/balance-access';
import { standProblem } from '../../core/commands/stand';
import { formatNumber, formatRate } from '../../core/format';
import { bombStock, previewInputFor } from '../../core/stand/from-state';
import { vigilLevelFor } from '../../core/systems/vigil';
import { suggestSix } from '../../core/stand/suggest';
import { standPoolOf } from '../../core/stand/pool';
import { creatureOf, DROSS_TIDE, standSeed, waveList } from '../../core/stand/waves';
import type { GameState, Preparation } from '../../core/state/game-state';
import { requestStandPreview, type StandAnswer } from '../app/odds-client';
import { dispatch, game, version } from '../app/runtime';
import { closeAllSheets, openSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { bandThresholdsLine } from '../../content/story/scenes';
import { standDelveLine } from '../../core/delves/view-run';
import { Num } from '../widgets/Num';
import { LongNightView } from './LongNightSheets';

// GDD §9.13 (D107, D109, D115): the Last Stand screen. The wave list (the first 12;
// "?" for species not yet Identified), six slots with the suggested six, one oil and
// one potion per hunter, bombs thrown automatically from the stores, the preview, and
// Start, with a confirmation that says the Long Night follows. Neutral text only
// (setting-primer §6.8).

type Kit = Pick<Preparation, 'oils' | 'potions'>;
const SHOWN_WAVES = 12;
const IDENTIFIED = 2;

const WaveList = ({ s }: { s: GameState }) => (
  <div
    class={styles.small}
    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 var(--space-3)' }}
  >
    {waveList(standSeed(s), SHOWN_WAVES, standPoolOf(s)).map((w) => (
      <div key={w.n}>
        <span class={styles.dim}>{w.n}.</span>{' '}
        {/* The Dross-Tide can never be investigated, so it is named at once (GDD §5.9.3, D363). */}
        {w.monster === DROSS_TIDE || (s.bestiary[w.monster]?.level ?? 0) >= IDENTIFIED
          ? creatureOf(w.monster).name
          : '?'}{' '}
        <span class={styles.dim}>(tier {w.tier})</span>
      </div>
    ))}
  </div>
);

/** How many of an item the chosen kit already uses. */
const used = (kit: Kit, item: ConsumableId): number =>
  [...Object.values(kit.oils), ...Object.values(kit.potions)].filter((x) => x === item).length;

const KitPicker = ({
  s,
  hunter,
  kind,
  kit,
  onChange,
}: {
  s: GameState;
  hunter: HunterId;
  kind: 'oil' | 'potion';
  kit: Kit;
  onChange: (k: Kit) => void;
}) => {
  const key = kind === 'oil' ? 'oils' : 'potions';
  const mine = kit[key][hunter] ?? '';
  const options = CONSUMABLE_IDS.filter((id) => consumables[id].kind === kind && s.stores[id] > 0);
  if (options.length === 0) return null;
  return (
    <select
      class={styles.oilPicker}
      aria-label={`${hunters[hunter].shortName}'s ${kind}`}
      value={mine}
      onChange={(e) => {
        const v = e.currentTarget.value as ConsumableId | '';
        const rest = Object.fromEntries(Object.entries(kit[key]).filter(([h]) => h !== hunter));
        onChange({ ...kit, [key]: v === '' ? rest : { ...rest, [hunter]: v } });
      }}
    >
      <option value="">No {kind}</option>
      {options.map((id) => (
        <option key={id} value={id} disabled={id !== mine && used(kit, id) >= s.stores[id]}>
          {consumables[id].name} ({s.stores[id] - used(kit, id) + (id === mine ? 1 : 0)} left)
        </option>
      ))}
    </select>
  );
};

const Confirm = ({ party, kit }: { party: HunterId[]; kit: Kit }) => (
  <div>
    <p>
      Start the Last Stand? <strong>The Long Night follows</strong>: the hold starts over from a
      hamlet. Your hunters (with part of their levels), the bestiary, Embers, relics and warden
      upgrades are kept.
    </p>
    {standDelveLine(game()) && <p class={styles.small}>{standDelveLine(game())}</p>}
    <p class={`${styles.small} ${styles.dim}`}>This can't be undone.</p>
    <button
      type="button"
      class={styles.btnPrimary}
      style={{ width: '100%' }}
      onClick={() => {
        if (dispatch({ type: 'stand.make', party, prep: kit }).ok) {
          closeAllSheets();
          openSheet('The Long Night', () => <LongNightView />);
        }
      }}
    >
      Go up to the walls
    </button>
  </div>
);

export const StandView = () => {
  void version.value;
  const s = game();
  const problem = standProblem(s);
  const [party, setParty] = useState<HunterId[]>(() => suggestSix(s));
  const [kit, setKit] = useState<Kit>({ oils: {}, potions: {} });
  const [answer, setAnswer] = useState<StandAnswer | null>(null);
  const max = num('laststand.partyMax');
  const kitFor = (p: HunterId[]): Kit => ({
    oils: Object.fromEntries(Object.entries(kit.oils).filter(([h]) => p.includes(h as HunterId))),
    potions: Object.fromEntries(
      Object.entries(kit.potions).filter(([h]) => p.includes(h as HunterId)),
    ),
  });
  const chosenKit = kitFor(party);
  // GDD §9.23: the preview is worked out again when the Rising Vigil switch flips, so the level the
  // stand would have is part of the key (read from the core, never computed here).
  const key = `${party.join(',')}|${JSON.stringify(chosenKit)}|${s.threat.toFixed(2)}|${vigilLevelFor(s)}`;
  useEffect(() => {
    if (party.length === 0) return;
    let live = true;
    setAnswer(null);
    void requestStandPreview(previewInputFor(s, party, chosenKit)).then((a) => {
      if (live) setAnswer(a);
    });
    return () => {
      live = false;
    };
  }, [key]);
  if (problem) return <p>{problem}</p>;
  const bombs = bombStock(s);
  const kitStocked = CONSUMABLE_IDS.some(
    (id) =>
      (consumables[id].kind === 'oil' || consumables[id].kind === 'potion') && s.stores[id] > 0,
  );
  const toggle = (id: HunterId): void =>
    setParty(party.includes(id) ? party.filter((h) => h !== id) : [...party, id].slice(0, max));
  const p = answer?.preview;
  return (
    <div>
      <p>The dark is at the walls. Choose who goes up; they fight one wave at a time.</p>
      <h3 class={styles.cardTitle}>Waves</h3>
      <WaveList s={s} />
      <h3 class={styles.cardTitle}>
        On the walls ({party.length}/{max})
      </h3>
      <ul class={styles.list}>
        {s.roster.active.map((id) => {
          const h = s.hunters[id];
          if (!h) return null;
          const on = party.includes(id);
          return (
            <li key={id} class={styles.divider}>
              <label class={styles.row}>
                <input type="checkbox" checked={on} onChange={() => toggle(id)} />
                <span class={styles.grow}>
                  <strong>{hunters[id].shortName}</strong>{' '}
                  <span class={styles.dim}>
                    {roleNames[hunters[id].role]} · Lv {h.level}
                    {h.recovery ? ' · injured, can still stand' : ''}
                  </span>
                </span>
              </label>
              {on && kitStocked && (
                <div class={styles.row} style={{ flexWrap: 'wrap' }}>
                  <KitPicker s={s} hunter={id} kind="oil" kit={chosenKit} onChange={setKit} />
                  <KitPicker s={s} hunter={id} kind="potion" kit={chosenKit} onChange={setKit} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p class={`${styles.small} ${styles.dim}`}>
        Bombs are thrown automatically from the stores, up to {num('prep.bombSlots')} a wave:{' '}
        {Object.keys(bombs).length === 0
          ? 'none in the stores'
          : Object.entries(bombs)
              .map(([id, n]) => `${consumables[id as ConsumableId].name} ×${n}`)
              .join(', ')}
        . Each potion works once in the whole stand.
      </p>
      <h3 class={styles.cardTitle}>Preview</h3>
      <p class={`${styles.small} ${styles.dim}`}>
        {bandThresholdsLine(num('band.heldFrom'), num('band.triumphantFrom'))}
      </p>
      {party.length === 0 ? (
        <p class={styles.dim}>Choose at least one hunter.</p>
      ) : !p ? (
        <p class={styles.dim}>Running practice stands…</p>
      ) : (
        <div class={styles.small}>
          <p>
            Expected: <strong>{p.median} waves</strong>{' '}
            <span class={styles.dim}>
              (range {p.p10}–{p.p90}, from {p.samples} practice stands
              {answer?.quick ? ', quick estimate' : ''})
            </span>
          </p>
          <p>
            Embers now:{' '}
            <Num
              text={formatNumber(p.embersNow.value)}
              breakdown={() => p.embersNow.breakdown}
              marked
            />{' '}
            <span class={styles.dim}>· {formatRate(p.embersPerDay)} per day of the cycle</span>
          </p>
          <p>
            By tomorrow: Threat {formatRate(p.threatTomorrow)}; Embers about{' '}
            <Num
              text={formatNumber(p.embersTomorrow.value)}
              breakdown={() => p.embersTomorrow.breakdown}
            />{' '}
            <span class={styles.dim}>
              ({formatRate(p.embersPerDayTomorrow)} per day; an estimate at today's Threat rate and
              trophies)
            </span>
          </p>
        </div>
      )}
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        disabled={party.length === 0}
        onClick={() =>
          openSheet('Start the Last Stand?', () => <Confirm party={party} kit={chosenKit} />)
        }
      >
        Start
      </button>
    </div>
  );
};
