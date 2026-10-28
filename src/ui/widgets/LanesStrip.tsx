import { signal } from '@preact/signals';
import { BREACH_TEXT, wavesText } from '../../content/breach-text';
import type { LaneInfo, LaneView } from '../../core/systems/breach';
import { openSheet } from '../app/sheets';
import { BreakdownView } from '../sheets/BreakdownView';
import styles from '../styles/ui.module.css';
import css from './LanesStrip.module.css';

// GDD §9.25 (D588): the Lanes strip and its text list. It draws what `laneView` gives and works out
// no lane number (CLAUDE.md). A tap on a lane opens its breakdown sheet and, on the Arrange Hold sheet,
// lights the pieces that cover it. The two choices live in signals, because a sheet opened over this
// one hides it, and it is drawn again when that sheet closes.

/** The lane (0 to 7) whose covering pieces are lit on the grid, or none. */
export const litLane = signal<number | null>(null);
const mode = signal<'strip' | 'list'>('strip');

const LaneSheet = ({ lane }: { lane: LaneInfo }) => (
  <div data-testid="lane-sheet">
    <BreakdownView breakdown={lane.wallCut.breakdown} />
    <BreakdownView breakdown={lane.volley.breakdown} />
  </div>
);

const tap = (lane: LaneInfo, light: boolean): void => {
  if (light) litLane.value = lane.lane - 1;
  openSheet(BREACH_TEXT.lane(lane.lane), () => <LaneSheet lane={lane} />);
};

/** The Lanes strip with its Strip / List switch; nothing before Bastion. `light`: this screen has a grid to light. */
export const LanesStrip = ({ view, light }: { view: LaneView; light: boolean }) => {
  if (!view.shown) return null;
  return (
    <div data-testid="lanes" class={styles.divider}>
      <div class={styles.row} style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 class={`${styles.cardTitle} ${styles.grow}`} style={{ margin: 0 }}>
          {BREACH_TEXT.lanes}
        </h3>
        <div class={styles.segmented} role="group" aria-label={BREACH_TEXT.lanes}>
          {(
            [
              ['strip', BREACH_TEXT.strip],
              ['list', BREACH_TEXT.list],
            ] as const
          ).map(([value, text]) => (
            <button
              type="button"
              key={value}
              data-testid={`lanes-switch-${value}`}
              class={mode.value === value ? styles.segmentOn : styles.segment}
              aria-pressed={mode.value === value}
              onClick={() => (mode.value = value)}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
      {mode.value === 'strip' ? (
        <>
          <div class={css.strip} data-testid="lanes-strip">
            {view.lanes.map((lane) => (
              <button
                type="button"
                key={lane.lane}
                data-testid={`lane-${lane.lane}`}
                aria-pressed={light && litLane.value === lane.lane - 1}
                class={`${css.box} ${light && litLane.value === lane.lane - 1 ? css.boxOn : ''}`}
                onClick={() => tap(lane, light)}
              >
                <span class={css.laneName}>{BREACH_TEXT.lane(lane.lane)}</span>
                <span class={styles.small}>{BREACH_TEXT.coverBox(lane.coverPercent)}</span>
                <span class={css.dots} aria-hidden="true">
                  {lane.waves.map((n) => (
                    <span key={n} class={css.dot} />
                  ))}
                </span>
              </button>
            ))}
          </div>
          <p class={styles.small} data-testid="lanes-hint">
            {BREACH_TEXT.hint}
          </p>
        </>
      ) : (
        <ul class={css.list} data-testid="lanes-list">
          {view.lanes.map((lane) => (
            <li key={lane.lane}>
              <button
                type="button"
                data-testid={`lane-line-${lane.lane}`}
                class={css.line}
                onClick={() => tap(lane, light)}
              >
                {BREACH_TEXT.listLine(
                  lane.lane,
                  lane.coverPercent,
                  lane.towerReachPercent,
                  wavesText(lane.waves, view.waveCount),
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p class={styles.small} data-testid="lanes-help">
        {BREACH_TEXT.help}
      </p>
      {view.none && (
        <p class={styles.small} data-testid="lanes-empty">
          {BREACH_TEXT.empty}
        </p>
      )}
    </div>
  );
};
