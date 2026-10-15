// Plan T7.1 and T7.5 (technical design §5.2, D245, D246, D267): the v6 → v7 migration, tested
// on the owner's real v0.6 save (tests/saves/fixtures/v6-owner.json, from the save code they
// pasted on 2026-10-14: cycle 19, Hamlet, Acts I to III complete, every cycle from 7 on with
// an act number but no story) and on v7.json, that save after it took the Act IV card and
// the simulated player played it 72 h. v7 adds the family wins, the Delve state, and puts
// Act IV on load in the current cycle with fresh counters.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply } from '../../src/core/commands/apply';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../../src/core/save';
import {
  SCHEMA_VERSION,
  type ContractInstance,
  type GameState,
} from '../../src/core/state/game-state';
import { startingDelve } from '../../src/core/state/delve-state';
import { createNewGame } from '../../src/core/state/new-game';
import { freshHunter } from '../../src/core/state/hunters-state';
import { snapshotOf } from '../../src/core/systems/hunters';
import { actFourDue } from '../../src/core/story/act4';
import { isFound, recordWin, sweepDocuments } from '../../src/core/story/documents';

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
const roundTrip = (s: GameState): GameState => load(JSON.parse(encodeSaveFile(makeEnvelope(s, 0))));
const win = (
  s: GameState,
  monster: ContractInstance['monster'],
  village: ContractInstance['village'],
) =>
  recordWin(s, {
    id: 'c',
    village,
    monster,
    tier: 2,
    location: 'field',
    arrivedAt: s.time,
    revealed: 3,
  });

describe('the v6 → v7 migration on the owner’s real save', () => {
  const old = readFixture('v6-owner.json');
  const before = old.state as unknown as GameState;
  const fresh = (): GameState => load(readFixture('v6-owner.json'));
  const after = fresh();

  it('is a real v0.6 save: schema 6, cycle 19, Hamlet', () => {
    expect(SCHEMA_VERSION).toBe(7);
    expect(old.schemaVersion).toBe(6);
    expect(before.cycle).toEqual({ number: 19, age: 'hamlet' });
    expect(after.meta.schemaVersion).toBe(7);
  });

  it('keeps everything the save had, apart from what v7 adds and re-bases', () => {
    const strip = (s: GameState['story']) => ({
      ...s,
      acts: s.acts.filter((a) => a.act <= 3).map(({ winsByFamily: _f, ...a }) => a),
    });
    expect(strip(after.story)).toEqual(strip(before.story));
    expect(after.story.documents).toEqual(before.story.documents);
    for (const key of Object.keys(before) as (keyof GameState)[]) {
      if (key === 'meta') expect({ ...after.meta, schemaVersion: 6 }).toEqual(before.meta);
      else if (key !== 'story' && key !== 'cycles') expect(after[key], key).toEqual(before[key]);
    }
  });

  it('puts Act IV on load in cycle 19: the story-less acts and their counters are gone (D246)', () => {
    expect(before.story.acts.map((a) => a.act)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
    ]);
    expect(after.story.acts.map((a) => [a.act, a.cycle])).toEqual([
      [1, 7],
      [2, 8],
      [3, 9],
      [4, 19],
    ]);
    expect(after.story.acts[3]).toEqual({
      act: 4,
      cycle: 19,
      startedAt: after.time,
      wins: 0,
      winsByVillage: {},
      ruinWins: 0,
      winsByFamily: {},
    });
    const acts = after.cycles.map((c) => c.act);
    expect(acts.slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(acts.slice(6, 9)).toEqual([1, 2, 3]);
    expect(acts.slice(9, 18)).toEqual(Array(9).fill(null));
    expect(acts[18]).toBe(4);
    // The stands of the story-less cycles keep their result and band.
    expect(after.cycles.map((c) => c.stand?.wavesHeld)).toEqual(
      before.cycles.map((c) => c.stand?.wavesHeld),
    );
  });

  it('plays D4-01 on load, finds nothing else (Hamlet), and the next Field & Forest win finds D4-02', () => {
    const s = fresh();
    expect(actFourDue(s)).toBe(true);
    expect(sweepDocuments(s)).not.toContain('doc:D4-01'); // only by the start
    expect(apply(s, { type: 'story.startActIV' }, s.time).ok).toBe(true);
    expect(s.story.documents.find((d) => d.id === 'D4-01')).toMatchObject({
      cycle: 19,
      via: 'arrival',
    });
    expect(s.story.documents.filter((d) => d.id.startsWith('D4-')).map((d) => d.id)).toEqual([
      'D4-01',
    ]);
    expect(actFourDue(s)).toBe(false);
    expect(apply(s, { type: 'story.startActIV' }, s.time).ok).toBe(false); // once
    // The Kikimora is Field & Forest; the Gaunt Wolf is not; Beasts & Wilds needs two.
    expect(win(s, 'wolf', 'dubno-ford')).not.toContain('doc:D4-02');
    expect(win(s, 'kikimora', 'dubno-ford')).toEqual(
      expect.arrayContaining(['doc:D4-02', 'name:21', 'name:22', 'name:24']),
    );
    expect(win(s, 'bies', 'velkvik')).toEqual(
      expect.arrayContaining(['doc:D4-03', 'name:25', 'name:26', 'name:27']),
    );
  });

  it('finds an Act IV Rank document on load only if the Rank is already behind the save this cycle', () => {
    const s = fresh();
    s.cycle.age = 'citadel';
    const rec = s.cycles[s.cycles.length - 1];
    if (!rec) throw new Error('no cycle');
    rec.ranks.keep = s.time;
    rec.ranks.citadel = s.time;
    expect(apply(s, { type: 'story.startActIV' }, s.time).ok).toBe(true);
    const ids = s.story.documents
      .filter((d) => d.id.startsWith('D4-'))
      .map((d) => d.id)
      .sort();
    expect(ids).toEqual(['D4-01', 'D4-04']); // the Citadel, not Bastion
    expect(isFound(s, 'D4-05')).toBe(false);
  });

  it('gives the Delves their starting state: nothing yet, the allowance starting now (a Keep was reached)', () => {
    expect(after.delve).toEqual({ ...startingDelve(), allowanceAt: after.time });
  });

  it('round-trips equal', () => {
    expect(roundTrip(after)).toEqual(after);
    const s = fresh();
    apply(s, { type: 'story.startActIV' }, s.time);
    expect(roundTrip(s)).toEqual(s);
  });
});

describe('v7 state', () => {
  it('a new game: Act I with no family wins, and the starting Delve state', () => {
    const g = createNewGame('seed', 1_000);
    expect(g.story.acts[0]?.winsByFamily).toEqual({});
    expect(g.delve).toEqual(startingDelve());
    expect(g.delve.allowanceAt).toBeNull();
  });

  it('a save in an Act I to III cycle is not re-based, and a Hamlet save has no allowance clock yet', () => {
    const env = readFixture('v6.json'); // the owner's older save, played: cycle 2, Act I
    const s = load(env);
    expect(s.story.acts.map((a) => a.act)).toEqual(
      (env.state.story as { acts: { act: number }[] }).acts.map((a) => a.act),
    );
    expect(s.cycles.map((c) => c.act)).toEqual(
      (env.state.cycles as { act: number | null }[]).map((c) => c.act),
    );
    expect(actFourDue(s)).toBe(false);
  });

  it('the v7.json fixture (the owner’s save after the Act IV card, played 72 h) loads and round-trips', () => {
    const env = readFixture('v7.json');
    expect(env.schemaVersion).toBe(7);
    const s = load(env);
    expect(isFound(s, 'D4-01')).toBe(true);
    expect(s.story.documents.find((d) => d.id === 'D4-01')?.via).toBe('arrival');
    expect(roundTrip(s)).toEqual(s);
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

describe('the saved Delve state (technical design §5.2)', () => {
  const withRun = (): GameState => {
    const s = createNewGame('delve', 1_000);
    s.hunters.ostap = freshHunter();
    s.delve.runs = 1;
    s.delve.riftglass = 12;
    s.delve.allowance = 40;
    s.delve.allowanceAt = 900;
    s.delve.sceneSeen = true;
    s.delve.shop = {
      lateHours: 2,
      traitsBought: ['halvar'],
      traitsActive: ['halvar'],
      cosmetics: ['wall-lanterns'],
      chosenStart: true,
      reroll: false,
    };
    s.delve.deep = { 'unlits-breath': { level: 2, kills: 1 } };
    s.delve.relics = [{ id: 'spindle-whorl', cycle: 1 }];
    s.delve.echoes = [{ id: 'E-01', cycle: 1, at: 800 }];
    s.delve.taken = { 'pale-smith': ['faint'] };
    s.delve.kills = { 'beasts-and-wilds': 4, deep: 1 };
    s.delve.guardiansBeaten = { 'unlits-breath': 1 };
    s.delve.run = {
      seed: `${s.meta.gameSeed}:delve:1`,
      baseTier: 2,
      floor: 3,
      party: ['halvar', 'zora', 'ostap'],
      snapshots: (['halvar', 'zora', 'ostap'] as const).map((id) => snapshotOf(s, id)),
      health: { halvar: 0.8, zora: 0, ostap: 0.45 },
      kills: 3,
      vigilUsed: false,
      lastFloor: {
        floor: 2,
        blessings: ['true-hammer'],
        health: { halvar: 1, zora: 1, ostap: 1 },
        kills: 1,
        vigilUsed: false,
        result: 'win',
      },
      blessings: ['true-hammer', 'toll'],
      stage: { kind: 'offer', patron: 'wolf', cards: ['long-teeth', 'hungry', 'heavy-jaw'] },
      lastDoors: ['pale-smith', 'drowned-bell'],
      unlitDoorsUsed: 0,
      rerollUsed: false,
      earned: {
        floors: 2,
        riftglass: 4,
        reagents: { 'river-pearl': 1 },
        echoes: [],
        relics: [],
        kills: 4,
        guardianBeaten: false,
      },
    };
    return s;
  };

  it('a paused run, the shop, relics and echoes round-trip equal', () => {
    const s = withRun();
    expect(roundTrip(s)).toEqual(s);
  });

  it('a finished run waiting for its sheet round-trips', () => {
    const s = withRun();
    const { earned } = s.delve.run ?? { earned: undefined };
    if (!earned) throw new Error('no run');
    s.delve.result = { ...earned, outcome: 'left', at: 1_500, allowanceLeft: 36, line: 1 };
    s.delve.run = null;
    expect(roundTrip(s)).toEqual(s);
  });

  it.each([
    [
      'a party of two',
      (s: GameState) => {
        if (s.delve.run) s.delve.run.party = ['halvar', 'zora'];
      },
    ],
    [
      'a floor past the guardian',
      (s: GameState) => {
        if (s.delve.run) s.delve.run.floor = 8;
      },
    ],
    [
      'a blessing taken twice',
      (s: GameState) => {
        if (s.delve.run) s.delve.run.blessings = ['toll', 'toll'];
      },
    ],
    [
      'an offer of an unknown blessing',
      (s: GameState) => {
        if (s.delve.run) s.delve.run.stage = { kind: 'offer', patron: 'wolf', cards: ['nope'] };
      },
    ],
    [
      'a sixth Late hours level',
      (s: GameState) => {
        s.delve.shop.lateHours = 6;
      },
    ],
  ])('refuses %s', (_name, damage) => {
    const s = withRun();
    damage(s);
    expect(loadEnvelope(JSON.parse(encodeSaveFile(makeEnvelope(s, 0)))).ok).toBe(false);
  });

  it('drops an unknown echo, relic family or guardian with a warning, not a crash', () => {
    const env = JSON.parse(encodeSaveFile(makeEnvelope(withRun(), 0))) as Env;
    const d = env.state.delve as {
      echoes: { id: string; cycle: number; at: number }[];
      deep: Record<string, unknown>;
      kills: Record<string, number>;
    };
    d.echoes.push({ id: 'E-99', cycle: 1, at: 1 });
    d.deep.nothing = { level: 1, kills: 1 };
    d.kills.dragons = 2;
    const r = loadEnvelope(env);
    if (!r.ok) throw new Error(r.error);
    expect(r.value.warnings.length).toBe(3);
    expect(r.value.state.delve.echoes.map((e) => e.id)).toEqual(['E-01']);
  });
});
