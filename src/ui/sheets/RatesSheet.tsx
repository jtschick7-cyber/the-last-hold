import { RESOURCE_IDS, resources } from '../../content/resources';
import { formatRate } from '../../core/format';
import { productionRate } from '../../core/systems/production';
import { dispatch, game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';
import { RESOURCE_ICON } from '../widgets/icons';
import { Num } from '../widgets/Num';

// GDD §9.1 / §5.0: per-minute rates by default, with a per-hour toggle.
export const RatesSheet = () => {
  void version.value;
  const s = game();
  const perHour = s.settings.rateUnit === 'hour';
  const scale = perHour ? 60 : 1;
  return (
    <div>
      <div class={styles.row}>
        <span class={styles.grow}>Rates</span>
        <div class={styles.segmented} role="group" aria-label="Rate unit">
          {(['minute', 'hour'] as const).map((u) => (
            <button
              type="button"
              key={u}
              class={s.settings.rateUnit === u ? styles.segmentOn : styles.segment}
              onClick={() => dispatch({ type: 'settings.set', patch: { rateUnit: u } })}
            >
              per {u}
            </button>
          ))}
        </div>
      </div>
      <ul class={styles.list}>
        {RESOURCE_IDS.map((r) => {
          const rate = productionRate(s, r);
          return (
            <li key={r} class={`${styles.row} ${styles.divider}`}>
              <span aria-hidden="true">{RESOURCE_ICON[r]}</span>
              <span class={styles.grow}>{resources[r].name}</span>
              <Num
                text={`${formatRate(rate.value * scale)}/${perHour ? 'h' : 'min'}`}
                breakdown={() => rate.breakdown}
                marked
              />
            </li>
          );
        })}
      </ul>
      <p class={`${styles.small} ${styles.dim}`}>
        Long-press any number, or tap ⓘ, to see how it's worked out. Breakdowns show per-minute
        values.
      </p>
    </div>
  );
};
