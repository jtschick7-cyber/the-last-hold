// Plan: the brew texts show the Alchemy-boosted numbers (GDD §5.8.6, §9.9): every number
// in a brew's effect is `alchemyPotency` stronger, counts and durations are not, and the
// breakdown is built by the same function as the text.
import { describe, expect, it } from 'vitest';
import { CONSUMABLE_IDS, consumables } from '../../src/content/consumables';
import { brewSummary } from '../../src/core/alchemy/brew-text';
import { num } from '../../src/core/balance-access';
import { alchemyPotency } from '../../src/core/combat/stats';

describe('brewSummary', () => {
  it('reads exactly as the content text at Alchemy 0, for every brew', () => {
    for (const id of CONSUMABLE_IDS)
      expect(brewSummary(0, id).text, id).toBe(consumables[id].summary);
  });

  it('shows the boosted numbers at Alchemy 4 (potency 1 + 4 × skill.alchemyPotency)', () => {
    const p = alchemyPotency(4);
    expect(p).toBeCloseTo(1 + 4 * num('skill.alchemyPotency'), 9);
    const pct = (x: number): string => `${Math.round(x * 1000) / 10}%`;
    const pts = (x: number): number => Math.round(x * 1000) / 10;
    expect(brewSummary(4, 'grave-oil').text).toBe(`+${pct(0.35 * p)} damage vs Restless Dead.`);
    expect(brewSummary(4, 'wrights-oil').text).toBe(`+${pct(0.35 * p)} damage vs the Cursed.`);
    expect(brewSummary(4, 'mending-draught').text).toBe(
      `Once, below 50% Health: heal ${pct(0.45 * p)} of max Health.`,
    );
    expect(brewSummary(4, 'hardwood-tonic').text).toBe(
      `+${pct(0.4 * p)} Armor and −${pct(0.15 * p)} all damage taken until the holder's 8th action.`,
    );
    expect(brewSummary(4, 'quickfoot-tincture').text).toBe(
      `+${pct(0.15 * p)} Speed for the whole fight.`,
    );
    expect(brewSummary(4, 'coldwater-draught').text).toBe(
      `The holder takes −${pct(0.5 * p)} Fire and −${pct(0.3 * p)} Frost damage and gains +${pct(0.1 * p)} Might for the whole fight.`,
    );
    expect(brewSummary(4, 'owl-eye-drops').text).toBe(
      `+${pts(0.1 * p)} points to the holder's hit chance and +${pts(0.1 * p)} points to crit chance for the whole fight.`,
    );
    expect(brewSummary(4, 'steadfast-draught').text).toBe(
      `Prevents the next ${Math.floor(2 * p + 0.5)} ability-caused lost actions and grants +${pct(0.1 * p)} Might for the whole fight.`,
    );
    // Bombs: the damage, burn and Shrouded bonuses scale (bombs rounded to 2 places);
    // the Speed cut, action counts and turns do not.
    const r2 = (x: number): number => Math.round(x * 100) / 100;
    expect(brewSummary(4, 'fire-pot').text).toBe(
      `At tick 1: ${r2(40 * p)} Fire damage, then ${r2(10 * p)} Fire on each of the monster's next 3 actions.`,
    );
    expect(brewSummary(4, 'frost-pot').text).toBe(
      `At tick 1: ${r2(30 * p)} Frost damage, then −30% Speed for the monster's next 3 actions.`,
    );
    expect(brewSummary(4, 'saltburst').text).toBe(
      `Triggers on the monster's first ability: ${r2(25 * p)} Rune damage, cancels it, and blocks abilities for the monster's next 3 actions.`,
    );
    expect(brewSummary(4, 'poppy-smoke').text).toBe(
      `At tick 1: the monster loses its next action and is Shrouded for 2 actions (party attacks gain +${pts(0.15 * p)} hit, +${pts(0.1 * p)} crit, +${pct(0.15 * p)} damage).`,
    );
  });

  it('scales every v1.9 brew cleanly with no leftover level-0 breakdown', () => {
    for (const id of ['saltburst', 'steadfast-draught', 'poppy-smoke'] as const) {
      expect(brewSummary(0, id).text, id).toBe(consumables[id].summary);
      expect(brewSummary(7, id).breakdown, id).not.toBeNull();
    }
  });

  it('explains the boost with the Alchemy line, and has none at level 0', () => {
    expect(brewSummary(0, 'grave-oil').breakdown).toBeNull();
    expect(brewSummary(0, 'saltburst').breakdown).toBeNull();
    const b = brewSummary(4, 'grave-oil').breakdown;
    expect(b?.label).toBe('Grave Oil');
    expect(b?.value).toBeCloseTo(0.35 * alchemyPotency(4), 9);
    expect(b?.children?.map((c) => c.label)).toEqual(['Base', 'Alchemy 4']);
    expect(b?.children?.[1]?.value).toBeCloseTo(4 * num('skill.alchemyPotency'), 9);
  });
});
