// Plan T1.13: best payback (GDD §5.1.2), including mixed-cost and housing cases.
import { describe, expect, it } from 'vitest';
import type { GameState } from '../state/game-state';
import { createNewGame } from '../state/new-game';
import { bestBuy, bundleValue, deltaRateValue, payback } from './valuation';

const game = (): GameState => createNewGame('t', 0);

describe('value(bundle) with weights food 1, wood 1.5, iron 3, silver 12', () => {
  it('weighs each resource', () => {
    expect(bundleValue({ food: 10, wood: 30, iron: 0, silver: 0 })).toBe(55);
    expect(bundleValue({ food: 0, wood: 0, iron: 1, silver: 1 })).toBe(15);
  });
});

describe('payback', () => {
  it('mixed cost: Mill L1 costs 120 wood + 40 iron = 300; +25% of 6 food = 1.5', () => {
    const p = payback(game(), 'mill');
    expect(p.breakdown.children?.[0]?.value).toBe(300);
    expect(p.breakdown.children?.[1]?.value).toBeCloseTo(1.5, 12);
    expect(p.value).toBeCloseTo(200, 10);
  });

  it('housing: a Cottage adds 2 peasants to the best open slots', () => {
    // Start: 1/3 farmers, 2/3 woodcutters; both jobs are worth 6 per worker.
    expect(deltaRateValue(game(), 'cottage')).toBeCloseTo(12, 12);
    expect(payback(game(), 'cottage').value).toBeCloseTo(55 / 12, 12);
  });

  it('housing with only one open slot counts one peasant', () => {
    const s = game();
    s.peasants.total = 5;
    s.peasants.jobs = { farmer: 3, woodcutter: 2, miner: 0, 'silver-digger': 0 };
    expect(deltaRateValue(s, 'cottage')).toBeCloseTo(6, 12);
  });

  it('housing with no open slot is worth nothing', () => {
    const s = game();
    s.peasants.total = 6;
    s.peasants.jobs = { farmer: 3, woodcutter: 3, miner: 0, 'silver-digger': 0 };
    expect(deltaRateValue(s, 'cottage')).toBe(0);
    expect(payback(s, 'cottage').value).toBe(Number.POSITIVE_INFINITY);
  });

  it('housing values the better slot when bonuses differ', () => {
    const s = game();
    s.buildings.mill = 2; // a farmer is now worth 9, a woodcutter 6
    s.peasants.total = 5;
    s.peasants.jobs = { farmer: 2, woodcutter: 3, miner: 0, 'silver-digger': 0 };
    expect(deltaRateValue(s, 'cottage')).toBeCloseTo(9, 12);
  });

  it('slot buildings count only when idle peasants are waiting', () => {
    const s = game();
    expect(deltaRateValue(s, 'mine')).toBe(0);
    s.peasants.total = 8; // 6 working, 2 idle
    s.peasants.jobs = { farmer: 3, woodcutter: 3, miner: 0, 'silver-digger': 0 };
    s.buildings.mine = 0;
    expect(deltaRateValue(s, 'mine')).toBeCloseTo(12, 12); // 2 idle → 2 miners × 2 iron × 3
  });

  it('the Bell Tower adds no production', () => {
    const s = game();
    s.cycle.age = 'keep';
    expect(payback(s, 'bell-tower').value).toBe(Number.POSITIVE_INFINITY);
  });

  it('valuing never changes the state', () => {
    const s = game();
    const before = structuredClone(s);
    payback(s, 'cottage');
    payback(s, 'mill');
    bestBuy(s);
    expect(s).toEqual(before);
  });
});

describe('bestBuy (the ● hint)', () => {
  it('picks the lowest payback among affordable options', () => {
    const s = game();
    s.resources = { food: 1e6, wood: 1e6, iron: 1e6, silver: 0 };
    // Cottage 55/12 ≈ 4.6 beats Mill 200 and everything else.
    expect(bestBuy(s)).toBe('cottage');
  });

  it('skips what you cannot afford', () => {
    const s = game();
    s.resources = { food: 0, wood: 0, iron: 0, silver: 0 };
    expect(bestBuy(s)).toBeNull();
  });

  it('never marks something that adds nothing', () => {
    const s = game();
    s.peasants.total = 6;
    s.peasants.jobs = { farmer: 3, woodcutter: 3, miner: 0, 'silver-digger': 0 };
    s.resources = { food: 1e6, wood: 1e6, iron: 0, silver: 0 };
    // No open slots, no idle peasants, no iron for levels: nothing pays back.
    expect(bestBuy(s)).toBeNull();
  });
});
