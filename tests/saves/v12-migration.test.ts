// Plan TL.1 (technical design §19, D502, S10, S13): the v11 → v12 migration and the layout guard.
// v11-owner.json is the owner's real save, exported 2026-10-23; v12.json is that save after this
// migration; v12-played.json is v12.json after 72 h of play (scripts/make-v12-fixtures.ts).
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
import { CANONICAL_LAYOUT } from '../../src/content/hold-layout';
import { canonicalLayout } from '../../src/core/systems/layout-catalog';

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
const withLayout = (layout: unknown): Env => {
  const e = structuredClone(readFixture('v12.json'));
  e.state.layout = layout;
  return e;
};

describe('the v11 → v12 migration', () => {
  it('is schema 12, and rules version stays 5', () => {
    expect(SCHEMA_VERSION).toBe(12);
    expect(RULES_VERSION).toBe(5);
    expect(readFixture('v11-owner.json').schemaVersion).toBe(11);
    expect(readFixture('v12.json').schemaVersion).toBe(12);
  });

  it.each(['v11-owner.json', 'v11.json', 'v11-played.json', 'v12.json', 'v12-played.json'])(
    '%s loads with no warnings, has the layout block, and round-trips',
    (f) => {
      const loaded = loadFull(readFixture(f));
      expect(loaded.warnings).toEqual([]);
      expect(loaded.state.meta.schemaVersion).toBe(12);
      expect(Object.keys(loaded.state.layout.placed)).toHaveLength(40);
      expect(roundTrip(loaded.state)).toEqual(loaded.state);
    },
  );

  it("the owner's save arrives with the canonical layout and the ghosts on", () => {
    const s = loadFull(readFixture('v11-owner.json')).state;
    expect(s.layout).toEqual(canonicalLayout());
  });

  it.each(['v11-owner.json', 'v11-played.json'])(
    '%s: the step itself adds only the layout',
    (f) => {
      const before = readFixture(f).state;
      const step = migrations[11];
      if (!step) throw new Error('no step from version 11');
      const after = step(before);
      expect(after.layout).toEqual(canonicalLayout());
      const rest = { ...after };
      delete rest.layout;
      expect(rest).toEqual(before);
    },
  );

  it('migrate() reaches v12 from v11 and does not touch its input', () => {
    const before = readFixture('v11-owner.json').state;
    const copy = structuredClone(before);
    expect(migrate(before, 11).ok).toBe(true);
    expect(before).toEqual(copy);
  });

  it('v12.json is v11-owner.json after the migration', () => {
    expect(loadFull(readFixture('v12.json')).state).toEqual(
      loadFull(readFixture('v11-owner.json')).state,
    );
  });

  it('every golden fight and recorded stand keeps its result (D344 (1))', () => {
    for (const f of ['v11-owner.json', 'v11-played.json', 'v12-played.json']) {
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

  it('a save from a newer version (13) is refused with the usual message', () => {
    const env = { ...readFixture('v12.json'), schemaVersion: 13 };
    expect(loadEnvelope(env)).toEqual({ ok: false, error: NEWER_VERSION });
  });

  it('migrates quickly (the budget row, 100 ms on the throttled profile, is TL.10)', () => {
    const t0 = performance.now();
    loadFull(readFixture('v11-owner.json'));
    expect(performance.now() - t0).toBeLessThan(2000);
  });
});

describe('a new game and the Long Night (D502)', () => {
  it('starts with the Hearth Hall at (3, 3), the starting Farm and Camp placed (TL.3), no ghosts shown for the rest', () => {
    expect(createNewGame('seed', 0).layout).toEqual({
      placed: {
        'hearth-hall': { x: 3, y: 3 },
        'farm-1': { x: 3, y: 2 },
        'woodcutter-1': { x: 4, y: 2 },
      },
      showGhosts: true,
    });
  });

  it('the Long Night keeps the layout exactly', () => {
    const s = loadFull(readFixture('v12.json')).state;
    s.layout.placed['mill'] = { x: 7, y: 7 };
    s.layout.showGhosts = false;
    const before = structuredClone(s.layout);
    resetForNewCycle(s);
    expect(s.layout).toEqual(before);
  });
});

describe('the layout guard (S13)', () => {
  it('drops a place off the grid, with a warning', () => {
    const l = canonicalLayout();
    l.placed['mill'] = { x: 8, y: 3 };
    l.placed['sawpit'] = { x: 1.5, y: 3 };
    const r = loadFull(withLayout(l));
    expect(r.state.layout.placed['mill']).toBeUndefined();
    expect(r.state.layout.placed['sawpit']).toBeUndefined();
    expect(r.warnings).toHaveLength(2);
  });

  it('puts a missing or misplaced Hearth Hall back at (3, 3)', () => {
    for (const hall of [undefined, { x: 0, y: 0 }, { x: 5, y: 3 }]) {
      const l = canonicalLayout();
      if (hall) l.placed['hearth-hall'] = hall;
      else delete l.placed['hearth-hall'];
      expect(loadFull(withLayout(l)).state.layout.placed['hearth-hall']).toEqual({ x: 3, y: 3 });
    }
  });

  it('sends a piece standing on an earlier piece to the tray, the Hall winning', () => {
    const l = canonicalLayout();
    l.placed['mill'] = { x: 4, y: 4 }; // inside the Hall's four tiles
    const r = loadFull(withLayout(l));
    expect(r.state.layout.placed['mill']).toBeUndefined();
    expect(r.state.layout.placed['hearth-hall']).toEqual({ x: 3, y: 3 });
    expect(r.warnings.join(' ')).toContain('mill');
  });

  it('settles a 1 × 1 overlap in catalog order (the earlier piece keeps the tile)', () => {
    const l = canonicalLayout();
    l.placed['smithy'] = { ...CANONICAL_LAYOUT['sawpit'] }; // sawpit comes before smithy
    const r = loadFull(withLayout(l)).state.layout.placed;
    expect(r['sawpit']).toEqual(CANONICAL_LAYOUT['sawpit']);
    expect(r['smithy']).toBeUndefined();
  });

  it('drops unknown keys with a warning, and refuses a layout with no flag', () => {
    const l = canonicalLayout() as unknown as { placed: Record<string, unknown> };
    l.placed['moat'] = { x: 1, y: 1 };
    const r = loadFull(withLayout(l));
    expect(r.state.layout.placed).not.toHaveProperty('moat');
    expect(r.warnings.join(' ')).toContain('moat');
    const bad = withLayout({ placed: {} });
    expect(loadEnvelope(bad).ok).toBe(false);
  });
});
