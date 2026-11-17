// Plan T19.2 (technical design §26.1, D631, D632, D636): the v16 → v17 migration,
// safe events.boss.visit remapping around two new Great Beasts (#4, #5), legacy
// boss cosmetic backfill capping at 3, and dual rulesVersion 7 → 8 propagation.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runFight, type FightInput } from '../../src/core/combat';
import { fightInputOf, replayFight } from '../../src/core/contracts/playback';
import {
  fightFloor,
  floorFightInput,
  lastFloorReplayInput,
  replayLastFloor,
} from '../../src/core/delves/run';
import {
  fightReplayDiffers,
  floorReplayDiffers,
  standReplayDiffers,
} from '../../src/core/replay-check';
import { RULES_VERSION } from '../../src/core/rules-version';
import {
  decodeSaveCode,
  decodeSaveFile,
  encodeSaveCode,
  encodeSaveFile,
  loadEnvelope,
  makeEnvelope,
} from '../../src/core/save';
import { NEWER_VERSION, migrate, migrations } from '../../src/core/save/migrations';
import { replayStand, standInputOf } from '../../src/core/stand/replay';
import { SCHEMA_VERSION, type GameState } from '../../src/core/state/game-state';
import { bossOfVisit, passOfVisit } from '../../src/core/systems/boss';
import { backfillCosmetics } from '../../src/core/systems/cosmetics';
import {
  inputOf as descentInputOf,
  rebuildDescentLogs,
  rebuildMatches,
} from '../../src/core/systems/descent-record';
import { eventFightInput, eventPlayback } from '../../src/core/systems/events-playback';
import { browserCodec } from '../../src/platform/compression';

type Env = Record<string, unknown> & { schemaVersion: number; state: Record<string, unknown> };
const readFixture = (name: string): Env =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

const loadFull = (raw: unknown) => {
  const r = loadEnvelope(raw);
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

const roundTrip = (s: GameState): GameState =>
  loadFull(JSON.parse(encodeSaveFile(makeEnvelope(s, s.time)))).state;

const OLD = ['v15-owner.json', 'v16.json', 'v16-owner.json', 'v16-played.json'] as const;

describe('the v16 → v17 migration', () => {
  it('bumps schema to 17 and rulesVersion to 8, and registers migration 16', () => {
    expect(SCHEMA_VERSION).toBe(17);
    expect(RULES_VERSION).toBe(8);
    expect(typeof migrations[16]).toBe('function');
    expect(readFixture('v16.json').schemaVersion).toBe(16);
    expect(readFixture('v16-owner.json').schemaVersion).toBe(16);
    expect(readFixture('v16-played.json').schemaVersion).toBe(16);
    expect(readFixture('v17.json').schemaVersion).toBe(17);
  });

  it.each([...OLD, 'v17.json'])(
    '%s loads cleanly with no warnings and round-trips bit-for-bit',
    (f) => {
      const loaded = loadFull(readFixture(f));
      expect(loaded.warnings).toEqual([]);
      expect(loaded.state.meta.schemaVersion).toBe(17);
      expect(roundTrip(loaded.state)).toEqual(loaded.state);
    },
  );

  it('v17.json matches migrated v16.json', () => {
    expect(loadFull(readFixture('v17.json')).state).toEqual(
      loadFull(readFixture('v16.json')).state,
    );
  });

  it('refuses saves newer than schema 17 with NEWER_VERSION', () => {
    const raw = readFixture('v16.json');
    raw.schemaVersion = 18;
    const res = loadEnvelope(raw);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain(NEWER_VERSION);
  });

  it('migrate() reaches v17 from v16 in under 100 ms without mutating its input', () => {
    const before = readFixture('v16-played.json').state;
    const snapshot = structuredClone(before);
    const start = performance.now();
    const res = migrate(before, 16);
    const elapsed = performance.now() - start;
    expect(res.ok).toBe(true);
    expect(elapsed).toBeLessThan(100);
    expect(before).toEqual(snapshot);
  });

  describe('events.boss.visit remapping (D631, TD §26.1)', () => {
    const remapCase = (visit: number, pool: number | null) => {
      const raw = readFixture('v16.json').state as Record<string, unknown> & {
        events: {
          boss: {
            visit: number;
            tier: number;
            pool: number | null;
            paid: number;
            attempts: number;
          };
        };
      };
      raw.events.boss = {
        visit,
        tier: 5,
        pool,
        paid: 2,
        attempts: 4,
      };
      const res = migrate(raw, 16);
      if (!res.ok) throw new Error(res.error);
      const migrated = res.value as { events: { boss: typeof raw.events.boss } };
      return migrated.events.boss;
    };

    it.each([
      { inVisit: 0, pool: null, expectedVisit: 0 },
      { inVisit: 0, pool: 1200, expectedVisit: 0 },
      { inVisit: 1, pool: 4927, expectedVisit: 1 },
      { inVisit: 2, pool: null, expectedVisit: 2 },
      { inVisit: 2, pool: 3000, expectedVisit: 2 },
      // Cycle boundary with pool === null: finished The Thorn-Stag (#3) and has not begun chasing #4 yet.
      { inVisit: 3, pool: null, expectedVisit: 3 },
      // Active pool at visit === 3: already chasing the next Great Beast in the old 3-boss loop -> shifts past #4/#5 to 5.
      { inVisit: 3, pool: 1500, expectedVisit: 5 },
      { inVisit: 4, pool: null, expectedVisit: 6 },
      { inVisit: 4, pool: 2000, expectedVisit: 6 },
      { inVisit: 5, pool: null, expectedVisit: 7 },
      { inVisit: 5, pool: 2500, expectedVisit: 7 },
      { inVisit: 6, pool: null, expectedVisit: 10 },
      { inVisit: 6, pool: 1000, expectedVisit: 10 },
      { inVisit: 7, pool: null, expectedVisit: 11 },
      { inVisit: 7, pool: 1800, expectedVisit: 11 },
    ])(
      'remaps visit=$inVisit, pool=$pool to visit=$expectedVisit while preserving boss fields',
      ({ inVisit, pool, expectedVisit }) => {
        const boss = remapCase(inVisit, pool);
        expect(boss).toEqual({
          visit: expectedVisit,
          tier: 5,
          pool,
          paid: 2,
          attempts: 4,
        });
      },
    );

    it('handles missing events.boss cleanly without throwing', () => {
      const raw = readFixture('v16.json').state as Record<string, unknown> & {
        events?: { boss?: unknown };
      };
      delete raw.events?.boss;
      const res = migrate(raw, 16);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect((res.value as { events?: { boss?: unknown } }).events?.boss).toBeUndefined();
      }
    });
  });

  describe('cosmetics preservation and legacy boss backfill cap (D631, TD §26.1)', () => {
    it('preserves existing cosmetics.marks toggles verbatim across v16 → v17 and loadEnvelope', () => {
      const raw = readFixture('v16.json');
      raw.state.cosmetics = {
        marks: {
          'fjord-bone-standard': false,
          'barrow-brazier': true,
          'river-reed-basin': false,
        },
        unlockedTitles: [],
        title: null,
      };
      const migrated = migrate(raw.state, 16);
      expect(migrated.ok).toBe(true);
      if (migrated.ok) {
        expect((migrated.value as GameState).cosmetics.marks).toEqual({
          'fjord-bone-standard': false,
          'barrow-brazier': true,
          'river-reed-basin': false,
        });
      }
      const loaded = loadFull(raw);
      expect(loaded.warnings).toEqual([]);
      expect(loaded.state.cosmetics.marks['fjord-bone-standard']).toBe(false);
      expect(loaded.state.cosmetics.marks['barrow-brazier']).toBe(true);
      expect(loaded.state.cosmetics.marks['river-reed-basin']).toBe(false);
    });

    it('caps backfillCosmetics historical boss kills at 3 even when visit >= 6', () => {
      const state = structuredClone(loadFull(readFixture('v16.json')).state);
      state.cosmetics.marks = {};
      state.events.boss.visit = 10;
      backfillCosmetics(state);
      expect(state.cosmetics.marks['fjord-bone-standard']).toBe(true);
      expect(state.cosmetics.marks['barrow-brazier']).toBe(true);
      expect(state.cosmetics.marks['river-reed-basin']).toBe(true);
      const grantedBossMarks = ['fjord-bone-standard', 'barrow-brazier', 'river-reed-basin'].filter(
        (id) => id in state.cosmetics.marks,
      );
      expect(grantedBossMarks).toHaveLength(3);
    });
  });
});

describe('dual rulesVersion 7 → 8 propagation (D632)', () => {
  it('FightInput accepts an optional rulesVersion field', () => {
    const checkType: Pick<FightInput, 'rulesVersion'> = { rulesVersion: 7 };
    expect(checkType.rulesVersion).toBe(7);
  });

  it('forwards FightRef.rulesVersion through replayFight and eventPlayback', () => {
    const v16 = loadFull(readFixture('v16-played.json')).state;
    expect(v16.log.recentFights.length).toBeGreaterThan(0);
    for (const ref of v16.log.recentFights) {
      expect(ref.rulesVersion).toBeLessThan(RULES_VERSION);
      expect(fightInputOf(ref).rulesVersion).toBe(ref.rulesVersion);
      const replayed = replayFight(ref);
      expect(fightReplayDiffers(ref, replayed)).toBe(false);
      expect(replayed.result).toBe(ref.result);
    }
    expect(v16.events.recent.length).toBeGreaterThan(0);
    for (const ref of v16.events.recent) {
      expect(ref.rulesVersion).toBeLessThan(RULES_VERSION);
      expect(eventFightInput(ref).rulesVersion).toBe(ref.rulesVersion);
      expect(eventPlayback(ref).log.length).toBeGreaterThan(0);
    }
  });

  it('preserves recorded stand replays from v16.json and v16-played.json', () => {
    for (const fixture of ['v16.json', 'v16-played.json'] as const) {
      const s = loadFull(readFixture(fixture)).state;
      const stands = s.cycles.flatMap((c) => (c.stand ? [c.stand] : []));
      expect(stands.length).toBeGreaterThan(0);
      for (const stand of stands) {
        expect(standInputOf(stand).rulesVersion).toBe(stand.rulesVersion);
        const replayed = replayStand(stand);
        expect(standReplayDiffers(stand, replayed)).toBe(false);
        expect(replayed.wavesHeld).toBe(stand.wavesHeld);
      }
    }
  });

  it('floorFightInput forwards rec.rulesVersion and replayLastFloor defaults missing rulesVersion to 7', () => {
    const v7 = loadFull(readFixture('v7-owner.json')).state;
    const run = v7.delve.run;
    if (!run?.lastFloor) throw new Error('Expected v7-owner.json to have delve.run.lastFloor');
    expect(run.lastFloor.rulesVersion).toBeUndefined();
    expect(lastFloorReplayInput(v7)?.rulesVersion).toBe(7);
    expect(floorReplayDiffers(v7)).toBe(false);
    const replayed = replayLastFloor(v7);
    expect(replayed).not.toBeNull();
    expect(replayed?.result).toBe(run.lastFloor.result);

    const legacyInput = floorFightInput(v7, run, { ...run.lastFloor, rulesVersion: 7 }, true);
    expect(legacyInput.rulesVersion).toBe(7);

    const currentInput = floorFightInput(v7, run, { ...run.lastFloor, rulesVersion: 8 }, true);
    expect(currentInput.rulesVersion).toBe(8);
  });

  it('fightFloor stamps RULES_VERSION (8) onto delve.run.lastFloor.rulesVersion', () => {
    const s = structuredClone(loadFull(readFixture('v7-owner.json')).state);
    if (!s.delve.run) throw new Error('Expected v7-owner.json to have delve.run');
    s.delve.run.stage = { kind: 'fight' };
    const res = fightFloor(s);
    expect(res.ok).toBe(true);
    expect(s.delve.run.lastFloor?.rulesVersion).toBe(RULES_VERSION);
    expect(lastFloorReplayInput(s)?.rulesVersion).toBe(RULES_VERSION);
  });

  it('preserves DelveFloorRecord.rulesVersion across save validate/round-trip', () => {
    const s = loadFull(readFixture('v7-owner.json')).state;
    if (!s.delve.run?.lastFloor) throw new Error('Missing lastFloor');
    s.delve.run.lastFloor.rulesVersion = 8;
    const roundTripped = roundTrip(s);
    expect(roundTripped.delve.run?.lastFloor?.rulesVersion).toBe(8);
  });

  it('rebuilds v14-played.json Descent logs identically under recorded rulesVersion', () => {
    const s = loadFull(readFixture('v14-played.json')).state;
    const record = s.descent.last;
    if (!record) throw new Error('Expected v14-played.json to have descent.last');
    expect(record.rulesVersion).toBeLessThan(RULES_VERSION);
    expect(descentInputOf(record, true).rulesVersion).toBe(record.rulesVersion);
    expect(descentInputOf({ ...record, rulesVersion: 7 }, false).rulesVersion).toBe(7);
    const rebuilt = rebuildDescentLogs(record);
    expect(rebuildMatches(record, rebuilt)).toBe(true);
  });
});

describe('real v16 owner save (v16-owner.json) migration, edge cases & round-trip (T19.8)', () => {
  const codec = browserCodec();

  it('migrates v16-owner.json in < 100 ms without mutating input and preserves boss state & marks', async () => {
    const raw = readFixture('v16-owner.json') as Env & {
      rulesVersion: number;
      savedAt: number;
      app: 'the-last-hold';
    };
    expect(raw.schemaVersion).toBe(16);
    expect(raw.rulesVersion).toBe(7);

    const snapshot = structuredClone(raw.state);
    const t0 = performance.now();
    const migrated = migrate(raw.state, 16);
    const elapsed = performance.now() - t0;
    expect(migrated.ok).toBe(true);
    expect(elapsed).toBeLessThan(100);
    expect(raw.state).toEqual(snapshot);

    // Simulate importing an LH1. code exported directly from v16.
    const v16Code = await encodeSaveCode(
      {
        app: raw.app,
        schemaVersion: 16,
        rulesVersion: 7,
        savedAt: raw.savedAt,
        state: raw.state as unknown as GameState,
      },
      codec,
    );
    expect(v16Code.startsWith('LH1.')).toBe(true);
    const decoded = await decodeSaveCode(v16Code, codec);
    if (!decoded.ok) throw new Error(decoded.error);
    expect(decoded.value.warnings).toEqual([]);

    const s = decoded.value.state;
    expect(s.meta.schemaVersion).toBe(17);
    expect(s.meta.debugUsed).toBe(false);
    expect(s.events.boss).toEqual({
      visit: 2,
      tier: 5,
      pool: 1533,
      paid: 3,
      attempts: 6,
    });
    expect(bossOfVisit(s.events.boss.visit)).toBe('mother-of-the-river');
    expect(s.cosmetics.marks).toEqual({
      'fjord-bone-standard': true,
      'barrow-brazier': true,
      'stoneback-cairn': true,
      'kettle-barrow-wreath': true,
      'watch-fire-sconce': true,
    });
    expect(s.cosmetics.marks['river-reed-basin']).toBeUndefined();
    expect(s.cosmetics.marks['thorn-antler-rack']).toBeUndefined();
    expect(s.cosmetics.marks['beacon-iron-urn']).toBeUndefined();

    // Full v17 encode/decode round-trips across LH1., LH0., and plain save file.
    const env17 = makeEnvelope(s, s.time);
    const lh1 = await encodeSaveCode(env17, codec);
    const lh0 = await encodeSaveCode(env17, null);
    const file = encodeSaveFile(env17);
    const fromLh1 = await decodeSaveCode(lh1, codec);
    const fromLh0 = await decodeSaveCode(lh0, null);
    const fromFile = decodeSaveFile(file);
    if (!fromLh1.ok) throw new Error(fromLh1.error);
    if (!fromLh0.ok) throw new Error(fromLh0.error);
    if (!fromFile.ok) throw new Error(fromFile.error);
    expect(fromLh1.value.state).toEqual(s);
    expect(fromLh0.value.state).toEqual(s);
    expect(fromFile.value.state).toEqual(s);
  });

  it.each([
    {
      name: 'visit = 3 with pool === null keeps The Thorn-Stag next and backfills only #1-#3',
      visit: 3,
      pool: null,
      expectedVisit: 3,
      expectedBoss: 'thorn-stag',
      expectedPass: 0,
    },
    {
      name: 'visit = 3 with active pool remaps past #4/#5 to pass-1 Lindworm (visit = 5)',
      visit: 3,
      pool: 1500,
      expectedVisit: 5,
      expectedBoss: 'lindworm-of-velk-fjord',
      expectedPass: 1,
    },
    {
      name: 'visit = 4 with active pool remaps to pass-1 Barrow-King (visit = 6)',
      visit: 4,
      pool: 2000,
      expectedVisit: 6,
      expectedBoss: 'barrow-king',
      expectedPass: 1,
    },
    {
      name: 'visit = 5 with pool === null remaps to pass-1 Mother of the River (visit = 7)',
      visit: 5,
      pool: null,
      expectedVisit: 7,
      expectedBoss: 'mother-of-the-river',
      expectedPass: 1,
    },
    {
      name: 'visit = 6 with active pool remaps to pass-2 Lindworm (visit = 10)',
      visit: 6,
      pool: 1000,
      expectedVisit: 10,
      expectedBoss: 'lindworm-of-velk-fjord',
      expectedPass: 2,
    },
  ])(
    'v16-owner edge case: $name without backfilling Marks #4/#5',
    async ({ visit, pool, expectedVisit, expectedBoss, expectedPass }) => {
      const cloned = structuredClone(readFixture('v16-owner.json'));
      const rawEvents = cloned.state.events as {
        boss: {
          visit: number;
          tier: number | null;
          pool: number | null;
          paid: number;
          attempts: number;
        };
      };
      const rawCosmetics = cloned.state.cosmetics as {
        marks: Record<string, boolean>;
        hidden: string[];
      };
      rawEvents.boss = { visit, tier: 5, pool, paid: 2, attempts: 4 };
      // Clear boss marks (keep hunt marks) and hide #1 explicitly to test backfill cap + toggle preservation.
      rawCosmetics.marks = {
        'fjord-bone-standard': false,
        'stoneback-cairn': true,
        'kettle-barrow-wreath': true,
        'watch-fire-sconce': true,
      };

      const t0 = performance.now();
      const loaded = loadFull(cloned);
      expect(performance.now() - t0).toBeLessThan(100);
      expect(loaded.warnings).toEqual([]);

      const s = loaded.state;
      expect(s.events.boss).toEqual({
        visit: expectedVisit,
        tier: 5,
        pool,
        paid: 2,
        attempts: 4,
      });
      expect(bossOfVisit(s.events.boss.visit)).toBe(expectedBoss);
      expect(passOfVisit(s.events.boss.visit)).toBe(expectedPass);

      // Existing false toggle preserved; legacy #2/#3 backfilled; #4/#5 never prematurely awarded.
      expect(s.cosmetics.marks['fjord-bone-standard']).toBe(false);
      expect(s.cosmetics.marks['barrow-brazier']).toBe(true);
      expect(s.cosmetics.marks['river-reed-basin']).toBe(true);
      expect(s.cosmetics.marks['thorn-antler-rack']).toBeUndefined();
      expect(s.cosmetics.marks['beacon-iron-urn']).toBeUndefined();

      const code = await encodeSaveCode(makeEnvelope(s, s.time), codec);
      const redecoded = await decodeSaveCode(code, codec);
      if (!redecoded.ok) throw new Error(redecoded.error);
      expect(redecoded.value.state).toEqual(s);
    },
  );

  it('preserves unlocked v17 Marks #4 and #5 toggles across LH1. round-trip', async () => {
    const s = loadFull(readFixture('v16-owner.json')).state;
    s.cosmetics.marks['thorn-antler-rack'] = true;
    s.cosmetics.marks['beacon-iron-urn'] = false;

    const code = await encodeSaveCode(makeEnvelope(s, s.time), codec);
    const decoded = await decodeSaveCode(code, codec);
    if (!decoded.ok) throw new Error(decoded.error);
    expect(decoded.value.state.cosmetics.marks['thorn-antler-rack']).toBe(true);
    expect(decoded.value.state.cosmetics.marks['beacon-iron-urn']).toBe(false);
    expect(decoded.value.state).toEqual(s);
  });

  it('replays all 50 recentFights (rulesVersion 6 & 7), events.recent, and 5 recorded stands from v16-owner.json', () => {
    const s = loadFull(readFixture('v16-owner.json')).state;
    expect(s.log.recentFights).toHaveLength(50);
    const fightVersions = new Set(s.log.recentFights.map((r) => r.rulesVersion));
    expect(fightVersions.has(6)).toBe(true);
    expect(fightVersions.has(7)).toBe(true);

    for (const ref of s.log.recentFights) {
      expect(fightInputOf(ref).rulesVersion).toBe(ref.rulesVersion);
      const replayed = replayFight(ref);
      expect(fightReplayDiffers(ref, replayed)).toBe(false);
      expect(replayed.result).toBe(ref.result);
    }

    expect(s.events.recent.length).toBeGreaterThan(0);
    for (const ref of s.events.recent) {
      expect(eventFightInput(ref).rulesVersion).toBe(ref.rulesVersion);
      const rawReplay = runFight(eventFightInput(ref));
      expect(fightReplayDiffers(ref, rawReplay)).toBe(false);
      expect(eventPlayback(ref).result).toBe(ref.result);
    }

    const stands = s.cycles.flatMap((c) => (c.stand ? [c.stand] : []));
    expect(stands).toHaveLength(5);
    expect(stands.some((st) => st.rulesVersion === 5)).toBe(true);
    expect(stands.some((st) => st.rulesVersion === 6)).toBe(true);
    for (const stand of stands) {
      expect(standInputOf(stand).rulesVersion).toBe(stand.rulesVersion);
      const replayed = replayStand(stand);
      expect(standReplayDiffers(stand, replayed)).toBe(false);
      expect(replayed.wavesHeld).toBe(stand.wavesHeld);
    }
  });
});
