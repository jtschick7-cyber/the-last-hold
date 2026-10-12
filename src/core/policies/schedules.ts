// GDD §6.1: when each simulated player checks in. Times are minutes after
// midnight. The simulator's clock reads epoch ms as local time with no time
// zone (UTC), so a day is a plain 24 h and 1970-01-01 is a Thursday.

export const POLICY_IDS = ['opening', 'standard', 'light', 'heavy'] as const;
export type PolicyId = (typeof POLICY_IDS)[number];

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const at = (h: number, m = 0): number => h * HOUR + m * MINUTE;

const STANDARD_WEEKDAY = [at(7), at(10), at(12, 30), at(16), at(21)];
const STANDARD_WEEKEND = [at(9), at(13), at(17), at(21)];
const LIGHT = [at(7), at(12, 30), at(21)];
const HEAVY = [at(7), at(9), at(11), at(13), at(15), at(17), at(19), at(21), at(23)];

/** The Opening policy acts every 10 s for the first 15 min, then plays Standard. */
export const OPENING_STEP = 10_000;
export const OPENING_LENGTH = 15 * MINUTE;

const THURSDAY = 3;
/** 0 = Monday … 6 = Sunday. */
export const weekday = (t: number): number => (Math.floor(t / DAY) + THURSDAY) % 7;
const isWeekend = (t: number): boolean => weekday(t) >= 5;

const dayTimes = (policy: PolicyId, dayStart: number): readonly number[] => {
  if (policy === 'light') return LIGHT;
  if (policy === 'heavy') return HEAVY;
  return isWeekend(dayStart) ? STANDARD_WEEKEND : STANDARD_WEEKDAY;
};

/**
 * The first check-in strictly after `after`. `startedAt` is when the game was
 * started, which the Opening policy counts its 15 minutes from.
 */
export const nextCheckIn = (policy: PolicyId, after: number, startedAt: number): number => {
  if (policy === 'opening' && after < startedAt + OPENING_LENGTH) {
    const steps = Math.floor((after - startedAt) / OPENING_STEP) + 1;
    return startedAt + steps * OPENING_STEP;
  }
  let dayStart = after - (after % DAY);
  for (;;) {
    const next = dayTimes(policy, dayStart).find((m) => dayStart + m > after);
    if (next !== undefined) return dayStart + next;
    dayStart += DAY;
  }
};
