// Plan T6.3: the v5 → v6 migration, tested on the owner's real v0.5 save
// (tests/saves/fixtures/v5-owner.json, from the save code they pasted on 2026-10-14:
// cycle 2, Act I, after the v0.4 arrival's four-wave stand), and on v5.json, a v5 save
// with a brew in the kettles. v6 adds the recipe book, warden skills, experiment jobs,
// six store slots, the Alchemy level on records and each stand's band (D218).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { INGREDIENT_IDS } from '../../src/content/ingredients';
import { ingredientProperties } from '../../src/content/properties';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { migrations } from '../../src/core/save/migrations';
import { startingBook } from '../../src/core/state/book-state';
import type { GameState, StandRecord } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';

const FIXTURES = new URL('./fixtures/', import.meta.url);
type Env = { schemaVersion: number; state: Record<string, unknown> };
const readFixture = (f: string): Env =>
  JSON.parse(readFileSync(new URL(f, FIXTURES), 'utf8')) as Env;
const load = (env: unknown): GameState => {
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  expect(r.value.warnings).toEqual([]);
  return r.value.state;
};

const NEW_BREWS = [
  'hidebane-oil',
  'wrights-oil',
  'coldwater-draught',
  'owl-eye-drops',
  'steadfast-draught',
  'poppy-smoke',
] as const;

describe("the v5 → v6 migration on the owner's real save (plan T6.3)", () => {
  const old = readFixture('v5-owner.json');
  const after = load(old);
  const before = old.state as unknown as GameState;

  it('is a real v0.5 save: cycle 2, Act I, one recorded stand', () => {
    expect(old.schemaVersion).toBe(5);
    expect(before.cycle.number).toBe(2);
    expect(before.cycles[0]?.stand?.wavesHeld).toBe(4);
  });

  it("keeps everything the owner's save had", () => {
    const strip = (c: GameState['cycles'][number]) => {
      const { stand, ...rest } = c;
      if (!stand) return { ...rest, stand };
      const kept: Partial<StandRecord> = { ...stand };
      delete kept.band; // v6 adds the band and the Alchemy level
      delete kept.alchemy;
      return { ...rest, stand: kept };
    };
    for (const key of Object.keys(before) as (keyof GameState)[]) {
      if (key === 'meta') expect({ ...after.meta, schemaVersion: 5 }).toEqual(before.meta);
      else if (key === 'cycles') expect(after.cycles.map(strip)).toEqual(before.cycles);
      else if (key === 'story')
        // v7 adds each act's family wins (D245).
        expect({
          ...after.story,
          acts: after.story.acts.map(({ winsByFamily: _f, ...a }) => a),
        }).toEqual(before.story);
      else if (key === 'stores')
        expect(
          Object.fromEntries(
            Object.entries(after.stores).filter(([k]) => !NEW_BREWS.some((b) => b === k)),
          ),
        ).toEqual(before.stores);
      else if (key === 'log')
        expect(after.log.recentFights.map(({ alchemy: _a, ...f }) => f)).toEqual(
          before.log.recentFights,
        );
      else expect(after[key], key).toEqual(before[key]);
    }
  });

  it('opens the recipe book with the 15 properties the nine v0.3 recipes prove (D200)', () => {
    expect(after.book).toEqual(startingBook());
    const shown = INGREDIENT_IDS.flatMap((id) => after.book.properties[id]).length;
    expect(shown).toBe(15);
    for (const id of INGREDIENT_IDS)
      expect(after.book.properties[id], id).toEqual(
        ingredientProperties[id].flatMap((p, i) => (p.known ? [i] : [])),
      );
    expect(after.book.tried).toEqual([]);
  });

  it('starts every warden skill at 0 XP (D205)', () => {
    expect(after.skills).toEqual({ alchemy: 0, smithing: 0, lore: 0, command: 0 });
  });

  it('gives the six new brews empty store slots', () => {
    for (const b of NEW_BREWS) expect(after.stores[b], b).toBe(0);
  });

  it('records no Alchemy level on old fights, so every replay is unchanged (D206)', () => {
    expect(after.log.recentFights.length).toBeGreaterThan(0);
    for (const f of after.log.recentFights) expect(f.alchemy).toBe(0);
    expect(after.cycles[0]?.stand?.alchemy).toBe(0);
  });

  it('keeps the band the four-wave stand earned: Broken (D194)', () => {
    expect(after.cycles[0]?.stand?.band).toBe('broken');
  });

  it('round-trips equal', () => {
    expect(load(JSON.parse(encodeSaveFile(makeEnvelope(after, 0))))).toEqual(after);
  });
});

describe('the v5 → v6 migration on other v5 saves', () => {
  const step = migrations[5];
  if (!step) throw new Error('no v5 → v6 migration');

  it('a brew in the kettles records the v0.3 recipe it was paid with, so a cancel refunds it', () => {
    const s = load(readFixture('v5.json'));
    expect(s.queues.brewing).toEqual([
      {
        kind: 'brew',
        item: 'fire-pot',
        doneAt: 1792228200000,
        paid: { ingredients: { pitch: 1 }, resources: { wood: 1 } },
      },
    ]);
  });

  it('every past stand keeps the band the old thresholds (9 and 12) gave it (D194)', () => {
    const v5 = structuredClone(readFixture('v5.json').state) as Record<string, unknown>;
    const cycles = v5.cycles as { stand: { wavesHeld: number } | null }[];
    const bands: Record<number, string> = {
      0: 'broken',
      8: 'broken',
      9: 'held',
      11: 'held',
      12: 'triumphant',
      17: 'triumphant',
    };
    for (const [waves, band] of Object.entries(bands)) {
      const first = cycles[0];
      if (!first?.stand) throw new Error('fixture has no stand');
      first.stand.wavesHeld = Number(waves);
      const m = step(structuredClone(v5)) as unknown as GameState;
      expect(m.cycles[0]?.stand?.band, `${waves} waves`).toBe(band);
    }
  });

  it('a running contract is frozen at Alchemy 0 (D206)', () => {
    const v5 = structuredClone(readFixture('v5.json').state) as Record<string, unknown>;
    v5.running = [{ contract: { id: 'c1' }, party: [], snapshots: [] }];
    const m = step(v5) as unknown as { running: { alchemy: number }[] };
    expect(m.running[0]?.alchemy).toBe(0);
  });
});

describe('the v6.json fixture (the owner’s save, played 72 h by the simulated player)', () => {
  it('is a v6 save that loads without warnings and round-trips', () => {
    const env = readFixture('v6.json');
    expect(env.schemaVersion).toBe(6);
    const s = load(env);
    expect(s.cycle.number).toBe(2);
    expect(s.book).toEqual(startingBook());
    expect(load(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))))).toEqual(s);
  });
});

describe('v6 state (technical design §5.2)', () => {
  it('a new game opens the book and starts every skill at 0', () => {
    const g = createNewGame('seed', 1_000);
    expect(g.book).toEqual(startingBook());
    expect(g.skills).toEqual({ alchemy: 0, smithing: 0, lore: 0, command: 0 });
    for (const b of NEW_BREWS) expect(g.stores[b]).toBe(0);
  });

  it('an experiment in the kettles saves and loads', () => {
    const g = createNewGame('seed', 1_000);
    g.queues.brewing.push({ kind: 'experiment', a: 'yarrow', b: 'pitch', units: 1, doneAt: null });
    g.book.tried.push('yarrow+pitch');
    expect(load(JSON.parse(encodeSaveFile(makeEnvelope(g, 0))))).toEqual(g);
  });

  it('a bad book or kettle job is refused with a plain error', () => {
    const g = createNewGame('seed', 1_000);
    const env = JSON.parse(encodeSaveFile(makeEnvelope(g, 0))) as {
      state: Record<string, unknown>;
    };
    const bad = (mutate: (s: Record<string, unknown>) => void): boolean => {
      const copy = structuredClone(env);
      mutate(copy.state);
      return loadEnvelope(copy).ok;
    };
    expect(bad(() => undefined)).toBe(true);
    expect(bad((s) => ((s.book as { tried: string[] }).tried = ['pitch+yarrow']))).toBe(false);
    expect(bad((s) => ((s.book as { tried: string[] }).tried = ['yarrow+yarrow']))).toBe(false);
    expect(
      bad((s) => ((s.book as { properties: Record<string, number[]> }).properties.yarrow = [3])),
    ).toBe(false);
    expect(
      bad(
        (s) =>
          ((s.queues as { brewing: unknown[] }).brewing = [
            { kind: 'experiment', a: 'yarrow', b: 'yarrow', units: 1, doneAt: null },
          ]),
      ),
    ).toBe(false);
    expect(bad((s) => ((s.skills as Record<string, number>).lore = -1))).toBe(false);
  });
});
