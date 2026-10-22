// GDD §9.20, technical design §18.3: the one place JS-driven motion is created. Playback, the
// reading's pace and sprite frames go through here, so "reduced" is decided in one place and a
// test can prove nothing else starts a timer-driven animation.

export type ReduceSetting = 'system' | 'on' | 'off';

/** Motion is reduced if the phone says so OR the Settings switch is on (the switch never overrides the phone). */
export const isReduced = (setting: ReduceSetting, phoneSaysReduce: boolean): boolean =>
  setting === 'on' || phoneSaysReduce;

export const phoneSaysReduce = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/**
 * A repeating step of a playback (fight, Delve or the reading). The timeline and the pace are the
 * same whether motion is reduced or not: reduced motion changes what is drawn, never how long it takes.
 * Returns the function that stops it.
 */
export const motionInterval = (step: () => void, ms: number): (() => void) => {
  const id = setInterval(step, ms);
  return () => clearInterval(id);
};
