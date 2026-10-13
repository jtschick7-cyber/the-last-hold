// Plan T1.16: offline equivalence (D30), chunk independence, backward clock,
// determinism, and cap reporting (technical design §6.2, §6.4, §14).
import { describe, expect, it } from 'vitest';
import { apply } from '../../src/core/commands';
import { advance, catchUpNow, type AdvanceEvent } from '../../src/core/sim';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { compareStates } from './compare-states';

const T0 = Date.UTC(2026, 9, 12, 7, 0, 0); // a Monday, 07:00 (GDD §6.1)
const SECOND = 1000;
const HOUR = 3600 * SECOND;

/** A mid-game hold with room to grow, so peasants settle throughout the run. */
const midGame = (): GameState => {
  const s = createNewGame('equivalence', T0);
  Object.assign(s.buildings, {
    cottage: 12,
    farm: 4,
    'woodcutters-camp': 3,
    mine: 2,
    mill: 2,
    sawpit: 1,
  });
  s.resources = { food: 40, wood: 500, iron: 50, silver: 0 };
  return s;
};

describe('offline equivalence (D30)', () => {
  it('12 h of 1 s live ticks equals one 12 h catch-up', () => {
    const live = midGame();
    const liveEvents: AdvanceEvent[] = [];
    for (let t = T0 + SECOND; t <= T0 + 12 * HOUR; t += SECOND) {
      liveEvents.push(...advance(live, t).events);
    }
    const offline = midGame();
    const summary = catchUpNow(offline, T0 + 12 * HOUR);

    expect(summary.counted).toBe(12 * HOUR);
    expect(summary.capped).toBe(false);
    expect(liveEvents.length).toBeGreaterThan(5); // the run really exercised settles
    expect(compareStates(live, offline)).toEqual([]);
    expect(compareStates(liveEvents, summary.events)).toEqual([]);
  });

  it('chunk size never changes the result', () => {
    const oneStep = midGame();
    advance(oneStep, T0 + 6 * HOUR);
    const chunked = midGame();
    catchUpNow(chunked, T0 + 6 * HOUR);
    const odd = midGame();
    for (let t = T0; t < T0 + 6 * HOUR;) {
      t = Math.min(T0 + 6 * HOUR, t + 7_919); // a prime number of ms
      advance(odd, t);
    }
    expect(compareStates(oneStep, chunked)).toEqual([]);
    expect(compareStates(oneStep, odd)).toEqual([]);
  });
});

describe('auto-settle (GDD §5.1.1)', () => {
  it('settles at most one peasant every 30 s, into the first open priority slot', () => {
    const s = midGame();
    s.resources.food = 1e6;
    const { events } = advance(s, T0 + 95 * SECOND);
    expect(events.map((e) => e.at - T0)).toEqual([0, 30_000, 60_000, 90_000]);
    expect(events.every((e) => e.type === 'settle' && e.job === 'farmer')).toBe(true);
    expect(s.peasants.total).toBe(7);
  });

  it('settles the moment food reaches the cost', () => {
    const s = createNewGame('x', T0);
    s.buildings.cottage = 1; // housing 5, 3 peasants
    s.resources.food = 0;
    const { events } = advance(s, T0 + HOUR);
    // Cost 20 × 1.15^3 = 30.4175 food at 6 food/min → 5.069583… min.
    expect(events[0]?.at).toBeCloseTo(T0 + ((20 * Math.pow(1.15, 3)) / 6) * 60_000, 3);
  });

  it('stops at full housing and when auto-settle is off', () => {
    const s = createNewGame('x', T0);
    s.resources.food = 1e6;
    expect(advance(s, T0 + HOUR).events).toEqual([]); // housing 3, 3 peasants
    s.buildings.cottage = 1;
    apply(s, { type: 'peasants.autoSettle', on: false }, T0 + HOUR);
    expect(advance(s, T0 + 2 * HOUR).events).toEqual([]);
  });

  it('leaves a peasant idle when no slot is open', () => {
    const s = createNewGame('x', T0);
    s.buildings.cottage = 3; // housing 9; slots: 3 farmer + 3 woodcutter = 6
    s.resources.food = 1e6;
    advance(s, T0 + 10 * 60 * SECOND);
    expect(s.peasants.total).toBe(9);
    expect(s.peasants.jobs).toEqual({ farmer: 3, woodcutter: 3, miner: 0, 'silver-digger': 0 });
  });
});

describe('offline catch-up (GDD §5.2)', () => {
  it('counts at most the 12 h cap and reports the rest', () => {
    const s = createNewGame('x', T0);
    const away = 14 * HOUR + 20 * 60 * SECOND;
    const summary = catchUpNow(s, T0 + away);
    expect(summary.away).toBe(away);
    expect(summary.counted).toBe(12 * HOUR);
    expect(summary.capped).toBe(true);
    // 12 h of 6 food/min, nothing settles (housing is full).
    expect(summary.resources.food).toBeCloseTo(6 * 60 * 12, 6);
    expect(s.time).toBe(T0 + away);
    expect(s.meta.lastSeen).toBe(T0 + away);
  });

  it('a Bell Tower extends the cap', () => {
    const s = createNewGame('x', T0);
    s.cycle.age = 'keep';
    s.buildings['bell-tower'] = 3;
    expect(catchUpNow(s, T0 + 20 * HOUR).counted).toBe(15 * HOUR);
  });

  it('summarizes peasants settled', () => {
    const s = midGame();
    const summary = catchUpNow(s, T0 + 2 * HOUR);
    expect(summary.peasantsSettled).toBe(summary.events.length);
    expect(summary.peasantsSettled).toBeGreaterThan(0);
  });
});

describe('backward clock (D21)', () => {
  it('counts no time, changes nothing, and resets lastSeen', () => {
    const s = createNewGame('x', T0);
    catchUpNow(s, T0 + HOUR);
    const before = structuredClone(s);
    const summary = catchUpNow(s, T0 + 10 * 60 * SECOND); // clock moved back 50 min
    expect(summary.backwardClock).toBe(true);
    expect(summary.away).toBe(0);
    expect(summary.counted).toBe(0);
    expect(s.resources).toEqual(before.resources);
    expect(s.meta.lastSeen).toBe(T0 + 10 * 60 * SECOND);
  });

  it('does not freeze play: production continues from the new clock at once', () => {
    const s = createNewGame('x', T0);
    catchUpNow(s, T0 + HOUR);
    catchUpNow(s, T0); // back an hour
    const food = s.resources.food;
    advance(s, T0 + 60 * SECOND);
    expect(s.resources.food - food).toBeCloseTo(6, 9); // one minute at 6/min
  });
});

describe('determinism', () => {
  const play = (): string => {
    const s = createNewGame('det-seed', T0);
    const script: [number, Parameters<typeof apply>[1]][] = [
      [60, { type: 'build.buy', building: 'cottage', count: 1 }],
      [300, { type: 'build.buy', building: 'farm', count: 1 }],
      [900, { type: 'build.buy', building: 'mine', count: 'max' }],
      [1200, { type: 'peasants.fill', job: 'miner' }],
      [3600, { type: 'build.upgrade', building: 'mill' }],
    ];
    for (const [sec, cmd] of script) {
      advance(s, T0 + sec * SECOND);
      apply(s, cmd, T0 + sec * SECOND);
    }
    catchUpNow(s, T0 + 8 * HOUR);
    return JSON.stringify(s);
  };

  it('the same seed and commands give a byte-identical state', () => {
    expect(play()).toBe(play());
  });
});
