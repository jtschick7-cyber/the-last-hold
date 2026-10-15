// Plan T8.7 (GDD §5.11.3, D309, D310, D328): hunter ranks and stars, the trophies on hand, and
// that they are kept through the Long Night.
import { describe, expect, it } from 'vitest';
import { buildHunter } from '../../src/core/combat/build';
import { mightEff } from '../../src/core/combat/stats';
import type { GameState } from '../../src/core/state/game-state';
import { hunterStat, snapshotOf } from '../../src/core/systems/hunters';
import { productionRate } from '../../src/core/systems/production';
import {
  growthPerLevel,
  peakLevel,
  rankUpView,
  starView,
  talentPointsAt,
  tiersOpen,
  trophiesOnHand,
  unspentTalentPoints,
} from '../../src/core/systems/ranks';
import { keepRich, run } from '../contracts/helpers';

const earn = (
  s: GameState,
  trophies: number,
  peak = 5,
  hunter: 'zora' | 'halvar' = 'zora',
): void => {
  s.stats.trophies = trophies;
  s.story.peakLevels[hunter] = peak;
};
const hunter = (s: GameState) => {
  const h = s.hunters.zora;
  if (!h) throw new Error('no zora');
  return h;
};

describe('trophies on hand (D328 (3))', () => {
  it('are the trophies earned this cycle minus those spent, never below 0', () => {
    const s = keepRich('hand');
    earn(s, 50);
    expect(trophiesOnHand(s)).toBe(50);
    s.stats.trophiesSpent = 20;
    expect(trophiesOnHand(s)).toBe(30);
    s.stats.trophiesSpent = 99;
    expect(trophiesOnHand(s)).toBe(0);
  });

  it('spending them never lowers the Trophy Hall count or the Embers conversion (A7)', () => {
    const s = keepRich('a7');
    s.buildings['trophy-hall'] = 1;
    earn(s, 80);
    const rate = () => productionRate(s, 'wood').value;
    const before = rate();
    expect(run(s, { type: 'hunter.rankUp', hunter: 'zora' }).ok).toBe(true);
    expect(run(s, { type: 'hunter.addStar', hunter: 'zora' }).ok).toBe(false); // no Embers yet
    s.embers = 100;
    expect(run(s, { type: 'hunter.addStar', hunter: 'zora' }).ok).toBe(true);
    expect(s.stats.trophies).toBe(80); // earned stays
    expect(s.stats.trophiesSpent).toBe(30);
    expect(rate()).toBe(before);
  });
});

describe('ranks (D309)', () => {
  it('Wright needs the highest level ever at 5 and 20 trophies; the refusal says which', () => {
    const s = keepRich('wright');
    earn(s, 100, 4);
    const low = rankUpView(s, 'zora');
    expect(low).toMatchObject({
      available: false,
      reason: 'needs highest level 5',
      label: 'Wright',
    });
    const r = run(s, { type: 'hunter.rankUp', hunter: 'zora' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('Zora: needs highest level 5.');
    earn(s, 19, 5);
    expect(rankUpView(s, 'zora')?.reason).toBe('needs 20 trophies');
    earn(s, 20, 5);
    expect(run(s, { type: 'hunter.rankUp', hunter: 'zora' }).ok).toBe(true);
    expect(hunter(s).rank).toBe('wright');
    expect(trophiesOnHand(s)).toBe(0);
  });

  it('reads the highest level ever, not the level now, and never loses a rank to halving', () => {
    const s = keepRich('peak');
    hunter(s).level = 2; // halved at a Long Night
    earn(s, 100, 9);
    expect(peakLevel(s, 'zora')).toBe(9);
    expect(run(s, { type: 'hunter.rankUp', hunter: 'zora' }).ok).toBe(true);
    hunter(s).level = 1;
    expect(hunter(s).rank).toBe('wright');
  });

  it('Master-Wright needs level 10 ever and 60 trophies, after Wright; nothing above', () => {
    const s = keepRich('master');
    earn(s, 200, 9);
    run(s, { type: 'hunter.rankUp', hunter: 'zora' });
    expect(rankUpView(s, 'zora')).toMatchObject({
      label: 'Master-Wright',
      reason: 'needs highest level 10',
    });
    earn(s, 79, 10);
    s.stats.trophiesSpent = 20;
    expect(rankUpView(s, 'zora')?.reason).toBe('needs 60 trophies');
    earn(s, 80, 10);
    expect(run(s, { type: 'hunter.rankUp', hunter: 'zora' }).ok).toBe(true);
    expect(hunter(s).rank).toBe('masterWright');
    expect(run(s, { type: 'hunter.rankUp', hunter: 'zora' }).ok).toBe(false);
  });

  it('gives 1, 3 and 5 talent points by rank, and the cost shows its breakdown', () => {
    expect(
      ['apprentice', 'wright', 'masterWright'].map((r) => talentPointsAt(r as 'wright')),
    ).toEqual([1, 3, 5]);
    const s = keepRich('points');
    expect(unspentTalentPoints(hunter(s))).toBe(1);
    hunter(s).talents = ['mender-herbs-1'];
    expect(unspentTalentPoints(hunter(s))).toBe(0);
    earn(s, 100);
    expect(rankUpView(s, 'zora')?.trophies.breakdown).toMatchObject({
      value: 20,
      key: 'rank.wrightTrophies',
    });
  });
});

describe('stars (D310)', () => {
  it('star n costs 20 × n Embers and 10 × n trophies, up to five', () => {
    const s = keepRich('stars');
    earn(s, 500);
    s.embers = 1000;
    const costs: number[][] = [];
    for (let n = 1; n <= 5; n++) {
      const v = starView(s, 'zora');
      costs.push([v?.embers?.value ?? -1, v?.trophies.value ?? -1]);
      expect(run(s, { type: 'hunter.addStar', hunter: 'zora' }).ok, `star ${n}`).toBe(true);
    }
    expect(costs).toEqual([
      [20, 10],
      [40, 20],
      [60, 30],
      [80, 40],
      [100, 50],
    ]);
    expect(1000 - s.embers).toBe(300); // a hunter at 5 stars has cost 300 Embers…
    expect(s.stats.trophiesSpent).toBe(150); // …and 150 trophies
    expect(hunter(s).stars).toBe(5);
    const sixth = run(s, { type: 'hunter.addStar', hunter: 'zora' });
    expect(sixth.ok).toBe(false);
    if (!sixth.ok) expect(sixth.reason).toMatch(/5 stars/);
  });

  it('refuses without the Embers or the trophies, and says which', () => {
    const s = keepRich('stars-poor');
    earn(s, 5);
    s.embers = 10;
    expect(starView(s, 'zora')?.reason).toBe('needs 20 Embers');
    s.embers = 20;
    expect(starView(s, 'zora')?.reason).toBe('needs 10 trophies');
  });

  it('raises stats at once: growth per level is 10% plus a point a star, in the fight and in the display', () => {
    const s = keepRich('growth');
    hunter(s).level = 6;
    earn(s, 100);
    s.embers = 100;
    const before = hunterStat(s, 'zora', 'might').value;
    expect(growthPerLevel(2)).toBeCloseTo(0.12, 12);
    run(s, { type: 'hunter.addStar', hunter: 'zora' });
    run(s, { type: 'hunter.addStar', hunter: 'zora' });
    const after = hunterStat(s, 'zora', 'might');
    expect(after.value).toBeCloseTo(20 * (1 + 0.12 * 5), 9); // Zora's base Might 20, level 6, 2 stars
    expect(after.value).toBeGreaterThan(before);
    const snap = snapshotOf(s, 'zora');
    expect(snap.stars).toBe(2);
    expect(mightEff(buildHunter(snap, 0))).toBeCloseTo(after.value, 9);
    expect(buildHunter(snap, 0).maxHealth).toBe(hunterStat(s, 'zora', 'health').value);
    const labels = (after.breakdown.children ?? []).map((c) => c.label);
    expect(labels).toContain('2 stars: +2% growth per level');
  });

  it('adds no star line, and leaves the snapshot as it was, at zero stars', () => {
    const s = keepRich('nostar');
    hunter(s).level = 3;
    expect('stars' in snapshotOf(s, 'zora')).toBe(false);
    const labels = (hunterStat(s, 'zora', 'might').breakdown.children ?? []).map((c) => c.label);
    expect(labels.some((l) => l.includes('star'))).toBe(false);
  });

  it('opens talent tiers: 1 always, 2 at two stars, 3 at four', () => {
    expect([0, 1, 2, 3, 4, 5].map(tiersOpen)).toEqual([1, 1, 2, 2, 3, 3]);
  });
});

describe('kept through the Long Night (GDD §5.9.7)', () => {
  it('ranks, stars, talents and keepsakes stay; the trophies spent reset with the trophies', () => {
    const s = keepRich('kept');
    s.cycle = { number: 1, age: 'bastion' };
    const h = hunter(s);
    Object.assign(h, {
      rank: 'wright',
      stars: 3,
      talents: ['striker-edge-1'],
      keepsake: 'rune-nail',
      level: 8,
    });
    s.legendaries.push({ id: 'rune-nail', cycle: 1 });
    s.stats.trophiesSpent = 30;
    s.stats.trophies = 40;
    expect(run(s, { type: 'stand.make', party: ['halvar', 'zora', 'ostap'] }).ok).toBe(true);
    const after = hunter(s);
    expect(after).toMatchObject({
      rank: 'wright',
      stars: 3,
      talents: ['striker-edge-1'],
      keepsake: 'rune-nail',
    });
    expect(after.level).toBeLessThan(8); // levels halve…
    expect(s.stats).toMatchObject({ trophies: 0, trophiesSpent: 0 });
    expect(s.legendaries).toHaveLength(1);
  });
});

describe('use-skills come with Wright (D312)', () => {
  it('the snapshot carries the hunter’s use-skill from Wright on, so odds, stands and Delves all use it', () => {
    const s = keepRich('skill-snapshot');
    expect('skill' in snapshotOf(s, 'zora')).toBe(false); // an Apprentice
    hunter(s).rank = 'wright';
    expect(snapshotOf(s, 'zora').skill).toBe('boathook');
    hunter(s).rank = 'masterWright';
    expect(snapshotOf(s, 'zora').skill).toBe('boathook'); // no upgrades at Master-Wright
    expect(snapshotOf(s, 'halvar').skill).toBeUndefined();
  });
});
