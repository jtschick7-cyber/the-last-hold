import { BREACH_TEXT } from '../../content/breach-text';
import { ARRANGE_TEXT, V18_TEXT } from '../../content/v18-text';
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
  readonly onOpenHoldLook: () => void;
  readonly onSavePreset: (slot: LayoutPresetSlot) => void;
  readonly onApplyPreset: (slot: LayoutPresetSlot) => void;
}

const MODES: readonly (readonly [LayoutArrangeMode, string])[] = [
  ['balanced', ARRANGE_TEXT.modeBalanced],
  ['economy', ARRANGE_TEXT.modeEconomy],
  ['fortress', ARRANGE_TEXT.modeFortress],
];

/** Mode selector, Arrange/Clear/Suggest/Hold Look buttons, and 2-slot Preset bar for Arrange Hold. */
export const ArrangeHoldControls = ({
  mode,
  presets,
  showSuggest,
  onSelectMode,
  onAutoArrange,
  onRequestClear,
  onSuggest,
  onOpenHoldLook,
  onSavePreset,
  onApplyPreset,
}: ControlsProps) => (
  <>
    <div class={styles.divider} data-mode-bar="true" style={{ paddingTop: 'var(--space-2)' }}>
      <div
        class={styles.segmentedWrap}
        role="group"
        aria-label={ARRANGE_TEXT.layoutMode}
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
        <button
          type="button"
          class={styles.btn}
          data-hold-look-button="arrange"
          onClick={onOpenHoldLook}
        >
          {V18_TEXT.holdLookButton}
        </button>
      </div>
    </div>

    <div
      class={styles.divider}
      data-presets-bar="true"
      role="region"
      aria-label={ARRANGE_TEXT.presets}
      style={{ paddingTop: 'var(--space-2)' }}
    >
      <h3 class={styles.cardTitle}>{ARRANGE_TEXT.presets}</h3>
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
              <strong>{ARRANGE_TEXT.slot(slotNum)}</strong>{' '}
              <span class={styles.small} data-preset-status={slotNum}>
                {preset ? ARRANGE_TEXT.placedCount(savedCount) : ARRANGE_TEXT.empty}
              </span>
            </span>
            <button
              type="button"
              class={styles.btn}
              data-preset-save={slotNum}
              aria-label={`Save Slot ${slotNum}`}
              onClick={() => onSavePreset(slotIdx)}
            >
              {ARRANGE_TEXT.save}
            </button>
            <button
              type="button"
              class={styles.btn}
              data-preset-apply={slotNum}
              aria-label={`Apply Slot ${slotNum}`}
              disabled={!preset}
              onClick={() => onApplyPreset(slotIdx)}
            >
              {ARRANGE_TEXT.apply}
            </button>
          </div>
        );
      })}
    </div>
  </>
);
