import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_LAYOUT,
  GRID_COLS,
  GRID_ROWS,
  PIECES,
  hallAnchorBounds,
  type HoldPieceId,
} from '../../src/content/hold-layout';
import { apply } from '../../src/core/commands/apply';
import { decodeSaveFile, encodeSaveFile } from '../../src/core/save/code';
import { makeEnvelope } from '../../src/core/save/envelope';
import { loadEnvelope } from '../../src/core/save/load';
import { v15ToV16 } from '../../src/core/save/migration-v16';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import {
  lanesFor,
  laneTableFor,
  layoutScore,
  suggestLayout,
  suggestLayoutFor,
} from '../../src/core/systems/breach';
import {
  footprint,
  getPieceStatus,
  inClearing,
  isPieceUnlocked,
} from '../../src/core/systems/layout';
import {
  canonicalLayout,
  clearingBounds,
  newLayoutState,
} from '../../src/core/systems/layout-catalog';
import { evaluateHoldTactics } from '../../src/core/systems/layout-tactics';

const NOW = 1_700_000_000_000;

const bastionFull = (seed = 'presets-modes-seed'): GameState => {
  const s = createNewGame(seed, NOW);
  expect(apply(s, { type: 'debug.layoutFillBastion' }, NOW).ok).toBe(true);
  return s;
};

const assertValidPlaced = (state: GameState): void => {
  const bounds = clearingBounds(state.cycle.age);
  const occupied = new Map<string, HoldPieceId>();
  for (const def of PIECES) {
    const at = state.layout.placed[def.id];
    const unlocked = isPieceUnlocked(state, def.id);
    if (unlocked) expect(at, `${def.id} unlocked must be placed`).toBeDefined();
    if (!at) continue;
    const fp = footprint(def, at);
    for (const tile of fp) {
      expect(tile.x).toBeGreaterThanOrEqual(0);
      expect(tile.x).toBeLessThan(GRID_COLS);
      expect(tile.y).toBeGreaterThanOrEqual(0);
      expect(tile.y).toBeLessThan(GRID_ROWS);
      if (unlocked) {
        expect(inClearing(bounds, tile), `${def.id} out of ${state.cycle.age} clearing`).toBe(true);
      }
      const key = `${tile.x},${tile.y}`;
      expect(occupied.has(key), `overlap at ${key} (${occupied.get(key)} & ${def.id})`).toBe(false);
      occupied.set(key, def.id);
    }
  }
};

describe('Layout presets, save compatibility & 3-mode arrange/suggest', () => {
  it('initializes presets: [null, null] on new game, canonical layout, and v15ToV16', () => {
    const s = createNewGame('preset-init', NOW);
    expect(s.layout.presets).toEqual([null, null]);
    expect(newLayoutState().presets).toEqual([null, null]);
    expect(canonicalLayout().presets).toEqual([null, null]);

    const v15 = JSON.parse(
      readFileSync(new URL('../saves/fixtures/v15-owner.json', import.meta.url), 'utf8'),
    ) as { state: Record<string, unknown> };
    const migrated = v15ToV16(v15.state) as { layout: { presets?: unknown } };
    expect(migrated.layout.presets).toEqual([null, null]);
  });

  it('loads v16 fixtures missing presets with zero warnings and defaults presets to [null, null]', () => {
    for (const name of ['v16.json', 'v16-played.json']) {
      const raw = JSON.parse(
        readFileSync(new URL(`../saves/fixtures/${name}`, import.meta.url), 'utf8'),
      ) as unknown;
      const loaded = loadEnvelope(raw);
      expect(loaded.ok).toBe(true);
      if (loaded.ok) {
        expect(loaded.value.warnings).toEqual([]);
        expect(loaded.value.state.layout.presets).toEqual([null, null]);
      }
    }
  });

  it('saves and applies compact presets within the 2048 B budget with zero side effects outside state.layout', () => {
    const s = bastionFull('preset-budget');
    const otherBefore = structuredClone({ ...s, layout: undefined });

    // Custom arrangement before saving slot 0.
    expect(apply(s, { type: 'layout.place', pieceId: 'hearth-hall', x: 6, y: 10 }, NOW).ok).toBe(
      true,
    );
    expect(apply(s, { type: 'layout.savePreset', slot: 0 }, NOW).ok).toBe(true);
    expect(apply(s, { type: 'layout.autoArrange', mode: 'fortress' }, NOW).ok).toBe(true);
    expect(apply(s, { type: 'layout.savePreset', slot: 1 }, NOW).ok).toBe(true);

    // Budget check (GDD §6.5): 40 placed pieces + 2 full presets <= 2,048 B.
    const layoutBytes = Buffer.byteLength(JSON.stringify(s.layout), 'utf8');
    expect(layoutBytes).toBeLessThanOrEqual(2048);

    // Clear and restore slot 0 cleanly.
    const snapshotAfterSave = structuredClone(s.layout.placed);
    expect(apply(s, { type: 'layout.clear' }, NOW).ok).toBe(true);
    expect(apply(s, { type: 'layout.applyPreset', slot: 0 }, NOW).ok).toBe(true);
    expect(s.layout.placed['hearth-hall']).toEqual({ x: 6, y: 10 });
    expect(s.layout.placed).not.toEqual(snapshotAfterSave);

    // Restoring slot 1 restores the fortress arrangement untouched.
    expect(apply(s, { type: 'layout.applyPreset', slot: 1 }, NOW).ok).toBe(true);
    expect(s.layout.placed).toEqual(snapshotAfterSave);
    assertValidPlaced(s);

    // Zero side effects outside state.layout.
    const otherAfter = structuredClone({ ...s, layout: undefined });
    expect(otherAfter).toEqual(otherBefore);

    // Round-trip save with populated presets.
    const text = encodeSaveFile(makeEnvelope(s, NOW));
    const decoded = decodeSaveFile(text);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.value.warnings).toEqual([]);
      expect(decoded.value.state.layout).toEqual(s.layout);
    }
  });

  it('refuses empty or invalid preset slots with zero state mutation', () => {
    const s = createNewGame('preset-refusal', NOW);
    const before = structuredClone(s);

    const emptyApply = apply(s, { type: 'layout.applyPreset', slot: 0 }, NOW);
    expect(emptyApply.ok).toBe(false);
    expect(s).toEqual(before);

    const badSave = apply(s, { type: 'layout.savePreset', slot: 2 as never }, NOW);
    expect(badSave.ok).toBe(false);
    expect(s).toEqual(before);

    const badApply = apply(s, { type: 'layout.applyPreset', slot: -1 as never }, NOW);
    expect(badApply.ok).toBe(false);
    expect(s).toEqual(before);
  });

  it('clamps Bastion hearth-hall into Hamlet clearing, preserves dormant-ring outer blueprints, and auto-places omitted pieces', () => {
    const s = createNewGame('preset-cross-rank', NOW);
    expect(apply(s, { type: 'debug.layoutFillBastion' }, NOW).ok).toBe(true);
    // Put hearth-hall near the bottom-right edge (outside Hamlet 6x6 clearing) & move wall-1 to north row 0.
    expect(apply(s, { type: 'layout.place', pieceId: 'hearth-hall', x: 6, y: 10 }, NOW).ok).toBe(
      true,
    );
    expect(apply(s, { type: 'layout.savePreset', slot: 0 }, NOW).ok).toBe(true);

    // Rewind to a Hamlet save with walls = 0 & watchtower = 0 (so outer defenses become dormant-ring)
    // and farm-1 unlocked, while resetting placed & keeping preset 0.
    const hamlet = createNewGame('preset-hamlet-target', NOW);
    hamlet.cycle.age = 'hamlet';
    hamlet.buildings.farm = 1;
    hamlet.layout.presets = structuredClone(s.layout.presets);

    // Force preset slot 0 to omit 'farm-1' (simulate piece built after saving the preset).
    const existingSlot0 = hamlet.layout.presets[0];
    if (!existingSlot0) throw new Error('expected saved preset slot 0');
    const slot0 = [...existingSlot0];
    const farmIdx = PIECES.findIndex((p) => p.id === 'farm-1');
    slot0[farmIdx] = null;
    hamlet.layout.presets[0] = slot0;

    expect(apply(hamlet, { type: 'layout.applyPreset', slot: 0 }, NOW).ok).toBe(true);
    const hallBounds = hallAnchorBounds(clearingBounds('hamlet'));
    const hallAt = hamlet.layout.placed['hearth-hall'];
    if (!hallAt) throw new Error('expected hearth-hall placement after applyPreset');
    expect(hallAt.x).toBeGreaterThanOrEqual(hallBounds.minX);
    expect(hallAt.x).toBeLessThanOrEqual(hallBounds.maxX);
    expect(hallAt.y).toBeGreaterThanOrEqual(hallBounds.minY);
    expect(hallAt.y).toBeLessThanOrEqual(hallBounds.maxY);

    // Outer defense from Bastion preset outside Hamlet clearing stays as dormant-ring/locked blueprint.
    expect(getPieceStatus(hamlet, 'watchtower-1')).not.toBe('active');
    expect(hamlet.layout.placed['watchtower-1']).toBeDefined();
    // Newly unlocked farm-1 omitted from the preset was auto-placed inside Hamlet clearing.
    assertValidPlaced(hamlet);
  });

  it('supports balanced, economy, and fortress modes in autoArrange across all Ages', () => {
    const bal = bastionFull('modes-bal');
    expect(apply(bal, { type: 'layout.autoArrange', mode: 'balanced' }, NOW).ok).toBe(true);
    expect(bal.layout.placed).toEqual(CANONICAL_LAYOUT);
    assertValidPlaced(bal);

    const econ = bastionFull('modes-econ');
    expect(apply(econ, { type: 'layout.autoArrange', mode: 'economy' }, NOW).ok).toBe(true);
    assertValidPlaced(econ);

    const fort = bastionFull('modes-fort');
    expect(apply(fort, { type: 'layout.autoArrange', mode: 'fortress' }, NOW).ok).toBe(true);
    assertValidPlaced(fort);

    // Unlinked clear-rebuilt baseline: compare Economy tactics vs cleared-then-minimal.
    const unlinked = createNewGame('modes-unlinked', NOW);
    expect(apply(unlinked, { type: 'debug.unlockAge', age: 'bastion' }, NOW).ok).toBe(true);
    unlinked.buildings = structuredClone(econ.buildings);
    const econTactics = evaluateHoldTactics(econ);
    expect(econTactics.links.length).toBeGreaterThanOrEqual(10);
    expect(econTactics.productionBonus.food).toBeGreaterThan(0);
    expect(econTactics.productionBonus.wood).toBeGreaterThan(0);
    expect(econTactics.productionBonus.iron).toBeGreaterThan(0);
    expect(econTactics.hearthWarded).toBe(true);

    // Fortress mode builds connected north ramparts, Screened Watchtowers, Warded hearth, and Sector Support.
    const fortTactics = evaluateHoldTactics(fort);
    const fortTable = laneTableFor(fort);
    const fortLanes = lanesFor(fort.meta.gameSeed, 12);
    const fortWaves = Array.from({ length: 8 }, (_, c) => fortLanes.filter((l) => l === c).length);
    expect(fortTactics.connectedWalls.size).toBeGreaterThanOrEqual(4);
    expect(fortTactics.screenedTowers.size).toBeGreaterThanOrEqual(1);
    expect(fortTactics.hearthWarded).toBe(true);
    expect(fortTable.sectorCols?.some((c) => c > 0)).toBe(true);
    expect(layoutScore(fortTable, fortWaves)).toBeGreaterThanOrEqual(
      layoutScore(laneTableFor(econ), fortWaves),
    );

    // Every earlier Age stays inside its clearing with zero overlaps in both economy & fortress modes.
    for (const age of ['hamlet', 'keep', 'citadel'] as const) {
      for (const mode of ['balanced', 'economy', 'fortress'] as const) {
        const st = createNewGame(`age-${age}-${mode}`, NOW);
        expect(apply(st, { type: 'debug.unlockAge', age }, NOW).ok).toBe(true);
        st.buildings.farm = 3;
        st.buildings['woodcutters-camp'] = 3;
        st.buildings.walls = age === 'citadel' ? 5 : 0;
        st.buildings.watchtower = age === 'citadel' ? 3 : 0;
        expect(apply(st, { type: 'layout.autoArrange', mode }, NOW).ok).toBe(true);
        assertValidPlaced(st);
      }
    }
  });

  it('runs 3-mode suggestLayout atomically as defense-only within < 20 ms', () => {
    const s = bastionFull('suggest-modes');
    const lanes = lanesFor(s.meta.gameSeed, 12);
    const waves = Array.from({ length: 8 }, (_, c) => lanes.filter((l) => l === c).length);
    const nonDefenseBefore = structuredClone(
      Object.fromEntries(
        Object.entries(s.layout.placed).filter(
          ([id]) => !id.startsWith('wall-') && !id.startsWith('watchtower-'),
        ),
      ),
    );

    for (const mode of ['balanced', 'economy', 'fortress'] as const) {
      const copy = structuredClone(s);
      const out = suggestLayoutFor(copy, lanes, mode);
      let best = Infinity;
      for (let i = 0; i < 5; i++) {
        const t0 = performance.now();
        suggestLayoutFor(copy, lanes, mode);
        best = Math.min(best, performance.now() - t0);
      }
      expect(best).toBeLessThan(20);
      expect(
        out.moves.every(
          (m) => m.pieceId.startsWith('wall-') || m.pieceId.startsWith('watchtower-'),
        ),
      ).toBe(true);
      expect(apply(copy, { type: 'layout.setDefenses', moves: [...out.moves] }, NOW).ok).toBe(true);
      assertValidPlaced(copy);
      for (const [id, coord] of Object.entries(nonDefenseBefore)) {
        expect(copy.layout.placed[id as HoldPieceId]).toEqual(coord);
      }
      expect(layoutScore(laneTableFor(copy), waves)).toBeCloseTo(out.score, 9);
    }

    const defaultOut = suggestLayout(s);
    const balancedOut = suggestLayout(s, 'balanced');
    expect(defaultOut).toEqual(balancedOut);
  });
});
