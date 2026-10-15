// Plan T8.5 (technical design §5.2, D306–D318): the v7 → v8 migration, tested on the owner's real
// v0.7 save (tests/saves/fixtures/v7-owner.json, from the save code they pasted on 2026-10-15:
// cycle 19, Act IV, Bastion reached, the stand not yet made, a Delve paused on floor 2) and on
// v8.json, that save after the migration and played 72 h by the simulated player. v8 adds items
// (gear slots become equipped Common items with the same numbers), Legendaries, hunter ranks,
// stars, talents and keepsakes, trophies spent, and per-act family counters; Act V starts on
// load in a story-less cycle.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply } from '../../src/core/commands/apply';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { SCHEMA_VERSION, type GameState } from '../../src/core/state/game-state';
import { snapshotOf } from '../../src/core/systems/hunters';
import { itemById } from '../../src/core/systems/items';
import { actDue } from '../../src/core/story/act-start';
import { isFound } from '../../src/core/story/documents';
import { oldHunters, oldStats } from './old-view';

type Env = { schemaVersion: number; state: Record<string, unknown> };
const readFixture = (f: string): Env =>
  JSON.parse(readFileSync(new URL(`./fixtures/${f}`, import.meta.url), 'utf8')) as Env;
const load = (env: unknown): GameState => {
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  expect(r.value.warnings).toEqual([]);
  return r.value.state;
};
const roundTrip = (s: GameState): GameState => load(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))));

describe('the v7 → v8 migration on the owner’s real save', () => {
  const old = readFixture('v7-owner.json');
  const before = old.state as unknown as GameState;
  const fresh = (): GameState => load(readFixture('v7-owner.json'));
  const after = fresh();

  it('is a real v0.7 save: schema 7, cycle 19, Act IV, Bastion', () => {
    expect(SCHEMA_VERSION).toBe(8);
    expect(old.schemaVersion).toBe(7);
    expect(before.cycle).toEqual({ number: 19, age: 'bastion' });
    expect(after.meta.schemaVersion).toBe(8);
    expect(after.cycles[after.cycles.length - 1]?.act).toBe(4);
  });

  it('keeps everything the save had, apart from what v8 adds and changes', () => {
    for (const key of Object.keys(before) as (keyof GameState)[]) {
      if (key === 'meta') expect({ ...after.meta, schemaVersion: 7 }).toEqual(before.meta);
      else if (key === 'hunters') expect(oldHunters(after)).toEqual(before.hunters);
      else if (key === 'stats') expect(oldStats(after)).toEqual(before.stats);
      else if (key === 'story') {
        expect({ ...after.story, acts: [] }).toEqual({ ...before.story, acts: [] });
        expect(after.story.acts.map(({ winsByFamily: _f, ...a }) => a)).toEqual(
          before.story.acts.map(({ winsByFamily: _f, ...a }) => a),
        );
      } else expect(after[key], key).toEqual(before[key]);
    }
  });

  it('turns every worn piece into an equipped Common item with the same base, so the same numbers', () => {
    expect(after.items).toHaveLength(22); // 11 hunters × weapon and armor
    expect(after.itemSeq).toBe(22);
    for (const [id, h] of Object.entries(after.hunters)) {
      const was = before.hunters[id as keyof typeof before.hunters];
      for (const slot of ['weapon', 'armor'] as const) {
        const it = itemById(after, h[slot]);
        expect(it, `${id} ${slot}`).toMatchObject({
          base: was?.[slot],
          rarity: 'common',
          lines: [],
          where: { hunter: id, slot },
        });
      }
    }
    // What a fight sees is exactly what it saw.
    const snap = snapshotOf(after, 'halvar');
    expect([snap.weapon, snap.armorGear]).toEqual(['wrights-blade', 'emberwright-plate']);
  });

  it('gives Salvage what went in: the base tier’s step costs', () => {
    const halvar = itemById(after, after.hunters.halvar?.weapon ?? null);
    expect(halvar?.paid).toEqual({ iron: 1160, silver: 420 });
    const plate = itemById(after, after.hunters.halvar?.armor ?? null);
    expect(plate?.paid).toEqual({ iron: 900, silver: 150 });
    const hide = itemById(after, after.hunters.arvid?.armor ?? null);
    expect(hide?.paid).toEqual({ iron: 0, silver: 0 });
  });

  it('makes the seven hunters at level 5 or more Wrights, the other four Apprentices, with no stars or talents (D311)', () => {
    const wrights = Object.entries(after.hunters)
      .filter(([, h]) => h.rank === 'wright')
      .map(([id]) => id)
      .sort();
    expect(wrights).toEqual(['bjarna', 'halvar', 'herdis', 'ostap', 'radek', 'vesna', 'zora']);
    const apprentices = Object.entries(after.hunters)
      .filter(([, h]) => h.rank === 'apprentice')
      .map(([id]) => id)
      .sort();
    expect(apprentices).toEqual(['arvid', 'sigrun', 'stanko', 'toma']);
    for (const h of Object.values(after.hunters))
      expect(h).toMatchObject({ stars: 0, talents: [], keepsake: null });
    expect(after.stats.trophiesSpent).toBe(0);
  });

  it('finds the Legendary the bestiary already earned: the Wolf-Tooth String, waiting in Stores', () => {
    expect(after.legendaries).toEqual([{ id: 'wolf-tooth-string', cycle: 19 }]);
    expect(Object.values(after.hunters).every((h) => h.keepsake === null)).toBe(true);
  });

  it('keeps Act IV’s family counts and clears Acts I–III’s (D318)', () => {
    const [one, two, three, four] = after.story.acts;
    expect([one?.winsByFamily, two?.winsByFamily, three?.winsByFamily]).toEqual([{}, {}, {}]);
    expect(four?.winsByFamily).toEqual(before.story.acts[3]?.winsByFamily);
    expect(four?.winsByFamily).not.toEqual({});
  });

  it('keeps the paused Delve run as it was', () => {
    expect(after.delve).toEqual(before.delve);
    expect(after.delve.run?.stage.kind).toBe('offer');
  });

  it('reaches Act V with the next warden when the cycle-19 stand is made (Act IV’s cycle)', () => {
    const s = fresh();
    expect(actDue(s)).toBeNull(); // Act IV's scene has already played
    const party = ['halvar', 'zora', 'ostap', 'vesna', 'herdis', 'bjarna'] as const;
    s.delve.run = null; // a stand ends a paused Delve
    s.delve.unlitOpen = false; // the owner opened it with the debug switch
    const r = apply(s, { type: 'stand.make', party: [...party] }, s.time);
    expect(r.ok).toBe(true);
    expect(s.cycle.number).toBe(20);
    expect(s.cycles[s.cycles.length - 1]?.act).toBe(5);
    expect(isFound(s, 'D5-01')).toBe(true);
    expect(isFound(s, 'D4-06')).toBe(true);
    expect(s.items).toHaveLength(0); // everything but Legendaries resets
    expect(s.legendaries.map((l) => l.id)).toEqual(['wolf-tooth-string']);
    expect(Object.values(s.hunters).filter((h) => h.rank === 'wright')).toHaveLength(7);
    expect(s.delve.unlitOpen).toBe(false); // Act IV's stand does not open the door
    expect(roundTrip(s)).toEqual(s);
  });

  it('starts Act V on load when the same save was in a story-less cycle, with fresh counters (D246)', () => {
    const env = JSON.parse(JSON.stringify(old)) as Env;
    const cycles = env.state.cycles as { act: number | null }[];
    const last = cycles[cycles.length - 1];
    if (last) last.act = 5; // a cycle after Act IV's stand, when v7 had no Act V text: story-less
    const rows = (env.state.story as { acts: { act: number }[] }).acts;
    const four = rows.find((a) => a.act === 4);
    if (four) four.act = 5; // its recorded counters, which the migration drops
    const s = load(env);
    expect(s.cycles[s.cycles.length - 1]?.act).toBe(5);
    expect(s.story.acts.map((a) => a.act)).toEqual([1, 2, 3, 5]);
    expect(s.story.acts[3]).toMatchObject({
      act: 5,
      cycle: 19,
      wins: 0,
      ruinWins: 0,
      winsByFamily: {},
    });
    expect(actDue(s)).toBe(5);
    expect(apply(s, { type: 'story.startAct' }, s.time).ok).toBe(true);
    expect(s.story.documents.find((d) => d.id === 'D5-01')).toMatchObject({
      cycle: 19,
      via: 'arrival',
    });
    expect(actDue(s)).toBeNull();
    expect(apply(s, { type: 'story.startAct' }, s.time).ok).toBe(false); // once
    expect(roundTrip(s)).toEqual(s);
  });

  it('round-trips equal', () => {
    expect(roundTrip(after)).toEqual(after);
  });
});

describe('the v8 fixture (the owner’s save after the migration, played 72 h)', () => {
  it('loads and round-trips, and is on the current schema', () => {
    const env = readFixture('v8.json');
    expect(env.schemaVersion).toBe(8);
    const s = load(env);
    expect(s.meta.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.legendaries).toEqual([{ id: 'wolf-tooth-string', cycle: 19 }]);
    expect(roundTrip(s)).toEqual(s);
  });
});

describe('the v8 guard (technical design §5.2)', () => {
  const env = (): Env => JSON.parse(JSON.stringify(readFixture('v7-owner.json'))) as Env;
  const failsWith = (e: Env, text: string): void => {
    const r = loadEnvelope(e);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(text);
  };

  it('refuses a hunter wearing an item that does not exist', () => {
    const e = loadEnvelope(env());
    if (!e.ok) throw new Error(e.error);
    const saved = JSON.parse(encodeSaveFile(makeEnvelope(e.value.state, 0))) as Env;
    const hunters = saved.state.hunters as Record<string, { weapon: string }>;
    (hunters.halvar as { weapon: string }).weapon = 'i999';
    failsWith(saved, 'does not exist');
  });

  it('refuses an item whose lines do not match its rarity, and a stars count above 5', () => {
    const e = loadEnvelope(env());
    if (!e.ok) throw new Error(e.error);
    const make = (): Env => JSON.parse(encodeSaveFile(makeEnvelope(e.value.state, 0))) as Env;
    const a = make();
    const first = (a.state.items as { rarity: string }[])[0];
    if (!first) throw new Error('no items');
    first.rarity = 'rare';
    failsWith(a, 'lines for a rare item');
    const b = make();
    const bh = (b.state.hunters as Record<string, { stars: number }>).halvar;
    if (!bh) throw new Error('no halvar');
    bh.stars = 6;
    failsWith(b, 'stars');
  });

  it('drops an unknown or wrong-role talent and a Legendary no one has found, with a warning', () => {
    const e = loadEnvelope(env());
    if (!e.ok) throw new Error(e.error);
    const saved = JSON.parse(encodeSaveFile(makeEnvelope(e.value.state, 0))) as Env;
    const h = (
      saved.state.hunters as Record<string, { talents: string[]; keepsake: string | null }>
    ).halvar;
    if (!h) throw new Error('no halvar');
    h.talents = ['vanguard-wall-1', 'striker-edge-1', 'nonsense'];
    h.keepsake = 'rune-nail';
    const r = loadEnvelope(saved);
    if (!r.ok) throw new Error(r.error);
    expect(r.value.state.hunters.halvar).toMatchObject({
      talents: ['vanguard-wall-1'],
      keepsake: null,
    });
    expect(r.value.warnings.length).toBe(3);
  });
});
