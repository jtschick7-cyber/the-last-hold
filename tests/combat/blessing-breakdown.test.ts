// Plan T7.8 (GDD §9.15, D257): "Your blessings" has a breakdown line for every effect, and the
// Unlit's drawbacks are negative lines.
import { describe, expect, it } from 'vitest';
import { blessings, blessingById } from '../../src/content/delves/blessings';
import { blessingsBreakdown, effectLine } from '../../src/core/delves/blessing-breakdown';

describe('Your blessings', () => {
  it('has a line for every effect of every blessing, and the exact text beside the name', () => {
    const all = blessingsBreakdown(blessings.map((b) => b.id));
    expect(all.children).toHaveLength(48);
    for (const c of all.children ?? []) {
      const b = blessings.find((x) => x.name === c.label);
      expect(c.formula, c.label).toBe(b?.text);
      expect(c.children?.length, c.label).toBe(
        (b?.effects.length ?? 0) + (b?.rule ? 1 : 0) + (b?.drawbacks?.length ?? 0),
      );
      for (const l of c.children ?? []) expect(l.label.length, c.label).toBeGreaterThan(2);
    }
  });

  it('shows the Unlit’s drawbacks as negative lines', () => {
    for (const b of blessings.filter((x) => x.patron === 'unlit')) {
      const lines = blessingsBreakdown([b.id]).children?.[0]?.children ?? [];
      const negatives = lines.filter((l) => l.value < 0);
      expect(negatives.length, b.name).toBeGreaterThanOrEqual(b.drawbacks?.length ?? 1);
    }
    const hands = blessingsBreakdown(['cold-hands']).children?.[0]?.children ?? [];
    expect(hands.map((l) => l.label)).toEqual(['+20% Might', '−20% max Health']);
  });

  it('reads signs the right way round: a reduction in damage taken is a good (positive) line', () => {
    expect(effectLine({ kind: 'takenPct', amount: 0.1, types: ['fire', 'frost'] })).toMatchObject({
      label: '−10% fire and frost damage taken',
      value: -0.1,
    });
    expect(blessingById('close-the-door')?.effects[0]).toMatchObject({ kind: 'takenPct' });
  });
});
