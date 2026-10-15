// Plan T7.1 (technical design §5.2, D245, D267): schema v7 so far. The v6 → v7 step gives
// every act begun a family-win count; T7.5 adds the Delve state to this same step.
// Tested on the owner's real v0.6 save (tests/saves/fixtures/v6-owner.json, from the save
// code they pasted on 2026-10-14: cycle 19, Hamlet, Acts I to III complete), and on v7.json.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { SCHEMA_VERSION, type GameState } from '../../src/core/state/game-state';
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

describe('the v6 → v7 migration on the owner’s real save (plan T7.1)', () => {
  const old = readFixture('v6-owner.json');
  const before = old.state as unknown as GameState;
  const after = load(old);

  it('is a real v0.6 save: schema 6, cycle 19', () => {
    expect(SCHEMA_VERSION).toBe(7);
    expect(old.schemaVersion).toBe(6);
    expect(before.cycle.number).toBe(19);
    expect(after.meta.schemaVersion).toBe(7);
  });

  it('gives every act begun an empty family-win count and changes nothing else', () => {
    expect(after.story.acts.length).toBe(before.story.acts.length);
    for (const a of after.story.acts) expect(a.winsByFamily).toEqual({});
    const strip = (s: GameState['story']) => ({
      ...s,
      acts: s.acts.map(({ winsByFamily: _f, ...a }) => a),
    });
    expect(strip(after.story)).toEqual(strip(before.story));
    for (const key of Object.keys(before) as (keyof GameState)[]) {
      if (key === 'meta') expect({ ...after.meta, schemaVersion: 6 }).toEqual(before.meta);
      else if (key !== 'story') expect(after[key], key).toEqual(before[key]);
    }
  });

  it('round-trips equal', () => {
    expect(load(JSON.parse(encodeSaveFile(makeEnvelope(after, 0))))).toEqual(after);
  });
});

describe('v7 state', () => {
  it('a new game’s Act I starts with no family wins', () => {
    expect(createNewGame('seed', 1_000).story.acts[0]?.winsByFamily).toEqual({});
  });

  it('the v7.json fixture loads without warnings and round-trips', () => {
    const env = readFixture('v7.json');
    expect(env.schemaVersion).toBe(7);
    const s = load(env);
    expect(load(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))))).toEqual(s);
  });

  it('a count for an unknown family is dropped with a warning', () => {
    const env = JSON.parse(JSON.stringify(readFixture('v7.json'))) as Env;
    const story = env.state.story as { acts: { winsByFamily: Record<string, number> }[] };
    (story.acts[0] as { winsByFamily: Record<string, number> }).winsByFamily = { dragons: 3 };
    const r = loadEnvelope(env);
    if (!r.ok) throw new Error(r.error);
    expect(r.value.warnings.some((w) => w.includes('dragons'))).toBe(true);
  });
});
