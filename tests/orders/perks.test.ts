// Plan T10.7 (GDD §5.13.5, D411, D418): the four number perks. Each is its own factor, `1 − step ×
// level`, with its own breakdown line, and only while its Order is SEATED.
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { CONSUMABLE_IDS } from '../../src/content/consumables';
import type { OrderId } from '../../src/content/orders';
import { num } from '../../src/core/balance-access';
import { brewMs, experimentMs } from '../../src/core/alchemy/brewing';
import { apply } from '../../src/core/commands/apply';
import { provisions } from '../../src/core/contracts/rewards';
import { clueDuration } from '../../src/core/investigation/lodge';
import { loadEnvelope } from '../../src/core/save';
import { encodeSaveFile, makeEnvelope } from '../../src/core/save';
import { advance } from '../../src/core/sim/advance';
import { previewInputFor } from '../../src/core/stand/from-state';
import type { ContractInstance, GameState } from '../../src/core/state/game-state';
import { applyContractThreat, threatRate } from '../../src/core/threat/threat';
import { orderLevel } from '../../src/core/systems/orders';
import { perkCut, perkFactor, perkLines } from '../../src/core/systems/orders-perks';
import { HOUR, T0, keepRich, run } from '../contracts/helpers';

const P = balance.orders.perk;
const STEP: Record<OrderId, number> = {
  moot: P.moot.foodStep.value,
  greyWives: P.greyWives.timeStep.value,
  bellWatchers: P.bellWatchers.clueStep.value,
  quenchers: P.quenchers.threatStep.value,
};
const ALL: OrderId[] = ['moot', 'greyWives', 'bellWatchers', 'quenchers'];

/** A Keep with every Order open and at `level` (by the saved high-water level). */
const keep = (level: number, seated: OrderId[] = []): GameState => {
  const s = keepRich('perks');
  for (const id of ALL) {
    s.orders.opened[id] = { at: T0 };
    s.orders.levelHigh[id] = level;
  }
  s.orders.seats = seated;
  return s;
};
const contract: Pick<ContractInstance, 'monster'> = { monster: 'rusalka' };

describe('each factor is 1 − step × level, while seated', () => {
  it.each(ALL)('%s', (id) => {
    for (const level of [1, 2, 3, 4]) {
      const s = keep(level, [id]);
      expect(orderLevel(s, id)).toBe(level);
      expect(perkFactor(s, id)).toBe(1 - STEP[id] * level);
      expect(perkCut(s, id)).toBe(STEP[id] * level);
    }
  });

  it('is exactly 1 for an unseated Order, whatever its level', () => {
    for (const id of ALL) {
      expect(perkFactor(keep(4), id)).toBe(1);
      expect(perkLines(keep(4), id)).toEqual([]);
    }
  });

  it('never takes more than the locked ceiling at level 4', () => {
    for (const id of ALL)
      expect(STEP[id] * 4).toBeLessThanOrEqual(balance.orders.perkCeiling.value);
  });
});

describe('with no Order seated, every result equals what it was before Orders', () => {
  const fixtures = readdirSync(new URL('../saves/fixtures/', import.meta.url)).filter((f) =>
    f.endsWith('.json'),
  );
  const load = (file: string): GameState => {
    const r = loadEnvelope(
      JSON.parse(readFileSync(new URL(`../saves/fixtures/${file}`, import.meta.url), 'utf8')),
    );
    if (!r.ok) throw new Error(r.error);
    return r.value.state;
  };
  const numbers = (s: GameState): number[] => [
    provisions(s, 3, 2).value,
    threatRate(s).value,
    clueDuration(s, contract, 0).value,
    brewMs(s),
    experimentMs(s),
  ];

  it.each(fixtures)('%s: Orders at level 4 but unseated change nothing', (file) => {
    const plain = load(file);
    const unseated = load(file);
    for (const id of ALL) unseated.orders.levelHigh[id] = 4;
    expect(unseated.orders.seats).toEqual([]);
    expect(numbers(unseated)).toEqual(numbers(plain));
  });
});

describe('contract provisions (Thanes’ Moot)', () => {
  it('are cut by the seated factor, with their own breakdown line', () => {
    const none = provisions(keep(2), 3, 2);
    const seated = provisions(keep(2, ['moot']), 3, 2);
    expect(seated.value).toBe(none.value * (1 - 0.03 * 2));
    const lines = seated.breakdown.children?.map((c) => c.label) ?? [];
    expect(lines).toContain("Thanes' Moot, Friend: −6% food for provisions");
    expect(none.breakdown.children?.some((c) => c.label.startsWith("Thanes' Moot"))).toBe(false);
  });

  it('are paid at launch, so a launched contract keeps what it paid', () => {
    const s = keep(2, ['moot']);
    s.board.open = [
      {
        id: 'run1',
        village: 'dubno-ford',
        monster: 'kikimora',
        tier: 1,
        location: 'field',
        arrivedAt: T0,
        revealed: 3,
      },
    ];
    const food = s.resources.food;
    const due = provisions(s, 1, 1, ['sigrun']).value;
    expect(run(s, { type: 'contract.launch', contract: 'run1', party: ['sigrun'] }).ok).toBe(true);
    expect(s.resources.food).toBe(food - due);
    s.orders.seats = []; // unseating later refunds and charges nothing
    expect(s.resources.food).toBe(food - due);
  });
});

describe('brews and experiments (Grey Wives): fixed when queued', () => {
  const hut = (seated: OrderId[]): GameState => {
    const s = keep(2, seated);
    s.buildings['alchemists-hut'] = 1;
    for (const k of Object.keys(s.stores)) {
      s.stores[k as keyof typeof s.stores] = (CONSUMABLE_IDS as readonly string[]).includes(k)
        ? 0
        : 20;
    }
    return s;
  };
  const BREW = num('brew.time') * 1000;
  const cut = 1 - 0.04 * 2;

  it('a brew queued while seated takes the cut; one queued unseated does not', () => {
    const a = hut(['greyWives']);
    run(a, { type: 'brew.queue', item: 'grave-oil' });
    expect(a.queues.brewing[0]?.doneAt).toBe(a.time + BREW * cut);
    const b = hut([]);
    run(b, { type: 'brew.queue', item: 'grave-oil' });
    expect(b.queues.brewing[0]?.doneAt).toBe(b.time + BREW);
    expect(b.queues.brewing[0]).not.toHaveProperty('orderCut');
  });

  it('a seat change never alters a job already queued, running or waiting', () => {
    const s = hut(['greyWives']);
    run(s, { type: 'brew.queue', item: 'grave-oil' }); // running
    run(s, { type: 'brew.queue', item: 'grave-oil' }); // waiting for the one kettle
    run(s, { type: 'orders.setSeats', orders: [] });
    const first = s.queues.brewing[0]?.doneAt;
    expect(first).toBe(T0 + BREW * cut);
    run(s, { type: 'brew.queue', item: 'grave-oil' }); // queued unseated: no cut
    advance(s, (first ?? 0) + 1);
    const second = (first ?? 0) + BREW * cut;
    expect(s.queues.brewing[0]?.doneAt).toBe(second); // the waiting one kept its cut
    advance(s, second);
    expect(s.queues.brewing[0]?.doneAt).toBe(second + BREW); // the one queued unseated has none
  });

  it('an experiment is the same, and the stored cut survives a save round trip', () => {
    const s = hut(['greyWives']);
    run(s, { type: 'experiment.queue', a: 'yarrow', b: 'pitch' });
    expect(s.queues.brewing[0]?.orderCut).toBe(0.08);
    const r = loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))));
    if (!r.ok) throw new Error(r.error);
    expect(r.value.state.queues.brewing).toEqual(s.queues.brewing);
  });

  it('refuses a stored cut above the ceiling', () => {
    const s = hut(['greyWives']);
    run(s, { type: 'brew.queue', item: 'grave-oil' });
    const env = JSON.parse(encodeSaveFile(makeEnvelope(s, 0)));
    env.state.queues.brewing[0].orderCut = 0.5;
    expect(loadEnvelope(env).ok).toBe(false);
  });
});

describe('clues (Bell-Watchers): fixed as the clue starts', () => {
  const lodge = (seated: OrderId[]): GameState => {
    const s = keep(3, seated);
    s.buildings['hunters-lodge'] = 1;
    s.board.open = [
      {
        id: 'c1',
        village: 'dubno-ford',
        monster: 'rusalka',
        tier: 2,
        location: 'river',
        arrivedAt: T0,
        revealed: 0,
      },
    ];
    return s;
  };
  it('a clue takes the seated cut and shows its line', () => {
    const none = clueDuration(lodge([]), contract, 0);
    const seated = clueDuration(lodge(['bellWatchers']), contract, 0);
    expect(seated.value).toBe(Math.round(none.value * (1 - 0.04 * 3)));
    expect(seated.breakdown.children?.some((c) => c.label.startsWith('Bell-Watchers, Ally'))).toBe(
      true,
    );
  });

  it('a clue already running keeps its time when the seat changes', () => {
    const s = lodge(['bellWatchers']);
    expect(run(s, { type: 'investigate.assign', contract: 'c1' }).ok).toBe(true);
    const due = s.queues.investigation[0]?.nextClueAt;
    run(s, { type: 'orders.setSeats', orders: [] });
    expect(s.queues.investigation[0]?.nextClueAt).toBe(due);
    expect((due ?? 0) - s.time).toBe(clueDuration(lodge(['bellWatchers']), contract, 0).value);
  });
});

describe('the hourly Threat rate (Quenchers)', () => {
  const citadel = (seated: OrderId[]): GameState => {
    const s = keep(2, seated);
    s.cycle.age = 'citadel';
    return s;
  };

  it('takes the seated cut off the rate, with its line', () => {
    const none = threatRate(citadel([]));
    const seated = threatRate(citadel(['quenchers']));
    expect(none.value).toBeGreaterThan(0);
    expect(seated.value).toBe(none.value * (1 - 0.03 * 2));
    expect(
      seated.breakdown.children?.some((c) => c.label.startsWith('the Quenchers, Friend')),
    ).toBe(true);
  });

  it('touches only the hourly rate, not Threat from failed or completed contracts', () => {
    const a = citadel([]);
    const b = citadel(['quenchers']);
    for (const s of [a, b]) {
      s.threat = 10;
      applyContractThreat(s, 3, false);
      applyContractThreat(s, 2, true);
    }
    expect(b.threat).toBe(a.threat);
  });

  it('one long advance equals many short ones, with the Quenchers seated and a seat change inside', () => {
    const make = (): GameState => citadel(['quenchers']);
    const long = make();
    const short = make();
    const mid = T0 + 10 * HOUR;
    const end = T0 + 30 * HOUR;
    advance(long, mid);
    run(long, { type: 'orders.setSeats', orders: [] });
    advance(long, end);
    for (let t = T0 + HOUR; t <= mid; t += HOUR) advance(short, t);
    run(short, { type: 'orders.setSeats', orders: [] });
    for (let t = mid + HOUR; t <= end; t += HOUR) advance(short, t);
    expect(long.threat).toBeCloseTo(short.threat, 9);
    const seatedAll = make();
    const seatedSteps = make();
    advance(seatedAll, end);
    for (let t = T0 + HOUR; t <= end; t += HOUR) advance(seatedSteps, t);
    expect(seatedAll.threat).toBeCloseTo(seatedSteps.threat, 9);
    expect(seatedAll.threat).toBeLessThan(
      (() => {
        const n = citadel([]);
        advance(n, end);
        return n.threat;
      })(),
    );
  });

  it('the stand preview’s tomorrow estimate changes when a seat changes', () => {
    const before = previewInputFor(citadel([]), ['halvar'], { oils: {}, potions: {} }).threatPerDay;
    const s = citadel([]);
    expect(apply(s, { type: 'orders.seat', order: 'quenchers' }, T0).ok).toBe(true);
    const after = previewInputFor(s, ['halvar'], { oils: {}, potions: {} }).threatPerDay;
    expect(after).toBeLessThan(before);
    expect(after).toBe(before * (1 - 0.03 * 2));
  });
});
