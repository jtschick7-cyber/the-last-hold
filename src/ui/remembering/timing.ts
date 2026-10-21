// GDD §9.19 (D464 (4)): the reading's pace is a presentation timing, so it lives here and not in
// balance.ts. Lore §34.5: about 2 seconds a name. Reduced motion changes the fade, never the speed.
export const READING_INTERVAL_MS = 2000;

/** The reading's position: 0..count-1 is a name; `count` is the final state (the last name stays, the Unlit's line shows). */
export interface ReadingPlayer {
  readonly index: () => number;
  readonly finished: () => boolean;
  /** Starts the automatic pace. */
  readonly start: () => void;
  /** A tap shows the next name at once (and restarts the interval so it does not double-step). */
  readonly tap: () => void;
  /** Skip jumps to the last frame. */
  readonly skip: () => void;
  readonly stop: () => void;
}

export const createReadingPlayer = (
  count: number,
  onChange: (index: number) => void,
  intervalMs: number = READING_INTERVAL_MS,
): ReadingPlayer => {
  let i = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const stop = (): void => {
    if (timer !== null) clearInterval(timer);
    timer = null;
  };
  const go = (to: number): void => {
    const next = Math.min(count, to);
    if (next === i) return;
    i = next;
    onChange(i);
    if (i >= count) stop();
  };
  const start = (): void => {
    stop();
    if (i < count) timer = setInterval(() => go(i + 1), intervalMs);
  };
  return {
    index: () => i,
    finished: () => i >= count,
    start,
    tap: () => {
      go(i + 1);
      start();
    },
    skip: () => go(count),
    stop,
  };
};
