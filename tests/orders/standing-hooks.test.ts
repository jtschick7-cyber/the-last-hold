// Plan T10.3 (GDD §5.13.2, D410, D418): standing hooks for contracts, Triumphant stands and Delve
// floors. Standing is derived (start + counts × weights + Triumphant stands × chunk); each source adds
// exactly its weight once, inside `advance` too; standing and level never drop.
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { delveRewards } from '../../src/content/delves/rewards';
import { ORDER_IDS, ORDER_SOURCES, type OrderId } from '../../src/content/orders';
import type { HunterId } from '../../src/content/hunters';
import { advance } from '../../src/core/sim';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import {
  levelOfStanding,
  orderLevel,
  orderStanding,
  ordersContractWon,
  ordersDelveFloor,
  ordersTriumphantStand,
  raiseLevels,
  standingExplained,
} from '../../src/core/systems/orders';
import { HOUR, keepRich, run, T0 } from '../contracts/helpers';
import { cmd, PARTY, playRun, strongKeep } from '../delves/helpers';

const WEIGHTS = balance.orders.standing;
const CHUNK = balance.orders.triumphantChunk.value;
const standings = (s: GameState): Record<OrderId, number> =>
  Object.fromEntries(ORDER_IDS.map((id) => [id, orderStanding(s, id)])) as Record<OrderId, number>;

describe('standing is derived from start, counts and Triumphant stands', () => {
  it('equals start + Σ count × weight + Triumphant stands × chunk, and the breakdown adds up', () => {
    const s = createNewGame('derive', T0);
    s.orders.start.greyWives = 30;
    s.orders.counts.greyWives = { brew: 4, experiment: 2, property: 3 };
    s.orders.triumphant = 2;
    const w = WEIGHTS.greyWives.value;
    const expected = 30 + 4 * w.brew + 2 * w.experiment + 3 * w.property + 2 * CHUNK;
    const e = standingExplained(s, 'greyWives');
    expect(e.value).toBe(expected);
    expect(e.breakdown.value).toBe(expected);
    expect(e.breakdown.children?.reduce((n, c) => n + c.value, 0)).toBe(expected);
    expect(e.breakdown.children?.[0]?.label).toBe('Brought from before the Orders');
    expect(orderStanding(s, 'moot')).toBe(2 * CHUNK); // every Order gets the chunk
  });

  it('has a source line for every source of every Order', () => {
    const s = createNewGame('lines', T0);
    for (const id of ORDER_IDS)
      expect(standingExplained(s, id).breakdown.children).toHaveLength(
        ORDER_SOURCES[id].length + 1,
      );
  });

  it('gives a level at each threshold, no sooner', () => {
    for (const id of ORDER_IDS) {
      const t = balance.orders.levelThresholds.value[id];
      expect(levelOfStanding(id, 0)).toBe(0);
      t.forEach((x, i) => {
        expect(levelOfStanding(id, x - 1)).toBe(i);
        expect(levelOfStanding(id, x)).toBe(i + 1);
      });
    }
  });
});

describe('a contract won (the Moot, and the Quenchers for Kozly Hollow)', () => {
  const fight = (s: GameState, village: string, id: string): void => {
    s.board.open.push({
      id,
      village: village as 'mirograd',
      monster: 'kikimora',
      tier: 1,
      location: 'field',
      arrivedAt: s.time,
      revealed: 3,
    });
    const party: HunterId[] = ['zora', 'halvar', 'ostap'];
    expect(run(s, { type: 'contract.launch', contract: id, party }).ok).toBe(true);
  };
  const strong = (seed: string): GameState => {
    const s = keepRich(seed);
    for (const id of ['halvar', 'zora', 'ostap'] as const) {
      const h = s.hunters[id];
      if (h) h.level = 12;
    }
    return s;
  };

  it('adds the weight once to the Moot for any village, and to the Quenchers for Kozly Hollow only', () => {
    const s = strong('won-kozly');
    fight(s, 'kozly-hollow', 'k1');
    advance(s, s.time + 24 * HOUR);
    fight(s, 'mirograd', 'm1');
    advance(s, s.time + 24 * HOUR);
    expect(s.stats.contractsWon).toBe(2);
    expect(s.orders.counts.moot.contract).toBe(2);
    expect(s.orders.counts.quenchers.kozlyContract).toBe(1);
    expect(orderStanding(s, 'moot')).toBe(2 * WEIGHTS.moot.value.contract);
    expect(orderStanding(s, 'quenchers')).toBe(WEIGHTS.quenchers.value.kozlyContract);
    expect(orderStanding(s, 'greyWives')).toBe(0);
  });

  it('counts a contract that finishes inside a long catch-up exactly once, as many short steps do', () => {
    const one = strong('catchup');
    const many = strong('catchup');
    fight(one, 'kozly-hollow', 'c1');
    fight(many, 'kozly-hollow', 'c1');
    advance(one, one.time + 30 * HOUR);
    for (let h = 1; h <= 30; h++) advance(many, T0 + h * HOUR);
    expect(one.orders.counts).toEqual(many.orders.counts);
    expect(one.orders.counts.moot.contract).toBe(one.stats.contractsWon);
    expect(one.stats.contractsWon).toBe(1);
  });

  it('adds nothing for a lost contract: the Moot count always equals the contracts won', () => {
    for (let n = 0; n < 6; n++) {
      const s = keepRich(`lost-${n}`);
      s.board.open.push({
        id: 'hard',
        village: 'kozly-hollow',
        monster: 'draugr',
        tier: 4,
        location: 'barrow',
        arrivedAt: s.time,
        revealed: 3,
      });
      run(s, {
        type: 'contract.launch',
        contract: 'hard',
        party: ['sigrun', 'toma'],
        confirmReckless: true,
      });
      advance(s, s.time + 48 * HOUR);
      expect(s.orders.counts.moot.contract).toBe(s.stats.contractsWon);
      expect(s.orders.counts.quenchers.kozlyContract).toBe(s.stats.contractsWon);
    }
  });
});

const SIX = ['halvar', 'zora', 'ostap', 'bjarna', 'vesna', 'radek'] as const;
/** A Bastion hold whose six hunters are all at `level`, which makes its Last Stand (as stand-story.test.ts). */
const standAt = (level: number, seed: string): GameState => {
  const s = keepRich(seed);
  s.cycle.age = 'bastion';
  s.time = T0;
  for (const h of Object.values(s.hunters)) if (h) h.level = level;
  s.buildings.walls = 10; // defenses carry a strong party to Triumphant (D194)
  s.buildings.watchtower = 10;
  const party = level > 1 ? [...SIX] : ['halvar' as const];
  expect(run(s, { type: 'stand.make', party, prep: { oils: {}, potions: {} } }).ok).toBe(true);
  return s;
};

describe('a Triumphant stand adds the chunk to all four Orders', () => {
  it('adds the chunk to every Order, opened or not, and a Broken stand adds none', () => {
    const s = createNewGame('triumph', T0);
    const before = standings(s);
    ordersTriumphantStand(s);
    for (const id of ORDER_IDS) expect(orderStanding(s, id)).toBe(before[id] + CHUNK);
    expect(s.orders.triumphant).toBe(1);
    expect(s.orders.opened).toEqual({});
  });

  it('is called by the stand command only for the Triumphant band', () => {
    const win = standAt(20, 'orders-triumphant');
    expect(win.cycles.find((c) => c.stand)?.stand?.band).toBe('triumphant');
    expect(win.orders.triumphant).toBe(1);
    const broken = standAt(1, 'orders-broken');
    expect(broken.cycles.find((c) => c.stand)?.stand?.band).toBe('broken');
    expect(broken.orders.triumphant).toBe(0);
  });
});

describe('Delve floors (a floor counts only if its result paid at least 1 Riftglass)', () => {
  const cap = balance.orders.delveWeeklyCap.value;
  const windowMs = balance.orders.delveWindow.value * 1000;

  it('adds nothing for a floor that paid nothing', () => {
    const s = createNewGame('floor-0', T0);
    expect(ordersDelveFloor(s, 0, T0)).toEqual([]);
    expect(s.orders.counts.quenchers.delveFloor).toBe(0);
    expect(s.orders.delveWindow).toBeNull();
  });

  it('starts a window at the first counted floor, and the cap holds across it', () => {
    const s = createNewGame('window', T0);
    for (let i = 0; i < cap + 5; i++) ordersDelveFloor(s, 1, T0 + i * 1000);
    expect(s.orders.counts.quenchers.delveFloor).toBe(cap);
    expect(s.orders.delveWindow).toEqual({ start: expect.any(Number), used: cap });
    expect(orderStanding(s, 'quenchers')).toBe(cap * WEIGHTS.quenchers.value.delveFloor);
  });

  it('starts a new window once the old one has lasted `orders.delveWindow`', () => {
    const s = createNewGame('window-2', T0);
    for (let i = 0; i < cap; i++) ordersDelveFloor(s, 1, T0);
    const first = s.orders.delveWindow?.start ?? -1;
    ordersDelveFloor(s, 1, T0 + windowMs - 1); // still the same window, still capped
    expect(s.orders.counts.quenchers.delveFloor).toBe(cap);
    ordersDelveFloor(s, 1, T0 + windowMs); // a new window
    expect(s.orders.counts.quenchers.delveFloor).toBe(cap + 1);
    expect(s.orders.delveWindow).toEqual({ start: first + windowMs, used: 1 });
  });

  it('a real run adds one count per floor that paid, and never more than the cap', () => {
    const s = strongKeep('delve-orders');
    expect(cmd(s, { type: 'delve.start', party: PARTY }).ok).toBe(true);
    const before = s.delve.riftglass;
    playRun(s);
    const counted = s.orders.counts.quenchers.delveFloor ?? 0;
    expect(s.delve.riftglass).toBeGreaterThan(before);
    expect(counted).toBeGreaterThan(0);
    expect(counted).toBeLessThanOrEqual(cap);
    expect(s.orders.delveWindow?.used).toBe(counted * WEIGHTS.quenchers.value.delveFloor);
  });

  it('a run past its allowance, or with Cold Comfort, adds nothing', () => {
    const empty = strongKeep('delve-empty');
    empty.delve.allowance = 0;
    expect(cmd(empty, { type: 'delve.start', party: PARTY }).ok).toBe(true);
    playRun(empty);
    expect(empty.orders.counts.quenchers.delveFloor).toBe(0);

    const cold = strongKeep('delve-cold');
    expect(cmd(cold, { type: 'delve.start', party: PARTY }).ok).toBe(true);
    cold.delve.run?.blessings.push('cold-comfort');
    const glass = cold.delve.riftglass;
    playRun(cold);
    expect(cold.delve.riftglass).toBe(glass);
    expect(cold.orders.counts.quenchers.delveFloor).toBe(0);
  });

  it('is registered as a Delve reward with an idle source (D20, D271)', () => {
    const r = delveRewards.find((x) => x.id === 'orders-standing:quenchers');
    expect(r?.idleSource).toMatch(/Kozly Hollow/);
  });
});

describe('standing and level never drop', () => {
  it('keeps the highest level reached even if a weight is lowered afterwards', () => {
    const s = createNewGame('never-drop', T0);
    s.orders.counts.moot.contract = balance.orders.levelThresholds.value.moot[1] ?? 0;
    expect(raiseLevels(s)).toEqual(['moot']);
    expect(orderLevel(s, 'moot')).toBe(2);
    s.orders.counts.moot.contract = 0; // as if the weight had been tuned down to nothing
    expect(orderStanding(s, 'moot')).toBe(0);
    expect(orderLevel(s, 'moot')).toBe(2);
    expect(s.orders.levelHigh.moot).toBe(2);
    expect(raiseLevels(s)).toEqual([]);
  });

  it('raises the level in the same call that adds the standing', () => {
    const s = createNewGame('same-call', T0);
    const need = balance.orders.levelThresholds.value.moot[0] ?? 0;
    s.orders.counts.moot.contract = need - 1;
    expect(s.orders.levelHigh.moot).toBe(0);
    expect(ordersContractWon(s, 'mirograd')).toEqual(['moot']);
    expect(s.orders.levelHigh.moot).toBe(1);
  });
});
