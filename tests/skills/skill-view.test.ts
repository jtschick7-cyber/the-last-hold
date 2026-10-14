// Plan T6.9b: what "What the ember remembers" shows (GDD §5.8.6): the same numbers the bonuses use.
import { describe, expect, it } from 'vitest';
import { emberRemembers, emberRemembersMore } from '../../src/content/skills';
import { num } from '../../src/core/balance-access';
import { skillBonus, skillViews, xpToNext } from '../../src/core/skills/skills';
import { keepRich } from '../contracts/helpers';

describe('skill views', () => {
  it('start at level 0 with no bonus and a full bar to fill', () => {
    const views = skillViews(keepRich('sv'));
    expect(views.map((v) => v.id)).toEqual(['alchemy', 'smithing', 'lore', 'command']);
    for (const v of views) {
      expect(v.level).toBe(0);
      expect(v.progress).toEqual({ level: 0, into: 0, needed: xpToNext(0) });
      expect(v.bonus.value).toBe(0);
      expect(v.maxed).toBe(false);
    }
  });

  it('show progress, the bonus with its sign, and agree with the bonus the game uses', () => {
    const s = keepRich('sv2');
    s.skills.lore = xpToNext(0) + xpToNext(1) + 3; // level 2, 3 into the next
    s.skills.smithing = xpToNext(0);
    s.skills.alchemy = xpToNext(0);
    s.skills.command = xpToNext(0);
    const views = Object.fromEntries(skillViews(s).map((v) => [v.id, v]));
    const lore = views.lore;
    if (!lore) throw new Error('no lore');
    expect(lore.level).toBe(2);
    expect(lore.progress.into).toBe(3);
    expect(lore.bonus.value).toBe(skillBonus(s, 'lore').value);
    expect(lore.bonusText).toBe(`−${Math.round(2 * num('skill.loreClueTime') * 1000) / 10}%`);
    expect(lore.bonus.breakdown.label).toBe('Lore 2');
    expect(lore.bonus.breakdown.children?.[0]?.formula).toContain('3 of');
    expect(views.alchemy?.bonusText.startsWith('+')).toBe(true);
    expect(views.command?.bonusText.startsWith('+')).toBe(true);
    expect(views.smithing?.bonusText.startsWith('−')).toBe(true);
  });

  it('say "highest level" at the cap', () => {
    const s = keepRich('sv3');
    s.skills.command = 1e9;
    const v = skillViews(s).find((x) => x.id === 'command');
    expect(v?.level).toBe(num('skill.maxLevel'));
    expect(v?.maxed).toBe(true);
    expect(v?.bonus.breakdown.children?.[0]?.formula).toBe('Highest level');
  });
});

describe('the ember lines (GDD §5.8.6)', () => {
  it('read as the GDD says', () => {
    expect(emberRemembersMore('Lore', 3)).toBe('The ember remembers more: Lore 3.');
    expect(
      emberRemembers([
        { name: 'Alchemy', level: 4 },
        { name: 'Smithing', level: 2 },
        { name: 'Lore', level: 3 },
        { name: 'Command', level: 5 },
      ]),
    ).toBe('The ember remembers: Alchemy 4 · Smithing 2 · Lore 3 · Command 5.');
  });
});
