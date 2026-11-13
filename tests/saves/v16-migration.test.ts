// Plan T18.2 (technical design §25.1, D618, D621, D624): the v15 → v16 migration, 8 × 12
// portrait geometry, flexible Hearth Hall anchor, and expanded frontRows (5).
// v15-owner.json is the owner's real v15 save; v16.json is that save after v15 → v16 (not
// played); v16-played.json exercises Bastion commands on the 8 × 12 grid + frontRows = 5 Stand.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import {
  GRID_COLS,
  GRID_ROWS,
  HOLD_PIECE_IDS,
  type HoldPieceId,
} from '../../src/content/hold-layout';
import { apply } from '../../src/core/commands/apply';
import { resetForNewCycle } from '../../src/core/long-night/reset';
import { RULES_VERSION } from '../../src/core/rules-version';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { NEWER_VERSION, migrate, migrations } from '../../src/core/save/migrations';
import { standReplayDiffers } from '../../src/core/replay-check';
import { replayStand } from '../../src/core/stand/replay';
import { SCHEMA_VERSION, type GameState } from '../../src/core/state/game-state';
import { MAX_PIECES_PER_COLUMN } from '../../src/core/state/lane-table';
import { createNewGame } from '../../src/core/state/new-game';
import { footprint } from '../../src/core/systems/layout';
import { clearingBounds, pieceDef } from '../../src/core/systems/layout-catalog';

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

const OLD = ['v15.json', 'v15-owner.json', 'v15-played.json'];

describe('the v15 → v16 migration', () => {
  it('is schema 16, keeps rules version 6, and syncs frontRows with lane table max', () => {
    expect(SCHEMA_VERSION).toBe(16);
    expect(RULES_VERSION).toBe(7);
    expect(balance.breach.frontRows.value).toBe(5);
    expect(balance.breach.frontRows.locked).toBe(true);
    expect(MAX_PIECES_PER_COLUMN).toBe(5);
    expect(readFixture('v15-owner.json').schemaVersion).toBe(15);
    expect(readFixture('v16.json').schemaVersion).toBe(16);
    expect(readFixture('v16-played.json').schemaVersion).toBe(16);
  });

  it.each([...OLD, 'v16.json', 'v16-played.json'])(
    '%s loads with no warnings and round-trips cleanly',
    (f) => {
      const loaded = loadFull(readFixture(f));
      expect(loaded.warnings).toEqual([]);
      expect(loaded.state.meta.schemaVersion).toBe(16);
      expect(roundTrip(loaded.state)).toEqual(loaded.state);
    },
  );

  it('v16.json matches v15-owner.json after migration', () => {
    expect(loadFull(readFixture('v16.json')).state).toEqual(
      loadFull(readFixture('v15-owner.json')).state,
    );
  });

  it('migrate() reaches v16 from v15 without mutating its input', () => {
    const before = readFixture('v15-owner.json').state;
    const snapshot = structuredClone(before);
    const res = migrate(before, 15);
    expect(res.ok).toBe(true);
    expect(before).toEqual(snapshot);
  });

  it("keeps y = 0..2 front defenses north and shifts owner's inner ward +3 rows south", () => {
    const raw = readFixture('v15-owner.json').state as {
      layout: { placed: Record<string, { x: number; y: number }>; showGhosts: boolean };
    };
    const migrated = loadFull(readFixture('v15-owner.json')).state;
    expect(migrated.layout.showGhosts).toBe(raw.layout.showGhosts);
    expect(Object.keys(migrated.layout.placed)).toHaveLength(Object.keys(raw.layout.placed).length);

    const occupied = new Set<string>();
    for (const id of HOLD_PIECE_IDS) {
      const before = raw.layout.placed[id];
      const after = migrated.layout.placed[id];
      if (!before) continue;
      expect(after).toBeDefined();
      if (!after) throw new Error(`missing ${id}`);
      if ((id.startsWith('wall-') || id.startsWith('watchtower-')) && before.y <= 2) {
        expect(after, id).toEqual(before);
      } else {
        expect(after, id).toEqual({ x: before.x, y: before.y + 3 });
      }
      for (const t of footprint(pieceDef(id), after)) {
        const k = `${t.x},${t.y}`;
        expect(occupied.has(k), `${id} collides at ${k}`).toBe(false);
        occupied.add(k);
      }
    }
    expect(migrated.layout.placed['hearth-hall']).toEqual({ x: 3, y: 6 });
    expect(migrated.layout.placed['smithy']).toEqual({ x: 3, y: 5 });
  });

  it('shifts defenses on y >= 3 and resolves clamping collisions with zero drops or overlaps', () => {
    const base = structuredClone(readFixture('v15-owner.json'));
    const layout = (base.state as unknown as GameState).layout;
    // Crafted v15 edge cases on empty col x=0: wall on y=6 shifts +3, two clamped pieces collide at y=11
    layout.placed['wall-9'] = { x: 0, y: 6 };
    layout.placed['wall-10'] = { x: 0, y: 9 };
    layout.placed['wall-11'] = { x: 0, y: 10 };
    const step = migrations[15];
    if (!step) throw new Error('missing v15 → v16 step');
    const out = step(base.state as Record<string, unknown>) as unknown as GameState;

    // Zero pieces dropped
    expect(Object.keys(out.layout.placed)).toHaveLength(Object.keys(layout.placed).length);
    // wall-9 on y=6 shifts +3 to y=9; wall-10 clamps to y=11; wall-11 resolves deterministically nearby
    expect(out.layout.placed['wall-9']).toEqual({ x: 0, y: 9 });
    expect(out.layout.placed['wall-10']).toEqual({ x: 0, y: 11 });
    expect(out.layout.placed['wall-11']).not.toEqual({ x: 0, y: 11 });

    // Verify zero overlaps and all tiles in 8 × 12 grid
    const seen = new Set<string>();
    for (const [id, c] of Object.entries(out.layout.placed)) {
      for (const t of footprint(pieceDef(id as HoldPieceId), c)) {
        expect(t.x).toBeGreaterThanOrEqual(0);
        expect(t.x).toBeLessThan(GRID_COLS);
        expect(t.y).toBeGreaterThanOrEqual(0);
        expect(t.y).toBeLessThan(GRID_ROWS);
        const k = `${t.x},${t.y}`;
        expect(seen.has(k), `overlap at ${k}`).toBe(false);
        seen.add(k);
      }
    }
  });

  it('keeps Long Night Hearth Hall inside Hamlet clearing when moved near edge in Bastion', () => {
    const s = createNewGame('hall-clamp', 0);
    s.cycle.age = 'bastion';
    s.buildings.walls = 1;
    expect(apply(s, { type: 'layout.place', pieceId: 'hearth-hall', x: 0, y: 1 }, s.time).ok).toBe(
      true,
    );
    resetForNewCycle(s);
    const hall = s.layout.placed['hearth-hall'];
    if (!hall) throw new Error('missing hearth-hall');
    const hamlet = clearingBounds('hamlet');
    for (const t of footprint(pieceDef('hearth-hall'), hall)) {
      expect(t.x).toBeGreaterThanOrEqual(hamlet.minX);
      expect(t.x).toBeLessThanOrEqual(hamlet.maxX);
      expect(t.y).toBeGreaterThanOrEqual(hamlet.minY);
      expect(t.y).toBeLessThanOrEqual(hamlet.maxY);
    }
  });

  it('refuses saves from schema version 17 with NEWER_VERSION', () => {
    const env = { ...readFixture('v16.json'), schemaVersion: 17 };
    expect(loadEnvelope(env)).toEqual({ ok: false, error: NEWER_VERSION });
  });
});

describe('v16-played.json', () => {
  it('records a Bastion stand using rows 0..4 and flexible Hearth Hall placement, and replays cleanly', () => {
    const { state, warnings } = loadFull(readFixture('v16-played.json'));
    expect(warnings).toEqual([]);
    expect(state.layout.placed['hearth-hall']).toEqual({ x: 1, y: 8 });
    expect(state.layout.placed['wall-4']).toEqual({ x: 0, y: 3 });
    expect(state.layout.placed['watchtower-1']).toEqual({ x: 0, y: 4 });
    const latest = [...state.cycles].reverse().find((c) => c.stand)?.stand;
    expect(latest?.lanes?.pieces[0]).toBe(5);
    expect(latest?.lanes?.towerCols).toEqual([0, 3]);
    for (const c of state.cycles)
      if (c.stand && c.stand.rulesVersion >= 4)
        expect(standReplayDiffers(c.stand, replayStand(c.stand))).toBe(false);
  });
});
