// GDD §6.1 check-in schedules.
import { describe, expect, it } from 'vitest';
import { DAY, nextCheckIn, OPENING_LENGTH, OPENING_STEP, weekday } from './schedules';

const HOUR = 3_600_000;
const MONDAY = 19_723 * DAY; // 2024-01-01, a Monday
const at = (day: number, h: number, m = 0): number => MONDAY + day * DAY + h * HOUR + m * 60_000;

const sequence = (policy: Parameters<typeof nextCheckIn>[0], from: number, n: number): number[] => {
  const out: number[] = [];
  for (let t = from; out.length < n;) out.push((t = nextCheckIn(policy, t, from)));
  return out;
};

describe('weekday', () => {
  it('counts Monday as 0 and Sunday as 6', () => {
    expect(weekday(at(0, 7))).toBe(0);
    expect(weekday(at(5, 9))).toBe(5);
    expect(weekday(at(6, 23))).toBe(6);
    expect(weekday(at(7, 0))).toBe(0);
  });
});

describe('Standard', () => {
  it('weekdays: 07:00, 10:00, 12:30, 16:00, 21:00', () => {
    expect(sequence('standard', at(0, 7), 6)).toEqual([
      at(0, 10),
      at(0, 12, 30),
      at(0, 16),
      at(0, 21),
      at(1, 7),
      at(1, 10),
    ]);
  });

  it('weekends: 09:00, 13:00, 17:00, 21:00, then Monday 07:00', () => {
    expect(sequence('standard', at(4, 21), 9)).toEqual([
      at(5, 9),
      at(5, 13),
      at(5, 17),
      at(5, 21),
      at(6, 9),
      at(6, 13),
      at(6, 17),
      at(6, 21),
      at(7, 7),
    ]);
  });
});

describe('Light and Heavy', () => {
  it('Light: 07:00, 12:30, 21:00 every day', () => {
    expect(sequence('light', at(5, 7), 4)).toEqual([
      at(5, 12, 30),
      at(5, 21),
      at(6, 7),
      at(6, 12, 30),
    ]);
  });

  it('Heavy: every 2 h from 07:00 to 23:00', () => {
    const s = sequence('heavy', at(0, 21), 4);
    expect(s).toEqual([at(0, 23), at(1, 7), at(1, 9), at(1, 11)]);
  });
});

describe('Opening', () => {
  it('acts every 10 s for 15 min, then plays Standard', () => {
    const start = at(0, 7);
    const s = sequence('opening', start, OPENING_LENGTH / OPENING_STEP + 1);
    expect(s[0]).toBe(start + OPENING_STEP);
    expect(s.at(-2)).toBe(start + OPENING_LENGTH);
    expect(s.at(-1)).toBe(at(0, 10));
  });
});
