import { useMemo, useState } from 'preact/hooks';
import { floorName, floorPlayback, type FloorPlayback } from '../../core/delves/view';
import { dispatch, game, version } from '../app/runtime';
import { closeSheet } from '../app/sheets';
import styles from '../styles/ui.module.css';
import { Arena } from './Arena';
import css from './Delve.module.css';
import { PlaybackView } from './PlaybackView';

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

const Waiting = () => {
  const run = game().delve.run;
  return (
    <div>
      <h3 class={styles.cardTitle}>{run ? `Delve: ${floorName(run.floor)}` : 'Delve'}</h3>
      <p class={styles.dim}>
        The doors and blessing cards arrive in the next build of this milestone.
      </p>
      <LeaveRun />
    </div>
  );
};

const Result = () => {
  const r = game().delve.result;
  if (!r) return <p>The rift is quiet.</p>;
  return (
    <div>
      <h3 class={styles.cardTitle}>
        {r.outcome === 'guardian'
          ? 'The guardian is beaten'
          : r.outcome === 'left'
            ? 'You came back up'
            : 'The party was beaten'}
      </h3>
      <p>
        Floors cleared: {r.floors}. Riftglass earned: {r.riftglass}.
      </p>
      <button
        type="button"
        class={styles.btnPrimary}
        style={{ width: '100%' }}
        onClick={() => {
          dispatch({ type: 'delve.ackResult' });
          closeSheet();
        }}
      >
        Done
      </button>
    </div>
  );
};

export const DelveView = () => {
  void version.value;
  const s = game();
  const [played, setPlayed] = useState<FloorPlayback | null>(null);
  if (played) return <PlaybackView pb={played} onContinue={() => setPlayed(null)} />;
  const run = s.delve.run;
  if (!run) return <Result />;
  return run.stage.kind === 'fight' ? <FightReady onFight={setPlayed} /> : <Waiting />;
};
