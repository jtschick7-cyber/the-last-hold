// Plan T10.2 (GDD §7.12, D408–D425, OUT-2b): the Orders constants exist once, with the §7.12 values.
// The six locked keys change only through a decisions row the owner approves (plan §0.6, D418); the
// rest are tunable, and the weights, thresholds, chunk and cap are sketches (T10.17, T10.18).
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { ORDER_IDS, ORDER_SOURCES } from '../../src/content/orders';
import { flattenBalance } from './flatten-balance';

const all = flattenBalance(balance);
const value = (key: string): unknown => all.get(key)?.value;
const LOCKED = [
  'orders.seatsStart',
  'orders.seatsMax',
  'orders.thirdSeatTopOrders',
  'orders.levels',
  'orders.opposed',
  'orders.perkCeiling',
];

describe('GDD §7.12 Orders constants', () => {
  it('the locked keys start at the §7.12 values', () => {
    expect(value('orders.seatsStart')).toBe(2);
    expect(value('orders.seatsMax')).toBe(3);
    expect(value('orders.thirdSeatTopOrders')).toBe(2);
    expect(value('orders.levels')).toBe(4);
    expect(value('orders.opposed')).toEqual(['moot', 'quenchers']);
    expect(value('orders.perkCeiling')).toBe(0.2);
  });

  it('the tunable keys start at the §7.12 values', () => {
    expect(value('orders.standing.moot')).toEqual({ contract: 1 });
    expect(value('orders.standing.greyWives')).toEqual({ brew: 1, experiment: 3, property: 10 });
    expect(value('orders.standing.bellWatchers')).toEqual({ document: 5, letter: 5, name: 10 });
    expect(value('orders.standing.quenchers')).toEqual({ kozlyContract: 2, delveFloor: 1 });
    expect(value('orders.delveWindow')).toBe(7 * 24 * 3600);
    expect(value('orders.delveWeeklyCap')).toBe(20);
    expect(value('orders.triumphantChunk')).toBe(25);
    expect(value('orders.levelThresholds')).toEqual({
      moot: [5, 40, 100, 200],
      greyWives: [10, 70, 180, 330],
      bellWatchers: [5, 50, 120, 250],
      quenchers: [10, 40, 100, 180],
    });
    expect(value('orders.backfillCapLevel')).toBe(1);
    expect(value('orders.swapCooldown')).toBe(24 * 3600);
    expect(value('orders.perk.moot.foodStep')).toBe(0.03);
    expect(value('orders.perk.greyWives.timeStep')).toBe(0.04);
    expect(value('orders.perk.bellWatchers.clueStep')).toBe(0.04);
    expect(value('orders.perk.quenchers.threatStep')).toBe(0.03);
  });

  it('locks exactly the six plan §0.6 keys and nothing else under orders.*', () => {
    const orders = [...all.keys()].filter((k) => k.startsWith('orders.'));
    expect(orders.filter((k) => all.get(k)?.locked).sort()).toEqual([...LOCKED].sort());
    expect(orders).toHaveLength(LOCKED.length + 14);
  });

  it('every perk step times the top level stays inside the locked perk ceiling (D418)', () => {
    const ceiling = balance.orders.perkCeiling.value;
    const levels = balance.orders.levels.value;
    const steps = [
      balance.orders.perk.moot.foodStep.value,
      balance.orders.perk.greyWives.timeStep.value,
      balance.orders.perk.bellWatchers.clueStep.value,
      balance.orders.perk.quenchers.threatStep.value,
    ];
    for (const step of steps) expect(step * levels).toBeLessThanOrEqual(ceiling + 1e-12);
  });

  it('has a weight for every source and one threshold per level, rising, for every Order', () => {
    for (const id of ORDER_IDS) {
      const weights = balance.orders.standing[id].value as Record<string, number>;
      expect(Object.keys(weights).sort()).toEqual([...ORDER_SOURCES[id]].sort());
      const t = balance.orders.levelThresholds.value[id];
      expect(t).toHaveLength(balance.orders.levels.value);
      expect(t.every((x, i) => i === 0 || x > (t[i - 1] ?? 0))).toBe(true);
    }
  });

  it('the opposed pair is two Orders that exist', () => {
    for (const id of balance.orders.opposed.value) expect(ORDER_IDS).toContain(id);
  });
});
