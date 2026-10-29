// Plan TB.2 (technical design §5.2, §9.4, §23.1, §23.6, D585): the v14 → v15 migration and the
// stand's lane table. v14-owner.json is the owner's real v1.4 save (exported at TB.2); v15.json is
// that save after this migration, not played (scripts/make-v15-fixtures.ts). v15-played.json is
// made in TB.10 with the real commands.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runFight } from '../../src/core/combat';
import { balance } from '../../src/content/balance';
import { fightReplayDiffers, standReplayDiffers } from '../../src/core/replay-check';
import { RULES_VERSION } from '../../src/core/rules-version';
import { seeded } from '../../src/core/rng';
import {
  encodeSaveFile,
  loadEnvelope,
  makeEnvelope,
  migrate,
  migrations,
  NEWER_VERSION,
} from '../../src/core/save';
import { replayStand } from '../../src/core/stand/replay';
import { SCHEMA_VERSION, type GameState } from '../../src/core/state/game-state';
import { LANE_COUNT, MAX_PIECES_PER_COLUMN, type LaneTable } from '../../src/core/state/lane-table';

type Env = { schemaVersion: number; rulesVersion: number; state: Record<string, unknown> };
const readFixture = (f: string): Env =>
  JSON.parse(readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8')) as Env;
const loadFull = (env: unknown) => {
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};
const roundTrip = (s: GameState): GameState =>
  loadFull(JSON.parse(encodeSaveFile(makeEnvelope(s, 0)))).state;
const OLD = ['v14-owner.json', 'v14.json', 'v14-played.json'];
const ALL = [...OLD, 'v15.json'];

/** A valid table with three counted towers (the largest the validator allows). */
const TABLE: LaneTable = {
  pieces: [2, 1, 3, 1, 0, 1, 2, 1],
  towerCols: [0, 2, 2],
  k: {
    coverOwn: 0.5,
    coverNeighbour: 0.25,
    depthStep: 0.25,
    depthMax: 2,
    towerReach: [1, 0.5, 0.25],
    volleyScale: 1,
  },
};
const withLanes = (lanes: unknown): Env => {
  const e = structuredClone(readFixture('v15.json'));
  const cycles = e.state.cycles as { stand: Record<string, unknown> | null }[];
  const first = cycles.find((c) => c.stand);
  if (!first?.stand) throw new Error('the fixture has no recorded stand');
  first.stand.lanes = lanes;
  return e;
};
const mutate = (patch: (t: Record<string, unknown>) => void): unknown => {
  const t = structuredClone(TABLE) as unknown as Record<string, unknown>;
  patch(t);
  return t;
};
const k = (t: Record<string, unknown>) => t.k as Record<string, unknown>;

describe('the v14 → v15 migration', () => {
  it('is schema 15, and rules version is 6 from TB.5', () => {
    expect(SCHEMA_VERSION).toBe(15);
    expect(RULES_VERSION).toBe(6);
    expect(readFixture('v14-owner.json').schemaVersion).toBe(14);
    expect(readFixture('v15.json').schemaVersion).toBe(15);
  });

  it.each(ALL)('%s loads with no warnings, and round-trips', (f) => {
    const loaded = loadFull(readFixture(f));
    expect(loaded.warnings).toEqual([]);
    expect(loaded.state.meta.schemaVersion).toBe(15);
    expect(roundTrip(loaded.state)).toEqual(loaded.state);
  });

  it.each(OLD)('%s: the step changes nothing in the state (it only moves the number)', (f) => {
    const before = readFixture(f).state;
    const step = migrations[14];
    if (!step) throw new Error('no step from version 14');
    expect(step(before)).toEqual(before);
  });

  it('migrate() reaches v15 from v14 and does not touch its input', () => {
    const before = readFixture('v14-owner.json').state;
    const copy = structuredClone(before);
    expect(migrate(before, 14).ok).toBe(true);
    expect(before).toEqual(copy);
  });

  it("v15.json is the owner's v14 save after the migration", () => {
    expect(loadFull(readFixture('v15.json')).state).toEqual(
      loadFull(readFixture('v14-owner.json')).state,
    );
  });

  it.each(ALL)('%s: no stand record has a lane table, and the layout is unchanged', (f) => {
    const raw = readFixture(f).state;
    const after = loadFull(readFixture(f)).state;
    for (const c of after.cycles) if (c.stand) expect(c.stand).not.toHaveProperty('lanes');
    expect(after.layout).toEqual(raw.layout);
  });

  it("the owner's own save keeps every placed piece where it was", () => {
    const raw = readFixture('v14-owner.json').state as { layout: { placed: object } };
    const after = loadFull(readFixture('v14-owner.json')).state;
    expect(after.layout.placed).toEqual(raw.layout.placed);
    expect(Object.keys(after.layout.placed)).toHaveLength(Object.keys(raw.layout.placed).length);
  });

  it('every golden fight and recorded stand keeps its result', () => {
    for (const f of ALL) {
      const after = loadFull(readFixture(f)).state;
      for (const ref of after.log.recentFights) {
        const replay = runFight({
          party: ref.party,
          monster: ref.monster,
          location: ref.location,
          rolls: seeded(ref.seed),
          prep: ref.prep,
          alchemy: ref.alchemy,
        });
        expect(fightReplayDiffers(ref, replay), `${f} ${ref.contractId}`).toBe(false);
      }
      for (const c of after.cycles)
        if (c.stand && c.stand.rulesVersion >= 4)
          expect(standReplayDiffers(c.stand, replayStand(c.stand)), f).toBe(false);
    }
  });

  it('the current code refuses a save from a newer version (16)', () => {
    const env = { ...readFixture('v15.json'), schemaVersion: 16 };
    expect(loadEnvelope(env)).toEqual({ ok: false, error: NEWER_VERSION });
  });

  it('runs the step in 100 ms or less', () => {
    const before = readFixture('v14-owner.json').state;
    const t0 = performance.now();
    expect(migrate(before, 14).ok).toBe(true);
    expect(performance.now() - t0).toBeLessThan(100);
  });
});

describe('the lane table guard (technical design §23.6)', () => {
  it('keeps a valid table, with no warnings, and round-trips', () => {
    const r = loadFull(withLanes(TABLE));
    const stand = r.state.cycles.find((c) => c.stand)?.stand;
    expect(stand?.lanes).toEqual(TABLE);
    expect(r.warnings).toEqual([]);
    expect(roundTrip(r.state)).toEqual(r.state);
  });

  it('keeps a table with no towers and an empty grid', () => {
    const t = { ...TABLE, pieces: [0, 0, 0, 0, 0, 0, 0, 0], towerCols: [] };
    expect(loadEnvelope(withLanes(t)).ok).toBe(true);
  });

  it('refuses each malformed table: the load fails, nothing is dropped', () => {
    const bads: [string, unknown][] = [
      ['not an object', 7],
      ['null', null],
      ['pieces too short', mutate((t) => (t.pieces = [1, 1, 1]))],
      ['pieces too long', mutate((t) => (t.pieces = [1, 1, 1, 1, 1, 1, 1, 1, 1]))],
      ['a piece count of 4', mutate((t) => (t.pieces = [4, 1, 3, 1, 0, 1, 2, 1]))],
      ['a negative piece count', mutate((t) => (t.pieces = [-1, 1, 3, 1, 0, 1, 2, 1]))],
      ['a fractional piece count', mutate((t) => (t.pieces = [1.5, 1, 3, 1, 0, 1, 2, 1]))],
      ['four tower columns', mutate((t) => (t.towerCols = [0, 1, 2, 2]))],
      ['a tower column above 7', mutate((t) => (t.towerCols = [0, 8]))],
      ['a negative tower column', mutate((t) => (t.towerCols = [-1]))],
      ['tower columns not ascending', mutate((t) => (t.towerCols = [2, 0]))],
      ['a tower column holding no piece', mutate((t) => (t.towerCols = [4]))],
      ['more towers in a column than pieces', mutate((t) => (t.towerCols = [1, 1]))],
      ['depthMax not whole', mutate((t) => (k(t).depthMax = 1.5))],
      ['depthMax too large', mutate((t) => (k(t).depthMax = 9))],
      ['depthMax negative', mutate((t) => (k(t).depthMax = -1))],
      ['towerReach of the wrong length', mutate((t) => (k(t).towerReach = [1, 0.5]))],
      ['towerReach not in quarters', mutate((t) => (k(t).towerReach = [1, 0.3, 0.25]))],
      ['towerReach above 1', mutate((t) => (k(t).towerReach = [1.25, 0.5, 0.25]))],
      ['towerReach negative', mutate((t) => (k(t).towerReach = [1, -0.25, 0.25]))],
      ['volleyScale not in hundredths', mutate((t) => (k(t).volleyScale = 1.005))],
      ['volleyScale negative', mutate((t) => (k(t).volleyScale = -1))],
      ['volleyScale far too large', mutate((t) => (k(t).volleyScale = 1000))],
      ['coverOwn above 1', mutate((t) => (k(t).coverOwn = 1.5))],
      ['coverNeighbour negative', mutate((t) => (k(t).coverNeighbour = -0.25))],
      ['depthStep negative', mutate((t) => (k(t).depthStep = -1))],
      ['depthStep far too large', mutate((t) => (k(t).depthStep = 50))],
      ['a number that is text', mutate((t) => (k(t).coverOwn = '0.5'))],
      ['no k', mutate((t) => delete t.k)],
    ];
    for (const [name, bad] of bads) expect(loadEnvelope(withLanes(bad)).ok, name).toBe(false);
  });

  it('drops an unknown field with a warning, never silently', () => {
    const r = loadFull(withLanes(mutate((t) => (t.extra = 1))));
    expect(r.state.cycles.find((c) => c.stand)?.stand?.lanes).toEqual(TABLE);
    expect(r.warnings.join(' ')).toContain('extra');
  });
});

describe('the table shape (technical design §23.1)', () => {
  it('equals the locked lane and front-row counts', () => {
    expect(LANE_COUNT).toBe(balance.breach.lanes.value);
    expect(MAX_PIECES_PER_COLUMN).toBe(balance.breach.frontRows.value);
  });
});

describe('the lane table on a record (GDD §6.5, D590)', () => {
  it('measures 0.4 KB or less, with three towers', () => {
    const bytes = new TextEncoder().encode(JSON.stringify(TABLE)).length;
    expect(bytes).toBeLessThanOrEqual(400);
  });
});
