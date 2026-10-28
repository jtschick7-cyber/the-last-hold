// Plan TD.2 (technical design §5.2, §9.4, §22.1, §22.6, D562): the v13 → v14 migration and the
// Descent's saved block. v13-owner.json is the owner's real v1.3 save (exported at TD.1); v14.json
// is that save after this migration, not played (scripts/make-v14-fixtures.ts). v14-played.json
// is made in TD.4b with the real commands.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runFight } from '../../src/core/combat';
import { chooseEnding } from '../../src/core/commands/remembering';
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
import { rememberingFrom } from '../../src/core/save/validate-remembering';
import { replayStand } from '../../src/core/stand/replay';
import type { DescentRecord } from '../../src/core/state/descent-state';
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
const EMPTY = { attempts: 0, unlitMet: false, last: null, firstWin: null, unreadResult: false };
const OLD = ['v13-owner.json', 'v13.json', 'v13-played.json'];

/** A DescentRecord made from a real fixture's hunters; the numbers are plain, the shape is exact. */
const sampleRecord = (outcome: 'win' | 'loss' = 'win'): DescentRecord => {
  const s = loadFull(readFixture('v13-owner.json')).state;
  const party = s.log.recentFights[0]?.party;
  if (!party || party.length === 0) throw new Error('the fixture has no recorded fight');
  const ids = party.map((h) => h.id);
  return {
    attempt: 1,
    cycle: s.cycle.number,
    warden: 'Test',
    seed: 'seed:descent:1',
    order: structuredClone(party),
    prep: { oils: {}, potions: {} },
    bombs: { saltburst: 1 },
    learned: { mightAndHealth: 0.2, taken: 0.05 },
    delveRelics: ['spindle-whorl'],
    bestiaryKnowledge: { 'unlits-breath': 4, 'the-forgotten': 3, unlit: 0 },
    stageTiers: [5, 6, 7],
    unlitBaseHealth: 4500,
    alchemy: 2,
    rulesVersion: RULES_VERSION,
    outcome,
    stagesCleared: outcome === 'win' ? 3 : 1,
    standingCount: outcome === 'win' ? ids.length : 0,
    downedCount: outcome === 'win' ? 0 : ids.length,
    stages: [
      { stage: 1, won: true, ticks: 40, downedIds: [], steppedInIds: [] },
      { stage: 2, won: outcome === 'win', ticks: 60, downedIds: [], steppedInIds: [] },
      ...(outcome === 'win'
        ? [{ stage: 3 as const, won: true, ticks: 90, downedIds: [], steppedInIds: [] }]
        : []),
    ],
  };
};
const withDescent = (descent: unknown): Env => {
  const e = structuredClone(readFixture('v14.json'));
  e.state.descent = descent;
  return e;
};
const block = (patch: Record<string, unknown>) => ({ ...EMPTY, ...patch });

describe('the v13 → v14 migration', () => {
  it('is schema 14, and rules version stays 5', () => {
    expect(SCHEMA_VERSION).toBe(14);
    expect(RULES_VERSION).toBe(5);
    expect(readFixture('v13-owner.json').schemaVersion).toBe(13);
    expect(readFixture('v14.json').schemaVersion).toBe(14);
  });

  it.each([...OLD, 'v14.json'])(
    '%s loads with no warnings, has the empty block, and round-trips',
    (f) => {
      const loaded = loadFull(readFixture(f));
      expect(loaded.warnings).toEqual([]);
      expect(loaded.state.meta.schemaVersion).toBe(14);
      expect(loaded.state.descent).toEqual(EMPTY);
      expect(roundTrip(loaded.state)).toEqual(loaded.state);
    },
  );

  it.each(OLD)('%s: the step itself adds only the descent block', (f) => {
    const before = readFixture(f).state;
    const step = migrations[13];
    if (!step) throw new Error('no step from version 13');
    const after = step(before);
    expect(after.descent).toEqual(EMPTY);
    const rest = { ...after };
    delete rest.descent;
    expect(rest).toEqual(before);
  });

  it('an empty state migrates to just the block (the empty migration)', () => {
    const step = migrations[13];
    if (!step) throw new Error('no step from version 13');
    expect(step({})).toEqual({ descent: EMPTY });
  });

  it('migrate() reaches v14 from v13 and does not touch its input', () => {
    const before = readFixture('v13-owner.json').state;
    const copy = structuredClone(before);
    expect(migrate(before, 13).ok).toBe(true);
    expect(before).toEqual(copy);
  });

  it("v14.json is the owner's v13 save after the migration", () => {
    expect(loadFull(readFixture('v14.json')).state).toEqual(
      loadFull(readFixture('v13-owner.json')).state,
    );
  });

  it('every golden fight and recorded stand keeps its result', () => {
    for (const f of [...OLD, 'v14.json']) {
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

  it('the current code refuses a save from a newer version (15)', () => {
    const env = { ...readFixture('v14.json'), schemaVersion: 15 };
    expect(loadEnvelope(env)).toEqual({ ok: false, error: NEWER_VERSION });
  });

  it('migrates quickly (the budget row, 100 ms on the throttled profile, is in the benchmark)', () => {
    const t0 = performance.now();
    loadFull(readFixture('v13-owner.json'));
    expect(performance.now() - t0).toBeLessThan(2000);
  });
});

describe('a new game and the Long Night (D562)', () => {
  it('starts with the empty block', () => {
    expect(createNewGame('seed', 0).descent).toEqual(EMPTY);
  });

  it('the Long Night keeps the block exactly', () => {
    const s = loadFull(readFixture('v14.json')).state;
    s.descent = {
      attempts: 3,
      unlitMet: true,
      last: sampleRecord('loss'),
      firstWin: sampleRecord('win'),
      unreadResult: true,
    };
    const kept = structuredClone(s.descent);
    resetForNewCycle(s);
    expect(s.descent).toEqual(kept);
  });
});

describe('the descent guard (technical design §22.6)', () => {
  it('keeps a valid block with a win and a loss as it is, with no warnings', () => {
    const d = {
      attempts: 2,
      unlitMet: true,
      last: sampleRecord('loss'),
      firstWin: sampleRecord('win'),
      unreadResult: true,
    };
    const r = loadFull(withDescent(d));
    expect(r.state.descent).toEqual(d);
    expect(r.warnings).toEqual([]);
    expect(roundTrip(r.state)).toEqual(r.state);
  });

  it('refuses a missing block and a bad flag or count', () => {
    for (const bad of [
      undefined,
      null,
      block({ attempts: -1 }),
      block({ attempts: 1.5 }),
      block({ unlitMet: 'yes' }),
      block({ unreadResult: 1 }),
    ])
      expect(loadEnvelope(withDescent(bad)).ok).toBe(false);
  });

  it('drops an unknown field with a warning', () => {
    const r = loadFull(withDescent({ ...EMPTY, cap: 9 }));
    expect(r.state.descent).toEqual(EMPTY);
    expect(r.warnings.join(' ')).toContain('cap');
  });

  it('refuses a record that is damaged', () => {
    const w = sampleRecord('win');
    const bads: unknown[] = [
      { ...w, outcome: 'draw' },
      { ...w, attempt: 0 },
      { ...w, stagesCleared: 4 },
      { ...w, stageTiers: [5, 6] },
      { ...w, stages: [] },
      { ...w, stages: [...w.stages, ...w.stages] },
      { ...w, order: [] },
      { ...w, order: Array.from({ length: 15 }, () => w.order[0]) },
      { ...w, learned: { mightAndHealth: -1, taken: 0 } },
      { ...w, learned: { mightAndHealth: 0, taken: 1.5 } },
      { ...w, delveRelics: ['no-such-relic'] },
      { ...w, bombs: { saltburst: -1 } },
      { ...w, bestiaryKnowledge: { 'the-forgotten': 5 } },
      { ...w, rulesVersion: 'five' },
      { ...w, seed: 7 },
    ];
    for (const bad of bads) {
      expect(loadEnvelope(withDescent(block({ attempts: 1, last: bad }))).ok).toBe(false);
    }
  });

  it('refuses a firstWin that is not a win', () => {
    expect(
      loadEnvelope(withDescent(block({ attempts: 1, firstWin: sampleRecord('loss') }))).ok,
    ).toBe(false);
  });

  it('drops an unknown monster, bomb or relic id in a record with a warning', () => {
    const w = sampleRecord('win') as unknown as Record<string, unknown>;
    w.bestiaryKnowledge = { ...(w.bestiaryKnowledge as object), 'no-such-beast': 2 };
    w.bombs = { ...(w.bombs as object), 'no-such-bomb': 2 };
    const r = loadFull(withDescent(block({ attempts: 1, last: w })));
    expect(r.state.descent.last?.bestiaryKnowledge).not.toHaveProperty('no-such-beast');
    expect(r.state.descent.last?.bombs).not.toHaveProperty('no-such-bomb');
    expect(r.warnings.join(' ')).toContain('no-such-beast');
    expect(r.warnings.join(' ')).toContain('no-such-bomb');
  });
});

describe("the endings list with 'descent' (technical design §5.2)", () => {
  // The guard on its own: the whole-save rule that drops endings before Act VI's stand is applied
  // (D461) is not what is tested here, and the owner's v1.3 save is still in cycle 2.
  const endingsOf = (list: string[]) => {
    try {
      const warnings: string[] = [];
      const r = rememberingFrom(
        {
          nearSeen: true,
          readyNoted: true,
          endings: list.map((ending, i) => ({ ending, at: i, cycle: 1 })),
        },
        6,
        warnings,
      );
      return r.endings.map((e) => e.ending);
    } catch {
      return 'refused';
    }
  };

  it.each([
    [['descent']],
    [['descent', 'remember']],
    [['remember', 'descent']],
    [['vigil', 'descent', 'remember']],
    [['descent', 'vigil', 'remember']],
    [['vigil', 'remember', 'descent']],
  ])('accepts %j in that order', (list) => {
    expect(endingsOf(list)).toEqual(list);
  });

  it('refuses a repeat and Keep the Vigil after Remember Them, as before', () => {
    expect(endingsOf(['descent', 'descent'])).toBe('refused');
    expect(endingsOf(['remember', 'vigil'])).toBe('refused');
    expect(endingsOf(['remember', 'descent', 'vigil'])).toBe('refused');
  });

  it("chooseEnding refuses 'descent' (only a won Descent records it, S2)", () => {
    const s = loadFull(readFixture('v14.json')).state;
    const r = chooseEnding(s, 'descent', 0);
    expect(r.ok).toBe(false);
    expect(s.remembering.endings.some((e) => e.ending === 'descent')).toBe(false);
  });
});
