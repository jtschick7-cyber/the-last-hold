// Plan KV.2 (technical design §9.4, §21.1, §21.6, D543): the v12 → v13 migration and Rising
// Vigil's block. v12-owner.json is the owner's real save, exported 2026-10-24; v13.json is that
// save after this migration (scripts/make-v13-fixtures.ts).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runFight } from '../../src/core/combat';
import { resetForNewCycle } from '../../src/core/long-night/reset';
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
import { createNewGame } from '../../src/core/state/new-game';

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
const withVigil = (vigil: unknown, debugUsed = false): Env => {
  const e = structuredClone(readFixture('v13.json'));
  e.state.vigil = vigil;
  (e.state.meta as { debugUsed: boolean }).debugUsed = debugUsed;
  return e;
};
const OLD = ['v12-owner.json', 'v12.json', 'v12-played.json'];

describe('the v12 → v13 migration', () => {
  it('is schema 13, and rules version stays 5', () => {
    expect(SCHEMA_VERSION).toBe(15); // D593 (a): was 14 before v1.5
    expect(RULES_VERSION).toBe(5);
    expect(readFixture('v12-owner.json').schemaVersion).toBe(12);
    expect(readFixture('v13.json').schemaVersion).toBe(13);
  });

  it.each([...OLD, 'v13.json'])(
    '%s loads with no warnings, has the empty block and no level anywhere, and round-trips',
    (f) => {
      const loaded = loadFull(readFixture(f));
      expect(loaded.warnings).toEqual([]);
      expect(loaded.state.meta.schemaVersion).toBe(15); // D593 (a): was 14 before v1.5
      expect(loaded.state.vigil).toEqual({ on: false, stands: 0 });
      expect(JSON.stringify(loaded.state)).not.toContain('vigilLevel');
      expect(roundTrip(loaded.state)).toEqual(loaded.state);
    },
  );

  it.each(OLD)('%s: the step itself adds only the vigil block', (f) => {
    const before = readFixture(f).state;
    const step = migrations[12];
    if (!step) throw new Error('no step from version 12');
    const after = step(before);
    expect(after.vigil).toEqual({ on: false, stands: 0 });
    const rest = { ...after };
    delete rest.vigil;
    expect(rest).toEqual(before);
  });

  it('migrate() reaches v13 from v12 and does not touch its input', () => {
    const before = readFixture('v12-owner.json').state;
    const copy = structuredClone(before);
    expect(migrate(before, 12).ok).toBe(true);
    expect(before).toEqual(copy);
  });

  it("v13.json is the owner's v12 save after the migration", () => {
    expect(loadFull(readFixture('v13.json')).state).toEqual(
      loadFull(readFixture('v12-owner.json')).state,
    );
  });

  it('every golden fight and recorded stand keeps its result', () => {
    for (const f of [...OLD, 'v13.json']) {
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
    const env = { ...readFixture('v13.json'), schemaVersion: 16 }; // D593 (a): was 15 before v1.5
    expect(loadEnvelope(env)).toEqual({ ok: false, error: NEWER_VERSION });
  });

  it('migrates quickly (the budget row, 100 ms on the throttled profile, is in the benchmark)', () => {
    const t0 = performance.now();
    loadFull(readFixture('v12-owner.json'));
    expect(performance.now() - t0).toBeLessThan(2000);
  });
});

describe('a new game and the Long Night (D543)', () => {
  it('starts with the switch Off and no stand fought On', () => {
    expect(createNewGame('seed', 0).vigil).toEqual({ on: false, stands: 0 });
  });

  it('the Long Night keeps the block exactly', () => {
    const s = loadFull(readFixture('v13.json')).state;
    s.vigil = { on: true, stands: 4 };
    s.meta.debugUsed = true;
    resetForNewCycle(s);
    expect(s.vigil).toEqual({ on: true, stands: 4 });
  });
});

describe('the vigil guard (technical design §21.6)', () => {
  it('keeps a valid block as it is', () => {
    const r = loadFull(withVigil({ on: true, stands: 0 }, true));
    expect(r.state.vigil).toEqual({ on: true, stands: 0 });
    expect(r.warnings).toEqual([]);
  });

  it('refuses a missing block, a non-boolean switch and a bad count', () => {
    for (const bad of [
      undefined,
      { on: 'yes', stands: 0 },
      { on: false, stands: -1 },
      { on: false, stands: 1.5 },
    ])
      expect(loadEnvelope(withVigil(bad)).ok).toBe(false);
  });

  it('drops an unknown field with a warning', () => {
    const r = loadFull(withVigil({ on: false, stands: 0, cap: 9 }));
    expect(r.state.vigil).toEqual({ on: false, stands: 0 });
    expect(r.warnings.join(' ')).toContain('cap');
  });

  it('warns, and never refuses or repairs, when stands does not match the records', () => {
    const r = loadFull(withVigil({ on: false, stands: 2 }));
    expect(r.state.vigil.stands).toBe(2);
    expect(r.warnings.join(' ')).toContain('vigil.stands');
  });

  it('is quiet about a count mismatch once the debug panel has been used', () => {
    expect(loadFull(withVigil({ on: false, stands: 2 }, true)).warnings).toEqual([]);
  });

  it('keeps a recorded level of 1 or more, quietly when the count matches, and refuses 0 or a fraction', () => {
    const base = loadFull(readFixture('v11-played.json')).state;
    const at = base.cycles.findIndex((c) => c.stand);
    const withLevel = (level: unknown, stands: number): Record<string, unknown> => {
      const s = structuredClone(base);
      s.meta.debugUsed = false;
      s.vigil = { on: false, stands };
      const env = JSON.parse(encodeSaveFile(makeEnvelope(s, 0))) as Env;
      const stand = (env.state.cycles as { stand: Record<string, unknown> }[])[at]?.stand;
      if (!stand) throw new Error('no recorded stand');
      stand.vigilLevel = level;
      return env;
    };
    const ok = loadFull(withLevel(3, 1));
    expect(ok.state.cycles[at]?.stand?.vigilLevel).toBe(3);
    expect(ok.warnings).toEqual([]);
    expect(loadFull(withLevel(3, 0)).warnings.join(' ')).toContain('vigil.stands');
    for (const bad of [0, 1.5, -1, '2']) expect(loadEnvelope(withLevel(bad, 1)).ok).toBe(false);
  });

  it('the block plus 20 recorded levels adds at most 0.5 KB (GDD §6.5)', () => {
    const block = JSON.stringify({ vigil: { on: true, stands: 20 } }).length;
    let levels = 0;
    for (let n = 1; n <= 20; n++) levels += `,"vigilLevel":${n}`.length;
    expect(block + levels).toBeLessThanOrEqual(512);
  });
});

describe('v13-played.json (made in KV.4 with the real commands)', () => {
  const loaded = () => loadFull(readFixture('v13-played.json'));

  it('loads with no warnings, validates and round-trips', () => {
    const r = loaded();
    expect(r.warnings).toEqual([]);
    expect(r.state.meta.schemaVersion).toBe(15); // D593 (a): was 14 before v1.5
    expect(roundTrip(r.state)).toEqual(r.state);
  });

  it('has recorded levels 1, 2, 3, a stand with no level after them, and the switch On again', () => {
    const { state } = loaded();
    const levels = state.cycles.filter((c) => c.stand).map((c) => c.stand?.vigilLevel);
    expect(levels.slice(-4)).toEqual([1, 2, 3, undefined]);
    expect(state.vigil).toEqual({ on: true, stands: 3 }); // the next On stand is level 4
  });

  it('every recorded stand replays line for line, the vigil ones at their saved level', () => {
    for (const c of loaded().state.cycles)
      if (c.stand) expect(standReplayDiffers(c.stand, replayStand(c.stand))).toBe(false);
  });
});
