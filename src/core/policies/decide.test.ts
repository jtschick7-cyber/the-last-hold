// GDD §6.1 and D60: what the simulated player does at a check-in.
import { describe, expect, it } from 'vitest';
import { apply } from '../commands';
import type { GameState } from '../state/game-state';
import { createNewGame } from '../state/new-game';
import { decideCheckIn } from './decide';

const LONG = 1e12;
const game = (): GameState => createNewGame('t', 0);

const builds = (s: GameState, horizon = LONG): string[] =>
  decideCheckIn(s, horizon)
    .commands.filter((c) => c.type === 'build.buy' || c.type === 'build.upgrade')
    .map((c) => ('building' in c ? c.building : ''));

/** A hold where housing, job slots and peasants are all full. */
const full = (): GameState => {
  const s = game();
  s.buildings.cottage = 3; // housing 9
  s.buildings['woodcutters-camp'] = 2; // 6 woodcutter slots
  s.buildings.mine = 1;
  s.peasants.total = 9;
  s.peasants.jobs = { farmer: 3, woodcutter: 6, miner: 0, 'silver-digger': 0 };
  s.stats.buildingsBought = 5;
  return s;
};

describe('decideCheckIn', () => {
  it('never changes the state it is given, and its commands all apply', () => {
    const s = full();
    s.resources = { food: 5000, wood: 5000, iron: 500, silver: 0 };
    const before = JSON.stringify(s);
    const d = decideCheckIn(s, LONG);
    expect(JSON.stringify(s)).toBe(before);
    for (const c of d.commands) expect(apply(s, c, 0).ok).toBe(true);
    expect(d.purchases).toBeGreaterThan(0);
  });

  it('opens a fresh game with a Cottage (GDD §5.1.4)', () => {
    expect(builds(game())[0]).toBe('cottage');
  });

  it('saves for the first Mine after the first purchase', () => {
    const s = game();
    s.stats.buildingsBought = 1;
    s.buildings.cottage = 1;
    s.resources = { food: 60, wood: 70, iron: 0, silver: 0 };
    // A second Cottage is affordable, but it would dip into the Mine's wood.
    expect(builds(s)).toEqual([]);
    s.resources.wood = 80;
    expect(builds(s)[0]).toBe('mine');
  });

  it('staffs a new Mine by moving a worker when nobody is idle', () => {
    const s = full();
    const d = decideCheckIn(s, LONG);
    expect(d.commands.slice(0, 2)).toEqual([
      { type: 'peasants.remove', job: 'woodcutter' },
      { type: 'peasants.add', job: 'miner' },
    ]);
  });

  it('buys a Cottage and slots together for the bottleneck when both are full', () => {
    // Iron is the Age-up resource furthest from ready, so the pair is a Mine.
    const s = full();
    s.peasants.jobs = { farmer: 3, woodcutter: 5, miner: 1, 'silver-digger': 0 };
    s.resources = { food: 200, wood: 200, iron: 0, silver: 0 };
    expect(builds(s).slice(0, 2)).toEqual(['cottage', 'mine']);
  });

  it('saves for the Age-up once it is affordable within the horizon, with auto-settle off', () => {
    const s = full();
    s.buildings.mill = 3;
    s.buildings.smithy = 1;
    s.peasants.total = 10;
    s.peasants.jobs = { farmer: 3, woodcutter: 5, miner: 2, 'silver-digger': 0 };
    s.buildings['silver-seam'] = 2;
    s.peasants.jobs['silver-digger'] = 0;
    s.resources = { food: 11_000, wood: 9_000, iron: 4_000, silver: 300 };
    const d = decideCheckIn(s, LONG);
    expect(d.saving).toBe(true);
    expect(d.purchases).toBe(0);
    expect(d.commands).toContainEqual({ type: 'peasants.autoSettle', on: false });
    // With the full cost in hand, it ages up instead.
    s.resources.food = 12_000;
    const up = decideCheckIn(s, LONG);
    expect(up.agedUp).toBe(true);
    expect(up.commands).toContainEqual({ type: 'age.up' });
  });

  it('does not save when the Age-up is further away than the horizon', () => {
    const s = full();
    s.buildings.mill = 3;
    s.buildings.smithy = 1;
    s.peasants.total = 10;
    s.peasants.jobs = { farmer: 3, woodcutter: 5, miner: 2, 'silver-digger': 0 };
    s.resources = { food: 100, wood: 100, iron: 0, silver: 0 };
    expect(decideCheckIn(s, 60_000).saving).toBe(false);
  });
});
