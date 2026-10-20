// Plan T9.2 (GDD §7.11, D370–D380, D387): the v0.9 constants exist once, with the §7.11 values.
// Every `boss.*` constant is locked (plan §0.6); every `hunt.*` one and `events.recentKeep` is tunable.
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { flattenBalance } from './flatten-balance';

const all = flattenBalance(balance);
const value = (key: string): unknown => all.get(key)?.value;

describe('GDD §7.11 Events constants', () => {
  it('boss.* starts at the §7.11 values', () => {
    expect(value('boss.partySize')).toBe(4);
    expect(value('boss.tokenInterval')).toBe(8 * 3600);
    expect(value('boss.tokenMax')).toBe(6);
    expect(value('boss.hunterRest')).toBe(24 * 3600);
    expect(value('boss.openAge')).toBe('citadel');
    expect(value('boss.order')).toEqual(['lindworm', 'barrow-king', 'mother-of-the-river']);
    expect(value('boss.poolBase')).toBe(24000);
    expect(value('boss.baseTier')).toEqual({ citadel: 4, bastion: 5 });
    expect(value('boss.passTierStep')).toBe(1);
    expect(value('boss.milestones')).toEqual([0.25, 0.5, 0.75, 1.0]);
    expect(value('boss.silverBounties')).toEqual({ milestone: 1, kill: 3 });
    expect(value('boss.reagents')).toEqual({ milestone: 3, kill: 6 });
    expect(value('boss.itemChance')).toBe(1);
    expect(value('boss.itemRarityWeights')).toEqual({ fine: 40, rare: 40, heroic: 20 });
    expect(value('boss.xpPerTier')).toBe(15);
    expect(value('boss.previewSamples')).toBe(100);
  });

  it('hunt.* and events.recentKeep start at the §7.11 values', () => {
    expect(value('hunt.unlockPoints')).toBe(100);
    expect(value('hunt.trackPoints')).toEqual({
      I: { win: 12, loss: 4 },
      II: { win: 20, loss: 6 },
      III: { win: 32, loss: 10 },
    });
    expect(value('hunt.trackTiers')).toEqual([3, 4, 5]);
    expect(value('hunt.xpPerTier')).toBe(15);
    expect(value('hunt.lossXpShare')).toBe(0.5);
    expect(value('hunt.replayReagents')).toBe(1);
    expect(value('events.recentKeep')).toBe(10);
  });

  it('locks the whole boss.* namespace and nothing else here', () => {
    const boss = [...all.keys()].filter((k) => k.startsWith('boss.'));
    expect(boss).toHaveLength(16);
    for (const k of boss) expect(all.get(k)?.locked, k).toBe(true);
    for (const k of [...all.keys()].filter((k) => /^(hunt|events)\./.test(k)))
      expect(all.get(k)?.locked, k).toBe(false);
  });

  it('keeps the visit at about 12 attempts on paper: the sketch pool at tier 4 is 32,400 (D360)', () => {
    const tier4 = (value('boss.poolBase') as number) * 1.35;
    expect(Math.round(tier4)).toBe(32400);
  });
});
