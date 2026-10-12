import type { Breakdown } from '../../core/breakdown/breakdown';
import { openSheet } from '../app/sheets';
import { BreakdownView } from '../sheets/BreakdownView';
import styles from '../styles/ui.module.css';
import { useLongPress } from './use-long-press';

export interface NumProps {
  text: string;
  /** Built on demand by the same function that built the number (D10). */
  breakdown: () => Breakdown;
  /** Show the ⓘ marker (GDD §9.1) for key numbers. */
  marked?: boolean;
}

/** A number that opens its breakdown on long-press, ⓘ tap, or keyboard. */
export const Num = ({ text, breakdown, marked }: NumProps) => {
  const open = (): void => {
    const b = breakdown();
    openSheet(b.label, () => <BreakdownView breakdown={b} />);
  };
  const press = useLongPress(open);
  return (
    <span>
      <button
        type="button"
        class={styles.num}
        {...press}
        onKeyDown={(e) => e.key === 'Enter' && open()}
      >
        {text}
      </button>
      {marked && (
        <button
          type="button"
          class={`${styles.num} ${styles.info}`}
          onClick={open}
          aria-label="Show breakdown"
        >
          ⓘ
        </button>
      )}
    </span>
  );
};
