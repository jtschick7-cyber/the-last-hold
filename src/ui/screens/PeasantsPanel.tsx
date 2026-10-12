import { JOB_IDS, jobs } from '../../content/jobs';
import { housing, idlePeasants, jobSlots } from '../../core/systems/housing';
import { settleCost } from '../../core/systems/settle';
import { formatNumber } from '../../core/format';
import { dispatch, game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';
import { Num } from '../widgets/Num';

// GDD §9.2 peasants panel: total/housing, idle warning, auto-settle, and a row
// per job with − / + / fill (GDD §5.1.1: reassigning is free and instant).
export const PeasantsPanel = () => {
  void version.value;
  const s = game();
  const house = housing(s);
  const idle = idlePeasants(s);
  const cost = settleCost(s.peasants.total);
  const shown = JOB_IDS.filter((j) => jobSlots(s, j).value > 0 || s.peasants.jobs[j] > 0);
  return (
    <section class={styles.card} aria-labelledby="peasants-title">
      <h2 id="peasants-title" class={styles.cardTitle}>
        Peasants{' '}
        <Num text={`${s.peasants.total}/${house.value}`} breakdown={() => house.breakdown} marked />
        {idle > 0 && <span class={styles.warn}>idle {idle} ⚠️</span>}
      </h2>
      <div class={styles.row}>
        <label class={`${styles.row} ${styles.grow}`}>
          <input
            type="checkbox"
            checked={s.peasants.autoSettle}
            onChange={(e) => dispatch({ type: 'peasants.autoSettle', on: e.currentTarget.checked })}
          />
          Auto-settle
        </label>
        <span class={`${styles.small} ${styles.dim}`}>
          next costs{' '}
          <Num text={`${formatNumber(cost.value)} 🌾`} breakdown={() => cost.breakdown} />
        </span>
      </div>
      {idle > 0 && (
        <p class={`${styles.small} ${styles.warn}`}>Idle hands produce nothing. Give them a job.</p>
      )}
      <ul class={styles.list}>
        {shown.map((j) => {
          const slots = jobSlots(s, j);
          const working = s.peasants.jobs[j];
          return (
            <li key={j} class={`${styles.row} ${styles.divider}`}>
              <span class={styles.grow}>
                {jobs[j].name}{' '}
                <Num text={`${working}/${slots.value}`} breakdown={() => slots.breakdown} />
              </span>
              <button
                type="button"
                class={styles.btn}
                aria-label={`One fewer ${jobs[j].name}`}
                disabled={working < 1}
                onClick={() => dispatch({ type: 'peasants.remove', job: j })}
              >
                −
              </button>
              <button
                type="button"
                class={styles.btn}
                aria-label={`One more ${jobs[j].name}`}
                disabled={idle < 1 || working >= slots.value}
                onClick={() => dispatch({ type: 'peasants.add', job: j })}
              >
                +
              </button>
              <button
                type="button"
                class={styles.btn}
                disabled={idle < 1 || working >= slots.value}
                onClick={() => dispatch({ type: 'peasants.fill', job: j })}
              >
                fill
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
