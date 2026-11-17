// Plan T19.4 (decisions D633, D634; technical design §26.2):
// PreparationPicker's Saltburst Well-Prepared indicator checks monster.abilities.length > 0.
import { describe, expect, it } from 'vitest';
import { MONSTER_IDS, monsters } from '../../content/monsters';
import { createNewGame } from '../../core/state/new-game';
import type { ContractIdentity } from '../../core/investigation/view';
import type { Preparation } from '../../core/state/game-state';
import { PreparationPicker } from './PreparationPicker';

const collectText = (node: unknown): string => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (typeof node === 'object' && 'type' in node && 'props' in node) {
    const v = node as { type: unknown; props: Record<string, unknown> };
    if (typeof v.type === 'function') {
      return collectText((v.type as (p: Record<string, unknown>) => unknown)(v.props));
    }
    return collectText(v.props.children);
  }
  return '';
};

const renderPicker = (
  monster: keyof typeof monsters | null,
  identified: boolean,
  prep: Preparation,
  alchemyXp = 0,
): string => {
  const s = createNewGame('prep-picker', 0);
  s.stores['thornbane-oil'] = 2;
  s.stores['wrights-oil'] = 2;
  s.stores.saltburst = 2;
  s.stores['fire-pot'] = 2;
  s.stores['poppy-smoke'] = 2;
  s.skills.alchemy = alchemyXp;
  const identity: ContractIdentity = {
    identified,
    monster,
    level: identified ? 2 : 0,
    candidates: [],
    clues: [],
  };
  return collectText(
    PreparationPicker({
      state: s,
      party: ['halvar'],
      prep,
      identity,
      onChange: () => {},
    }),
  );
};

describe('PreparationPicker Saltburst Well-Prepared indicator (D633)', () => {
  it('shows Well prepared for any identified monster with abilities when Saltburst + matched oil are picked', () => {
    // Passive-ability monster (Gloam-moths: Lightless) and active-ability monster (Kikimora: Spoil)
    const mothsText = renderPicker('gloam-moths', true, {
      oils: { halvar: 'wrights-oil' },
      potions: {},
      bombs: ['saltburst'],
    });
    expect(mothsText).toContain('Well prepared:');
    expect(mothsText).toContain('cancels the monster’s first ability');

    const kikimoraText = renderPicker('kikimora', true, {
      oils: { halvar: 'thornbane-oil' },
      potions: {},
      bombs: ['saltburst'],
    });
    expect(kikimoraText).toContain('Well prepared:');
    for (const id of MONSTER_IDS) expect(monsters[id].abilities.length).toBeGreaterThan(0);
  });

  it('does NOT show Well prepared for Saltburst alone when monster.abilities.length === 0', () => {
    const orig = monsters.kikimora.abilities;
    try {
      (monsters.kikimora as { abilities: typeof orig }).abilities = [];
      const noAbilities = renderPicker('kikimora', true, {
        oils: { halvar: 'thornbane-oil' },
        potions: {},
        bombs: ['saltburst'],
      });
      expect(noAbilities).not.toContain('Well prepared:');

      // Still shows Well prepared when a weak elemental bomb is also present
      const withWeak = renderPicker('kikimora', true, {
        oils: { halvar: 'thornbane-oil' },
        potions: {},
        bombs: ['saltburst', 'fire-pot'],
      });
      expect(withWeak).toContain('Well prepared:');
    } finally {
      (monsters.kikimora as { abilities: typeof orig }).abilities = orig;
    }
  });

  it('does NOT show Well prepared while the contract monster is unidentified', () => {
    const unknown = renderPicker('kikimora', false, {
      oils: { halvar: 'thornbane-oil' },
      potions: {},
      bombs: ['saltburst'],
    });
    expect(unknown).not.toContain('Well prepared:');
  });

  it('shows the Shrouded status line for Poppy Smoke scaled by Alchemy level (T19.7, D633)', () => {
    const baseText = renderPicker('wolf', true, {
      oils: {},
      potions: {},
      bombs: ['poppy-smoke'],
    });
    expect(baseText).toContain(
      'Poppy Smoke: the monster loses its next action and is Shrouded for 2 actions (party attacks gain +15 hit, +10 crit, +15% damage).',
    );

    // Alchemy Lv 4 (40 XP in v1.9 -> +12% potency = 1.12×): +16.8 hit, +11.2 crit, +16.8% damage.
    const scaledText = renderPicker(
      'wolf',
      true,
      {
        oils: {},
        potions: {},
        bombs: ['poppy-smoke'],
      },
      100,
    );
    expect(scaledText).toContain('is Shrouded for 2 actions');
    expect(scaledText).not.toBe(baseText);
  });
});
