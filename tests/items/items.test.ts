// Plan T8.6 (GDD §5.11.1–§5.11.2, §5.11.7, D304, D305, D307, D328): items in fights and stats,
// contract loot, Stores, Salvage, and the craft / rework / equip / unequip / salvage commands.
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { gear } from '../../src/content/gear';
import { runFight } from '../../src/core/combat';
import { buildHunter } from '../../src/core/combat/build';
import { mightEff, outgoingPct, speedEff, armorEff } from '../../src/core/combat/stats';
import { scripted, seeded, stream } from '../../src/core/rng';
import type { ContractInstance, GameState } from '../../src/core/state/game-state';
import type { ItemLine } from '../../src/core/state/item-state';
import { hunterStat, snapshotOf } from '../../src/core/systems/hunters';
import { equipItem, itemById, makeItem } from '../../src/core/systems/items';
import {
  lootChance,
  lootKey,
  pickRarity,
  rollContractLoot,
  salvageValue,
  stepsPaid,
  storesCount,
  takeLoot,
} from '../../src/core/systems/loot';
import { foundLines } from '../../src/core/story/found-lines';
import { give, gearIn, keepRich, run, wear } from '../contracts/helpers';
import { HOUR } from '../contracts/helpers';
import { advance } from '../../src/core/sim';

const put = (s: GameState, over: Partial<ContractInstance> = {}): ContractInstance => {
  const c: ContractInstance = {
    id: `t${s.board.open.length}-${over.monster ?? 'wolf'}-${over.tier ?? 1}`,
    village: 'mirograd',
    monster: 'wolf',
    tier: 1,
    location: 'field',
    arrivedAt: s.time,
    revealed: 3,
    ...over,
  };
  s.board.open.push(c);
  return c;
};

const item = (
  s: GameState,
  base: keyof typeof gear,
  rarity: 'fine' | 'rare' | 'heroic',
  lines: ItemLine[],
) => makeItem(s, gear[base], rarity, lines, stepsPaid(base));

describe('loot rolls (D305, D328)', () => {
  it('drops with a chance of 10% + 5% a tier, in a fixed order of rolls', () => {
    expect(lootChance(1)).toBeCloseTo(0.15, 12);
    expect(lootChance(5)).toBeCloseTo(0.35, 12);
    expect(rollContractLoot(scripted([0.16]), 1)).toBeNull(); // above 15%: nothing
    const r = scripted([0.14, 0.4, 0.0, 0.0]);
    const drop = rollContractLoot(r, 1);
    expect(drop?.base.id).toBe('iron-blade'); // weapon half, tier 1
    expect(drop?.rarity).toBe('fine');
    expect(drop?.lines).toEqual([{ kind: 'might', size: 0.06 }]);
    r.assertConsumed();
  });

  it('picks the base piece by tier: weapon or armor half each', () => {
    const bases = (tier: number) =>
      [0.01, 0.99].map((half) => rollContractLoot(scripted([0.0, half, 0.0, 0.0]), tier)?.base.id);
    expect(bases(2)).toEqual(['iron-blade', 'hide-armor']);
    expect(bases(3)).toEqual(['steel-blade', 'mail']);
    expect(bases(4)).toEqual(['silvered-blade', 'mail']);
    expect(bases(5)).toEqual(['silvered-blade', 'emberwright-plate']);
  });

  it('weights rarity 65 / 27 / 8', () => {
    const w = balance.loot.rarityWeights.value;
    expect(['fine', 'rare', 'heroic']).toEqual(Object.keys(w));
    const at = (x: number) => pickRarity(scripted([x]), w);
    expect([at(0), at(0.649), at(0.65), at(0.919), at(0.92), at(0.999)]).toEqual([
      'fine',
      'fine',
      'rare',
      'rare',
      'heroic',
      'heroic',
    ]);
  });

  it('gives 1, 2 or 3 distinct lines by rarity, the bane line rolling its family', () => {
    for (const [rarity, n] of [
      ['fine', 1],
      ['rare', 2],
      ['heroic', 3],
    ] as const) {
      const drop = rollContractLoot(
        scripted([
          0,
          0,
          rarity === 'fine' ? 0 : rarity === 'rare' ? 0.7 : 0.95,
          ...Array(6).fill(0.5),
        ]),
        1,
      );
      expect(drop?.rarity).toBe(rarity);
      expect(drop?.lines).toHaveLength(n);
      expect(new Set(drop?.lines.map((l) => l.kind)).size).toBe(n);
    }
    // The last of six kinds is the bane line; a roll of 0.99 on the family draws the last family.
    const bane = rollContractLoot(scripted([0, 0, 0, 0.99, 0.99]), 1);
    expect(bane?.lines).toEqual([{ kind: 'bane', size: 0.12, family: 'cursed' }]);
  });

  it('is fixed per contract: the same seed and contract roll the same, others differ', () => {
    const roll = (seed: string, id: string) => {
      const d = rollContractLoot(stream(seed, 'loot', id), 5);
      return JSON.stringify(d ? [d.base.id, d.rarity, d.lines] : null);
    };
    expect(roll('seed-a', 'c1')).toBe(roll('seed-a', 'c1'));
    const many = new Set(Array.from({ length: 60 }, (_, i) => roll('seed-a', `c${i}`)));
    expect(many.size).toBeGreaterThan(5);
    expect(
      new Set(Array.from({ length: 60 }, (_, i) => roll(`seed-${i}`, 'c1'))).size,
    ).toBeGreaterThan(5);
  });
});

describe('items in fights and stats (D305)', () => {
  const lines: ItemLine[] = [
    { kind: 'might', size: 0.06 },
    { kind: 'health', size: 0.08 },
    { kind: 'armor', size: 2 },
    { kind: 'speed', size: 1 },
    { kind: 'crit', size: 0.04 },
    { kind: 'bane', size: 0.12, family: 'beasts-and-wilds' },
  ];

  it('a Common item adds nothing: the snapshot has no lines and the numbers are the gear table’s', () => {
    const s = keepRich('common');
    wear(s, 'zora', 'steel-blade');
    const snap = snapshotOf(s, 'zora');
    expect('lines' in snap).toBe(false);
    expect(snap.weapon).toBe('steel-blade');
  });

  it('a worn item’s lines reach the snapshot and the fight, and the displayed stats match what the fight uses', () => {
    const s = keepRich('lines');
    const w = item(s, 'steel-blade', 'rare', [lines[0] as ItemLine, lines[4] as ItemLine]);
    const a = item(s, 'mail', 'rare', [lines[2] as ItemLine, lines[3] as ItemLine]);
    equipItem(s, w, 'zora', 'weapon');
    equipItem(s, a, 'zora', 'armor');
    const snap = snapshotOf(s, 'zora');
    expect(snap.lines).toEqual([lines[0], lines[4], lines[2], lines[3]]);
    const c = buildHunter(snap, 0);
    expect(mightEff(c)).toBeCloseTo(hunterStat(s, 'zora', 'might').value, 9);
    expect(armorEff(c)).toBeCloseTo(hunterStat(s, 'zora', 'armor').value, 9);
    expect(speedEff(c)).toBeCloseTo(hunterStat(s, 'zora', 'speed').value, 9);
    expect(c.maxHealth).toBe(hunterStat(s, 'zora', 'health').value);
    expect(c.critChance).toBeCloseTo(0.2 + 0.04, 12); // Striker 20% + the crit line
    // The breakdown names each line and where it came from.
    const labels = (hunterStat(s, 'zora', 'might').breakdown.children ?? []).map((x) => x.label);
    expect(labels).toContain('Rare Steel Blade: +6% Might');
    const armor = (hunterStat(s, 'zora', 'armor').breakdown.children ?? []).map((x) => x.label);
    expect(armor).toContain('Rare Mail: +2 Armor');
  });

  it('health lines raise max Health, and a bane line adds outgoing% against its family only', () => {
    const s = keepRich('bane');
    equipItem(
      s,
      item(s, 'iron-blade', 'rare', [lines[1] as ItemLine, lines[5] as ItemLine]),
      'zora',
      'weapon',
    );
    const c = buildHunter(snapshotOf(s, 'zora'), 0);
    expect(c.maxHealth).toBe(hunterStat(s, 'zora', 'health').value);
    const ctx = {
      location: 'field',
      family: 'beasts-and-wilds',
      monsterId: 'wolf',
      attacks: 1,
      hitCut: 0,
      oilBonus: 0,
    } as const;
    expect(outgoingPct(c, 'steel', ctx)).toBeCloseTo(0.12, 12);
    expect(outgoingPct(c, 'steel', { ...ctx, family: 'cursed' })).toBeCloseTo(0, 12);
  });

  it('a Might line changes the fight log, a Common item of the same base does not, and replays are exact', () => {
    const s = keepRich('fight');
    wear(s, 'zora', 'steel-blade');
    const plain = snapshotOf(s, 'zora');
    const lined = { ...plain, lines: [{ kind: 'might', size: 0.5 } as ItemLine] };
    const fight = (p: typeof plain) =>
      runFight({
        party: [p],
        monster: { monster: 'wolf', tier: 1 },
        location: 'field',
        rolls: seeded('items-fight'),
      });
    expect(fight(plain).log).toEqual(fight(plain).log);
    expect(JSON.stringify(fight(lined).log)).not.toBe(JSON.stringify(fight(plain).log));
  });
});

describe('Stores, Salvage and the commands (D304, D307)', () => {
  const richSmithy = (seed: string): GameState => {
    const s = keepRich(seed);
    s.resources = { food: 5000, wood: 5000, iron: 5000, silver: 5000 };
    s.buildings.smithy = 8;
    return s;
  };

  it('crafts an Iron Blade or Hide Armor from scratch into Stores, for the listed cost', () => {
    const s = richSmithy('craft');
    expect(run(s, { type: 'item.craft', base: 'iron-blade' }).ok).toBe(true);
    expect(run(s, { type: 'item.craft', base: 'hide-armor' }).ok).toBe(true);
    expect(s.resources).toMatchObject({ iron: 4940, wood: 4960, food: 4970 });
    expect(s.items.map((i) => [i.base, i.rarity, i.where])).toEqual([
      ['iron-blade', 'common', null],
      ['hide-armor', 'common', null],
    ]);
    expect(run(s, { type: 'item.craft', base: 'steel-blade' }).ok).toBe(false);
    const poor = keepRich('craft-poor');
    poor.resources = { food: 0, wood: 0, iron: 0, silver: 0 };
    poor.buildings.smithy = 1;
    expect(run(poor, { type: 'item.craft', base: 'iron-blade' }).ok).toBe(false);
  });

  it('reworks an item one tier up for that tier’s cost, keeping its lines and adding to what was paid', () => {
    const s = richSmithy('rework');
    const it0 = item(s, 'iron-blade', 'rare', [
      { kind: 'might', size: 0.06 },
      { kind: 'armor', size: 2 },
    ]);
    equipItem(s, it0, 'zora', 'weapon');
    expect(run(s, { type: 'item.rework', item: it0.id }).ok).toBe(true);
    const now = itemById(s, it0.id);
    expect(now).toMatchObject({ base: 'steel-blade', rarity: 'rare', lines: it0.lines });
    expect(now?.paid).toEqual({ iron: 60 + 250, silver: 0 });
    expect(s.resources).toMatchObject({ iron: 4750, wood: 4950 });
    expect(gearIn(s, 'zora', 'weapon')).toBe('steel-blade');
    // Up to the Wright's Blade, which needs the Citadel, and then nothing above it.
    expect(run(s, { type: 'item.rework', item: it0.id }).ok).toBe(true);
    const blocked = run(s, { type: 'item.rework', item: it0.id });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.reason).toBe("The Wright's Blade needs the Citadel.");
    s.cycle.age = 'citadel';
    expect(run(s, { type: 'item.rework', item: it0.id }).ok).toBe(true);
    const top = run(s, { type: 'item.rework', item: it0.id });
    expect(top.ok).toBe(false);
  });

  it('applies the Smithing cut to crafting and reworking', () => {
    const s = richSmithy('cut');
    s.skills.smithing = 10_000;
    const before = s.resources.iron;
    expect(run(s, { type: 'item.craft', base: 'iron-blade' }).ok).toBe(true);
    expect(before - s.resources.iron).toBeLessThan(60);
  });

  it('equips from Stores (the old piece goes to Stores), unequips, and refuses while the hunter is busy', () => {
    const s = richSmithy('equip');
    const a = item(s, 'steel-blade', 'fine', [{ kind: 'might', size: 0.06 }]);
    const b = item(s, 'iron-blade', 'fine', [{ kind: 'speed', size: 1 }]);
    expect(run(s, { type: 'item.equip', item: a.id, hunter: 'zora' }).ok).toBe(true);
    expect(run(s, { type: 'item.equip', item: b.id, hunter: 'zora' }).ok).toBe(true);
    expect(gearIn(s, 'zora', 'weapon')).toBe('iron-blade');
    expect(itemById(s, a.id)?.where).toBeNull();
    expect(storesCount(s)).toBe(1);
    expect(run(s, { type: 'item.equip', item: b.id, hunter: 'halvar' }).ok).toBe(false); // already worn
    expect(run(s, { type: 'item.unequip', hunter: 'zora', slot: 'weapon' }).ok).toBe(true);
    expect(s.hunters.zora?.weapon).toBeNull();
    expect(storesCount(s)).toBe(2);
    // A hunter on a contract can change nothing.
    equipItem(s, a, 'zora', 'weapon');
    const c = put(s, { tier: 1, monster: 'kikimora' });
    expect(run(s, { type: 'contract.launch', contract: c.id, party: ['zora'] }).ok).toBe(true);
    for (const cmd of [
      { type: 'item.unequip', hunter: 'zora', slot: 'weapon' },
      { type: 'item.equip', item: b.id, hunter: 'zora' },
      { type: 'item.rework', item: a.id },
    ] as const) {
      const r = run(s, cmd);
      expect(r.ok, cmd.type).toBe(false);
      if (!r.ok) expect(r.reason).toMatch(/contract/);
    }
    // …nor can a hunter in a Delve.
    const d = richSmithy('delve-busy');
    const w = item(d, 'iron-blade', 'fine', [{ kind: 'might', size: 0.06 }]);
    equipItem(d, w, 'halvar', 'weapon');
    d.delve.run = { party: ['halvar'] } as unknown as GameState['delve']['run'];
    const r = run(d, { type: 'item.unequip', hunter: 'halvar', slot: 'weapon' });
    expect(r.ok ? '' : r.reason).toMatch(/Delve/);
  });

  it('salvages from Stores for 25% of the iron and silver put in plus 20 silver a line, and never a worn item', () => {
    const s = richSmithy('salvage');
    const rare = item(s, 'silvered-blade', 'rare', [
      { kind: 'might', size: 0.06 },
      { kind: 'armor', size: 2 },
    ]);
    expect(rare.paid).toEqual({ iron: 560, silver: 120 }); // iron 60 + steel 250 + silvered 250; silver 120
    expect(salvageValue(rare)).toEqual({ iron: 140, silver: 30 + 40 });
    const before = { ...s.resources };
    equipItem(s, rare, 'zora', 'weapon');
    expect(run(s, { type: 'item.salvage', item: rare.id }).ok).toBe(false);
    expect(run(s, { type: 'item.unequip', hunter: 'zora', slot: 'weapon' }).ok).toBe(true);
    expect(run(s, { type: 'item.salvage', item: rare.id }).ok).toBe(true);
    expect(s.resources.iron - before.iron).toBe(140);
    expect(s.resources.silver - before.silver).toBe(70);
    expect(s.items).toHaveLength(0);
    expect(run(s, { type: 'item.salvage', item: 'i999' }).ok).toBe(false);
  });

  it('holds 40 in Stores: more loot is salvaged on arrival, with a line saying so', () => {
    const s = keepRich('full');
    for (let i = 0; i < 40; i++) makeItem(s, gear['iron-blade']);
    expect(storesCount(s)).toBe(40);
    const silver = s.resources.silver;
    const out = takeLoot(s, {
      base: gear['steel-blade'],
      rarity: 'rare',
      lines: [
        { kind: 'might', size: 0.06 },
        { kind: 'speed', size: 1 },
      ],
    });
    expect(out.kind).toBe('salvaged');
    expect(storesCount(s)).toBe(40);
    expect(s.resources.silver - silver).toBe(40);
    expect(foundLines(s, [lootKey(out)])).toEqual([
      'Stores was full: the Rare Steel Blade was salvaged for 78 iron and 40 silver.',
    ]);
    expect(run(s, { type: 'item.craft', base: 'iron-blade' }).ok).toBe(false); // no room
    const kept = takeLoot(keepRich('kept'), {
      base: gear['mail'],
      rarity: 'fine',
      lines: [{ kind: 'armor', size: 2 }],
    });
    expect(foundLines(s, [lootKey(kept)])).toEqual(['Loot: a Fine Mail.']);
  });

  it('a worn item stays out of the Stores count, and the Long Night takes every item', () => {
    const s = keepRich('count');
    wear(s, 'zora', 'steel-blade');
    expect(storesCount(s)).toBe(0);
    give(s, 'ostap');
    makeItem(s, gear['mail']);
    expect(storesCount(s)).toBe(1);
  });
});

describe('contract loot arrives with the result (D305)', () => {
  it('a won contract can bring an item, listed in the result and seeded by the contract', () => {
    // Play several wins on seeds until one drops; every drop is Stores-bound and in `found`.
    let found = 0;
    for (let n = 0; n < 12 && found === 0; n++) {
      const s = keepRich(`loot-flow-${n}`);
      for (let k = 0; k < 6; k++) {
        const c = put(s, { tier: 1, monster: 'kikimora' });
        run(s, { type: 'contract.launch', contract: c.id, party: ['zora', 'halvar', 'ostap'] });
        advance(s, s.time + 24 * HOUR);
      }
      for (const r of s.results) {
        const keys = (r.found ?? []).filter((k) => k.startsWith('loot:'));
        found += keys.length;
        for (const k of keys) expect(foundLines(s, [k])[0]).toMatch(/^Loot: a (Fine|Rare|Heroic) /);
      }
      if (found > 0) expect(s.items.length).toBeGreaterThan(0);
      expect(JSON.stringify(s.items)).toBe(JSON.stringify(s.items.map((i) => ({ ...i }))));
    }
    expect(found).toBeGreaterThan(0);
  });
});
