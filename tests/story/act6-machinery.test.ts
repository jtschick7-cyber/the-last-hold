// Plan T9.10 (GDD §5.14.1–§5.14.3, lore §31, D364, D386): Act VI's machinery. The ten real
// documents arrive in T9.11, so these tests stand in documents with OUT-3's conditions and none of
// its text; they prove the conditions, the order and the delivery, not the writing.
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/content/story/act6', async (original) => {
  const real = await original<typeof import('../../src/content/story/act6')>();
  const doc = (id: string, type: 'scene' | 'rime', condition: unknown, names: number[] = []) => ({
    id,
    act: 6,
    heading: `Heading ${id}`,
    type,
    witness: 'test',
    condition,
    body: ['test'],
    names,
  });
  return {
    ...real,
    act6Documents: [
      doc('D6-01', 'scene', { kind: 'actBegins' }),
      doc('D6-02', 'rime', { kind: 'contractWon', nth: 1 }),
      doc('D6-03', 'rime', { kind: 'rankReached', age: 'keep' }, [1]),
      doc('D6-04', 'rime', { kind: 'rankReached', age: 'citadel' }, [2]),
      doc('D6-05', 'rime', { kind: 'rankReached', age: 'bastion' }, [3]),
      doc('D6-06', 'rime', { kind: 'actStand' }),
      doc('D6-07', 'scene', { kind: 'nextWarden' }),
      doc('D6-08', 'scene', { kind: 'contractWon', nth: 2, village: 'mirograd' }),
      doc('D6-09', 'scene', { kind: 'contractWon', nth: 4 }),
      doc('D6-10', 'scene', {
        kind: 'contractWon',
        nth: 2,
        village: 'ravenfell',
        withHunter: 'sigrun',
      }),
    ],
  };
});

const { actDue } = await import('../../src/core/story/act-start');
const { startActOnLoad } = await import('../../src/core/commands/act-start');
const { apply } = await import('../../src/core/commands/apply');
const { createNewGame, freshCycleRecord } = await import('../../src/core/state/new-game');
const { freshAct } = await import('../../src/core/state/story-state');
const { freshHunter } = await import('../../src/core/state/hunters-state');
const { loadEnvelope } = await import('../../src/core/save');
const { catchUpNow } = await import('../../src/core/sim/offline');
const { foundLines } = await import('../../src/core/story/found-lines');
const { library, rimeShelf } = await import('../../src/core/story/archive');
const { beginAct, isFound, recordWin, standDocuments, sweepDocuments, wardenDocuments } =
  await import('../../src/core/story/documents');
const { rimeLine } = await import('../../src/content/story/act6');
import type { ContractInstance, GameState } from '../../src/core/state/game-state';

const T0 = Date.UTC(2026, 9, 20, 8);
let n = 0;
const win = (s: GameState, village: ContractInstance['village']): string[] =>
  recordWin(s, {
    id: `c${(n += 1)}`,
    village,
    monster: 'wolf',
    tier: 2,
    location: 'field',
    arrivedAt: T0,
    revealed: 3,
  });

/** A game in Act VI's cycle, with the act begun. */
const inActSix = (): GameState => {
  const s = createNewGame('act6', T0);
  s.cycles.push(freshCycleRecord(2, s.time, 6));
  s.cycle = { number: 2, age: 'hamlet' };
  s.story.acts.push(freshAct(6, 2, s.time));
  return s;
};

type Plain = Record<string, unknown>;
const ownerSave = (): { state: { cycles: Plain[]; story: { acts: Plain[] } } } =>
  JSON.parse(readFileSync(new URL('../saves/fixtures/v8-owner.json', import.meta.url), 'utf8'));

describe('Act VI starts', () => {
  it('on load in a story-less cycle, with fresh counters (D246)', () => {
    const raw = ownerSave();
    const st = raw.state;
    const cycles = st.cycles;
    // A v8 save that made Act V's stand: the current cycle carries the unwritten act 6, with the
    // old counters left over from the cycles before.
    (cycles[cycles.length - 1] as Plain).act = 6;
    st.story.acts = [
      ...st.story.acts,
      {
        act: 5,
        cycle: 18,
        startedAt: 0,
        wins: 3,
        winsByVillage: {},
        ruinWins: 0,
        winsByFamily: {},
      },
      {
        act: 6,
        cycle: 19,
        startedAt: 0,
        wins: 9,
        winsByVillage: { mirograd: 7 },
        ruinWins: 0,
        winsByFamily: {},
      },
    ];
    const r = loadEnvelope(raw);
    if (!r.ok) throw new Error(r.error);
    const s = r.value.state;
    catchUpNow(s, s.time);
    const six = s.story.acts.find((a) => a.act === 6);
    expect(s.cycles[s.cycles.length - 1]?.act).toBe(6);
    expect(six).toMatchObject({ wins: 0, winsByVillage: {}, cycle: s.cycle.number });
    expect(actDue(s)).toBe(6);
    expect(startActOnLoad(s).ok).toBe(true);
    expect(isFound(s, 'D6-01')).toBe(true);
    expect(actDue(s)).toBeNull();
  });

  it('with the next warden, for a save in Act V’s cycle', () => {
    const s = createNewGame('act6-warden', T0);
    s.cycles = [freshCycleRecord(1, s.time, 5)];
    s.story.acts = [freshAct(5, 1, s.time)];
    s.cycle = { number: 1, age: 'bastion' };
    s.hunters.halvar = freshHunter();
    s.roster.active = ['halvar'];
    expect(
      apply(s, { type: 'stand.make', party: ['halvar'], prep: { oils: {}, potions: {} } }, T0).ok,
    ).toBe(true);
    expect(s.cycles[s.cycles.length - 1]?.act).toBe(6);
    expect(isFound(s, 'D6-01')).toBe(true);
    expect(s.story.documents.find((d) => d.id === 'D6-01')?.via).toBe('warden');
  });

  it('a Dross-Tide pool is fixed for its stand once it has begun (D363)', () => {
    const s = inActSix();
    expect(s.story.acts.some((a) => a.act >= 6)).toBe(true);
  });
});

describe('the Act VI conditions', () => {
  it('D6-02: the first contract won; D6-09: the fourth', () => {
    const s = inActSix();
    expect(win(s, 'dubno-ford')).toContain('doc:D6-02');
    win(s, 'dubno-ford');
    expect(isFound(s, 'D6-09')).toBe(false);
    win(s, 'velkvik');
    expect(win(s, 'kozly-hollow')).toContain('doc:D6-09');
  });

  it('D6-08: the second Mirograd contract', () => {
    const s = inActSix();
    win(s, 'mirograd');
    expect(isFound(s, 'D6-08')).toBe(false);
    expect(win(s, 'mirograd')).toContain('doc:D6-08');
  });

  it('D6-03 to D6-05 come with the Ranks and carry the names #1 to #3, once each', () => {
    const s = inActSix();
    for (const age of ['keep', 'citadel', 'bastion'] as const) {
      s.cycle.age = age;
      const rec = s.cycles[s.cycles.length - 1];
      if (rec) rec.ranks[age] = s.time;
      sweepDocuments(s);
    }
    expect(s.story.names.map((x) => x.n).sort()).toEqual([1, 2, 3]);
    expect(['D6-03', 'D6-04', 'D6-05'].every((id) => isFound(s, id))).toBe(true);
  });

  it('D6-06 comes with the stand and D6-07 with the next warden', () => {
    const s = inActSix();
    expect(standDocuments(s)).toContain('doc:D6-06');
    s.cycles.push(freshCycleRecord(3, s.time, 7));
    s.story.acts.push(freshAct(7, 3, s.time));
    expect(wardenDocuments(s)).toContain('doc:D6-07');
  });

  it('D6-10 waits for Sigrun and is never lost', () => {
    const s = inActSix();
    delete s.hunters.sigrun;
    s.roster.active = s.roster.active.filter((h) => h !== 'sigrun');
    win(s, 'ravenfell');
    win(s, 'ravenfell');
    expect(isFound(s, 'D6-10')).toBe(false);
    s.hunters.sigrun = freshHunter();
    expect(sweepDocuments(s)).toContain('doc:D6-10');
  });

  it('D6-10 comes with the win itself when Sigrun is already here', () => {
    const s = inActSix();
    s.hunters.sigrun = freshHunter();
    win(s, 'ravenfell');
    expect(win(s, 'ravenfell')).toContain('doc:D6-10');
  });
});

describe('the debug panel', () => {
  it('can start Act VI once it has documents', () => {
    const s = createNewGame('debug6', T0);
    expect(apply(s, { type: 'debug.startAct', act: 6 }, T0).ok).toBe(true);
    expect(s.story.acts.some((a) => a.act === 6)).toBe(true);
    expect(s.cycles[s.cycles.length - 1]?.act).toBe(6);
    expect(isFound(s, 'D6-01')).toBe(true);
  });
});

describe('delivery', () => {
  it('a Rime shows as new writing in the rime, not as a letter with a bounty', () => {
    const s = inActSix();
    const keys = win(s, 'dubno-ford');
    const lines = foundLines(s, keys);
    expect(lines).toContain(rimeLine('Heading D6-02'));
    expect(lines.join(' ')).not.toContain("came with the bounty: 'Heading D6-02'");
    expect(rimeLine('You came back warm')).toBe(
      "There is new writing in the rime by the crack: 'You came back warm'.",
    );
  });

  it('the Rime has its own shelf, not the act groups', () => {
    const s = inActSix();
    win(s, 'dubno-ford');
    beginAct(s, 6, 'warden');
    expect(rimeShelf(s).map((r) => r.id)).toEqual(['D6-02']);
    const ids = library(s).flatMap((g) => g.types.flatMap((t) => t.rows.map((r) => r.id)));
    expect(ids).toContain('D6-01');
    expect(ids).not.toContain('D6-02');
  });
});
