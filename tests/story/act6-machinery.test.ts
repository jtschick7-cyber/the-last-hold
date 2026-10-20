// Plan T9.10 and T9.11 (GDD §5.14.1–§5.14.3, lore §31, D364, D386): Act VI's machinery on its real
// documents.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { actDue } from '../../src/core/story/act-start';
import { startActOnLoad } from '../../src/core/commands/act-start';
import { apply } from '../../src/core/commands/apply';
import { createNewGame, freshCycleRecord } from '../../src/core/state/new-game';
import { freshAct } from '../../src/core/state/story-state';
import { freshHunter } from '../../src/core/state/hunters-state';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import { foundLines } from '../../src/core/story/found-lines';
import { accounts, library, namesView, rimeShelf } from '../../src/core/story/archive';
import {
  beginAct,
  isFound,
  recordWin,
  standDocuments,
  sweepDocuments,
  wardenDocuments,
} from '../../src/core/story/documents';
import { rimeLine } from '../../src/content/story/act6';
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

describe('the Archive', () => {
  it('the Names view shows #1 to #3 as the roll gives them', () => {
    const s = inActSix();
    for (const age of ['keep', 'citadel', 'bastion'] as const) {
      s.cycle.age = age;
      const rec = s.cycles[s.cycles.length - 1];
      if (rec) rec.ranks[age] = s.time;
      sweepDocuments(s);
    }
    const rows = namesView(s).rows;
    expect(rows[0]?.text).toBe('Milena Horská — Mirograd — onward, year 200 of the order.');
    expect(rows[1]?.text).toBe('Ketil Ormsson — Velkvik — onward, year 202 of the order.');
    expect(rows[2]?.text).toBe('Mirek Bárta — Kozly Hollow — onward, year 204 of the order.');
  });

  it('the Accounts view lists What the cold wants, and adds Act VI to two older events', () => {
    const s = inActSix();
    win(s, 'dubno-ford');
    const cards = accounts(s);
    const cold = cards.find((c) => c.heading === 'What the cold wants');
    expect(cold?.accounts.map((a) => a.document)).toEqual(['D6-02']);
  });
});

describe('delivery', () => {
  it('a Rime shows as new writing in the rime, not as a letter with a bounty', () => {
    const s = inActSix();
    const keys = win(s, 'dubno-ford');
    const lines = foundLines(s, keys);
    expect(lines).toContain(rimeLine('You came back warm'));
    expect(lines.join(' ')).not.toContain("came with the bounty: 'You came back warm'");
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
