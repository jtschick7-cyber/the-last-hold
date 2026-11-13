import { BREACH_TEXT } from '../../content/breach-text';
import type {
  LayoutArrangeMode,
  LayoutPresetSlot,
  PresetSlot,
} from '../../core/state/layout-state';
import styles from '../styles/ui.module.css';

interface ControlsProps {
  readonly mode: LayoutArrangeMode;
  readonly presets: readonly [PresetSlot | null, PresetSlot | null];
  readonly showSuggest: boolean;
  readonly onSelectMode: (mode: LayoutArrangeMode) => void;
  readonly onAutoArrange: () => void;
  readonly onRequestClear: () => void;
  readonly onSuggest: () => void;
  readonly onSavePreset: (slot: LayoutPresetSlot) => void;
  readonly onApplyPreset: (slot: LayoutPresetSlot) => void;
}

const MODES: readonly (readonly [LayoutArrangeMode, string])[] = [
  ['balanced', 'Balanced'],
  ['economy', 'Economy'],
  ['fortress', 'Fortress'],
];

/** Mode selector, Arrange/Clear/Suggest action buttons, and 2-slot Preset bar for Arrange Hold. */
export const ArrangeHoldControls = ({
  mode,
  presets,
  showSuggest,
  onSelectMode,
  onAutoArrange,
  onRequestClear,
  onSuggest,
  onSavePreset,
  onApplyPreset,
}: ControlsProps) => (
  <>
    <div class={styles.divider} data-mode-bar="true" style={{ paddingTop: 'var(--space-2)' }}>
      <div
        class={styles.segmentedWrap}
        role="group"
        aria-label="Layout mode"
        style={{ marginBottom: 'var(--space-2)' }}
      >
        {MODES.map(([value, label]) => (
          <button
            type="button"
            key={value}
            data-arrange-mode={value}
            class={mode === value ? styles.segmentOn : styles.segment}
            aria-pressed={mode === value}
            onClick={() => onSelectMode(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div class={styles.row} style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <button type="button" class={styles.btn} onClick={onAutoArrange}>
          Auto-arrange
        </button>
        <button type="button" class={styles.btn} onClick={onRequestClear}>
          Clear to tray…
        </button>
        {showSuggest && (
          <button type="button" class={styles.btn} data-testid="suggest-layout" onClick={onSuggest}>
            {BREACH_TEXT.suggest}
          </button>
        )}
      </div>
    </div>

    <div
      class={styles.divider}
      data-presets-bar="true"
      role="region"
      aria-label="Presets"
      style={{ paddingTop: 'var(--space-2)' }}
    >
      <h3 class={styles.cardTitle}>Presets</h3>
      {([0, 1] as const).map((slotIdx) => {
        const preset = presets[slotIdx];
        const savedCount = preset ? preset.filter((c) => c !== null).length : 0;
        const slotNum = slotIdx + 1;
        return (
          <div
            key={slotIdx}
            class={styles.row}
            data-preset-slot={slotNum}
            style={{ flexWrap: 'wrap', marginBottom: 'var(--space-1)' }}
          >
            <span class={styles.grow} style={{ flex: '1 1 7rem' }}>
              <strong>Slot {slotNum}</strong>{' '}
              <span class={styles.small} data-preset-status={slotNum}>
                {preset ? `${savedCount} placed` : 'Empty'}
              </span>
            </span>
            <button
              type="button"
              class={styles.btn}
              data-preset-save={slotNum}
              aria-label={`Save Slot ${slotNum}`}
              onClick={() => onSavePreset(slotIdx)}
            >
              Save
            </button>
            <button
              type="button"
              class={styles.btn}
              data-preset-apply={slotNum}
              aria-label={`Apply Slot ${slotNum}`}
              disabled={!preset}
              onClick={() => onApplyPreset(slotIdx)}
            >
              Apply
            </button>
          </div>
        );
      })}
    </div>
  </>
);
