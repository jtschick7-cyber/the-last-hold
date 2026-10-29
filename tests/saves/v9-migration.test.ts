// Plan T9.1 (technical design §5.2, §9.4, D382): the v8 → v9 migration, tested on the owner's real
// v0.8 save (tests/saves/fixtures/v8-owner.json, copied unchanged from docs/flesh-out/v0.9: schema 8,
// rules version 5, cycle 19, Act IV, Bastion reached, the stand not yet made, 11 hunters, one
// Legendary, 421 Embers, 22 items) and on v9.json, that save after the migration and played 72 h by
// the Standard player (scripts/make-v9-fixture.ts). v9 adds `events` and each cycle's `standPool`.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply } from '../../src/core/commands/apply';
import { runFight } from '../../src/core/combat';
import { RULES_VERSION } from '../../src/core/rules-version';
import { seeded } from '../../src/core/rng';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { fightReplayDiffers, standReplayDiffers } from '../../src/core/replay-check';
import { catchUpNow } from '../../src/core/sim/offline';
import { replayStand } from '../../src/core/stand/replay';
import { SCHEMA_VERSION, type GameState } from '../../src/core/state/game-state';
import { citadelReached, eventNow, openEvents } from '../../src/core/systems/events';
import { actDue } from '../../src/core/story/act-start';

type Env = {
  schemaVersion: number;
  rulesVersion: number;
  savedAt: number;
  state: Record<string, unknown>;
};
const readFixture = (f: string): Env =>
  JSON.parse(readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8')) as Env;
const load = (env: unknown): GameState => {
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  expect(r.value.warnings).toEqual([]);
  return r.value.state;
};
const roundTrip = (s: GameState): GameState => load(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))));

describe('the v8 → v9 migration on the owner’s real save', () => {
  const old = readFixture('v8-owner.json');
  const before = old.state as unknown as GameState;
  const fresh = (): GameState => load(readFixture('v8-owner.json'));
  const after = fresh();

  it('is a real v0.8 save: schema 8, rules version 5, cycle 19, Act IV, Bastion, stand not made', () => {
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(9);
    expect(old.schemaVersion).toBe(8);
    expect(old.rulesVersion).toBe(5);
    expect(before.cycle).toEqual({ number: 19, age: 'bastion' });
    expect(Object.keys(before.hunters)).toHaveLength(11);
    expect(before.items).toHaveLength(22);
    expect(before.embers).toBe(421);
    expect(before.legendaries).toEqual([{ id: 'wolf-tooth-string', cycle: 19 }]);
    expect(before.cycles[18]?.stand).toBeNull();
    expect(after.meta.schemaVersion).toBe(SCHEMA_VERSION);
    expect(RULES_VERSION).toBe(6); // events change no combat rule (D308)
  });

  it('keeps everything the save had: hunters, items, Legendaries, documents, Embers, stands', () => {
    for (const key of Object.keys(before) as (keyof GameState)[]) {
      if (key === 'meta') expect({ ...after.meta, schemaVersion: 8 }).toEqual(before.meta);
      else if (key === 'cycles')
        expect(after.cycles.map(({ standPool: _p, ...c }) => c)).toEqual(before.cycles);
      else expect(after[key], key).toEqual(before[key]);
    }
  });

  it('marks every past cycle and cycle 19 (Bastion reached) as the base stand pool', () => {
    expect(after.cycles).toHaveLength(19);
    expect(after.cycles.map((c) => c.standPool)).toEqual(Array<'base'>(19).fill('base'));
    expect(after.cycles[18]?.stand).toBeNull();
  });

  it('marks a current cycle that has not reached Bastion as null', () => {
    const env = JSON.parse(JSON.stringify(old)) as Env;
    (env.state.cycle as { age: string }).age = 'keep';
    const cycles = env.state.cycles as { ranks: Record<string, number> }[];
    Reflect.deleteProperty(cycles[cycles.length - 1]?.ranks ?? {}, 'bastion');
    const s = load(env);
    expect(s.cycles.map((c) => c.standPool).slice(-2)).toEqual(['base', null]);
  });

  it('arrives with events closed and nothing in them, until the load path runs', () => {
    expect(after.events).toMatchObject({
      opened: false,
      sceneSeen: false,
      tokens: { count: 0, at: null },
      attempts: 0,
      rest: {},
      boss: { visit: 0, tier: null, pool: null, paid: 0, attempts: 0 },
      hunts: {
        stoneback: { points: 0, unlocked: false },
        mara: { points: 0, unlocked: false },
        likho: { points: 0, unlocked: false },
      },
      last: null,
      recent: [],
    });
    expect(after.events.clock.value).toBe(0);
  });

  it('opens events on the load path with an empty bank and the scene pending (D366, D369 (1))', () => {
    const s = fresh();
    const now = s.time + 5_000;
    catchUpNow(s, now); // the load path
    expect(s.events.opened).toBe(true);
    expect(s.events.sceneSeen).toBe(false);
    expect(s.events.tokens.count).toBe(0);
    expect(s.events.tokens.at).toBe(eventNow(s, now));
    expect(s.events.rest).toEqual({});
    expect(s.events.boss).toEqual({ visit: 0, tier: null, pool: null, paid: 0, attempts: 0 });
    expect(s.cycles[18]?.standPool).toBe('base');
    expect(s.cycles[18]?.stand).toBeNull();
    expect(actDue(s)).toBeNull(); // Act IV's scene has already played; events change no act
  });

  it('opens once: a second load changes nothing', () => {
    const s = fresh();
    catchUpNow(s, s.time + 1_000);
    const once = structuredClone(s.events);
    expect(openEvents(s, s.time + 2_000)).toBe(false);
    catchUpNow(s, s.time + 3_000);
    expect(s.events.tokens).toEqual(once.tokens);
    expect(s.events.opened).toBe(true);
  });

  it('leaves every hunter, item and Legendary exactly as they were after the load path', () => {
    const s = fresh();
    catchUpNow(s, s.time);
    expect(s.hunters).toEqual(before.hunters);
    expect(s.items).toEqual(before.items);
    expect(s.legendaries).toEqual(before.legendaries);
    expect(s.embers).toBe(421);
  });

  it('every recorded fight and stand keeps its result (recorded fights keep only a result, D344 (1))', () => {
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
    const s = fresh();
    catchUpNow(s, s.time + 1);
    expect(roundTrip(s)).toEqual(s);
  });
});

describe('opening events (GDD §5.12.1)', () => {
  const owner = (): GameState => {
    const r = loadEnvelope(readFixture('v8-owner.json'));
    if (!r.ok) throw new Error(r.error);
    return r.value.state;
  };

  it('does not open before the Citadel, and opens when it is reached', () => {
    const s = owner();
    s.cycle.age = 'keep';
    expect(citadelReached(s)).toBe(false);
    expect(openEvents(s, s.time + 10)).toBe(false);
    expect(s.events.opened).toBe(false);
    s.cycle.age = 'citadel';
    expect(openEvents(s, s.time + 20)).toBe(true);
    expect(s.events.opened).toBe(true);
    expect(s.events.tokens).toEqual({ count: 0, at: s.events.clock.value });
  });

  it('opens at the Rank-up itself, by the same function the load path uses', () => {
    const s = owner();
    s.cycle.age = 'keep';
    const ranks = s.cycles[18]?.ranks;
    if (ranks) Reflect.deleteProperty(ranks, 'bastion');
    s.resources.food = s.resources.wood = s.resources.iron = s.resources.silver = 1e9;
    const r = apply(s, { type: 'age.up' }, s.time);
    expect(r.ok, r.ok ? '' : r.reason).toBe(true);
    expect(s.cycle.age).toBe('citadel');
    expect(s.events.opened).toBe(true);
    expect(s.events.tokens.count).toBe(0);
  });

  it('keeps events open for good through the Long Night (D359 (7), D366)', () => {
    const s = owner();
    catchUpNow(s, s.time);
    expect(s.events.opened).toBe(true);
    s.cycle.age = 'hamlet'; // the Long Night returns the Hamlet; events are kept
    expect(openEvents(s, s.time + 1)).toBe(false);
    expect(s.events.opened).toBe(true);
  });

  it('a clock moved backward gives no time and loses none; back then forward gives no free time (D21, D359 (5))', () => {
    const s = owner();
    const t0 = s.time + 1_000;
    catchUpNow(s, t0);
    const at = eventNow(s, t0);
    expect(eventNow(s, t0 - 500)).toBe(at);
    openEvents(s, t0 - 500);
    expect(s.events.clock.high).toBe(t0);
    openEvents(s, t0); // forward again to the old mark: nothing gained
    expect(eventNow(s, t0)).toBe(at);
    openEvents(s, t0 + 700); // beyond the mark: exactly the new time
    expect(eventNow(s, t0 + 700)).toBe(at + 700);
  });
});

describe('the v9 guard (technical design §9.4)', () => {
  const saved = (): Env => {
    const r = loadEnvelope(readFixture('v8-owner.json'));
    if (!r.ok) throw new Error(r.error);
    return JSON.parse(encodeSaveFile(makeEnvelope(r.value.state, 0))) as Env;
  };
  type Ev = {
    rest: Record<string, number>;
    hunts: Record<string, unknown>;
    tokens: { count: number };
    boss: { visit: number };
  };
  const events = (e: Env) => e.state.events as Ev;

  it('drops an unknown hunter in rest and an unknown hunt, with warnings', () => {
    const e = saved();
    events(e).rest = { halvar: 5, nonsense: 9 };
    events(e).hunts.nonsense = { points: 3, unlocked: false };
    const r = loadEnvelope(e);
    if (!r.ok) throw new Error(r.error);
    expect(r.value.state.events.rest).toEqual({ halvar: 5 });
    expect(Object.keys(r.value.state.events.hunts).sort()).toEqual(['likho', 'mara', 'stoneback']);
    expect(r.value.warnings).toHaveLength(2);
  });

  it('refuses events that are missing or malformed', () => {
    const missing = saved();
    Reflect.deleteProperty(missing.state, 'events');
    expect(loadEnvelope(missing).ok).toBe(false);
    const bad = saved();
    events(bad).tokens.count = -1;
    expect(loadEnvelope(bad).ok).toBe(false);
    const bad2 = saved();
    events(bad2).boss.visit = 1.5;
    expect(loadEnvelope(bad2).ok).toBe(false);
  });

  it('refuses a cycle with a stand pool we do not know', () => {
    const e = saved();
    ((e.state.cycles as { standPool: unknown }[])[0] as { standPool: unknown }).standPool = 'moss';
    expect(loadEnvelope(e).ok).toBe(false);
  });
});

describe('the v9 fixture (the owner’s save after the migration, played 72 h)', () => {
  it('loads and round-trips, is on the current schema, and has events open', () => {
    const env = readFixture('v9.json');
    expect(env.schemaVersion).toBe(9);
    const s = load(env);
    expect(s.meta.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.events.opened).toBe(true);
    expect(s.legendaries.map((l) => l.id)).toContain('wolf-tooth-string');
    expect(roundTrip(s)).toEqual(s);
  });
});
