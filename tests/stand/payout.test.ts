// Plan T4.7 (GDD §5.9.3–5.9.6, D109, D111, D114): the Embers payout and its
// breakdown, the relic milestones, the stand preview, and the preview-honesty test.
import { describe, expect, it } from 'vitest';
import { RELIC_IDS } from '../../src/content/relics';
import { embersPayout } from '../../src/core/stand/embers';
import { runStand, type StandInput } from '../../src/core/stand/engine';
import { bombStock, previewInputFor, standInputFor } from '../../src/core/stand/from-state';
import { practiceWaves, previewStand } from '../../src/core/stand/preview';
import { relicsFound } from '../../src/core/stand/relics';
import { standSeed, waveList } from '../../src/core/stand/waves';
import { createNewGame } from '../../src/core/state/new-game';
import { freshHunter } from '../../src/core/state/hunters-state';
import { threatRate } from '../../src/core/threat/threat';
import { snap } from '../combat/helpers';

const IDS = ['halvar', 'zora', 'ostap', 'bjarna', 'vesna', 'radek'] as const;
const stand = (k: number): StandInput => ({
  seed: `h:stand:${k}`,
  threat: (k * 7) % 60,
  party: IDS.map((id) => snap(id, { level: 1 + (k % 12) })),
  prep: { oils: {}, potions: {}, bombs: [] },
  bombs: {},
  defenses: { walls: k % 8, watchtower: k % 5 },
  relics: [],
  knowledge: {},
});

describe('the Embers payout (GDD §5.9.4)', () => {
  it('waves part Σ 4 × 1.15^(n−1), × Rank × (1 + 0.007 × Threat), + 1 per trophy, floored', () => {
    // 3 waves: 4 + 4.6 + 5.29 = 13.89.
    expect(embersPayout({ rank: 'bastion', waves: 3, threat: 0, trophies: 10 }).value).toBe(23);
    expect(embersPayout({ rank: 'bastion', waves: 3, threat: 100, trophies: 0 }).value).toBe(
      Math.floor(13.89 * 1.7), // D138
    );
    expect(embersPayout({ rank: 'keep', waves: 3, threat: 0, trophies: 0 }).value).toBe(
      Math.floor(13.89 * 0.5),
    );
    expect(embersPayout({ rank: 'bastion', waves: 0, threat: 50, trophies: 7 }).value).toBe(7);
  });

  it('the arrival caps only the trophies part; the waves part goes on top', () => {
    const p = embersPayout({ rank: 'keep', waves: 3, threat: 0, trophies: 500, trophyCap: 40 });
    expect(p.trophies).toBe(40);
    expect(p.value).toBe(Math.floor(13.89 * 0.5 + 40));
    expect(JSON.stringify(p.breakdown)).toContain('capped at 40');
  });

  it('the breakdown shows each part and names its key', () => {
    const p = embersPayout({ rank: 'bastion', waves: 5, threat: 12, trophies: 3 });
    const tree = JSON.stringify(p.breakdown);
    for (const key of [
      'embers.perWave',
      'embers.rankMult',
      'embers.threatBonus',
      'embers.perTrophy',
    ])
      expect(tree).toContain(key);
    expect(p.breakdown.value).toBe(p.value);
    expect(Math.floor(p.waves + p.trophies)).toBe(p.value);
  });
});

describe('relic milestones (GDD §5.9.6)', () => {
  it('a first stand of about 10 waves finds two relics, none owned twice', () => {
    const found = relicsFound('r:stand:1', 10, 0, []);
    expect(found).toHaveLength(2);
    expect(new Set(found).size).toBe(2);
    expect(relicsFound('r:stand:1', 10, 0, [])).toEqual(found);
  });

  it('only milestones passed for the first time count, and only relics not yet owned', () => {
    expect(relicsFound('s', 10, 9, [])).toEqual([]);
    expect(relicsFound('s', 12, 6, [])).toHaveLength(2); // 9 and 12
    const owned = RELIC_IDS.slice(0, 5);
    expect(relicsFound('s', 21, 0, owned)).toEqual([RELIC_IDS[5]]);
    expect(relicsFound('s', 21, 0, RELIC_IDS)).toEqual([]);
  });
});

describe('the stand preview (GDD §5.9.3)', () => {
  const s = stand(4);
  const p = previewStand({
    stand: s,
    samples: 100,
    rank: 'bastion',
    trophies: 30,
    cycleDays: 4,
    threatPerDay: 40,
    trophiesPerDay: 7.5,
  });

  it('shows the median and the 10th–90th range of 100 practice stands', () => {
    expect(p.samples).toBe(100);
    expect(p.p10).toBeLessThanOrEqual(p.median);
    expect(p.median).toBeLessThanOrEqual(p.p90);
    const held = practiceWaves(s, 100);
    expect(held).toHaveLength(100);
    expect(p.median).toBe(held[49]);
  });

  it('Embers now from the median, per day of the cycle; tomorrow labeled an estimate', () => {
    expect(p.embersNow.value).toBe(
      embersPayout({ rank: 'bastion', waves: p.median, threat: s.threat, trophies: 30 }).value,
    );
    expect(p.embersPerDay).toBeCloseTo(p.embersNow.value / 4);
    expect(p.threatTomorrow).toBe(s.threat + 40);
    expect(p.embersTomorrow.value).toBe(
      embersPayout({ rank: 'bastion', waves: p.median, threat: s.threat + 40, trophies: 37.5 })
        .value,
    );
    expect(p.embersPerDayTomorrow).toBeCloseTo(p.embersTomorrow.value / 5);
  });

  it('practice stands roll their own dice on the same wave list', () => {
    const real = runStand({ ...s, log: true });
    const practice = runStand({ ...s, log: true, rolls: `${s.seed}:practice:0` });
    expect(practice.waves.map((w) => w.wave)).toEqual(
      real.waves.slice(0, practice.waves.length).map((w) => w.wave),
    );
    expect(practice.waves[0]?.fight.log).not.toEqual(real.waves[0]?.fight.log);
  });

  it('is honest: real stands land inside the range about as often as it says (D114)', () => {
    // Waves held are whole numbers, often the same in most practice stands, so the
    // inclusive 10th–90th range holds the real result at least 80% of the time in
    // expectation; with sampling noise: at least 75%, and at most 15% below or above.
    let inside = 0;
    let below = 0;
    let above = 0;
    const N = 16;
    for (let k = 0; k < N; k++) {
      const pv = previewStand({
        stand: stand(k),
        samples: 100,
        rank: 'bastion',
        trophies: 0,
        cycleDays: 3,
        threatPerDay: 0,
        trophiesPerDay: 0,
      });
      const real = runStand(stand(k)).wavesHeld;
      if (real < pv.p10) below += 1;
      else if (real > pv.p90) above += 1;
      else inside += 1;
    }
    expect(inside / N).toBeGreaterThanOrEqual(0.75);
    expect(below / N).toBeLessThanOrEqual(0.15);
    expect(above / N).toBeLessThanOrEqual(0.15);
  }, 15_000);
});

describe('the stand read from the hold (GDD §5.9.3, §5.9.8)', () => {
  const hold = () => {
    const g = createNewGame('fs', 0);
    g.cycle.age = 'bastion';
    for (const id of ['ostap', 'bjarna', 'vesna', 'radek'] as const) g.hunters[id] = freshHunter();
    g.stores['fire-pot'] = 2;
    g.stores.saltburst = 1;
    g.stores['mending-draught'] = 4;
    g.buildings.walls = 3;
    g.buildings.watchtower = 2;
    g.threat = 25;
    g.relics = [{ id: 'iron-shutter', cycle: 1 }];
    g.bestiary.wolf = { level: 3, kills: 4 };
    g.stats.trophies = 12;
    g.time = 2 * 86_400_000;
    return g;
  };

  it('uses the stand seed, the stores, the defenses, the relics and the bestiary', () => {
    const g = hold();
    const s = standInputFor(g, ['halvar', 'zora'], { oils: {}, potions: {} });
    expect(s.seed).toBe(standSeed(g));
    expect(s.bombs).toEqual(bombStock(g));
    expect(s.bombs).toEqual({ 'fire-pot': 2, saltburst: 1 });
    expect(s.defenses).toEqual({ walls: 3, watchtower: 2 });
    expect(s.relics).toEqual(['iron-shutter']);
    expect(s.knowledge).toEqual({ wolf: 3 });
    expect(s.threat).toBe(25);
    expect(waveList(s.seed, 3)).toEqual(waveList(standSeed(g), 3));
  });

  it('per day: Threat by tomorrow from the rate now, trophies from the cycle so far', () => {
    const g = hold();
    const i = previewInputFor(g, ['halvar', 'zora'], { oils: {}, potions: {} });
    expect(i.cycleDays).toBeCloseTo(2);
    expect(i.threatPerDay).toBeCloseTo(threatRate(g).value * 24);
    expect(i.trophiesPerDay).toBeCloseTo(6);
    expect(i.samples).toBe(100);
  });

  it('at the v0.4 arrival Threat is 0', () => {
    const g = hold();
    g.arrivalDue = true;
    expect(standInputFor(g, ['halvar'], { oils: {}, potions: {} }).threat).toBe(0);
  });
});
