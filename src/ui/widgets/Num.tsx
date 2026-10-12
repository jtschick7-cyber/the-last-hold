import { useRef, useState } from 'preact/hooks';
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

const HOVER_DELAY_MS = 350;

/**
 * GDD §9.1 / §5.0: a number whose breakdown opens on long-press, an ⓘ tap, or
 * Enter; on desktop, hovering shows it in a popover.
 */
export const Num = ({ text, breakdown, marked }: NumProps) => {
  const [hover, setHover] = useState<Breakdown | null>(null);
  const timer = useRef<number | null>(null);
  const open = (): void => {
    setHover(null);
    const b = breakdown();
    openSheet(b.label, () => <BreakdownView breakdown={b} />);
  };
  const press = useLongPress(open);
  const endHover = (): void => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setHover(null);
  };
  return (
    <span
      class={styles.numWrap}
      onPointerEnter={(e) => {
        if (e.pointerType !== 'mouse') return;
        timer.current = window.setTimeout(() => setHover(breakdown()), HOVER_DELAY_MS);
      }}
      onPointerLeave={endHover}
    >
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
      {hover && (
        <span class={styles.popover} role="tooltip">
          <BreakdownView breakdown={hover} />
        </span>
      )}
    </span>
  );
};
