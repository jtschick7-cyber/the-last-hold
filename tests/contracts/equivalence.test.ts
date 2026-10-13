// Technical design §6.2 / GDD §5.2 acceptance test, extended for v0.2: twelve hours
// of live play in 1 s ticks and one 12 h jump must end in the same state, even
// with contracts finishing, hunters recovering, and the board refilling.
import { describe, expect, it } from 'vitest';
import { advance } from '../../src/core/sim';
import { catchUpNow } from '../../src/core/sim';
import { compareStates } from '../determinism/compare-states';
import { HOUR, T0, keepRich, run } from './helpers';

const scenario = (seed: string) => {
  const s = keepRich(seed);
  s.board.open = [];
  s.board.open.push(
    {
      id: 'a',
      village: 'velkvik',
      monster: 'nix',
      tier: 5,
      location: 'river',
      arrivedAt: T0,
      revealed: 3,
    },
    {
      id: 'b',
      village: 'dubno-ford',
      monster: 'kikimora',
      tier: 1,
      location: 'field',
      arrivedAt: T0,
      revealed: 3,
    },
  );
  expect(
    run(s, { type: 'contract.launch', contract: 'a', party: ['halvar', 'zora', 'ostap'] }).ok,
  ).toBe(true);
  expect(run(s, { type: 'contract.launch', contract: 'b', party: ['bjarna'] }).ok).toBe(true);
  return s;
};

describe('live ticks equal one jump', () => {
  it.each(['eq1', 'eq2', 'eq3'])('with contracts and recoveries (seed %s)', (seed) => {
    const ticked = scenario(seed);
    for (let t = T0 + 1000; t <= T0 + 12 * HOUR; t += 1000) advance(ticked, t);
    const jumped = scenario(seed);
    advance(jumped, T0 + 12 * HOUR);
    expect(jumped.results.length).toBeGreaterThanOrEqual(2);
    expect(jumped.board.open.length).toBeGreaterThan(0);
    expect(compareStates(ticked, jumped)).toEqual([]);
  });

  it('and offline catch-up in 60 s chunks matches the jump', () => {
    const chunked = scenario('eq-chunk');
    catchUpNow(chunked, T0 + 12 * HOUR);
    const jumped = scenario('eq-chunk');
    advance(jumped, T0 + 12 * HOUR);
    expect(compareStates(chunked, jumped)).toEqual([]);
  });
});
