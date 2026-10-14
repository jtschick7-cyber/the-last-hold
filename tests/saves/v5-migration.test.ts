// Plan T5.3: the v4 → v5 migration, tested on the owner's real v0.4 save
// (tests/saves/fixtures/v4-owner.json, from the save code they pasted on 2026-10-14:
// cycle 2, back at the Hamlet after the v0.4 arrival's Long Night).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { VILLAGE_IDS } from '../../src/content/villages';
import { startingTrust } from '../../src/content/story/trust';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import { migrations } from '../../src/core/save/migrations';
import { createNewGame } from '../../src/core/state/new-game';
import { shiftClock } from '../../src/core/state/shift';
import type { GameState } from '../../src/core/state/game-state';

const FIXTURES = new URL('./fixtures/', import.meta.url);
const readFixture = (f: string): { schemaVersion: number; state: Record<string, unknown> } =>
  JSON.parse(readFileSync(new URL(f, FIXTURES), 'utf8')) as {
    schemaVersion: number;
    state: Record<string, unknown>;
  };
const load = (env: unknown): GameState => {
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  expect(r.value.warnings).toEqual([]);
  return r.value.state;
};

describe('the v4 → v5 migration (plan T5.3)', () => {
  const old = readFixture('v4-owner.json');
  const after = load(old);
  const before = old.state as unknown as GameState;

  it('is a real v0.4 save, past its v0.4 arrival', () => {
    expect(old.schemaVersion).toBe(4);
    expect(before.arrivalDue).toBe(false);
    expect(before.cycle.number).toBe(2);
  });

  it("keeps everything the owner's save had", () => {
    for (const key of Object.keys(before) as (keyof GameState)[]) {
      if (key === 'meta') expect({ ...after.meta, schemaVersion: 4 }).toEqual(before.meta);
      else if (key === 'cycles')
        expect(after.cycles.map(({ act: _a, warden: _w, ...rest }) => rest)).toEqual(before.cycles);
      else expect(after[key], key).toEqual(before[key]);
    }
  });

  it('starts Act I at once, in the current cycle (D149); earlier cycles had no act', () => {
    expect(after.cycles.map((c) => c.act)).toEqual([null, 1]);
    expect(after.story.acts).toEqual([
      { act: 1, cycle: 2, startedAt: before.time, wins: 0, winsByVillage: {}, ruinWins: 0 },
    ]);
  });

  it('leaves every warden unnamed, for the arrival to ask (D152)', () => {
    expect(after.cycles.map((c) => c.warden)).toEqual([null, null]);
  });

  it('owes the save its v0.5 arrival; Ilse has not come yet and nothing is found', () => {
    expect(after.story.arrivalDue).toBe(true);
    expect(after.story.ilseAt).toBeNull();
    expect(after.story.documents).toEqual([]);
    expect(after.story.names).toEqual([]);
    expect(after.story.ribbonshades).toBe(0);
    expect(after.story.letters).toEqual([]);
    expect(after.story.unread).toEqual([]);
  });

  it("takes each hunter's highest level from what the save still knows", () => {
    expect(after.story.peakLevels).toEqual({ halvar: 1, zora: 1 });
  });

  it('gives every village its starting trust, with no progress (setting-primer §3)', () => {
    for (const v of VILLAGE_IDS)
      expect(after.story.trust[v], v).toEqual({
        level: startingTrust[v],
        progress: 0,
        won: 0,
        triumphs: 0,
      });
  });

  it('round-trips equal', () => {
    expect(load(JSON.parse(encodeSaveFile(makeEnvelope(after, 0))))).toEqual(after);
  });
});

describe('the v4 → v5 migration on other v4 saves', () => {
  const step = migrations[4];
  if (!step) throw new Error('no v4 → v5 migration');

  it('a save still owed its v0.4 arrival starts Act I with the cycle after it', () => {
    const v4 = readFixture('v4.json').state;
    const s = step({ ...structuredClone(v4), arrivalDue: true }) as unknown as GameState;
    expect(s.cycles[s.cycles.length - 1]?.act).toBeNull();
    expect(s.story.acts).toEqual([]);
    expect(s.story.arrivalDue).toBe(true);
  });

  it("a fallen hunter's level at death counts toward their highest level", () => {
    const v4 = structuredClone(readFixture('v4.json').state);
    v4.fallen = [{ hunter: 'bjarna', diedAt: 1, cycle: 1, contractId: 'c', level: 6 }];
    const s = step(v4) as unknown as GameState;
    expect(s.story.peakLevels.bjarna).toBe(6);
  });
});

describe('v5 state (technical design §5.2)', () => {
  it('a new game starts Act I in cycle 1, with no v0.5 arrival', () => {
    const g = createNewGame('seed', 5_000);
    expect(g.cycles[0]?.act).toBe(1);
    expect(g.cycles[0]?.warden).toBeNull();
    expect(g.story.arrivalDue).toBe(false);
    expect(g.story.acts).toEqual([
      { act: 1, cycle: 1, startedAt: 5_000, wins: 0, winsByVillage: {}, ruinWins: 0 },
    ]);
    expect(g.story.peakLevels).toEqual({ halvar: 1, zora: 1 });
  });

  it('the debug time skip moves the story times with the clock', () => {
    const s = createNewGame('seed', 1_000);
    s.story.documents.push({ id: 'D1-01', cycle: 1, at: 2_000, via: 'contract' });
    s.story.names.push({ n: 39, cycle: 1, at: 2_000 });
    s.story.letters.push({ hunter: 'ostap', slot: 0, cycle: 1, at: 2_000 });
    s.story.ilseAt = 2_000;
    shiftClock(s, 500);
    expect(s.story.acts[0]?.startedAt).toBe(1_500);
    expect(s.story.documents[0]?.at).toBe(2_500);
    expect(s.story.names[0]?.at).toBe(2_500);
    expect(s.story.letters[0]?.at).toBe(2_500);
    expect(s.story.ilseAt).toBe(2_500);
  });

  it('a full story state validates and round-trips', () => {
    const s = load(readFixture('v5.json'));
    s.story.documents.push({ id: 'D1-03', cycle: 1, at: s.time, via: 'contract' });
    s.story.names.push({ n: 8, cycle: 1, at: s.time });
    s.story.ribbonshades = 2;
    s.story.letters.push({ hunter: 'arvid', slot: 0, cycle: 1, at: s.time });
    s.story.trust.mirograd = { level: 'trusting', progress: 3, won: 40, triumphs: 1 };
    s.story.unread = ['doc:D1-03', 'letter:arvid:0'];
    const last = s.cycles[s.cycles.length - 1];
    if (last) last.warden = 'Dobromila';
    expect(load(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))))).toEqual(s);
  });

  it('drops an unknown document with a warning, and refuses a name found twice', () => {
    const env = structuredClone(readFixture('v5.json'));
    const story = env.state.story as Record<string, unknown[]>;
    story.documents = [{ id: 'D9-99', cycle: 1, at: 0, via: 'contract' }];
    const r = loadEnvelope(env);
    if (!r.ok) throw new Error(r.error);
    expect(r.value.warnings).toEqual(['Dropped unknown document "D9-99".']);
    const env2 = structuredClone(readFixture('v5.json'));
    (env2.state.story as Record<string, unknown[]>).names = [
      { n: 39, cycle: 1, at: 0 },
      { n: 39, cycle: 2, at: 1 },
    ];
    expect(loadEnvelope(env2).ok).toBe(false);
  });

  it('refuses a warden name longer than 24 characters', () => {
    const env = structuredClone(readFixture('v5.json'));
    const cycles = env.state.cycles as Record<string, unknown>[];
    const last = cycles[cycles.length - 1];
    if (last) last.warden = 'x'.repeat(25);
    expect(loadEnvelope(env).ok).toBe(false);
  });
});
