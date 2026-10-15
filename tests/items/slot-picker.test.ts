// Plan T8.13a (GDD §9.16): the data behind the slot picker and the keepsake picker. The screens
// only draw it, so these tests pin its order, differences and refusal words.
import { describe, expect, it } from 'vitest';
import { gear } from '../../src/content/gear';
import { makeItem } from '../../src/core/systems/items';
import { stepsPaid } from '../../src/core/systems/loot';
import {
  itemDelta,
  keepsakeOptions,
  lineText,
  slotPicker,
} from '../../src/core/systems/slot-picker';
import type { GameState } from '../../src/core/state/game-state';
import type { ItemLine } from '../../src/core/state/item-state';
import { keepRich, run, wear } from '../contracts/helpers';

const make = (
  s: GameState,
  base: keyof typeof gear,
  rarity: 'common' | 'fine' | 'rare' | 'heroic',
  lines: ItemLine[] = [],
) => makeItem(s, gear[base], rarity, lines, stepsPaid(base));

describe('line and base words', () => {
  it('writes each kind of bonus line plainly', () => {
    expect(lineText({ kind: 'might', size: 0.05 })).toBe('+5% Might');
    expect(lineText({ kind: 'armor', size: 1 })).toBe('+1 Armor');
    expect(lineText({ kind: 'crit', size: 0.03 })).toBe('+3% crit chance');
    expect(lineText({ kind: 'bane', size: 0.08, family: 'cursed' })).toBe(
      '+8% damage against Cursed',
    );
  });
});

describe('the difference against what is worn', () => {
  it('lists what changes, signed, and says nothing for what stays', () => {
    const s = keepRich('delta');
    const worn = make(s, 'iron-blade', 'common');
    const better = make(s, 'steel-blade', 'fine', [{ kind: 'armor', size: 1 }]);
    const delta = itemDelta(better, worn);
    expect(delta).toContain(`+${gear['steel-blade'].might - gear['iron-blade'].might} Might`);
    expect(delta).toContain('+1 Armor');
    expect(itemDelta(worn, worn)).toEqual([]);
  });

  it('shows a lost sub-hit and a lost line as losses', () => {
    const s = keepRich('loss');
    const silver = make(s, 'silvered-blade', 'common');
    const iron = make(s, 'iron-blade', 'rare', [{ kind: 'might', size: 0.06 }]);
    const d = itemDelta(iron, silver);
    expect(d).toContain('loses its Silver sub-hit');
    expect(d).toContain('+6% Might');
    expect(d.some((x) => x.startsWith('−') && x.endsWith('Might'))).toBe(true);
  });
});

describe('the slot picker', () => {
  it('lists Stores items that fit the slot, best first', () => {
    const s = keepRich('order');
    wear(s, 'zora', 'iron-blade');
    const low = make(s, 'iron-blade', 'heroic', [
      { kind: 'might', size: 0.06 },
      { kind: 'health', size: 0.08 },
      { kind: 'speed', size: 1 },
    ]);
    const fine = make(s, 'steel-blade', 'fine', [{ kind: 'might', size: 0.06 }]);
    const rare = make(s, 'steel-blade', 'rare', [
      { kind: 'might', size: 0.06 },
      { kind: 'speed', size: 1 },
    ]);
    make(s, 'hide-armor', 'common'); // the other slot: not listed
    const view = slotPicker(s, 'zora', 'weapon');
    expect(view?.options.map((o) => o.item.id)).toEqual([rare.id, fine.id, low.id]);
    expect(view?.worn?.name).toBe('Iron Blade');
    expect(view?.options[0]?.item.lines).toEqual(['+6% Might', '+1 Speed']);
  });

  it('prices Craft and Rework and gives the reason when they cannot be done', () => {
    const s = keepRich('price');
    s.resources.iron = 0;
    s.resources.silver = 0;
    wear(s, 'zora', 'iron-blade');
    const view = slotPicker(s, 'zora', 'weapon');
    expect(view?.craft).toMatchObject({ base: 'iron-blade' });
    expect(view?.craft?.reason).toMatch(/Not enough resources|needs Smithy/);
    expect(view?.rework).toMatchObject({ name: 'Steel Blade' });
    expect(view?.rework?.reason).toMatch(/Not enough resources|needs Smithy/);
    expect(slotPicker(s, 'zora', 'armor')?.craft?.base).toBe('hide-armor');
  });

  it('gives the commands’ own words, and the command agrees', () => {
    const s = keepRich('same');
    s.resources.iron = 0;
    s.resources.silver = 0;
    wear(s, 'zora', 'iron-blade');
    const view = slotPicker(s, 'zora', 'weapon');
    const worn = s.hunters.zora?.weapon ?? '';
    const refused = run(s, { type: 'item.rework', item: worn });
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.reason).toBe(view?.rework?.reason);
  });

  it('gives the reason when the hunter is on a contract', () => {
    const s = keepRich('busy');
    wear(s, 'zora', 'iron-blade');
    const spare = make(s, 'iron-blade', 'fine', [{ kind: 'might', size: 0.06 }]);
    s.board.open.push({
      id: 'c1',
      village: 'mirograd',
      monster: 'wolf',
      tier: 1,
      location: 'field',
      arrivedAt: s.time,
      revealed: 3,
    });
    expect(run(s, { type: 'contract.launch', contract: 'c1', party: ['zora'] }).ok).toBe(true);
    const view = slotPicker(s, 'zora', 'weapon');
    expect(view?.options.find((o) => o.item.id === spare.id)?.reason).toBe(
      'Zora is on a contract.',
    );
    expect(view?.rework?.reason).toBe('Zora is on a contract.');
    const refused = run(s, { type: 'item.equip', item: spare.id, hunter: 'zora' });
    expect(refused.ok).toBe(false);
  });

  it('marks Craft full when Stores is full', () => {
    const s = keepRich('full');
    for (let i = 0; i < 40; i++) make(s, 'hide-armor', 'common');
    expect(slotPicker(s, 'zora', 'weapon')?.craft?.reason).toBe(
      'Stores is full. Salvage something first.',
    );
  });
});

describe('the keepsake picker', () => {
  it('lists all six with the reason each cannot go on', () => {
    const s = keepRich('keep');
    const none = keepsakeOptions(s, 'zora');
    expect(none).toHaveLength(6);
    expect(none.every((o) => o.reason === 'Not found yet.')).toBe(true);
    s.legendaries.push({ id: 'wolf-tooth-string', cycle: 1 });
    s.legendaries.push({ id: 'rune-nail', cycle: 1 });
    expect(run(s, { type: 'keepsake.equip', hunter: 'zora', legendary: 'rune-nail' }).ok).toBe(
      true,
    );
    const view = keepsakeOptions(s, 'halvar');
    expect(view.find((o) => o.id === 'wolf-tooth-string')?.reason).toBeNull();
    expect(view.find((o) => o.id === 'rune-nail')).toMatchObject({
      wornBy: 'Zora',
      reason: 'Worn by Zora. Take it off first.',
    });
    expect(keepsakeOptions(s, 'zora').find((o) => o.id === 'rune-nail')?.worn).toBe(true);
  });
});
