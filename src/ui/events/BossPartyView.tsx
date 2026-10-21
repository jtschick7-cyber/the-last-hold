import { useEffect, useMemo, useState } from 'preact/hooks';
import { bosses } from '../../content/great-beasts';
import type { HunterId } from '../../content/hunters';
import { num } from '../../core/balance-access';
import { noPreparation, type Preparation } from '../../core/state/game-state';
import { bossOfVisit } from '../../core/systems/boss';
import { bossPreviewInput, bossSuggestInput } from '../../core/systems/boss-odds';
import { bossPreviewLines, creatureLines, partyRows } from '../../core/systems/events-view';
import { now } from '../../platform/clock';
import { requestBossPreview, requestBossSuggest, type BossPreviewAnswer } from '../app/odds-client';
import { dispatch, game, version } from '../app/runtime';
import { closeSheet, openSheet } from '../app/sheets';
import { BreakdownView } from '../sheets/BreakdownView';
import { PreparationPicker } from '../sheets/PreparationPicker';
import styles from '../styles/ui.module.css';
import css from './Events.module.css';

const DEBOUNCE_MS = 150;

// GDD §9.17 party picker and preview: up to four hunters, each row with its rank, level, role, damage
// and the reason if unavailable; Suggest; preparation beside the Great Beast's weaknesses; the
// preview with Why?; Send. A boss has no win chance, so the preview is damage only.
export const BossPartyView = () => {
  void version.value;
  const s = game();
  const max = num('boss.partySize');
  const rows = partyRows(s, now());
  const boss = bosses[bossOfVisit(s.events.boss.visit)];
  const [party, setParty] = useState<HunterId[]>([]);
  const [prep, setPrep] = useState<Preparation>(noPreparation());
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [answer, setAnswer] = useState<BossPreviewAnswer | null>(null);
  const goers = rows.filter((r) => r.reason === null).map((r) => r.id);
  const chosen = useMemo(
    () => party.filter((h) => goers.includes(h)),
    [party.join(','), goers.join(',')],
  );
  const activePrep = useMemo<Preparation>(
    () => ({
      oils: Object.fromEntries(
        Object.entries(prep.oils).filter(([h]) => chosen.includes(h as HunterId)),
      ),
      potions: Object.fromEntries(
        Object.entries(prep.potions).filter(([h]) => chosen.includes(h as HunterId)),
      ),
      bombs: prep.bombs,
    }),
    [JSON.stringify(prep), chosen.join(',')],
  );
  useEffect(() => {
    if (chosen.length === 0) {
      setAnswer(null);
      return;
    }
    let live = true;
    const timer = setTimeout(() => {
      void requestBossPreview(bossPreviewInput(game(), chosen, activePrep)).then((a) => {
        if (live) setAnswer(a);
      });
    }, DEBOUNCE_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [chosen.join(','), JSON.stringify(activePrep)]);

  const toggle = (id: HunterId): void =>
    setParty(
      party.includes(id)
        ? party.filter((h) => h !== id)
        : party.length < max
          ? [...party, id]
          : party,
    );
  const suggest = async (): Promise<void> => {
    setBusy(true);
    setNote(null);
    const pick = await requestBossSuggest(bossSuggestInput(game(), now(), activePrep));
    if (pick) {
      setParty(pick.party.map((p) => p.id as HunterId));
      setNote(
        `Tried ${pick.considered} ${pick.considered === 1 ? 'party' : 'parties'}${
          pick.stoppedEarly ? '' : ', then took the best seen'
        }.`,
      );
    }
    setBusy(false);
  };
  const send = (): void => {
    if (dispatch({ type: 'boss.attempt', party: chosen, prep: activePrep }).ok) closeSheet();
  };
  const preview = answer?.preview ?? null;
  const words = preview ? bossPreviewLines(preview) : null;
  return (
    <div>
      <div class={styles.row}>
        <h3 class={`${styles.cardTitle} ${styles.grow}`}>
          Party ({chosen.length}/{max})
        </h3>
        <button
          type="button"
          class={styles.btn}
          onClick={() => void suggest()}
          disabled={goers.length === 0 || busy}
        >
          Suggest best
        </button>
      </div>
      {note && <p class={`${styles.small} ${styles.dim}`}>{note}</p>}
      <ul class={styles.list}>
        {rows.map((r) => (
          <li key={r.id} class={`${styles.divider} ${r.reason ? css.rowDisabled : ''}`}>
            <label class={styles.row}>
              <input
                type="checkbox"
                checked={party.includes(r.id)}
                disabled={r.reason !== null}
                onChange={() => toggle(r.id)}
              />
              <span class={styles.grow}>
                <span class={css.rank}>{r.rank}</span>
                {r.name}{' '}
                <span class={`${styles.small} ${styles.dim}`}>
                  {r.role} · {r.damage} · Lv {r.level}
                </span>
                {r.reason && <div class={`${styles.small} ${css.reason}`}>{r.reason}</div>}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p class={`${styles.small} ${styles.dim}`}>
        {boss.name}: weak to {creatureLines(boss).weak}.
      </p>
      <PreparationPicker
        state={s}
        party={chosen}
        prep={activePrep}
        creature={boss}
        onChange={setPrep}
      />
      {words && preview && (
        <div class={styles.card}>
          <div class={styles.row}>
            <strong class={styles.grow}>{words.expected}</strong>
            <button
              type="button"
              class={styles.btn}
              onClick={() =>
                openSheet('Why this damage', () => <BreakdownView breakdown={preview.why} />)
              }
            >
              Why? ▸
            </button>
          </div>
          {words.next && <div class={`${styles.small} ${styles.good}`}>{words.next}</div>}
          {answer?.quick && (
            <div class={`${styles.small} ${styles.warn}`}>
              Quick estimate ({preview.samples} fights): this device couldn't run the full 100.
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        disabled={chosen.length === 0 || busy}
        onClick={send}
      >
        Send the hunters
      </button>
    </div>
  );
};
