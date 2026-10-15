// Plan T8.13b (GDD §5.11.7, §9.16): the Stores list's data (count, sort, what Salvage returns, the
// Legendaries found) and the two debug actions the smoke test uses.
import { describe, expect, it } from 'vitest';
import { gear } from '../../src/content/gear';
import { makeItem } from '../../src/core/systems/items';
import { salvageValue, stepsPaid } from '../../src/core/systems/loot';
import { storesView } from '../../src/core/systems/stores-view';
import { rankUpView } from '../../src/core/systems/ranks';
import type { GameState } from '../../src/core/state/game-state';
import { keepRich, run, wear } from '../contracts/helpers';

const make = (
  s: GameState,
  base: keyof typeof gear,
  rarity: 'common' | 'fine' | 'rare' | 'heroic',
  lines: { kind: 'might'; size: number }[] = [],
) => makeItem(s, gear[base], rarity, lines, stepsPaid(base));

describe('the Stores view', () => {
  it('counts Stores, not what is worn, and sorts by slot or by rarity', () => {
    const s = keepRich('stores');
    wear(s, 'zora', 'iron-blade'); // worn: not in Stores
    const a = make(s, 'hide-armor', 'heroic', [{ kind: 'might', size: 0.06 }]);
    const b = make(s, 'steel-blade', 'fine', [{ kind: 'might', size: 0.06 }]);
    const c = make(s, 'iron-blade', 'rare', [{ kind: 'might', size: 0.06 }]);
    const bySlot = storesView(s, 'slot');
    expect([bySlot.count, bySlot.cap]).toEqual([3, 40]);
    expect(bySlot.rows.map((r) => r.item.id)).toEqual([b.id, c.id, a.id]); // weapons best first, then armor
    expect(storesView(s, 'rarity').rows.map((r) => r.item.id)).toEqual([a.id, c.id, b.id]); // rarest first
  });

  it('says exactly what Salvage returns, and the command pays that', () => {
    const s = keepRich('salvage');
    const item = make(s, 'steel-blade', 'rare', [{ kind: 'might', size: 0.06 }]);
    const row = storesView(s, 'slot').rows[0];
    const value = salvageValue(item);
    expect(row).toMatchObject({ iron: value.iron, silver: value.silver });
    expect(row?.salvage).toBe(
      [value.iron > 0 ? `${value.iron} iron` : '', value.silver > 0 ? `${value.silver} silver` : '']
        .filter(Boolean)
        .join(' and '),
    );
    const before = { iron: s.resources.iron, silver: s.resources.silver };
    expect(run(s, { type: 'item.salvage', item: item.id }).ok).toBe(true);
    expect(s.resources.iron - before.iron).toBeCloseTo(value.iron, 6);
    expect(s.resources.silver - before.silver).toBeCloseTo(value.silver, 6);
    expect(storesView(s, 'slot').count).toBe(0);
  });

  it('lists the Legendaries found, with who keeps them', () => {
    const s = keepRich('legends');
    expect(storesView(s, 'slot').legendaries).toEqual([]);
    s.legendaries.push({ id: 'rune-nail', cycle: 1 });
    s.legendaries.push({ id: 'barley-knot', cycle: 1 });
    expect(run(s, { type: 'keepsake.equip', hunter: 'zora', legendary: 'rune-nail' }).ok).toBe(
      true,
    );
    const rows = storesView(s, 'slot').legendaries;
    expect(rows.map((r) => [r.id, r.keptBy])).toEqual([
      ['barley-knot', null],
      ['rune-nail', 'Zora'],
    ]);
  });
});

describe('the debug actions for the v0.8 screens', () => {
  it('Grant loot puts a Rare Iron Blade with two lines in Stores, the same one for the same save', () => {
    const a = keepRich('debug-loot');
    const b = keepRich('debug-loot');
    expect(run(a, { type: 'debug.grantLoot' }).ok).toBe(true);
    run(b, { type: 'debug.grantLoot' });
    const view = storesView(a, 'slot');
    expect(view.count).toBe(1);
    expect(view.rows[0]?.item).toMatchObject({ name: 'Rare Iron Blade' });
    expect(view.rows[0]?.item.lines).toHaveLength(2);
    expect(storesView(b, 'slot').rows[0]?.item).toEqual(view.rows[0]?.item);
    expect(a.meta.debugUsed).toBe(true);
  });

  it('Grant loot salvages when Stores is full, like real loot', () => {
    const s = keepRich('debug-full');
    for (let i = 0; i < 40; i++) make(s, 'hide-armor', 'common');
    const iron = s.resources.iron;
    run(s, { type: 'debug.grantLoot' });
    expect(storesView(s, 'slot').count).toBe(40);
    expect(s.resources.iron).toBeGreaterThan(iron);
  });

  it('Ready to rank up lets every hunter rank up to Wright and then Master-Wright', () => {
    const s = keepRich('debug-ranks');
    expect(rankUpView(s, 'zora')?.available).toBe(false);
    expect(run(s, { type: 'debug.readyRanks' }).ok).toBe(true);
    expect(rankUpView(s, 'zora')?.available).toBe(true);
    expect(run(s, { type: 'hunter.rankUp', hunter: 'zora' }).ok).toBe(true);
    expect(rankUpView(s, 'zora')).toMatchObject({ label: 'Master-Wright', available: true });
  });
});
