// Plan T4.3 (D113): the v3 → v4 migration, tested on the owner's real v0.3 save
// (tests/saves/fixtures/v3-owner.json, from the save code they pasted on 2026-10-13).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { UPGRADE_IDS } from '../../src/content/warden-upgrades';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { apply } from '../../src/core/commands';
import { createNewGame } from '../../src/core/state/new-game';
import { shiftClock } from '../../src/core/state/shift';
import type { GameState } from '../../src/core/state/game-state';
import { oldCycles, oldKey } from './old-view';

const FIXTURES = new URL('./fixtures/', import.meta.url);
const readFixture = (f: string): { state: Record<string, unknown> } =>
  JSON.parse(readFileSync(new URL(f, FIXTURES), 'utf8')) as { state: Record<string, unknown> };
const load = (env: unknown): GameState => {
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  expect(r.value.warnings).toEqual([]);
  return r.value.state;
};

describe('the v3 → v4 migration (plan T4.3)', () => {
  const old = readFixture('v3-owner.json');
  const after = load(old);
  const before = old.state as unknown as GameState;

  it('is a real v0.3 save', () => {
    expect((old as unknown as { schemaVersion: number }).schemaVersion).toBe(3);
  });

  it("keeps everything the owner's save had", () => {
    for (const key of [
      'meta',
      'time',
      'cycle',
      'resources',
      'peasants',
      'hunters',
      'roster',
      'board',
      'bestiary',
      'stores',
      'queues',
      'garden',
      'running',
      'results',
      'fallen',
      'scenes',
      'log',
      'stats',
      'settings',
    ] as const) {
      if (key === 'meta') expect({ ...after.meta, schemaVersion: 3 }).toEqual(before.meta);
      else if (key === 'stores')
        // v6 adds a slot for each of the six new brews, empty.
        expect(
          Object.fromEntries(Object.entries(after.stores).filter(([k]) => k in before.stores)),
        ).toEqual(before.stores);
      else if (key === 'log')
        // v6 adds the Alchemy level, 0, to each fight record (D206).
        expect(after.log.recentFights.map(({ alchemy: _a, ...f }) => f)).toEqual(
          before.log.recentFights,
        );
      else expect(oldKey(after, key), key).toEqual(before[key]);
    }
  });

  it('adds Walls and Watchtower at 0, and every other building as it was', () => {
    expect(after.buildings.walls).toBe(0);
    expect(after.buildings.watchtower).toBe(0);
    for (const [id, n] of Object.entries(before.buildings))
      expect(after.buildings[id as keyof typeof after.buildings], id).toBe(n);
  });

  it('starts the Long Night parts empty, and the save faces its first Long Night', () => {
    expect(after.threat).toBe(0);
    expect(after.embers).toBe(0);
    expect(Object.keys(after.upgrades).sort()).toEqual([...UPGRADE_IDS].sort());
    expect(Object.values(after.upgrades).every((n) => n === 0)).toBe(true);
    expect(after.relics).toEqual([]);
    expect(after.arrivalDue).toBe(true);
  });

  it('records cycle 1 from when the game was created; Rank times before v0.4 are unknown', () => {
    expect(oldCycles(after)).toEqual([
      {
        number: 1,
        startedAt: before.meta.createdAt,
        ranks: { hamlet: before.meta.createdAt },
        contractThreat: { added: 0, removed: 0 },
        stand: null,
        // v5 (T5.3): a save still owed its v0.4 arrival has no act yet, and no warden name.
        act: null,
        warden: null,
      },
    ]);
  });

  it('round-trips equal', () => {
    expect(load(JSON.parse(encodeSaveFile(makeEnvelope(after, 0))))).toEqual(after);
  });
});

describe('v4 state (technical design §5.2, D113)', () => {
  it('a new game never faces the arrival, and starts its cycle history', () => {
    const g = createNewGame('seed', 5_000);
    expect(g.arrivalDue).toBe(false);
    expect(g.threat).toBe(0);
    expect(oldCycles(g)).toEqual([
      {
        number: 1,
        startedAt: 5_000,
        ranks: { hamlet: 5_000 },
        contractThreat: { added: 0, removed: 0 },
        stand: null,
        act: 1, // v5 (T5.3): a new game starts Act I
        warden: null,
      },
    ]);
  });

  it('a Rank-up records when the Rank was reached', () => {
    const s = createNewGame('seed', 0);
    s.peasants.total = 10;
    s.buildings.mill = 3;
    s.buildings.smithy = 1;
    Object.assign(s.resources, { food: 1e6, wood: 1e6, iron: 1e6, silver: 1e6 });
    s.time = 77_000;
    expect(apply(s, { type: 'age.up' }, 77_000).ok).toBe(true);
    expect(s.cycles[0]?.ranks.keep).toBe(77_000);
  });

  it('the debug time skip moves the cycle history with the clock', () => {
    const s = createNewGame('seed', 1_000);
    shiftClock(s, 500);
    expect(s.cycles[0]?.startedAt).toBe(1_500);
    expect(s.cycles[0]?.ranks.hamlet).toBe(1_500);
  });

  it('refuses a save whose cycle history does not end with the current cycle', () => {
    const env = structuredClone(readFixture('v4.json'));
    (env.state.cycles as unknown[]).length = 0;
    const r = loadEnvelope(env);
    expect(r.ok).toBe(false);
  });

  it('a cycle with a Last Stand record validates and round-trips', () => {
    const s = load(readFixture('v4.json'));
    const party = s.log.recentFights[0]?.party ?? [];
    expect(party.length).toBeGreaterThan(0);
    const record = s.cycles[s.cycles.length - 1];
    if (!record) throw new Error('no cycle');
    record.stand = {
      at: s.time,
      seed: `${s.meta.gameSeed}:stand:1`,
      rank: s.cycle.age,
      threat: 12.5,
      party,
      prep: { oils: {}, potions: {}, bombs: [] },
      bombs: { 'fire-pot': 2 },
      defenses: { walls: 1, watchtower: 0 },
      relics: [],
      knowledge: { wolf: 3 },
      rulesVersion: 1,
      wavesHeld: 7,
      embers: { waves: 30, trophies: 12, total: 42 },
      relicsFound: ['plough-share'],
      arrival: true,
      trustSteps: [],
      band: 'broken',
      alchemy: 0,
      seen: false,
    };
    expect(load(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))))).toEqual(s);
  });

  it('refuses a relic listed twice, and drops an unknown upgrade with a warning', () => {
    const env = structuredClone(readFixture('v4.json'));
    env.state.relics = [
      { id: 'tally-stick', cycle: 1 },
      { id: 'tally-stick', cycle: 1 },
    ];
    expect(loadEnvelope(env).ok).toBe(false);
    const env2 = structuredClone(readFixture('v4.json'));
    (env2.state.upgrades as Record<string, number>)['gone'] = 2;
    const r = loadEnvelope(env2);
    if (!r.ok) throw new Error(r.error);
    expect(r.value.warnings).toEqual(['Dropped unknown upgrades entry "gone".']);
  });
});
