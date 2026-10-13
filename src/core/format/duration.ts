// Technical design §8: durations read "45s", "12m", "3h 10m", "2d 4h".
// Input is seconds (the engine's unit, GDD §5.0). Display floors, and the
// second unit is dropped when it is zero ("3h", not "3h 0m").
const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

const pair = (big: number, bigUnit: string, small: number, smallUnit: string): string =>
  small > 0 ? `${big}${bigUnit} ${small}${smallUnit}` : `${big}${bigUnit}`;

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0)
    return seconds === Number.POSITIVE_INFINITY ? '∞' : '0s';
  const s = Math.floor(seconds);
  if (s < MINUTE) return `${s}s`;
  if (s < HOUR) return `${Math.floor(s / MINUTE)}m`;
  if (s < DAY) return pair(Math.floor(s / HOUR), 'h', Math.floor((s % HOUR) / MINUTE), 'm');
  return pair(Math.floor(s / DAY), 'd', Math.floor((s % DAY) / HOUR), 'h');
};
