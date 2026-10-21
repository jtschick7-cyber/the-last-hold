import { useMemo, useState } from 'preact/hooks';
import { floorPlayback, type FloorPlayback } from '../../core/delves/view';
import { stageView, yourBlessingsView } from '../../core/delves/view-run';
import { dispatch, game, version } from '../app/runtime';
import { openSheet } from '../app/sheets';
import { BreakdownView } from '../sheets/BreakdownView';
import styles from '../styles/ui.module.css';
import { Arena } from './Arena';
import css from './Delve.module.css';
import { PlaybackView } from './PlaybackView';
import { ResultView } from './ResultView';
import { StageViewScreen } from './StageViews';

// GDD §9.15: the Delve sheet, opened from the Rift card. It shows whatever the run is waiting
// on: the next fight (the party and the group, then the playback), or, until the door and
// blessing screens arrive with the next task (T7.13b), a plain note with Leave run.

const FightReady = ({ onFight }: { onFight: (pb: FloorPlayback) => void }) => {
  const s = game();
  const run = s.delve.run;
  const pb = useMemo(() => floorPlayback(game()), [run?.floor, run?.seed]);
  if (!pb) return null;
  return (
    <div>
      <h3 class={styles.cardTitle}>{pb.title}</h3>
      <p class={pb.guardian ? css.guardian : styles.dim}>{pb.subtitle}</p>
      <Arena
        combatants={pb.combatants}
        bars={Object.fromEntries(pb.combatants.map((c) => [c.id, c.start]))}
        frames={{}}
      />
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        onClick={() => onFight(pb)}
      >
        Fight
      </button>
    </div>
  );
};

const LeaveRun = () => {
  const [sure, setSure] = useState(false);
  return sure ? (
    <div class={styles.row}>
      <span class={styles.grow}>Leave? You keep what the run earned.</span>
      <button type="button" class={styles.btn} onClick={() => setSure(false)}>
        Stay
      </button>
      <button
        type="button"
        class={styles.btnPrimary}
        onClick={() => dispatch({ type: 'delve.leave' })}
      >
        Leave
      </button>
    </div>
  ) : (
    <button type="button" class={styles.btn} onClick={() => setSure(true)}>
      Leave run
    </button>
  );
};

const YourBlessings = () => {
  void version.value;
  const v = yourBlessingsView(game());
  return (
    <div>
      {v.items.length === 0 ? (
        <p class={styles.dim}>No blessings yet. Each floor offers one.</p>
      ) : (
        <ul class={styles.list}>
          {v.items.map((b) => (
            <li key={b.id} class={styles.divider} style={{ padding: 'var(--space-2) 0' }}>
              <strong>{b.name}</strong> <span class={css.rarity}>{b.rarityName}</span>
              <span class={`${styles.small} ${styles.dim}`}> · {b.patronName}</span>
              <br />
              <span class={styles.small}>{b.text}</span>
              {b.but && (
                <>
                  <br />
                  <span class={css.but}>but {b.but}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {v.items.length > 0 && (
        <button
          type="button"
          class={styles.btn}
          onClick={() =>
            openSheet('Your blessings, worked out', () => <BreakdownView breakdown={v.breakdown} />)
          }
        >
          How it adds up ▸
        </button>
      )}
    </div>
  );
};

/** Between floors: Your blessings (always available) and Leave run, with a confirmation (§9.15). */
const Footer = () => (
  <div class={css.footer}>
    <button
      type="button"
      class={styles.btn}
      onClick={() => openSheet('Your blessings', () => <YourBlessings />)}
    >
      Your blessings
    </button>
    <span class={styles.grow} />
    <LeaveRun />
  </div>
);

export const DelveView = () => {
  void version.value;
  const s = game();
  const [played, setPlayed] = useState<FloorPlayback | null>(null);
  if (played)
    return (
      <PlaybackView
        pb={played}
        onFinish={() => dispatch({ type: 'delve.fight' })}
        onContinue={() => setPlayed(null)}
      />
    );
  const run = s.delve.run;
  if (!run) return <ResultView />;
  const stage = stageView(s);
  return (
    <div>
      {stage ? <StageViewScreen v={stage} /> : <FightReady onFight={setPlayed} />}
      <Footer />
    </div>
  );
};
