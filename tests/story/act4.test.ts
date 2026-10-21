// Plan T7.1 (lore-secrets §28, D245): Act IV begins with the next warden, after Act III's
// stand: Pechko's bundle (D4-01) plays, and the act's counters start fresh. The save's
// on-load start (D246) is T7.5.
import { describe, expect, it } from 'vitest';
import { act4Arrival, act4ArrivalOnLoad } from '../../src/content/story/act4';
import { acts, actNumeral, LAST_WRITTEN_ACT } from '../../src/content/story/acts';
import { describeCondition, foundLine } from '../../src/core/story/archive';
import { allDocuments } from '../../src/content/story/acts';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame, freshCycleRecord } from '../../src/core/state/new-game';
import { freshAct } from '../../src/core/state/story-state';
import { T0, keepRich, run } from '../contracts/helpers';

/** A keep in Act III's cycle (cycle 3), ready to make the stand that begins Act IV. */
const actThree = (seed: string): GameState => {
  const s = keepRich(seed);
  s.cycle = { number: 3, age: 'bastion' };
  s.cycles.push(freshCycleRecord(2, s.time, 2), freshCycleRecord(3, s.time, 3));
  s.story.acts.push(freshAct(2, 2, s.time), freshAct(3, 3, s.time));
  s.story.ilseAt = s.time;
  return s;
};

describe('Act IV begins with the next warden (D245)', () => {
  it('Act IV is written, with the Keeper’s witness (Act VI is the last written act, D364)', () => {
    expect(LAST_WRITTEN_ACT).toBe(6);
    expect(acts.map((a) => a.act)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(actNumeral(4)).toBe('IV');
    expect(acts[3]?.heading).toBe('IV. The Keeper');
  });

  it('the stand that closes Act III brings D4-01 after D3-07, and Act IV’s counters start fresh', () => {
    const s = actThree('act4-arrives');
    expect(run(s, { type: 'stand.make', party: ['halvar'] }).ok).toBe(true);
    expect(s.cycle.number).toBe(4);
    expect(s.cycles[s.cycles.length - 1]?.act).toBe(4);
    const four = s.story.acts.find((a) => a.act === 4);
    expect(four).toMatchObject({ cycle: 4, wins: 0, ruinWins: 0, winsByFamily: {} });
    expect(s.story.documents.find((d) => d.id === 'D4-01')).toMatchObject({
      cycle: 4,
      via: 'warden',
    });
    expect(s.story.unread).toContain('doc:D4-01');
    const ids = s.story.documents.map((d) => d.id);
    expect(ids.indexOf('D3-07')).toBeLessThan(ids.indexOf('D4-01'));
    // No other Act IV document comes with the arrival in a Hamlet.
    expect(ids.filter((id) => id.startsWith('D4-'))).toEqual(['D4-01']);
  });

  it('a new game has no Act IV bundle, and Act II’s stand does not bring it', () => {
    const s = createNewGame('act4-not-yet', T0);
    expect(s.story.documents.some((d) => d.id === 'D4-01')).toBe(false);
  });

  it('describes the two new conditions in the Library’s "Found:" line', () => {
    const get = (id: string) => allDocuments.find((d) => d.id === id);
    const d1 = get('D4-01');
    const d2 = get('D4-02');
    const d3 = get('D4-03');
    if (!d1 || !d2 || !d3) throw new Error('missing Act IV documents');
    expect(describeCondition(d1)).toBe('Act IV begins');
    expect(describeCondition(d2)).toBe('the first Field & Forest Spirits contract won in Act IV');
    expect(describeCondition(d3)).toBe('the 2nd Beasts & Wilds contract won in Act IV');
    expect(foundLine(d2, { id: 'D4-02', cycle: 4, at: 0, via: 'contract' })).toBe(
      'Found: the first Field & Forest Spirits contract won in Act IV, cycle 4.',
    );
  });

  it('has the two arrival lines (lore-secrets §28)', () => {
    expect(act4Arrival).toContain('Pechko is waiting at the stove');
    expect(act4ArrivalOnLoad).toContain('before you’ve got your coat off'.replace('’', "'"));
  });
});
