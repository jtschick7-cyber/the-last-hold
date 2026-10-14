// Plan T5.8: village trust (GDD §5.14.6, D146, D147): contract progress, steps,
// a step from each Triumphant stand, carry-over, never down; notices read it; it
// changes no number.
import { describe, expect, it } from 'vitest';
import { trustClosingLines } from '../../src/content/story/trust';
import { VILLAGE_IDS } from '../../src/content/villages';
import { noticeFor } from '../../src/core/contracts/notice';
import { holdBounty, provisions } from '../../src/core/contracts/rewards';
import { createNewGame } from '../../src/core/state/new-game';
import type { ContractInstance } from '../../src/core/state/game-state';
import { bandFor } from '../../src/core/story/band';
import {
  stepNeed,
  triumphantStand,
  trustBreakdown,
  winForVillage,
} from '../../src/core/story/trust';

const T0 = Date.UTC(2026, 9, 14, 8);

describe('trust (GDD §5.14.6)', () => {
  it('starts at each village’s primer level, with steps of 10, 15, 20 and 25 contracts', () => {
    const s = createNewGame('trust', T0);
    expect(VILLAGE_IDS.map((v) => s.story.trust[v].level)).toEqual([
      'wary',
      'cold',
      'hopeful',
      'wary',
      'cold',
    ]);
    expect(
      ['cold', 'wary', 'hopeful', 'trusting', 'sworn'].map((l) => stepNeed(l as never)),
    ).toEqual([10, 15, 20, 25, null]);
  });

  it('ten Kozly Hollow wins leave Cold, with one line for the step', () => {
    const s = createNewGame('trust', T0);
    for (let i = 0; i < 9; i++) expect(winForVillage(s, 'kozly-hollow')).toEqual([]);
    expect(winForVillage(s, 'kozly-hollow')).toEqual(['trust:kozly-hollow:wary']);
    expect(s.story.trust['kozly-hollow']).toEqual({
      level: 'wary',
      progress: 0,
      won: 10,
      triumphs: 0,
    });
  });

  it('a Triumphant stand raises every village a step, and counted progress carries over', () => {
    const s = createNewGame('trust', T0);
    for (let i = 0; i < 6; i++) winForVillage(s, 'kozly-hollow');
    const keys = triumphantStand(s);
    expect(keys).toContain('trust:kozly-hollow:wary');
    expect(keys).toHaveLength(5);
    expect(s.story.trust['kozly-hollow']).toMatchObject({
      level: 'wary',
      progress: 6,
      triumphs: 1,
    });
    expect(s.story.trust.mirograd.level).toBe('trusting');
  });

  it('never drops and stops at Sworn', () => {
    const s = createNewGame('trust', T0);
    for (let i = 0; i < 5; i++) triumphantStand(s);
    expect(VILLAGE_IDS.every((v) => s.story.trust[v].level === 'sworn')).toBe(true);
    expect(winForVillage(s, 'mirograd')).toEqual([]);
    expect(s.story.trust.mirograd.progress).toBe(0);
    expect(s.story.trust.mirograd.won).toBe(1);
  });

  it('explains itself: contracts toward the next step, wins and Triumphant stands', () => {
    const s = createNewGame('trust', T0);
    for (let i = 0; i < 6; i++) winForVillage(s, 'kozly-hollow');
    const b = trustBreakdown(s, 'kozly-hollow');
    expect(b.value).toBe(6);
    expect(b.breakdown.formula).toBe('6 of 10 contracts toward Wary');
    expect(b.breakdown.children?.map((c) => c.value)).toEqual([6, 0]);
  });

  it('only a Triumphant stand raises it: bands from 9 and 12 waves (D145)', () => {
    expect([8, 9, 11, 12, 20].map(bandFor)).toEqual([
      'broken',
      'held',
      'held',
      'triumphant',
      'triumphant',
    ]);
  });

  it('notices close with the trust line once a village is above where it started (D180)', () => {
    const c: ContractInstance = {
      id: 'n1',
      village: 'kozly-hollow',
      monster: 'wolf',
      tier: 1,
      location: 'forest',
      arrivedAt: T0,
      revealed: 0,
    };
    const plain = noticeFor(c, 'seed', 1, 'cold').text;
    expect(noticeFor(c, 'seed', 1, 'hopeful').text).toBe(`${plain} ${trustClosingLines.hopeful}`);
    // Mirograd starts Hopeful: at Hopeful its notices stay as written.
    const m = { ...c, village: 'mirograd' as const, location: 'field' as const };
    expect(noticeFor(m, 'seed', 1, 'hopeful').text).toBe(noticeFor(m, 'seed', 1, null).text);
  });
});

describe('trust changes no number in v0.5 (D147)', () => {
  it('bounties and provisions read the same at any trust', () => {
    const cold = createNewGame('nums', T0);
    const sworn = createNewGame('nums', T0);
    for (let i = 0; i < 5; i++) triumphantStand(sworn);
    expect(holdBounty(sworn, 3, [[]], false)).toEqual(holdBounty(cold, 3, [[]], false));
    expect(provisions(sworn, 3, 3)).toEqual(provisions(cold, 3, 3));
  });
});
