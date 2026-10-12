// Plan T1.10–T1.11: every GDD §7.1–7.2 formula, checked with the GDD's numbers.
import { describe, expect, it } from 'vitest';
import type { Breakdown } from '../breakdown/breakdown';
import { createNewGame } from '../state/new-game';
import type { GameState } from '../state/game-state';
import { buildingCost, canAfford, maxAffordableCount } from './costs';
import { housing, idlePeasants, jobSlots } from './housing';
import { offlineCap } from './offline-cap';
import { productionRate } from './production';
import { settleCost } from './settle';

const game = (): GameState => createNewGame('t', 0);
const HOUR = 3600;

/** Every leaf in a breakdown, for checking that the explanation adds up. */
const keysIn = (b: Breakdown): string[] => [
  ...(b.key ? [b.key] : []),
  ...(b.children ?? []).flatMap(keysIn),
];

describe('housing and job slots (GDD §5.1.1)', () => {
  it('Hearth Hall houses 3; each Cottage adds 2', () => {
    const s = game();
    expect(housing(s).value).toBe(3);
    s.buildings.cottage = 2;
    expect(housing(s).value).toBe(7);
    expect(housing(s).breakdown.children?.map((c) => c.value)).toEqual([3, 4]);
  });

  it('Farm gives 3 farmer slots each; Mine 2 miner slots; Seam 1', () => {
    const s = game();
    expect(jobSlots(s, 'farmer').value).toBe(3);
    expect(jobSlots(s, 'woodcutter').value).toBe(3);
    expect(jobSlots(s, 'miner').value).toBe(0);
    s.buildings.mine = 2;
    s.buildings['silver-seam'] = 1;
    expect(jobSlots(s, 'miner').value).toBe(4);
    expect(jobSlots(s, 'silver-digger').value).toBe(1);
  });

  it('idle = total − workers', () => {
    const s = game();
    expect(idlePeasants(s)).toBe(0);
    s.peasants.total = 5;
    expect(idlePeasants(s)).toBe(2);
  });
});

describe('production (GDD §5.1.1, §5.0 buckets)', () => {
  it('the start makes 6 food and 8 wood per minute', () => {
    const s = game();
    expect(productionRate(s, 'food').value).toBe(6);
    expect(productionRate(s, 'wood').value).toBe(8);
    expect(productionRate(s, 'iron').value).toBe(0);
    // GDD §5.1.4: wood reaches 80 at 3.75 min.
    expect((80 - s.resources.wood) / productionRate(s, 'wood').value).toBe(3.75);
  });

  it('Mill adds +25% food per level in the building bucket', () => {
    const s = game();
    s.buildings.mill = 2;
    expect(productionRate(s, 'food').value).toBeCloseTo(6 * 1.5, 12);
    expect(keysIn(productionRate(s, 'food').breakdown)).toContain('mill.perLevel');
  });

  it('Sawpit +25% wood and Smithy +20% iron per level', () => {
    const s = game();
    s.buildings.sawpit = 1;
    s.buildings.smithy = 3;
    s.peasants.jobs.miner = 2;
    expect(productionRate(s, 'wood').value).toBeCloseTo(8 * 1.25, 12);
    expect(productionRate(s, 'iron').value).toBeCloseTo(2 * 2 * 1.6, 12);
  });

  it('Keep multiplies across buckets: building × age', () => {
    const s = game();
    s.buildings.mill = 2;
    s.cycle.age = 'keep';
    expect(productionRate(s, 'food').value).toBeCloseTo(6 * 1.5 * 1.5, 12);
    expect(keysIn(productionRate(s, 'food').breakdown)).toContain('age.keep.allProduction');
  });

  it('silver is 0.25/min per digger', () => {
    const s = game();
    s.peasants.jobs['silver-digger'] = 2;
    expect(productionRate(s, 'silver').value).toBe(0.5);
  });

  it("Keep's +50% doesn't change silver (T1.11, G1)", () => {
    const s = game();
    s.peasants.jobs['silver-digger'] = 2;
    const hamlet = productionRate(s, 'silver').value;
    s.cycle.age = 'keep';
    s.buildings.mill = 5;
    s.buildings.sawpit = 5;
    s.buildings.smithy = 3;
    expect(productionRate(s, 'silver').value).toBe(hamlet);
    expect(keysIn(productionRate(s, 'silver').breakdown)).not.toContain('age.keep.allProduction');
  });

  it('the breakdown value is the rate itself', () => {
    const s = game();
    s.buildings.mill = 3;
    s.cycle.age = 'keep';
    const r = productionRate(s, 'food');
    expect(r.breakdown.value).toBe(r.value);
  });
});

describe('building costs (GDD §5.1.2)', () => {
  it('the first Farm you buy is your 2nd: 40 × 1.15 = 46 wood', () => {
    expect(buildingCost(game(), 'farm').bundle.wood).toBeCloseTo(46, 10);
  });

  it('a first Cottage costs its base: 30 wood, 10 food', () => {
    const c = buildingCost(game(), 'cottage').bundle;
    expect(c).toEqual({ food: 10, wood: 30, iron: 0, silver: 0 });
  });

  it('×10 costs base × r^n × (r^k − 1)/(r − 1)', () => {
    const s = game();
    s.buildings.cottage = 3;
    const expected = 30 * Math.pow(1.15, 3) * ((Math.pow(1.15, 10) - 1) / 0.15);
    expect(buildingCost(s, 'cottage', 10).bundle.wood).toBeCloseTo(expected, 8);
  });

  it('level L costs base × 1.75^(L−1): Mill L1 120/40, L2 210/70', () => {
    const s = game();
    expect(buildingCost(s, 'mill').bundle).toMatchObject({ wood: 120, iron: 40 });
    s.buildings.mill = 1;
    expect(buildingCost(s, 'mill').bundle.wood).toBeCloseTo(210, 10);
    expect(buildingCost(s, 'mill').bundle.iron).toBeCloseTo(70, 10);
  });

  it('cost breakdowns name the growth key', () => {
    expect(keysIn(buildingCost(game(), 'farm').breakdown)).toContain('costGrowth.count');
    expect(keysIn(buildingCost(game(), 'mill').breakdown)).toContain('costGrowth.level');
  });

  it('Max is the smallest affordable k across resources', () => {
    const s = game();
    s.resources.wood = 1000;
    s.resources.food = 25; // Cottage: food 10 then 11.5 → only 2
    expect(maxAffordableCount(s, 'cottage')).toBe(2);
    s.resources.food = 1e6;
    const k = maxAffordableCount(s, 'cottage');
    expect(canAfford(s, buildingCost(s, 'cottage', k).bundle)).toBe(true);
    expect(canAfford(s, buildingCost(s, 'cottage', k + 1).bundle)).toBe(false);
  });

  it('Max never passes the 2-Seam limit', () => {
    const s = game();
    s.resources.wood = 1e9;
    s.resources.iron = 1e9;
    expect(maxAffordableCount(s, 'silver-seam')).toBe(2);
    s.buildings['silver-seam'] = 2;
    expect(maxAffordableCount(s, 'silver-seam')).toBe(0);
  });

  it('affordability uses exact values', () => {
    const s = game();
    s.resources.wood = 45.999;
    expect(canAfford(s, buildingCost(s, 'farm').bundle)).toBe(false);
    s.resources.wood = 46.000000001;
    expect(canAfford(s, buildingCost(s, 'farm').bundle)).toBe(true);
  });
});

describe('settle cost (GDD §5.1.1)', () => {
  it('is 20 × 1.15^P', () => {
    expect(settleCost(0).value).toBe(20);
    expect(settleCost(3).value).toBeCloseTo(20 * Math.pow(1.15, 3), 12);
    expect(settleCost(10).value).toBeCloseTo(20 * Math.pow(1.15, 10), 10);
  });
});

describe('offline cap (GDD §5.2)', () => {
  it('is 12 h, plus 1 h per Bell Tower level, never above 24 h', () => {
    const s = game();
    expect(offlineCap(s).value).toBe(12 * HOUR);
    s.buildings['bell-tower'] = 3;
    expect(offlineCap(s).value).toBe(15 * HOUR);
    s.buildings['bell-tower'] = 20; // impossible, but the ceiling must hold
    expect(offlineCap(s).value).toBe(24 * HOUR);
  });
});
