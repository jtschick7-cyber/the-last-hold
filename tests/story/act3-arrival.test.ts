// Plan T6.7 (GDD §5.14.1, §8.5; lore-secrets §26; D211, D213, D214): Arvid arrives with Ilse
// when Act III begins, at the highest hunter's level within the Rank cap; a save in an
// unwritten act's cycle starts Act III on load; the debug "Start Act III"; D3-08.
import { describe, expect, it } from 'vitest';
import { hunters } from '../../src/content/hunters';
import { arvidArrival, arvidArrivalOnLoad } from '../../src/content/story/act3';
import { freshCycleRecord, createNewGame } from '../../src/core/state/new-game';
import { freshHunter } from '../../src/core/state/hunters-state';
import { freshAct } from '../../src/core/state/story-state';
import type { GameState } from '../../src/core/state/game-state';
import { candidates, levelCap, unlockMet } from '../../src/core/systems/hunters';
import { actThreeDue } from '../../src/core/story/act3';
import { isFound, sweepDocuments } from '../../src/core/story/documents';
import { T0, keepRich, run } from '../contracts/helpers';

/** A keep in Act II's cycle (cycle 2), ready to make the stand that begins Act III. */
const actTwo = (seed: string): GameState => {
  const s = keepRich(seed);
  s.cycle = { number: 2, age: 'bastion' };
  s.cycles.push(freshCycleRecord(2, s.time, 2));
  s.story.acts.push(freshAct(2, 2, s.time));
  s.story.ilseAt = s.time;
  return s;
};

/** A v0.5 save in the third cycle: Act III's counters began, but no story was written for it. */
const v05Cycle3 = (seed: string): GameState => {
  const s = createNewGame(seed, T0);
  s.cycle = { number: 3, age: 'keep' };
  s.cycles.push(freshCycleRecord(2, s.time, 2), freshCycleRecord(3, s.time, 3));
  s.story.acts.push(freshAct(2, 2, s.time), freshAct(3, 3, s.time));
  s.story.ilseAt = s.time;
  return s;
};

const stand = (s: GameState): void => {
  expect(run(s, { type: 'stand.make', party: ['halvar'] }).ok).toBe(true);
};

describe('Arvid arrives when Act III begins (D211)', () => {
  it('the stand that closes Act II brings him, with D3-01, after the next warden’s scene', () => {
    const s = actTwo('arvid-arrives');
    expect(s.hunters.arvid).toBeUndefined();
    stand(s);
    expect(s.cycle.number).toBe(3);
    expect(s.cycles[s.cycles.length - 1]?.act).toBe(3);
    expect(s.hunters.arvid).toBeDefined();
    expect(s.story.documents.find((d) => d.id === 'D3-01')).toMatchObject({
      cycle: 3,
      via: 'warden',
    });
    expect(s.story.unread).toContain('doc:D3-01');
    // The Long Night's order: D2-10 (the act's closing scene), then Ilse's return, then D3-01.
    const ids = s.story.documents.map((d) => d.id);
    expect(ids.indexOf('D2-10')).toBeLessThan(ids.indexOf('D3-01'));
  });

  it('joins at the highest level among the hunters after the halving, within the Rank cap', () => {
    const s = actTwo('arvid-level');
    const h = s.hunters.halvar;
    if (!h) throw new Error('no halvar');
    h.level = 14;
    stand(s);
    const kept = Math.max(...Object.values(s.hunters).map((x) => x?.level ?? 0));
    expect(s.hunters.arvid?.level).toBe(Math.min(kept, levelCap(s)));
    expect(s.hunters.arvid?.level).toBeGreaterThan(1);
  });

  it('never above the Rank cap, even when a kept level is higher', () => {
    const s = actTwo('arvid-cap');
    const h = s.hunters.halvar;
    if (!h) throw new Error('no halvar');
    h.level = 60; // kept levels may sit above the cap
    stand(s);
    expect(s.hunters.halvar?.level).toBeGreaterThan(levelCap(s));
    expect(s.hunters.arvid?.level).toBe(levelCap(s));
  });

  it('is active if there is room, else in the reserve', () => {
    const s = actTwo('arvid-room');
    stand(s);
    // The new cycle starts with the cap's worth of hunters active: he waits in the reserve.
    expect(s.roster.active).not.toContain('arvid');
    const t = createNewGame('arvid-room-2', T0);
    t.cycle = { number: 3, age: 'hamlet' };
    t.cycles.push(freshCycleRecord(2, t.time, 2), freshCycleRecord(3, t.time, 3));
    t.story.acts.push(freshAct(2, 2, t.time), freshAct(3, 3, t.time));
    t.roster.active = ['halvar'];
    expect(actThreeDue(t)).toBe(true);
    expect(run(t, { type: 'story.startActIII' }).ok).toBe(true);
    expect(t.roster.active).toEqual(['halvar', 'arvid']);
  });

  it('is not a recruit: no price, no candidate', () => {
    const s = actTwo('arvid-not-candidate');
    s.story.acts.push(freshAct(3, 3, s.time));
    expect(unlockMet(s, hunters.arvid.unlock)).toBe(false);
    expect(candidates(s).some((c) => c.id === 'arvid')).toBe(false);
    expect(run(s, { type: 'hunter.recruit', hunter: 'arvid' }).ok).toBe(false);
  });

  it('his level-5 letter comes with him when he arrives at level 5 or more', () => {
    const s = actTwo('arvid-letter');
    const h = s.hunters.halvar;
    if (!h) throw new Error('no halvar');
    h.level = 20;
    stand(s);
    expect(s.story.letters.some((l) => l.hunter === 'arvid' && l.slot === 0)).toBe(true);
  });
});

describe('Act III on load (D214)', () => {
  it('is due for a save whose cycle began an act with no story, and Arvid is not there', () => {
    const s = v05Cycle3('load-due');
    expect(actThreeDue(s)).toBe(true);
    expect(candidates(s).some((c) => c.id === 'arvid')).toBe(false);
  });

  it('is not due in Act I or II, before the arrival, or once Arvid is at the hold', () => {
    expect(actThreeDue(createNewGame('new', T0))).toBe(false);
    expect(actThreeDue(actTwo('act2'))).toBe(false);
    const pending = v05Cycle3('pending');
    pending.story.arrivalDue = true;
    expect(actThreeDue(pending)).toBe(false);
    const there = v05Cycle3('there');
    there.hunters.arvid = freshHunter();
    expect(actThreeDue(there)).toBe(false);
  });

  it('Arvid arrives, D3-01 plays, and a Rank already behind this cycle finds D3-04 and D3-05', () => {
    const s = v05Cycle3('load-start');
    s.cycle.age = 'bastion';
    const rec = s.cycles[s.cycles.length - 1];
    if (rec) {
      rec.ranks.citadel = s.time;
      rec.ranks.bastion = s.time;
    }
    expect(run(s, { type: 'story.startActIII' }).ok).toBe(true);
    expect(s.hunters.arvid).toBeDefined();
    for (const id of ['D3-01', 'D3-04', 'D3-05']) expect(isFound(s, id)).toBe(true);
    expect(s.story.documents.find((d) => d.id === 'D3-01')?.via).toBe('arrival');
    expect(s.story.names.map((n) => n.n)).toEqual(expect.arrayContaining([30, 32, 33, 36, 37]));
    // A second time: nothing to start.
    expect(run(s, { type: 'story.startActIII' }).ok).toBe(false);
  });

  it('a Rank not yet reached finds nothing but D3-01', () => {
    const s = v05Cycle3('load-start-low');
    expect(run(s, { type: 'story.startActIII' }).ok).toBe(true);
    expect(isFound(s, 'D3-01')).toBe(true);
    expect(isFound(s, 'D3-04')).toBe(false);
    expect(isFound(s, 'D3-05')).toBe(false);
  });

  it('refuses when nothing is due', () => {
    const r = run(actTwo('refuse'), { type: 'story.startActIII' });
    expect(r.ok).toBe(false);
  });

  it('the two arrival lines are content, not rules', () => {
    expect(arvidArrival).toContain('an old man with a net-needle and an axe');
    expect(arvidArrivalOnLoad).toContain('Ilse comes up the road early');
  });
});

describe('debug: Start Act III', () => {
  it('begins Act III in the current cycle for testing, once', () => {
    const s = createNewGame('debug-act3', T0);
    expect(s.story.acts.some((a) => a.act === 3)).toBe(false);
    expect(run(s, { type: 'debug.startActIII' }).ok).toBe(true);
    expect(s.story.acts.some((a) => a.act === 3 && a.cycle === 1)).toBe(true);
    expect(s.cycles[s.cycles.length - 1]?.act).toBe(3);
    expect(s.hunters.arvid).toBeDefined();
    expect(isFound(s, 'D3-01')).toBe(true);
    expect(s.meta.debugUsed).toBe(true);
    expect(run(s, { type: 'debug.startActIII' }).ok).toBe(false);
  });

  it('works for Arvid added by "Add Arvid", and for a save that is due on load', () => {
    const s = createNewGame('debug-act3-b', T0);
    expect(run(s, { type: 'debug.addArvid' }).ok).toBe(true);
    expect(run(s, { type: 'debug.startActIII' }).ok).toBe(true);
    expect(isFound(s, 'D3-01')).toBe(true);
    const t = v05Cycle3('debug-act3-c');
    expect(run(t, { type: 'debug.startActIII' }).ok).toBe(true);
    expect(t.hunters.arvid).toBeDefined();
  });
});

describe('D3-08: Arvid and Sigrun at the hold (D213)', () => {
  const both = (seed: string): GameState => {
    const s = v05Cycle3(seed);
    s.hunters.arvid = freshHunter();
    s.hunters.sigrun = freshHunter();
    return s;
  };

  it('is found once both are at the hold in Act III’s cycle or later, after D2-08', () => {
    const s = both('d308');
    s.story.documents.push({ id: 'D2-08', cycle: 3, at: s.time, via: 'roster' });
    expect(sweepDocuments(s)).toContain('doc:D3-08');
  });

  it('waits for D2-08, for Sigrun, for Arvid, and for Act III', () => {
    const noD208 = both('d308-a');
    expect(sweepDocuments(noD208)).not.toContain('doc:D3-08');
    const noSigrun = both('d308-b');
    delete noSigrun.hunters.sigrun;
    noSigrun.story.documents.push({ id: 'D2-08', cycle: 2, at: 0, via: 'roster' });
    expect(sweepDocuments(noSigrun)).not.toContain('doc:D3-08');
    const noArvid = both('d308-c');
    delete noArvid.hunters.arvid;
    noArvid.story.documents.push({ id: 'D2-08', cycle: 2, at: 0, via: 'roster' });
    expect(sweepDocuments(noArvid)).not.toContain('doc:D3-08');
    const early = both('d308-d');
    early.story.acts = early.story.acts.filter((a) => a.act !== 3);
    early.story.documents.push({ id: 'D2-08', cycle: 2, at: 0, via: 'roster' });
    expect(sweepDocuments(early)).not.toContain('doc:D3-08');
  });

  it('comes in the same sweep that finds D2-08, and is found only once', () => {
    const s = both('d308-chain');
    s.cycle.age = 'bastion';
    const rec = s.cycles[s.cycles.length - 1];
    if (rec) rec.ranks.bastion = s.time;
    const keys = sweepDocuments(s);
    expect(keys).toEqual(expect.arrayContaining(['doc:D2-08', 'doc:D3-08']));
    expect(s.story.documents.filter((d) => d.id === 'D3-08')).toHaveLength(1);
    expect(sweepDocuments(s)).toEqual([]);
  });

  it('arrives when Arvid arrives, if Sigrun was already there and D2-08 found', () => {
    const s = v05Cycle3('d308-arrive');
    s.hunters.sigrun = freshHunter();
    s.story.documents.push({ id: 'D2-08', cycle: 2, at: 0, via: 'roster' });
    expect(run(s, { type: 'story.startActIII' }).ok).toBe(true);
    expect(isFound(s, 'D3-08')).toBe(true);
  });
});
