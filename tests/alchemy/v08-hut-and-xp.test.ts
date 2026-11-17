// Plan T19.3 (D633, D636 (c), TD §26.2):
// Alchemist's Hut −8% duration per level above 1 + Breakdown parity,
// skill.xp.alchemy { brew: 12, experiment: 5, property: 10 },
// Saltburst single-carrier + 1 silver recipe shape, and v1.9 brewSummary coverage.
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { CONSUMABLE_IDS, consumables } from '../../src/content/consumables';
import { knownRecipes, revealProperty } from '../../src/core/alchemy/book';
import { brewSummary } from '../../src/core/alchemy/brew-text';
import {
  brewDuration,
  brewMs,
  experimentDuration,
  experimentMs,
} from '../../src/core/alchemy/brewing';
import { num } from '../../src/core/balance-access';
import { alchemyPotency } from '../../src/core/combat/stats';
import { advance } from '../../src/core/sim/advance';
import type { GameState } from '../../src/core/state/game-state';
import { keepRich, run } from '../contracts/helpers';

const hut = (level = 1): GameState => {
  const s = keepRich('hut-v19');
  s.buildings['alchemists-hut'] = level;
  for (const k of Object.keys(s.stores)) s.stores[k as keyof typeof s.stores] = 20;
  for (const k of CONSUMABLE_IDS) s.stores[k] = 0;
  return s;
};

describe('Alchemist’s Hut brew/experiment duration factor (D633)', () => {
  it('adds tunable hut.timeCutPerLevel = 0.08 and skill.xp.alchemy = { brew: 12, experiment: 5, property: 10 }', () => {
    expect(balance.hut.timeCutPerLevel).toEqual({ value: 0.08, locked: false });
    expect(balance.skill.xp.alchemy).toEqual({
      value: { brew: 12, experiment: 5, property: 10 },
      locked: false,
    });
  });

  it('reduces brewDuration and experimentDuration by 8% per level above 1 with Breakdown parity', () => {
    const base = num('brew.time'); // 600s
    const expBase = num('experiment.time'); // 600s

    const l1 = brewDuration(hut(1));
    expect(l1.value).toBe(base);
    expect(l1.breakdown.children?.some((c) => c.key === 'hut.timeCutPerLevel')).toBe(false);

    for (const level of [2, 3, 4, 5] as const) {
      const s = hut(level);
      const cut = (level - 1) * 0.08;
      const b = brewDuration(s);
      const e = experimentDuration(s);
      expect(b.value).toBeCloseTo(base * (1 - cut), 9);
      expect(e.value).toBeCloseTo(expBase * (1 - cut), 9);
      expect(b.value).toBeCloseTo(brewMs(s) / 1000, 9);
      expect(e.value).toBeCloseTo(experimentMs(s) / 1000, 9);
      const child = b.breakdown.children?.find((c) => c.key === 'hut.timeCutPerLevel');
      expect(child).toBeDefined();
      expect(child?.label).toBe(`Alchemist's Hut Lv ${level}`);
      expect(child?.value).toBeCloseTo(cut, 9);
      expect(b.breakdown.formula).toContain(`(1 − ${cut})`);
    }
  });

  it('finishes brews and grants { brew: 12, experiment: 5, property: 10 } Alchemy XP at Hut timing', () => {
    const s = hut(3); // 16% cut -> 504s
    expect(run(s, { type: 'brew.queue', item: 'grave-oil' }).ok).toBe(true);
    const ms = brewMs(s);
    expect(ms).toBeCloseTo(504_000, 6);
    advance(s, s.time + ms);
    expect(s.stores['grave-oil']).toBe(1);
    expect(s.skills.alchemy).toBe(12);

    expect(run(s, { type: 'experiment.queue', a: 'wolf-fang', b: 'hares-foot' }).ok).toBe(true);
    advance(s, s.time + experimentMs(s));
    // experiment 5 + 4 revealed properties * 10 = 45 -> total 57
    expect(s.skills.alchemy).toBe(12 + 5 + 10 * 4);
  });
});

describe('Saltburst single-carrier recipe (D633)', () => {
  it('requires 1 carrier + 1 silver and offers single-carrier alternatives when discovered', () => {
    const s = hut(1);
    expect(consumables.saltburst.recipe).toEqual({
      ingredients: { 'rime-salt': 1 },
      resources: { silver: 1 },
    });
    expect(consumables.saltburst.shape).toEqual({
      kind: 'single',
      units: 1,
      resources: { silver: 1 },
    });
    expect(knownRecipes(s, 'saltburst')).toEqual([
      { ingredients: { 'rime-salt': 1 }, resources: { silver: 1 } },
    ]);
    revealProperty(s, 'grave-dust', 2);
    expect(knownRecipes(s, 'saltburst')).toEqual([
      { ingredients: { 'rime-salt': 1 }, resources: { silver: 1 } },
      { ingredients: { 'grave-dust': 1 }, resources: { silver: 1 } },
    ]);
  });
});

describe('v1.9 brewSummary formatting and Alchemy breakdowns', () => {
  it('shows scaled numbers for all rebalanced potions, Saltburst, and Poppy Smoke at Alchemy 4', () => {
    const p = alchemyPotency(4);
    const pct = (x: number) => `${Math.round(x * 1000) / 10}%`;
    const pts = (x: number) => `${Math.round(x * 1000) / 10}`;
    const amt = (x: number) => `${Math.round(x * 100) / 100}`;

    expect(brewSummary(4, 'quickfoot-tincture').text).toBe(
      `+${pct(0.15 * p)} Speed for the whole fight.`,
    );
    expect(brewSummary(4, 'mending-draught').text).toBe(
      `Once, below 50% Health: heal ${pct(0.45 * p)} of max Health.`,
    );
    expect(brewSummary(4, 'hardwood-tonic').text).toBe(
      `+${pct(0.4 * p)} Armor and −${pct(0.15 * p)} all damage taken until the holder's 8th action.`,
    );
    expect(brewSummary(4, 'coldwater-draught').text).toBe(
      `The holder takes −${pct(0.5 * p)} Fire and −${pct(0.3 * p)} Frost damage and gains +${pct(0.1 * p)} Might for the whole fight.`,
    );
    expect(brewSummary(4, 'owl-eye-drops').text).toBe(
      `+${pts(0.1 * p)} points to the holder's hit chance and +${pts(0.1 * p)} points to crit chance for the whole fight.`,
    );
    expect(brewSummary(4, 'steadfast-draught').text).toContain(`+${pct(0.1 * p)} Might`);
    expect(brewSummary(4, 'saltburst').text).toContain(`${amt(25 * p)} Rune damage`);
    expect(brewSummary(4, 'saltburst').breakdown).not.toBeNull();
    expect(brewSummary(4, 'poppy-smoke').text).toContain(`+${pts(0.15 * p)} hit`);
    expect(brewSummary(4, 'poppy-smoke').text).toContain(`+${pts(0.1 * p)} crit`);
    expect(brewSummary(4, 'poppy-smoke').text).toContain(`+${pct(0.15 * p)} damage`);
    expect(brewSummary(4, 'poppy-smoke').breakdown).not.toBeNull();
  });
});
