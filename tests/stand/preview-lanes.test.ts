// Plan TB.7a (technical design §23.5, D590): the Last Stand preview carries the lane table built from the
// layout now and the real stand's seed. Practice stands take their species and dice from their own seeds
// and their lanes from the real stand's (wave n takes the real stand's lane n).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply } from '../../src/core/commands/apply';
import { loadEnvelope } from '../../src/core/save';
import { previewFor, previewInputFor, standInputFor } from '../../src/core/stand/from-state';
import { at, practiceWaves, previewStand } from '../../src/core/stand/preview';
import { runStand } from '../../src/core/stand/engine';
import type { GameState } from '../../src/core/state/game-state';
import { requestStandPreview } from '../../src/ui/app/odds-client';

const load = (): GameState => {
  const env = JSON.parse(
    readFileSync(new URL('../saves/fixtures/v15.json', import.meta.url), 'utf8'),
  ) as unknown;
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  return r.value.state;
};
const party = (s: GameState) => s.roster.active.slice(0, 6);
const kit = { oils: {}, potions: {} };
/** Walls and Watchtower at their top level, so the layout has room to matter. */
const strong = (s: GameState): GameState => {
  s.buildings.walls = 15;
  s.buildings.watchtower = 15;
  return s;
};
const SAMPLES = 40; // the count only keeps the test quick; the equality below also runs the real 100

describe('the preview request', () => {
  it('carries the lane table and the real stand’s seed, and no layout', () => {
    const s = load();
    const input = previewInputFor(s, party(s), kit, SAMPLES);
    expect(input.stand.lanes).toBeDefined();
    expect(input.stand.seed).toBe(standInputFor(s, party(s), kit).seed);
    const text = JSON.stringify(input);
    expect(text).not.toContain('"placed"');
    expect(text).not.toContain('"tray"');
    expect(Object.keys(input.stand.lanes ?? {}).sort()).toEqual(['k', 'pieces', 'towerCols']);
  });
});

describe('the practice stands use the real stand’s lanes', () => {
  it('for the Auto-arrange layout the preview equals 100 practice stands run by hand', () => {
    const s = load();
    expect(apply(s, { type: 'layout.autoArrange' }, s.time).ok).toBe(true);
    const stand = standInputFor(s, party(s), kit);
    const held: number[] = [];
    for (let i = 0; i < 100; i++)
      held.push(runStand({ ...stand, rolls: `${stand.seed}:practice:${i}` }).wavesHeld);
    held.sort((a, b) => a - b);
    const preview = previewFor(s, party(s), kit);
    expect(preview.samples).toBe(100);
    expect(preview.median).toBe(at(held, 0.5));
    expect(preview.p10).toBe(at(held, 0.1));
    expect(preview.p90).toBe(at(held, 0.9));
  });

  it('moving a piece changes the preview', () => {
    const s = strong(load());
    const canonical = practiceWaves(standInputFor(s, party(s), kit), SAMPLES);
    const placed = Object.keys(s.layout.placed).filter((id) => /^(wall|watchtower)-/.test(id));
    expect(placed.length).toBeGreaterThan(0);
    for (const id of placed)
      expect(apply(s, { type: 'layout.unplace', pieceId: id as never }, s.time).ok).toBe(true);
    const lifted = practiceWaves(standInputFor(s, party(s), kit), SAMPLES);
    expect(lifted).not.toEqual(canonical);
  });

  it('with every defense in the Tray the preview shows the cost, and the table counts nothing', () => {
    const s = strong(load());
    const withDefenses = previewStand(previewInputFor(s, party(s), kit, SAMPLES));
    apply(s, { type: 'layout.clear' }, s.time);
    const input = previewInputFor(s, party(s), kit, SAMPLES);
    expect(input.stand.lanes?.pieces).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(input.stand.lanes?.towerCols).toEqual([]);
    const bare = previewStand(input);
    expect(bare.median).toBeLessThanOrEqual(withDefenses.median);
    expect(bare.p90).toBeLessThanOrEqual(withDefenses.p90);
    expect(
      bare.p10 < withDefenses.p10 ||
        bare.median < withDefenses.median ||
        bare.p90 < withDefenses.p90,
    ).toBe(true);
  });

  it('is the same on every call (same seeds, same lanes)', () => {
    const s = load();
    const a = previewStand(previewInputFor(s, party(s), kit, SAMPLES));
    expect(previewStand(previewInputFor(s, party(s), kit, SAMPLES))).toEqual(a);
  });
});

describe('stale requests are dropped', () => {
  it('an older request that finishes after a newer one is answered null', async () => {
    const s = load();
    const first = requestStandPreview(previewInputFor(s, party(s), kit, 5));
    const second = requestStandPreview(previewInputFor(s, party(s), kit, 5));
    expect(await first).toBeNull();
    expect((await second)?.preview.samples).toBeGreaterThan(0);
  });
});
