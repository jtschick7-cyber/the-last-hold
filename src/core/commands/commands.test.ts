// Plan T1.12: commands do what GDD §5.1 says, and a refused command never
// changes state.
import { describe, expect, it } from 'vitest';
import type { GameState } from '../state/game-state';
import { createNewGame } from '../state/new-game';
import { apply } from './apply';
import type { Command } from './types';

const game = (): GameState => createNewGame('t', 0);
const rich = (): GameState => {
  const s = game();
  s.resources = { food: 1e9, wood: 1e9, iron: 1e9, silver: 1e9 };
  return s;
};
const run = (s: GameState, cmd: Command) => apply(s, cmd, 0);

describe('build.buy', () => {
  it('buys one Farm for 46 wood and counts it', () => {
    const s = game();
    s.resources.wood = 100;
    expect(run(s, { type: 'build.buy', building: 'farm', count: 1 })).toEqual({ ok: true });
    expect(s.buildings.farm).toBe(2);
    expect(s.resources.wood).toBeCloseTo(54, 10);
    expect(s.stats.buildingsBought).toBe(1);
  });

  it('buys ten at once, priced as a geometric series', () => {
    const s = rich();
    run(s, { type: 'build.buy', building: 'cottage', count: 10 });
    expect(s.buildings.cottage).toBe(10);
    expect(1e9 - s.resources.wood).toBeCloseTo((30 * (Math.pow(1.15, 10) - 1)) / 0.15, 6);
  });

  it('Max buys exactly what is affordable', () => {
    const s = game();
    s.resources = { food: 1000, wood: 200, iron: 0, silver: 0 };
    run(s, { type: 'build.buy', building: 'cottage', count: 'max' });
    // 30 + 34.5 + 39.675 + 45.626 = 149.8 wood; a 5th (52.47 more) would need 202.3.
    expect(s.buildings.cottage).toBe(4);
    expect(s.resources.wood).toBeCloseTo(200 - (30 * (Math.pow(1.15, 4) - 1)) / 0.15, 8);
  });
});

describe('build.upgrade', () => {
  it('raises a level building by one', () => {
    const s = rich();
    expect(run(s, { type: 'build.upgrade', building: 'mill' })).toEqual({ ok: true });
    expect(s.buildings.mill).toBe(1);
    expect(1e9 - s.resources.wood).toBe(120);
  });

  it('allows higher levels after the Keep', () => {
    const s = rich();
    s.buildings.mill = 5;
    expect(run(s, { type: 'build.upgrade', building: 'mill' }).ok).toBe(false);
    s.cycle.age = 'keep';
    expect(run(s, { type: 'build.upgrade', building: 'mill' }).ok).toBe(true);
  });
});

describe('peasants', () => {
  it('moves peasants between idle and jobs', () => {
    const s = game();
    s.peasants.total = 5; // 2 idle
    expect(run(s, { type: 'peasants.add', job: 'farmer' }).ok).toBe(true);
    expect(s.peasants.jobs.farmer).toBe(2);
    expect(run(s, { type: 'peasants.remove', job: 'woodcutter' }).ok).toBe(true);
    expect(s.peasants.jobs.woodcutter).toBe(1);
    expect(run(s, { type: 'peasants.fill', job: 'woodcutter' }).ok).toBe(true);
    expect(s.peasants.jobs.woodcutter).toBe(3); // 2 idle, 2 free slots
  });

  it('sets auto-settle and the priority order', () => {
    const s = game();
    run(s, { type: 'peasants.autoSettle', on: false });
    expect(s.peasants.autoSettle).toBe(false);
    run(s, {
      type: 'peasants.priority',
      order: ['miner', 'farmer', 'woodcutter', 'silver-digger'],
    });
    expect(s.peasants.priority[0]).toBe('miner');
  });
});

describe('age.up (GDD §5.1.3)', () => {
  const ready = (): GameState => {
    const s = game();
    s.resources = { food: 12_000, wood: 9_000, iron: 4_000, silver: 250 };
    s.peasants.total = 10;
    s.buildings.mill = 3;
    s.buildings.smithy = 1;
    return s;
  };

  it('becomes a Keep and pays exactly the cost', () => {
    const s = ready();
    expect(run(s, { type: 'age.up' })).toEqual({ ok: true });
    expect(s.cycle.age).toBe('keep');
    expect(s.resources).toEqual({ food: 0, wood: 0, iron: 0, silver: 0 });
  });

  it('then the Bell Tower can be built', () => {
    const s = ready();
    s.resources.silver += 1e6;
    s.resources.wood += 1e6;
    s.resources.iron += 1e6;
    expect(run(s, { type: 'build.upgrade', building: 'bell-tower' }).ok).toBe(false);
    run(s, { type: 'age.up' });
    expect(run(s, { type: 'build.upgrade', building: 'bell-tower' }).ok).toBe(true);
  });

  it('names what is missing', () => {
    const s = ready();
    s.buildings.mill = 2;
    const r = run(s, { type: 'age.up' });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toContain('Mill level 2/3');
  });
});

describe('settings.set', () => {
  it('changes only valid settings', () => {
    const s = game();
    expect(run(s, { type: 'settings.set', patch: { rateUnit: 'hour', theme: 'light' } }).ok).toBe(
      true,
    );
    expect(s.settings.rateUnit).toBe('hour');
    expect(s.settings.theme).toBe('light');
  });
});

describe('refused commands never change state', () => {
  const cases: [string, () => GameState, Command][] = [
    ['unaffordable buy', game, { type: 'build.buy', building: 'mine', count: 1 }],
    ['unaffordable ×10', game, { type: 'build.buy', building: 'farm', count: 10 }],
    ['Max with nothing affordable', game, { type: 'build.buy', building: 'mine', count: 'max' }],
    ['zero copies', rich, { type: 'build.buy', building: 'farm', count: 0 }],
    ['fractional copies', rich, { type: 'build.buy', building: 'farm', count: 1.5 }],
    [
      'a third Silver Seam',
      () => {
        const s = rich();
        s.buildings['silver-seam'] = 2;
        return s;
      },
      { type: 'build.buy', building: 'silver-seam', count: 1 },
    ],
    ['buying a level building', rich, { type: 'build.buy', building: 'mill', count: 1 }],
    ['upgrading a count building', rich, { type: 'build.upgrade', building: 'farm' }],
    ['upgrading the Hearth Hall', rich, { type: 'build.upgrade', building: 'hearth-hall' }],
    ['Bell Tower in Hamlet', rich, { type: 'build.upgrade', building: 'bell-tower' }],
    [
      'Smithy past level 3 in Hamlet',
      () => {
        const s = rich();
        s.buildings.smithy = 3;
        return s;
      },
      { type: 'build.upgrade', building: 'smithy' },
    ],
    ['unaffordable upgrade', game, { type: 'build.upgrade', building: 'mill' }],
    ['unknown building', rich, { type: 'build.buy', building: 'tower' as never, count: 1 }],
    ['add with no idle peasants', game, { type: 'peasants.add', job: 'farmer' }],
    [
      'add with no free slot',
      () => {
        const s = game();
        s.peasants.total = 4;
        return s;
      },
      { type: 'peasants.add', job: 'miner' },
    ],
    ['remove from an empty job', game, { type: 'peasants.remove', job: 'miner' }],
    ['fill with nothing to move', game, { type: 'peasants.fill', job: 'farmer' }],
    ['unknown job', game, { type: 'peasants.add', job: 'baker' as never }],
    [
      'priority missing a job',
      game,
      { type: 'peasants.priority', order: ['farmer', 'miner', 'woodcutter', 'farmer'] },
    ],
    ['auto-settle not a boolean', game, { type: 'peasants.autoSettle', on: 'yes' as never }],
    ['age-up without requirements', rich, { type: 'age.up' }],
    [
      'age-up past the last Age',
      () => {
        const s = rich();
        s.cycle.age = 'keep';
        return s;
      },
      { type: 'age.up' },
    ],
    ['unknown setting', game, { type: 'settings.set', patch: { volume: 3 } as never }],
    ['invalid setting value', game, { type: 'settings.set', patch: { theme: 'neon' } as never }],
    [
      'half-valid settings patch',
      game,
      { type: 'settings.set', patch: { rateUnit: 'hour', theme: 'neon' } as never },
    ],
    ['unknown command', game, { type: 'cheat.gold' } as never],
  ];

  it.each(cases)('%s', (_, make, cmd) => {
    const s = make();
    const before = structuredClone(s);
    const r = run(s, cmd);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason.length).toBeGreaterThan(0);
    expect(s).toEqual(before);
  });
});
