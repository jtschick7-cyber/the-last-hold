import type { Settings } from '../../core/state/game-state';
import {
  HOLD_VIEWS,
  TEXT_SIZES,
  type HoldView,
  type SoundSetting,
  type TextSize,
} from '../../platform/app-settings';
import {
  appSettings,
  dispatch,
  game,
  setBackupReminder,
  setHoldView,
  setSound,
  setTextSize,
  version,
} from '../app/runtime';
import { SOUND_BUTTONS, SOUND_HELP, SOUND_LABEL } from '../../content/sound-text';
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
    <div class={`${styles.row} ${styles.divider}`} style={{ flexWrap: 'wrap' }}>
      <span class={styles.grow} style={{ flexBasis: '7rem' }}>
        {label}
      </span>
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

const TEXT_SIZE_LABEL: Record<TextSize, string> = {
  match: 'Match phone',
  large: 'Large',
  largest: 'Largest',
};

// GDD §9.20: lives in the settings key outside the save, so it is set directly, not by a command.
const TextSizeChoice = () => {
  const current = appSettings.value.textSize;
  return (
    <div class={`${styles.row} ${styles.divider}`} style={{ flexWrap: 'wrap' }}>
      <span class={styles.grow} style={{ flexBasis: '7rem' }}>
        Text size
      </span>
      <div class={styles.segmentedWrap} role="group" aria-label="Text size">
        {TEXT_SIZES.map((size) => (
          <button
            type="button"
            key={size}
            class={current === size ? styles.segmentOn : styles.segment}
            aria-pressed={current === size}
            onClick={() => setTextSize(size)}
          >
            {TEXT_SIZE_LABEL[size]}
          </button>
        ))}
      </div>
    </div>
  );
};

const HOLD_VIEW_LABEL: Record<HoldView, string> = { grid: 'Grid', scene: 'Classic scene' };

// GDD §9.21: also outside the save, like Text size.
const HoldViewChoice = () => {
  const current = appSettings.value.holdView;
  return (
    <div class={`${styles.row} ${styles.divider}`} style={{ flexWrap: 'wrap' }}>
      <span class={styles.grow} style={{ flexBasis: '7rem' }}>
        Hold view
      </span>
      <div class={styles.segmented} role="group" aria-label="Hold view">
        {HOLD_VIEWS.map((v) => (
          <button
            type="button"
            key={v}
            class={current === v ? styles.segmentOn : styles.segment}
            aria-pressed={current === v}
            onClick={() => setHoldView(v)}
          >
            {HOLD_VIEW_LABEL[v]}
          </button>
        ))}
      </div>
    </div>
  );
};

const SoundChoice = () => {
  const current = appSettings.value.sound;
  return (
    <div class={styles.divider}>
      <div class={styles.row} style={{ flexWrap: 'wrap' }}>
        <span class={styles.grow} style={{ flexBasis: '7rem' }}>
          {SOUND_LABEL}
        </span>
        <div class={styles.segmented} role="group" aria-label={SOUND_LABEL}>
          {(
            [
              ['on', SOUND_BUTTONS.on],
              ['off', SOUND_BUTTONS.off],
            ] as [SoundSetting, string][]
          ).map(([value, text]) => (
            <button
              type="button"
              key={value}
              class={current === value ? styles.segmentOn : styles.segment}
              aria-pressed={current === value}
              onClick={() => setSound(value)}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
      <p class={`${styles.small} ${styles.dim}`}>{SOUND_HELP}</p>
    </div>
  );
};

const BackupReminderChoice = () => {
  const on = appSettings.value.backupReminder;
  return (
    <div class={`${styles.row} ${styles.divider}`} style={{ flexWrap: 'wrap' }}>
      <span class={styles.grow} style={{ flexBasis: '7rem' }}>
        Backup reminder
      </span>
      <div class={styles.segmented} role="group" aria-label="Backup reminder">
        {(
          [
            [true, 'On'],
            [false, 'Off'],
          ] as const
        ).map(([value, text]) => (
          <button
            type="button"
            key={text}
            class={on === value ? styles.segmentOn : styles.segment}
            aria-pressed={on === value}
            onClick={() => setBackupReminder(value)}
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
      <TextSizeChoice />
      <HoldViewChoice />
      <SoundChoice />
      <BackupReminderChoice />
    </div>
  );
};
