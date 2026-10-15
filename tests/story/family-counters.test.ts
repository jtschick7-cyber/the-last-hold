// Plan T8.2 (D300, D318): "every act's winsByFamily shows Act IV's numbers". On the owner's real
// v0.7 save (tests/saves/fixtures/v7-owner.json, cycle 19) the four acts do show the same family
// counts. They are separate counters all the same: the v6 → v7 migration gave every act an empty
// count at the same moment (v6 saves had none), and a won contract counts for every act begun
// (GDD §5.14.1, so an earlier act's documents stay obtainable). An act begun later starts at zero
// and the earlier ones carry on from where they were.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { families } from '../../src/content/damage';
import { monsters, type MonsterId } from '../../src/content/monsters';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import type { ContractInstance, GameState } from '../../src/core/state/game-state';
import { createNewGame, freshCycleRecord } from '../../src/core/state/new-game';
import { freshAct } from '../../src/core/state/story-state';
import { recordWin } from '../../src/core/story/documents';

const T0 = Date.UTC(2026, 9, 15, 8);
const load = (env: unknown): GameState => {
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  return r.value.state;
};
const win = (s: GameState, monster: MonsterId): void => {
  const c: ContractInstance = {
    id: `c-${s.story.acts.length}-${monster}`,
    village: 'mirograd',
    monster,
    tier: 1,
    location: 'field',
    arrivedAt: T0,
    revealed: 3,
  };
  recordWin(s, c);
};
const beginAct = (s: GameState, act: number): void => {
  s.cycle = { number: act, age: 'hamlet' };
  s.cycles.push(freshCycleRecord(act, s.time, act));
  s.story.acts.push(freshAct(act, act, s.time));
};
const total = (counts: Partial<Record<string, number>>): number => {
  let sum = 0;
  for (const n of Object.values(counts)) sum += n ?? 0;
  return sum;
};

describe('per-act family counters (T8.2, D318)', () => {
  it('the owner’s v0.7 save: all four acts show the same family counts, as separate counters', () => {
    // Read as saved (schema 7), before the v8 migration clears Acts I–III (D318).
    const env = JSON.parse(
      readFileSync(new URL('../saves/fixtures/v7-owner.json', import.meta.url), 'utf8'),
    ) as { state: GameState };
    const acts = env.state.story.acts;
    expect(acts.map((a) => a.act)).toEqual([1, 2, 3, 4]);
    // The reported symptom: identical counts in every act.
    for (const a of acts) expect(a.winsByFamily).toEqual(acts[3]?.winsByFamily);
    // Why: the counts all started at the v7 migration, and Act IV began then too, so each is
    // the number of contracts won since (Act IV's own total is its wins).
    expect(total(acts[3]?.winsByFamily ?? {})).toBe(acts[3]?.wins);
    expect(acts[0]?.wins).toBeGreaterThan(acts[3]?.wins ?? 0); // Act I's other counters go back further
    // Loaded through a save and a load, they are separate objects, not one shared counter.
    const s = load(JSON.parse(JSON.stringify(env)));
    for (let i = 0; i < s.story.acts.length; i++)
      for (let j = i + 1; j < s.story.acts.length; j++)
        expect(s.story.acts[i]?.winsByFamily).not.toBe(s.story.acts[j]?.winsByFamily);
    // The v8 migration keeps Act IV's counts and clears the rest, which nothing reads (D318).
    expect(s.story.acts.map((a) => total(a.winsByFamily))).toEqual([
      0,
      0,
      0,
      total(acts[3]?.winsByFamily ?? {}),
    ]);
  });

  it('after the next win, every act begun moves, each from its own base; an act begun later starts at zero', () => {
    const s = createNewGame('family-counters', T0);
    win(s, 'wolf'); // Act I only
    win(s, 'wolf');
    beginAct(s, 2);
    win(s, 'kikimora'); // Acts I and II
    beginAct(s, 3);
    const [one, two, three] = s.story.acts;
    expect(one?.winsByFamily).toEqual({ 'beasts-and-wilds': 2, 'field-and-forest-spirits': 1 });
    expect(two?.winsByFamily).toEqual({ 'field-and-forest-spirits': 1 });
    expect(three?.winsByFamily).toEqual({});
    win(s, 'wolf');
    expect(one?.winsByFamily).toEqual({ 'beasts-and-wilds': 3, 'field-and-forest-spirits': 1 });
    expect(two?.winsByFamily).toEqual({ 'beasts-and-wilds': 1, 'field-and-forest-spirits': 1 });
    expect(three?.winsByFamily).toEqual({ 'beasts-and-wilds': 1 });
    expect(families[monsters.wolf.family].name).toBe('Beasts & Wilds');
  });

  it('keeps each act’s counter its own through a save and a load', () => {
    const s = createNewGame('family-round-trip', T0);
    win(s, 'wolf');
    beginAct(s, 2);
    win(s, 'wolf');
    const back = load(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))));
    expect(back.story.acts.map((a) => a.winsByFamily)).toEqual([
      { 'beasts-and-wilds': 2 },
      { 'beasts-and-wilds': 1 },
    ]);
    expect(back.story.acts[0]?.winsByFamily).not.toBe(back.story.acts[1]?.winsByFamily);
  });
});
