// Technical design §13.1: policies play the real core on a virtual clock.
import { describe, expect, it } from 'vitest';
import { createNewGame } from '../state/new-game';
import { play, type CheckInRecord } from './play';
import { DAY } from './schedules';

const MON_7 = 19_723 * DAY + 7 * 3_600_000;

const run = (policy: 'opening' | 'standard', days: number) => {
  const s = createNewGame('seed', MON_7);
  const log: CheckInRecord[] = [];
  play(s, { policy, startedAt: MON_7, until: MON_7 + days * DAY, onCheckIn: (r) => log.push(r) });
  return { s, log };
};

describe('play', () => {
  // Two 3-day runs take about 4.7 s alone, so the default 5 s limit fails under a loaded
  // machine's full-suite run (seen at v0.7 start): a longer limit, the assertion unchanged.
  it('is deterministic: the same run twice gives the same state', () => {
    expect(JSON.stringify(run('standard', 3).s)).toBe(JSON.stringify(run('standard', 3).s));
  }, 30_000);

  it('checks in at the schedule, starting now', () => {
    const { log } = run('standard', 1);
    const hours = log.map((r) => (r.at - MON_7) / 3_600_000);
    expect(hours).toEqual([0, 3, 5.5, 9, 14, 24]);
  });

  it('the Opening acts every 10 s for 15 minutes', () => {
    const { log } = run('opening', 0.5);
    expect(log.filter((r) => r.at - MON_7 <= 15 * 60_000)).toHaveLength(91);
  });

  it('can stop early', () => {
    const s = createNewGame('seed', MON_7);
    let n = 0;
    play(s, {
      policy: 'standard',
      startedAt: MON_7,
      until: MON_7 + DAY,
      onCheckIn: () => n++,
      stop: () => true,
    });
    expect(n).toBe(1);
  });
});
