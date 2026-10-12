import type { Settings } from '../../core/state/game-state';
import { dispatch, game, version } from '../app/runtime';
import styles from '../styles/ui.module.css';

// GDD §9.10: theme, best-buy hint, rates per minute or hour, reduce motion.
const Choice = <K extends keyof Settings>({
  label,
  k,
  options,
}: {
  label: string;
  k: K;
  options: [Settings[K], string][];
}) => {
  const current = game().settings[k];
  return (
    <div class={`${styles.row} ${styles.divider}`}>
      <span class={styles.grow}>{label}</span>
      <div class={styles.segmented} role="group" aria-label={label}>
        {options.map(([value, text]) => (
          <button
            type="button"
            key={String(value)}
            class={current === value ? styles.segmentOn : styles.segment}
            onClick={() =>
              dispatch({ type: 'settings.set', patch: { [k]: value } as Partial<Settings> })
            }
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
};

export const SettingsSheet = () => {
  void version.value;
  return (
    <div>
      <Choice
        label="Theme"
        k="theme"
        options={[
          ['dark', 'Dark'],
          ['light', 'Light'],
        ]}
      />
      <Choice
        label="Best-buy hint ●"
        k="bestBuyHint"
        options={[
          [true, 'On'],
          [false, 'Off'],
        ]}
      />
      <Choice
        label="Rates"
        k="rateUnit"
        options={[
          ['minute', '/min'],
          ['hour', '/hour'],
        ]}
      />
      <Choice
        label="Reduce motion"
        k="reduceMotion"
        options={[
          ['system', 'System'],
          ['on', 'On'],
          ['off', 'Off'],
        ]}
      />
    </div>
  );
};
