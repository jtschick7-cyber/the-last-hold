import { useEffect, useMemo, useState } from 'preact/hooks';
import { quarries } from '../../content/hunts';
import type { TrackId } from '../../content/hunts';
import type { HunterId } from '../../content/hunters';
import { num } from '../../core/balance-access';
import { noPreparation, type Preparation } from '../../core/state/game-state';
import { huntTrackView } from '../../core/systems/events-results';
import { huntOddsInput, huntSuggestInput } from '../../core/systems/hunt-odds';
import { now } from '../../platform/clock';
import { requestHuntOdds, requestHuntSuggest, type HuntOddsAnswer } from '../app/odds-client';
import { pct } from '../app/contract-text';
import { dispatch, game, version } from '../app/runtime';
import { closeSheet, openSheet } from '../app/sheets';
import { BreakdownView } from '../sheets/BreakdownView';
import { PreparationPicker } from '../sheets/PreparationPicker';
import styles from '../styles/ui.module.css';
import { startEventPlayback } from './EventPlayback';
import css from './Events.module.css';
import { PartyList } from './PartyList';

const DEBOUNCE_MS = 150;

// GDD §9.17 hunt sheet (a track): the §9.5 odds panel (win odds, the margin, "unprepared would be
// X%", no Reckless line because nobody is hurt), the legal party picker and preparation. A replay
// says so, since it pays no points.
export const HuntTrackSheet = ({ track }: { track: TrackId }) => {
  void version.value;
  const s = game();
  const v = huntTrackView(s, track, now());
  const max = num('boss.partySize');
  const quarry = quarries[v.quarryId];
  const [party, setParty] = useState<HunterId[]>([]);
  const [prep, setPrep] = useState<Preparation>(noPreparation());
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [answer, setAnswer] = useState<HuntOddsAnswer | null>(null);
  const goers = v.rows.filter((r) => r.reason === null).map((r) => r.id);
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
      void requestHuntOdds(huntOddsInput(game(), track, chosen, activePrep)).then((a) => {
        if (live) setAnswer(a);
      });
    }, DEBOUNCE_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [chosen.join(','), JSON.stringify(activePrep), track]);

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
    const pick = await requestHuntSuggest(huntSuggestInput(game(), track, now(), activePrep));
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
    if (!dispatch({ type: 'hunt.attempt', track, party: chosen, prep: activePrep }).ok) return;
    closeSheet();
    startEventPlayback();
  };
  const odds = answer?.odds ?? null;
  return (
    <div>
      <h3 class={styles.cardTitle}>{v.quarryName}</h3>
      <p class={`${styles.small} ${styles.dim}`}>
        {v.name} · tier {v.tier} · {v.restriction}
      </p>
      <p class={`${styles.small} ${styles.dim}`}>
        weak: {v.weak}
        <br />
        resists: {v.resists}
        <br />
        {v.abilities.join(' · ')}
      </p>
      <p class={`${styles.small} ${styles.dim}`}>
        <em>{v.notebook}</em>
      </p>
      {v.replay && (
        <p class={styles.small}>Already unlocked: a win pays XP and a reagent, but no points.</p>
      )}
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
      <PartyList rows={v.rows} party={party} onToggle={toggle} />
      <PreparationPicker
        state={s}
        party={chosen}
        prep={activePrep}
        creature={quarry}
        onChange={setPrep}
      />
      {odds && (
        <div class={styles.card}>
          <div class={styles.row}>
            <strong class={styles.grow}>
              ODDS {pct(odds.winChance)} ±{Math.round(odds.margin * 100)}
            </strong>
            <button
              type="button"
              class={styles.btn}
              onClick={() =>
                openSheet('Why these odds', () => <BreakdownView breakdown={odds.why} />)
              }
            >
              Why? ▸
            </button>
          </div>
          {odds.unpreparedWinChance !== odds.winChance && (
            <div class={`${styles.small} ${styles.dim}`}>
              unprepared would be {pct(odds.unpreparedWinChance)}
            </div>
          )}
          {answer?.quick && (
            <div class={`${styles.small} ${styles.warn}`}>
              Quick estimate ({odds.samples} fights): this device couldn't run the full 500.
            </div>
          )}
        </div>
      )}
      {v.sendProblem && <p class={`${styles.small} ${css.reason}`}>{v.sendProblem}</p>}
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        disabled={chosen.length === 0 || busy || v.sendProblem !== null}
        onClick={send}
      >
        Send the hunters
      </button>
    </div>
  );
};
