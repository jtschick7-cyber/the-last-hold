// GDD §6.2 v0.10 (D417, D440): how the Orders rows judge made-up Orderer runs.
import { describe, expect, it } from 'vitest';
import type { RunResult } from '../run';
import {
  ordersAllChaptersCheck,
  ordersFirstChapterCheck,
  ordersLevelFourCheck,
  ordersProvisionsCheck,
  ordersSilverCheck,
} from './v010';

const IDS = ['moot', 'greyWives', 'bellWatchers', 'quenchers'] as const;
const chapters = (cycle: number, n = 4) =>
  IDS.flatMap((order) =>
    Array.from({ length: n }, (_, i) => ({ order, n: i + 1, variant: null, hours: 10 + i, cycle })),
  );
const run = (orders: object, over: object = {}, seed = 'a'): RunResult =>
  ({
    spec: { policy: 'orderer', seed, start: 'mon', days: 14 },
    orders,
    keepPhase: {
      byCycle: [{ cycle: 1, bountySilver: 80, jobSilver: 20, provisionsFood: 25, jobFood: 100 }],
    },
    ...over,
  }) as unknown as RunResult;
const base = {
  opened: IDS.map((order) => ({ order, hours: 1, cycle: 1 })),
  openings: IDS.map((order) => ({ order, seated: true, hours: 1 })),
  levels: IDS.map((order) => ({ order, level: 4, hours: 50, cycle: 5 })),
  chapters: chapters(5),
};

describe('the first chapter row (D440)', () => {
  it('judges an Order seated at its opening by 24 h, and only reports one that was not', () => {
    expect(ordersFirstChapterCheck.judge([run(base)]).pass).toBe(true);
    const late = { ...base, chapters: chapters(5).map((c) => ({ ...c, hours: 40 })) };
    expect(ordersFirstChapterCheck.judge([run(late)]).pass).toBe(false);
    const unseated = {
      ...late,
      openings: base.openings.map((o) => ({
        ...o,
        seated:
          o.order !== 'greyWives' &&
          o.order !== 'moot' &&
          o.order !== 'bellWatchers' &&
          o.order !== 'quenchers',
      })),
    };
    // Nobody seated at an opening: nothing is judged, so it passes and says so.
    const r = ordersFirstChapterCheck.judge([run(unseated)]);
    expect(r.pass).toBe(true);
    expect(r.lines.join('\n')).toContain('reported only');
  });
});

describe('level, chapters, silver and provisions', () => {
  it('wants level 4 by cycle 6 and all 16 chapters by cycle 8', () => {
    expect(ordersLevelFourCheck.judge([run(base)]).pass).toBe(true);
    const slow = { ...base, levels: base.levels.map((l) => ({ ...l, cycle: 7 })) };
    expect(ordersLevelFourCheck.judge([run(slow)]).pass).toBe(false);
    expect(ordersAllChaptersCheck.judge([run(base)]).pass).toBe(true);
    expect(ordersAllChaptersCheck.judge([run({ ...base, chapters: chapters(9) })]).pass).toBe(
      false,
    );
    expect(ordersAllChaptersCheck.judge([run({ ...base, chapters: chapters(5, 3) })]).pass).toBe(
      false,
    );
  });
  it('wants 70% of cycle-1 silver from bounties and 20–40% provisions', () => {
    expect(ordersSilverCheck.judge([run(base)]).pass).toBe(true);
    const poor = {
      keepPhase: {
        byCycle: [{ cycle: 1, bountySilver: 50, jobSilver: 50, provisionsFood: 25, jobFood: 100 }],
      },
    };
    expect(ordersSilverCheck.judge([run(base, poor)]).pass).toBe(false);
    expect(ordersProvisionsCheck.judge([run(base)]).pass).toBe(true);
    const thin = {
      keepPhase: {
        byCycle: [{ cycle: 1, bountySilver: 80, jobSilver: 20, provisionsFood: 10, jobFood: 100 }],
      },
    };
    expect(ordersProvisionsCheck.judge([run(base, thin)]).pass).toBe(false);
  });
  it('needs Orderer runs, and is left out of the fast set', () => {
    expect(ordersSilverCheck.judge([]).pass).toBe(false);
    const fast = {
      spec: { policy: 'standard', seed: 'a', start: 'mon', days: 5, stopAt: ['citadel'] },
    };
    expect(ordersSilverCheck.judge([fast as unknown as RunResult]).pass).toBe(null);
  });
});
