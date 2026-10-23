// Plan T11.1 (technical design §5.2, §9.4, OUT-8, D452, D461, D462): the v10 → v11 migration and the
// `remembering` guard. The v10 fixtures are the owner's save migrated to v10 (v10.json, not played)
// and the scripted played save (v10-played.json); v11.json is v10.json after this migration.
// v9-fresh.json is the owner's save of 2026-10-21: a real v9 file, so the whole chain runs on it.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runFight } from '../../src/core/combat';
import { fightReplayDiffers, standReplayDiffers } from '../../src/core/replay-check';
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
import { createNewGame } from '../../src/core/state/new-game';
import { CONTRACT_SPECIES } from '../../src/content/remembering';
import { freshAct } from '../../src/core/state/story-state';
import { RULES_VERSION } from '../../src/core/rules-version';

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
const EMPTY = { nearSeen: false, readyNoted: false, endings: [] };

describe('the v10 → v11 migration', () => {
  it('is schema 11 or later, and rules version stays 5', () => {
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(11);
    expect(RULES_VERSION).toBe(5);
    for (const f of ['v10.json', 'v10-played.json']) {
      expect(readFixture(f).schemaVersion, f).toBe(10);
      expect(readFixture(f).rulesVersion, f).toBe(5);
    }
  });

  it.each(['v10.json', 'v10-played.json', 'v11.json'])(
    '%s loads with no warnings, has an empty block, and round-trips',
    (f) => {
      const loaded = loadFull(readFixture(f));
      expect(loaded.warnings).toEqual([]);
      expect(loaded.state.meta.schemaVersion).toBe(SCHEMA_VERSION);
      expect(loaded.state.remembering).toEqual(EMPTY);
      expect(roundTrip(loaded.state)).toEqual(loaded.state);
    },
  );

  it.each(['v10.json', 'v10-played.json'])(
    '%s: the step itself changes nothing but the new block (orders identical)',
    (f) => {
      const before = readFixture(f).state;
      const step = migrations[10];
      if (!step) throw new Error('no step from version 10');
      const after = step(before);
      expect(after.remembering).toEqual(EMPTY);
      expect(after.orders).toEqual(before.orders);
      const rest = { ...after };
      delete rest.remembering;
      expect(rest).toEqual(before);
    },
  );

  it('migrate() reaches v11 from v10 in one step and does not touch its input', () => {
    const before = readFixture('v10.json').state;
    const copy = structuredClone(before);
    const r = migrate(before, 10);
    expect(r.ok).toBe(true);
    expect(before).toEqual(copy);
  });

  it('a save from further back, a real v9 file, arrives with the block too', () => {
    const env = readFixture('v9-fresh.json');
    expect(env.schemaVersion).toBe(9);
    const loaded = loadFull(env);
    expect(loaded.warnings).toEqual([]);
    expect(loaded.state.remembering).toEqual(EMPTY);
    expect(roundTrip(loaded.state)).toEqual(loaded.state);
  });

  it('v11.json is v10.json after the migration', () => {
    expect(loadFull(readFixture('v11.json')).state).toEqual(
      loadFull(readFixture('v10.json')).state,
    );
  });

  it('every golden fight and recorded stand keeps its result (D344 (1))', () => {
    for (const f of ['v10.json', 'v10-played.json']) {
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

  it('a save from a newer version is refused with the usual message', () => {
    const env = { ...readFixture('v11.json'), schemaVersion: SCHEMA_VERSION + 1 };
    expect(loadEnvelope(env)).toEqual({ ok: false, error: NEWER_VERSION });
  });

  it('migrates quickly (measured; the budget row comes at T11.16)', () => {
    const t0 = performance.now();
    loadFull(readFixture('v10-played.json'));
    expect(performance.now() - t0).toBeLessThan(2000);
  });
});

describe('a new game', () => {
  it('starts with an empty block', () => {
    expect(createNewGame('seed', 0).remembering).toEqual(EMPTY);
  });
});

describe('the remembering guard (D461)', () => {
  // A save past Act VI's stand with the gate open, so only the structure of the list is on trial
  // (the stand and gate checks are in tests/remembering/gate.test.ts).
  const base = (): Env => {
    const e = JSON.parse(JSON.stringify(readFixture('v11.json'))) as Env; // the save is in cycle 19
    const st = e.state as unknown as GameState;
    const past = st.cycles.find((c) => c.stand);
    if (!past) throw new Error('the fixture has no stand');
    st.story.acts.push(freshAct(6, past.number, 0));
    st.story.names = Array.from({ length: 40 }, (_, i) => ({ n: i + 1, cycle: 1, at: 0 }));
    for (const m of CONTRACT_SPECIES) st.bestiary[m] = { level: 3, kills: 4 };
    return e;
  };
  const withEndings = (endings: unknown[], extra: object = {}) => {
    const e = base();
    e.state.remembering = { nearSeen: true, readyNoted: true, endings, ...extra };
    return e;
  };
  const rec = (ending: string, cycle = 19, at = 5) => ({ ending, at, cycle });

  it('keeps a valid vigil-then-remember list in array order, whatever the times say', () => {
    const r = loadFull(withEndings([rec('vigil', 18, 900), rec('remember', 19, 100)]));
    expect(r.warnings).toEqual([]);
    expect(r.state.remembering.endings.map((x) => x.ending)).toEqual(['vigil', 'remember']);
    expect(r.state.remembering.endings.map((x) => x.at)).toEqual([900, 100]);
  });

  it('drops an unknown ending id with a warning', () => {
    const r = loadFull(withEndings([rec('descent'), rec('remember')]));
    expect(r.state.remembering.endings).toEqual([rec('remember')]);
    expect(r.warnings).toHaveLength(1);
  });

  it.each([
    ['a repeated ending', [rec('remember'), rec('remember')]],
    ['a vigil after remember', [rec('remember'), rec('vigil')]],
    ['a cycle that does not exist (0)', [rec('remember', 0)]],
    ['a cycle that does not exist (20)', [rec('remember', 20)]],
    ['a fractional cycle', [rec('remember', 1.5)]],
    ['a negative time', [rec('remember', 19, -1)]],
  ])('refuses %s', (_name, endings) => {
    expect(loadEnvelope(withEndings(endings)).ok).toBe(false);
  });

  it('refuses a block that is missing or has the wrong types', () => {
    const missing = base();
    delete missing.state.remembering;
    expect(loadEnvelope({ ...missing, schemaVersion: 11 }).ok).toBe(false);
    expect(loadEnvelope(withEndings([], { nearSeen: 'yes' })).ok).toBe(false);
  });
});
