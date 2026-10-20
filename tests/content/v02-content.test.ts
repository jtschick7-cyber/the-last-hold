// Plan T2.1: the v0.2 content matches GDD §5.3, §8.2, §8.3 and §8.5, and is
// internally consistent. The coverage check is the GDD §8.3.1 required test
// (rule 1: every location × tier cell any village can generate has a species).
import { describe, expect, it } from 'vitest';
import { DAMAGE_TYPES, FAMILY_IDS, LOCATION_IDS, families } from '../../src/content/damage';
import { GEAR_IDS, gear } from '../../src/content/gear';
import { HUNTER_IDS, ROLE_IDS, hunters, roleBaselines } from '../../src/content/hunters';
import { MONSTER_IDS, monsters } from '../../src/content/monsters';
import { TRAIT_IDS, traits } from '../../src/content/traits';
import { VILLAGE_IDS, villages } from '../../src/content/villages';

const KEBAB = /^[a-z]+(-[a-z]+)*$/;

describe('v0.2 content', () => {
  it.each([
    ['monsters', MONSTER_IDS, monsters],
    ['hunters', HUNTER_IDS, hunters],
    ['traits', TRAIT_IDS, traits],
    ['gear', GEAR_IDS, gear],
    ['villages', VILLAGE_IDS, villages],
    ['families', FAMILY_IDS, families],
  ] as const)('%s: ids are kebab-case and match their records', (_, ids, table) => {
    expect(Object.keys(table).sort()).toEqual([...ids].sort());
    for (const id of ids) {
      expect(id).toMatch(KEBAB);
      expect((table as Record<string, { id: string }>)[id]?.id).toBe(id);
    }
  });

  it('has 14 hunters (8 from v0.2, 2 from v0.3, Arvid from v0.5, 3 legendary from v0.9), 16 monsters (4 Cursed from v0.5) and 5 villages (GDD §8)', () => {
    expect(HUNTER_IDS).toHaveLength(14);
    expect(MONSTER_IDS).toHaveLength(16);
    expect(VILLAGE_IDS).toHaveLength(5);
  });
});

describe('hunters (GDD §8.5)', () => {
  it('recruitment prices are the fixed G5 prices; the two starters are free', () => {
    const prices = Object.fromEntries(HUNTER_IDS.map((h) => [h, hunters[h].recruitPrice]));
    expect(prices).toEqual({
      halvar: 0,
      zora: 0,
      ostap: 150,
      vesna: 350,
      bjarna: 400,
      radek: 500,
      toma: 600,
      sigrun: 1200,
      stanko: 450,
      herdis: 300,
      arvid: 0, // GDD §8.5 (v0.5): free
      'gest-tall-torch': 0, // GDD §8.5 (v0.9): the legendary hunters join free
      'ragnhild-eye-taker': 0,
      'radmila-of-the-reeds': 0,
    });
    expect(HUNTER_IDS.filter((h) => hunters[h].unlock.kind === 'start').sort()).toEqual([
      'halvar',
      'zora',
    ]);
  });

  it('story hunters are Sigrun, Ostap, Toma and, from v0.5, Arvid', () => {
    expect(HUNTER_IDS.filter((h) => hunters[h].story).sort()).toEqual([
      'arvid',
      'ostap',
      'sigrun',
      'toma',
    ]);
  });

  it('each hunter has two real traits and base stats within ±10% or 1 point of the role baseline (D102)', () => {
    for (const id of HUNTER_IDS) {
      const h = hunters[id];
      expect(ROLE_IDS).toContain(h.role);
      expect(DAMAGE_TYPES).toContain(h.damage);
      expect(h.traits).toHaveLength(2);
      expect(new Set(h.traits).size).toBe(2);
      for (const t of h.traits) expect(TRAIT_IDS).toContain(t);
      const base = roleBaselines[h.role];
      for (const stat of ['health', 'might', 'armor', 'speed'] as const) {
        const ratio = h.stats[stat] / base[stat];
        // GDD §8.5: ±10% or 1 point, whichever is larger (D102).
        const off = Math.abs(h.stats[stat] - base[stat]);
        expect((ratio >= 0.9 && ratio <= 1.1) || off <= 1, `${id} ${stat}`).toBe(true);
      }
    }
  });

  it("Zora's sheet matches the GDD §5.5.1 golden fight: Speed 13 + 3 (Quick) = 16", () => {
    const zora = hunters.zora;
    expect(zora.stats).toEqual({ health: 100, might: 20, armor: 3, speed: 13 });
    expect(zora.traits).toContain('quick');
    expect(traits.quick.effect).toEqual({ kind: 'speedFlat', amount: 3 });
  });

  it('traits active in v0.2 are the twelve GDD §8.5 lists; the three v0.3 traits have their hunters', () => {
    expect(TRAIT_IDS.filter((t) => traits[t].activeFrom === 'v0.2')).toHaveLength(12);
    const v03 = HUNTER_IDS.flatMap((id) =>
      hunters[id].traits.filter((t) => traits[t].activeFrom === 'v0.3').map((t) => `${id}:${t}`),
    );
    expect(v03.sort()).toEqual(['herdis:tracker', 'stanko:wolf-friend', 'vesna:herbwise']);
  });
});

describe('monsters (GDD §8.3)', () => {
  it('every monster has complete, sane stats and resistances', () => {
    for (const id of MONSTER_IDS) {
      const m = monsters[id];
      expect(FAMILY_IDS).toContain(m.family);
      expect(m.tiers[0]).toBeGreaterThanOrEqual(1);
      expect(m.tiers[1]).toBeLessThanOrEqual(5);
      expect(m.tiers[0]).toBeLessThanOrEqual(m.tiers[1]);
      expect(m.locations.length).toBeGreaterThan(0);
      for (const l of m.locations) expect(LOCATION_IDS).toContain(l);
      expect(Object.keys(m.resist).sort()).toEqual([...DAMAGE_TYPES].sort());
      for (const t of DAMAGE_TYPES) expect(m.resist[t]).toBeGreaterThanOrEqual(0);
      expect(m.abilities.length).toBeGreaterThan(0);
    }
  });

  it('spot-checks the stat block against the GDD table', () => {
    expect(monsters.wolf).toMatchObject({
      health: 120,
      might: 10,
      armor: 2,
      speed: 14,
      attacks: 2,
    });
    expect(monsters.kikimora).toMatchObject({
      health: 110,
      might: 12,
      armor: 3,
      speed: 13,
      attacks: 1,
    });
    expect(monsters.draugr).toMatchObject({ health: 260, might: 22, armor: 9, speed: 6 });
    expect(monsters.leshy).toMatchObject({ health: 320, armor: 8, tiers: [4, 5] });
    expect(monsters.upyr.resist.venom).toBe(0); // immune (GDD §5.5, B5)
    expect(monsters.poludnitsa.resist.fire).toBe(0.25);
  });

  it('the Kikimora is the golden fight monster: Steel 1.0, Spoil, nothing else', () => {
    expect(monsters.kikimora.resist.steel).toBe(1.0);
    expect(monsters.kikimora.abilities).toEqual([{ kind: 'spoil', name: 'Spoil' }]);
  });
});

describe('villages and coverage (GDD §8.2, §8.3.1)', () => {
  it('every village location is a known tag, and every head is named', () => {
    for (const id of VILLAGE_IDS) {
      const v = villages[id];
      for (const l of v.locations) expect(LOCATION_IDS).toContain(l);
      expect(v.head.name.length).toBeGreaterThan(0);
    }
  });

  // GDD §8.3.1 verbatim. Barrow starts at tier 2 (A3).
  const table: Record<string, (string | null)[]> = {
    forest: [
      'wolf,kikimora',
      'wolf,kikimora,huldra',
      'bies,huldra',
      'bies,leshy,huldra',
      'bies,leshy',
    ],
    field: [
      'wolf,kikimora',
      'wolf,kikimora,upyr,poludnitsa,huldra',
      'upyr,poludnitsa,bies,huldra',
      'poludnitsa,bies,strzyga,huldra',
      'bies,strzyga',
    ],
    river: [
      'wolf,kikimora',
      'wolf,kikimora,rusalka',
      'rusalka,vodyanoy,nix',
      'vodyanoy,nix',
      'vodyanoy,nix',
    ],
    barrow: [null, 'wolf,upyr', 'upyr,draugr', 'draugr,strzyga', 'draugr,strzyga'],
    ruin: [
      null,
      'gloam-moths,ribbonshade',
      'gloam-moths,ribbonshade,anvil-wight',
      'ribbonshade,anvil-wight,rimewrought',
      'anvil-wight,rimewrought',
    ],
  };

  const candidates = (location: string, tier: number): string[] =>
    MONSTER_IDS.filter((m) => {
      const def = monsters[m];
      return (
        (def.locations as readonly string[]).includes(location) &&
        tier >= def.tiers[0] &&
        tier <= def.tiers[1]
      );
    }).sort();

  it('the species per location × tier cell match the GDD table', () => {
    for (const [location, row] of Object.entries(table)) {
      row.forEach((expected, i) => {
        const tier = i + 1;
        if (expected === null) return; // barrow and ruin tier 1 are never generated
        expect(candidates(location, tier), `${location} T${tier}`).toEqual(
          expected.split(',').sort(),
        );
      });
    }
  });

  it('every cell a village can generate has at least one species', () => {
    for (const id of VILLAGE_IDS) {
      for (const location of villages[id].locations) {
        for (let tier = location === 'barrow' || location === 'ruin' ? 2 : 1; tier <= 5; tier++) {
          expect(candidates(location, tier).length, `${id} ${location} T${tier}`).toBeGreaterThan(
            0,
          );
        }
      }
    }
  });
});

describe('gear (GDD §5.3.6)', () => {
  it('matches the tier table', () => {
    expect(gear['iron-blade']).toMatchObject({
      might: 4,
      cost: { iron: 60 },
      requires: { level: 1 },
    });
    expect(gear['steel-blade']).toMatchObject({ might: 9, cost: { iron: 250, wood: 50 } });
    expect(gear['silvered-blade']).toMatchObject({
      might: 9,
      silverSubHit: true,
      requires: { level: 5 },
    });
    expect(gear['hide-armor']).toMatchObject({ armor: 2, cost: { wood: 40, food: 30 } });
    expect(gear.mail).toMatchObject({ armor: 5, cost: { iron: 300 } });
    expect(gear['emberwright-plate']).toMatchObject({
      armor: 8,
      fireTakenReduction: 0.1,
      requires: { level: 6 },
    });
  });

  it("only the Silvered Blade and the Wright's Blade (v0.5, which keeps it) have a Silver sub-hit", () => {
    expect(GEAR_IDS.filter((g) => gear[g].silverSubHit)).toEqual([
      'silvered-blade',
      'wrights-blade',
    ]);
    expect(GEAR_IDS.filter((g) => gear[g].runeSubHit)).toEqual(['wrights-blade']);
  });
});
