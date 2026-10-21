// Plan T10.1 (technical design §5.2, §9.4, D410, D421, OUT-8): the v9 → v10 migration and the Orders
// guard. The fixture is the owner's real save of 2026-10-20 (v8-owner.json) carried forward through
// the shipped v8 → v9 migration and the events load path (scripts/make-v9-owner-fixture.ts): it is not
// a fresh export, because both exports sent on 2026-10-21 had `meta.debugUsed` true. v10.json is that
// save after this migration, not played (the played fixture comes at T10.16).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runFight } from '../../src/core/combat';
import { fightReplayDiffers, standReplayDiffers } from '../../src/core/replay-check';
import { seeded } from '../../src/core/rng';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import {
  backfillOrders,
  NOT_RECOVERED,
  PARTLY_RECOVERED,
} from '../../src/core/save/orders-backfill';
import { replayStand } from '../../src/core/stand/replay';
import { SCHEMA_VERSION, type GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { balance } from '../../src/content/balance';
import { ORDER_IDS } from '../../src/content/orders';

type Env = {
  schemaVersion: number;
  rulesVersion: number;
  savedAt: number;
  state: Record<string, unknown>;
};
const readFixture = (f: string): Env =>
  JSON.parse(readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8')) as Env;
const clone = (e: Env): Env => JSON.parse(JSON.stringify(e)) as Env;
const loadFull = (env: unknown) => {
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};
const roundTrip = (s: GameState): GameState =>
  loadFull(JSON.parse(encodeSaveFile(makeEnvelope(s, 0)))).state;

// Independent recount (typed access, written separately from the migration's plain-JSON readers),
// using the weights and thresholds in balance.ts (GDD §7.12).
const w = balance.orders.standing;
const THRESHOLD_1 = Object.fromEntries(
  ORDER_IDS.map((id) => [id, balance.orders.levelThresholds.value[id][0]]),
) as Record<(typeof ORDER_IDS)[number], number>;
const recount = (s: GameState) => {
  const chunk =
    s.cycles.filter((c) => c.stand?.band === 'triumphant').length *
    balance.orders.triumphantChunk.value;
  const properties = Object.values(s.book.properties).reduce((n, p) => n + p.length, 0);
  return {
    moot: s.stats.contractsWon * w.moot.value.contract + chunk,
    greyWives:
      s.book.tried.length * w.greyWives.value.experiment +
      properties * w.greyWives.value.property +
      chunk,
    bellWatchers:
      s.story.documents.length * w.bellWatchers.value.document +
      s.story.letters.length * w.bellWatchers.value.letter +
      s.story.names.length * w.bellWatchers.value.name +
      chunk,
    quenchers: (s.story.trust['kozly-hollow']?.won ?? 0) * w.quenchers.value.kozlyContract + chunk,
  };
};

describe('the v9 → v10 migration on the owner’s real save', () => {
  const old = readFixture('v9-owner.json');
  const before = old.state as unknown as GameState;
  const loaded = loadFull(readFixture('v9-owner.json'));
  const after = loaded.state;

  it('is a real v0.9-era save: schema 9, rules version 5, cycle 19, Bastion, 11 hunters', () => {
    expect(SCHEMA_VERSION).toBe(10);
    expect(old.schemaVersion).toBe(9);
    expect(old.rulesVersion).toBe(5);
    expect(before.cycle).toEqual({ number: 19, age: 'bastion' });
    expect(Object.keys(before.hunters)).toHaveLength(11);
    expect(before.events.opened).toBe(true);
    expect(after.meta.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('loads and validates with no warnings, and keeps everything else exactly as it was', () => {
    expect(loaded.warnings).toEqual([]);
    for (const key of Object.keys(before) as (keyof GameState)[]) {
      if (key === 'meta') expect({ ...after.meta, schemaVersion: 9 }).toEqual(before.meta);
      else expect(after[key], key).toEqual(before[key]);
    }
  });

  it('starts each Order at the independent recount, capped at the level-1 threshold (D410 (5))', () => {
    const raw = recount(before);
    expect(backfillOrders(old.state).raw).toEqual(raw);
    for (const id of ORDER_IDS) {
      expect(after.orders.start[id], id).toBe(Math.min(raw[id], THRESHOLD_1[id]));
      expect(after.orders.levelHigh[id], id).toBe(1);
    }
    // This save has done far more than level 1 asks of every Order, so the cap is what binds.
    expect(after.orders.start).toEqual(THRESHOLD_1);
  });

  it('adds no opened flag, queues no scene and seats nothing (T10.6 opens them; D422)', () => {
    expect(after.orders.opened).toEqual({});
    expect(after.orders.openingQueue).toEqual([]);
    expect(after.orders.seats).toEqual([]);
    expect(after.orders.seatStepPending).toBe(false);
    expect(after.orders.thirdSeat).toBe(false);
    expect(after.orders.triumphant).toBe(0);
    expect(after.orders.delveWindow).toBeNull();
    expect(after.orders.lastChange).toBeNull();
    for (const id of ORDER_IDS) {
      expect(after.orders.chaptersRead[id]).toBe(0);
      expect(after.orders.readWith[id]).toEqual([]);
      expect(Object.values(after.orders.counts[id]).every((n) => n === 0)).toBe(true);
    }
  });

  it('names every source it could not recover, as notes (not warnings)', () => {
    expect(loaded.notes).toEqual([...NOT_RECOVERED, PARTLY_RECOVERED]);
    expect(loaded.notes.join(' ')).toMatch(/brews/);
    expect(loaded.notes.join(' ')).toMatch(/Delve floors/);
    expect(loaded.notes.join(' ')).toMatch(/Kozly Hollow contracts/);
  });

  it('counts a small save as it is: below the cap nothing is rounded up', () => {
    const env = clone(old);
    const st = env.state as unknown as GameState;
    st.stats.contractsWon = 3;
    st.book.tried = ['yarrow+pitch'] as never;
    for (const k of Object.keys(st.book.properties))
      (st.book.properties as Record<string, number[]>)[k] = [];
    st.story.documents = [];
    st.story.letters = [];
    st.story.names = [];
    st.story.trust['kozly-hollow'] = { level: 'cold', progress: 0, won: 4, triumphs: 0 } as never;
    for (const c of st.cycles) if (c.stand) c.stand.band = 'held';
    const small = loadFull(env).state;
    expect(small.orders.start).toEqual({ moot: 3, greyWives: 3, bellWatchers: 0, quenchers: 8 });
    expect(small.orders.levelHigh).toEqual({
      moot: 0,
      greyWives: 0,
      bellWatchers: 0,
      quenchers: 0,
    });
  });

  it('adds past Triumphant stands to every Order, then caps', () => {
    const env = clone(old);
    const st = env.state as unknown as GameState;
    st.stats.contractsWon = 0;
    st.book.tried = [];
    for (const k of Object.keys(st.book.properties))
      (st.book.properties as Record<string, number[]>)[k] = [];
    st.story.documents = [];
    st.story.letters = [];
    st.story.names = [];
    st.story.trust['kozly-hollow'] = { level: 'cold', progress: 0, won: 0, triumphs: 0 } as never;
    st.cycles.forEach((c, i) => {
      if (c.stand) c.stand.band = i === 0 ? 'triumphant' : 'broken';
    });
    expect(loadFull(env).state.orders.start).toEqual({
      moot: 5,
      greyWives: 10,
      bellWatchers: 5,
      quenchers: 10,
    });
  });

  it('every golden fight and recorded stand keeps its result (D344 (1))', () => {
    for (const ref of after.log.recentFights) {
      const replay = runFight({
        party: ref.party,
        monster: ref.monster,
        location: ref.location,
        rolls: seeded(ref.seed),
        prep: ref.prep,
        alchemy: ref.alchemy,
      });
      expect(fightReplayDiffers(ref, replay), ref.contractId).toBe(false);
    }
    for (const c of after.cycles)
      if (c.stand && c.stand.rulesVersion >= 4)
        expect(standReplayDiffers(c.stand, replayStand(c.stand))).toBe(false);
  });

  it('round-trips equal', () => {
    expect(roundTrip(after)).toEqual(after);
  });

  it('migrates the fixture quickly (measured, T10.1 criterion 6)', () => {
    const t0 = performance.now();
    loadFull(readFixture('v9-owner.json'));
    expect(performance.now() - t0).toBeLessThan(2000); // generous; the real figure is in the progress entry
  });
});

describe('a save from further back also arrives with Orders', () => {
  it.each(['v8-owner.json', 'v7-owner.json', 'v5.json'])(
    '%s migrates to v10 with a level-capped start',
    (f) => {
      const r = loadFull(readFixture(f));
      expect(r.state.meta.schemaVersion).toBe(10);
      for (const id of ORDER_IDS)
        expect(r.state.orders.start[id]).toBeLessThanOrEqual(THRESHOLD_1[id]);
      expect(r.state.orders.opened).toEqual({});
    },
  );
});

describe('the v10 fixture (the owner’s save after the migration, not played)', () => {
  it('loads with no warnings and no notes, round-trips, and matches the migration of v9-owner', () => {
    const env = readFixture('v10.json');
    expect(env.schemaVersion).toBe(10);
    const r = loadFull(env);
    expect(r.warnings).toEqual([]);
    expect(r.notes).toEqual([]);
    expect(roundTrip(r.state)).toEqual(r.state);
    expect(r.state.orders).toEqual(loadFull(readFixture('v9-owner.json')).state.orders);
  });
});

describe('a new game', () => {
  it('starts with Orders empty, closed and unseated', () => {
    const s = createNewGame('seed', 0);
    expect(s.orders.opened).toEqual({});
    expect(s.orders.seats).toEqual([]);
    expect(s.orders.start).toEqual({ moot: 0, greyWives: 0, bellWatchers: 0, quenchers: 0 });
    expect(roundTrip(s)).toEqual(s);
  });
});

describe('the Orders guard (technical design §5.2)', () => {
  const saved = (): Env => clone(readFixture('v10.json'));
  type O = Record<string, unknown>;
  const orders = (e: Env) => e.state.orders as O;
  const fails = (mut: (o: O, e: Env) => void): boolean => {
    const e = saved();
    mut(orders(e), e);
    return !loadEnvelope(e).ok;
  };
  const openAll = (o: O) => {
    o.opened = Object.fromEntries(ORDER_IDS.map((id) => [id, { at: 5 }]));
  };

  it('drops unknown Orders and unknown sources with warnings, never a crash', () => {
    const e = saved();
    (orders(e).opened as O).bogus = { at: 1 };
    ((orders(e).counts as O).moot as O).nonsense = 4;
    orders(e).openingQueue = ['bogus'];
    const r = loadFull(e);
    expect(r.warnings).toHaveLength(3);
    expect(r.state.orders.opened).toEqual({});
    expect(r.state.orders.counts.moot).toEqual({ contract: 0 });
  });

  it('refuses Orders that are missing or malformed', () => {
    const e = saved();
    Reflect.deleteProperty(e.state, 'orders');
    expect(loadEnvelope(e).ok).toBe(false);
    expect(fails((o) => (((o.counts as O).moot as O).contract = -1))).toBe(true);
    expect(fails((o) => (((o.counts as O).moot as O).contract = 1.5))).toBe(true);
    expect(fails((o) => ((o.start as O).moot = -2))).toBe(true);
    expect(fails((o) => Reflect.deleteProperty(o.start as O, 'quenchers'))).toBe(true);
  });

  it('refuses a seat or a queued scene for an Order that has not opened', () => {
    expect(fails((o) => (o.seats = ['moot']))).toBe(true);
    expect(fails((o) => (o.openingQueue = ['moot']))).toBe(true);
  });

  it('refuses a seat listed twice, more seats than there are, and a third seat nothing opened', () => {
    expect(
      fails((o) => {
        openAll(o);
        o.seats = ['moot', 'moot'];
      }),
    ).toBe(true);
    expect(
      fails((o) => {
        openAll(o);
        o.seats = ['moot', 'greyWives', 'bellWatchers'];
      }),
    ).toBe(true);
    expect(
      fails((o) => {
        openAll(o);
        o.thirdSeat = true;
      }),
    ).toBe(true);
  });

  it('accepts a third seat once two Orders are at level 4 and the Quenchers have opened', () => {
    const e = saved();
    const o = orders(e);
    openAll(o);
    o.levelHigh = { moot: 4, greyWives: 4, bellWatchers: 1, quenchers: 1 };
    o.thirdSeat = true;
    o.seats = ['moot', 'greyWives', 'quenchers'];
    expect(loadEnvelope(e).ok).toBe(true);
  });

  it('puts seats back in list order with a warning', () => {
    const e = saved();
    const o = orders(e);
    openAll(o);
    o.seats = ['greyWives', 'moot'];
    const r = loadFull(e);
    expect(r.state.orders.seats).toEqual(['moot', 'greyWives']);
    expect(r.warnings).toHaveLength(1);
  });

  it('refuses a chapter read above the level, and a reading record that does not match', () => {
    expect(
      fails((o) => (o.chaptersRead = { moot: 2, greyWives: 0, bellWatchers: 0, quenchers: 0 })),
    ).toBe(true);
    expect(
      fails((o) => {
        o.levelHigh = { moot: 2, greyWives: 1, bellWatchers: 1, quenchers: 1 };
        o.chaptersRead = { moot: 1, greyWives: 0, bellWatchers: 0, quenchers: 0 };
      }),
    ).toBe(true); // readWith still empty
    expect(
      fails((o) => (o.levelHigh = { moot: 5, greyWives: 1, bellWatchers: 1, quenchers: 1 })),
    ).toBe(true);
  });

  it('round-trips a played state: opened, seated, chapters read, the Delve window, the cooldown', () => {
    const e = saved();
    const o = orders(e);
    openAll(o);
    o.levelHigh = { moot: 4, greyWives: 3, bellWatchers: 2, quenchers: 4 };
    o.seats = ['moot', 'quenchers'];
    o.chaptersRead = { moot: 2, greyWives: 0, bellWatchers: 1, quenchers: 0 };
    o.readWith = {
      moot: [['moot'], ['moot', 'quenchers']],
      greyWives: [],
      bellWatchers: [['moot']],
      quenchers: [],
    };
    o.delveWindow = { start: 1000, used: 7 };
    o.lastChange = 4242;
    o.triumphant = 2;
    o.openingQueue = ['bellWatchers'];
    o.seatStepPending = true;
    const s = loadFull(e).state;
    expect(s.orders.readWith.moot).toEqual([['moot'], ['moot', 'quenchers']]);
    expect(roundTrip(s)).toEqual(s);
  });
});
