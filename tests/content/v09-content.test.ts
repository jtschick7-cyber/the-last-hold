// Plan T9.4 (GDD §8.5, §8.5b, §8.13, §8.14; D358–D362, D368, D381): the Great Beasts, quarries, tracks
// and legendary hunters match the GDD tables, and the content rules of the plan hold.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { assetById, EVENT_CREATURE_IDS, eventCreaturePortraitId } from '../../src/content/assets';
import { BOSS_IDS, bosses, type EventCreature } from '../../src/content/great-beasts';
import { HUNTER_IDS, hunters, type HunterDef } from '../../src/content/hunters';
import { LEGENDARY_HUNTER_IDS } from '../../src/content/hunters-v09';
import { HUNT_IDS, hunts, QUARRY_IDS, quarries, type TrackDef } from '../../src/content/hunts';
import { traits } from '../../src/content/traits';
import { DAMAGE_TYPES, families } from '../../src/content/damage';
import { monsters } from '../../src/content/monsters';
import { flattenBalance } from './flatten-balance';

const gdd = readFileSync(new URL('../../docs/gdd.md', import.meta.url), 'utf8');
const part = (from: string, to: string): string => {
  const i = gdd.indexOf(from);
  if (i < 0) throw new Error(`No heading ${from}`);
  const j = gdd.indexOf(to, i + from.length);
  return gdd.slice(i, j < 0 ? undefined : j);
};
const clean = (s: string): string =>
  s
    .replace(/\*\*|\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const rows = (text: string): string[][] =>
  text
    .split('\n')
    .filter((l) => l.startsWith('|') && !l.includes('---'))
    .map((l) =>
      l
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map(clean),
    );
/** The table that starts with this header cell, without its header row. */
const table = (text: string, firstHeader: string): string[][] => {
  const all = rows(text);
  const start = all.findIndex((r) => r[0] === firstHeader);
  if (start < 0) throw new Error(`No table starting ${firstHeader}`);
  const out: string[][] = [];
  for (const r of all.slice(start + 1)) {
    if (r[0] === firstHeader) break;
    out.push(r);
  }
  return out;
};
const num = (s: string | undefined): number => Number((s ?? '').replace(/,/g, ''));

const beastsText = part('### 8.13 Great Beasts', '### 8.14');
const huntsText = part('### 8.14 Legendary Hunts', '## Judgment calls in §6–8');
const resistOf = (c: EventCreature): number[] => DAMAGE_TYPES.map((t) => c.resist[t]);
const byName = <T extends { name: string }>(list: readonly T[], name: string): T => {
  const found = list.find((x) => x.name === name);
  if (!found) throw new Error(`No ${name}`);
  return found;
};

describe('Great Beasts (GDD §8.13)', () => {
  const list = BOSS_IDS.map((id) => bosses[id]);

  it('are the three of the table, in the order of boss.order', () => {
    expect(BOSS_IDS).toEqual(['lindworm-of-velk-fjord', 'barrow-king', 'mother-of-the-river']);
    const order = flattenBalance(balance).get('boss.order')?.value as string[];
    // boss.order is locked with short keys (D379); the ids are the technical design's (§5.2),
    // so the two lists are matched by position.
    expect(BOSS_IDS.map((id) => id.split('-')[0])).toEqual(order.map((k) => k.split('-')[0]));
    for (const id of BOSS_IDS) expect(bosses[id].id).toBe(id);
  });

  it('match the stats table; the pool is boss.poolBase, so there is no Health here', () => {
    const t = table(beastsText, 'Great Beast');
    expect(t).toHaveLength(3);
    for (const [name, family, pool, might, armor, speed, atk] of t) {
      const b = byName(list, name ?? '');
      expect(pool).toBe('`boss.poolBase`');
      expect(families[b.family].name).toBe(family);
      expect([b.might, b.armor, b.speed, b.attacks]).toEqual([
        num(might),
        num(armor),
        num(speed),
        num(atk),
      ]);
      expect('health' in b).toBe(false);
    }
  });

  it('match the resistance rows', () => {
    // The resistance table shares the stats table's first header cell; read the rows of six numbers.
    const r = Object.fromEntries(
      rows(beastsText)
        .filter((row) => row.length === 7 && row.slice(1).every((c) => !Number.isNaN(num(c))))
        .map(([n, ...v]) => [n, v.map(num)]),
    );
    expect(Object.keys(r)).toHaveLength(3);
    for (const b of list) expect(resistOf(b), b.name).toEqual(r[b.name]);
  });

  it('carry the abilities, reagent, "What it was" and notebook line of the GDD', () => {
    for (const b of list) {
      expect(b.abilities.length, b.name).toBeGreaterThanOrEqual(2);
      expect(gdd, b.name).toContain(b.whatItWas);
      expect(gdd, b.name).toContain(`*"${b.notebook}"*`);
      expect(b.reagent).toBeDefined();
    }
    expect(bosses['lindworm-of-velk-fjord'].abilities).toEqual([
      { kind: 'coil', name: 'Coil', every: 3 },
      { kind: 'fjordRoar', name: 'Fjord Roar', every: 5, knockBack: 20 },
    ]);
    expect(bosses['barrow-king'].abilities).toEqual([
      { kind: 'barrowGrip', name: 'Barrow-Grip', every: 3 },
      { kind: 'graveChill', name: 'Grave Chill', maxHealthFraction: 0.02 },
    ]);
    expect(bosses['mother-of-the-river'].abilities).toEqual([
      { kind: 'drowningSong', name: 'Drowning Song', every: 4 },
      { kind: 'weirPull', name: 'Weir-Pull', every: 4, knockBack: 25 },
    ]);
    expect(bosses['barrow-king'].reagent).toBe('grave-dust');
    expect(bosses['mother-of-the-river'].reagent).toBe('river-pearl');
    expect(bosses['lindworm-of-velk-fjord'].reagent).toBe('wolf-fang');
  });
});

describe('Quarries (GDD §8.14)', () => {
  const list = QUARRY_IDS.map((id) => quarries[id]);

  it('match the stats table', () => {
    const t = table(huntsText, 'Quarry').filter((r) => r.length === 8);
    expect(t).toHaveLength(3);
    for (const [name, family, unlocks, health, might, armor, speed, atk] of t) {
      const q = byName(list, name ?? '');
      expect(families[q.family].name).toBe(family);
      expect(byName(Object.values(hunters), unlocks ?? '').id).toBe(
        hunts[HUNT_IDS.find((h) => hunts[h].quarry === q.id) ?? 'stoneback'].hunter,
      );
      expect([q.health, q.might, q.armor, q.speed, q.attacks]).toEqual([
        num(health),
        num(might),
        num(armor),
        num(speed),
        num(atk),
      ]);
    }
  });

  it('match the resistance rows', () => {
    const r = Object.fromEntries(
      rows(huntsText)
        .filter((row) => row.length === 7 && row.slice(1).every((c) => !Number.isNaN(num(c))))
        .map(([n, ...v]) => [n, v.map(num)]),
    );
    expect(Object.keys(r)).toHaveLength(3);
    for (const q of list) expect(resistOf(q), q.name).toEqual(r[q.name]);
  });

  it('carry the "What it was" and notebook lines, and a reagent for a replay win', () => {
    for (const q of list) {
      expect(gdd, q.name).toContain(q.whatItWas.replace('sleeper’s', "sleeper's"));
      expect(gdd, q.name).toContain(`*"${q.notebook}"*`);
      expect(q.abilities).toHaveLength(2);
    }
  });
});

describe('Hunts and tracks (GDD §8.14)', () => {
  const start = HUNTER_IDS.filter((h) => !(LEGENDARY_HUNTER_IDS as readonly string[]).includes(h));
  const allows = (t: TrackDef, h: HunterDef): boolean => {
    const r = t.restriction;
    if (r.kind === 'roles') return r.roles.includes(h.role);
    if (r.kind === 'damage') return r.types.includes(h.damage);
    return h.traits.some((x) => r.traits.includes(x));
  };

  it('are nine tracks with the GDD’s names, restrictions and tiers', () => {
    const t = table(huntsText, 'Hunt').filter((r) => r.length === 5);
    expect(t).toHaveLength(9);
    const tiers = flattenBalance(balance).get('hunt.trackTiers')?.value as number[];
    t.forEach(([hunt, number, name, who, tier], i) => {
      const def = hunts[HUNT_IDS[Math.floor(i / 3)] ?? 'stoneback'];
      const track = def.tracks[i % 3];
      expect(hunt?.toLowerCase().startsWith(def.label.toLowerCase())).toBe(true);
      expect(['I', 'II', 'III'][(track?.number ?? 1) - 1]).toBe(number);
      expect(track?.name).toBe(name);
      expect(track?.restrictionText).toBe(who);
      expect(tiers[(track?.number ?? 1) - 1]).toBe(num(tier));
    });
  });

  it('give every track at least four legal hunters among the starting eleven', () => {
    expect(start).toHaveLength(11);
    for (const id of HUNT_IDS)
      for (const t of hunts[id].tracks) {
        const legal = start.filter((h) => allows(t, hunters[h]));
        expect(legal.length, t.name).toBeGreaterThanOrEqual(4);
      }
  });

  it('use only real traits and need no hunter that only an event gives', () => {
    for (const id of HUNT_IDS)
      for (const t of hunts[id].tracks)
        if (t.restriction.kind === 'traits')
          for (const x of t.restriction.traits) expect(traits[x], x).toBeDefined();
    expect(start.every((h) => !['huntPoints'].includes(hunters[h].unlock.kind))).toBe(true);
  });

  it('pair each hunt with its quarry, its legendary hunter and the unlock line of the GDD', () => {
    expect(hunts.stoneback.hunter).toBe('gest-tall-torch');
    expect(hunts.mara.hunter).toBe('radmila-of-the-reeds');
    expect(hunts.likho.hunter).toBe('ragnhild-eye-taker');
    for (const id of HUNT_IDS) {
      expect(gdd).toContain(`*"${hunts[id].unlockLine}"*`);
      expect(hunters[hunts[id].hunter].unlock).toEqual({ kind: 'huntPoints', hunt: id });
    }
  });
});

describe('Legendary hunters (GDD §8.5, D362, D368)', () => {
  const t = table(part('**v0.9 adds three legendary hunters**', 'Portraits (art task)'), 'Hunter');

  it('match the table: role, damage, origin, traits, stats and sketch', () => {
    expect(t).toHaveLength(3);
    for (const [name, role, damage, origin, tr, , stats, sketch] of t) {
      const h = byName(Object.values(hunters), name ?? '');
      expect(h.role).toBe((role ?? '').toLowerCase());
      expect(h.damage).toBe((damage ?? '').toLowerCase());
      expect(h.origin).toBe((origin ?? '').toLowerCase());
      expect(h.traits.map((x) => traits[x].name)).toEqual((tr ?? '').split(', '));
      expect(Object.values(h.stats).join('/')).toBe(stats);
      expect(h.sketch.replace(/’/g, "'")).toBe(sketch?.replace(/’/g, "'"));
    }
  });

  it('are free, have no letters, are not story hunters and do not start in the roster', () => {
    for (const id of LEGENDARY_HUNTER_IDS) {
      expect(hunters[id].recruitPrice).toBe(0);
      expect(hunters[id].story).toBe(false);
      expect(hunters[id].unlock.kind).toBe('huntPoints');
    }
  });

  it('have the three traits of the GDD', () => {
    expect(traits['eye-taker'].effect).toEqual({ kind: 'critPoints', amount: 10 });
    expect(traits['tall-torch'].effect).toEqual({ kind: 'partyHitWhileStanding', amount: 0.03 });
    expect(traits['night-sitter'].effect).toEqual({
      kind: 'mightVsFamily',
      family: 'field-and-forest-spirits',
      amount: 0.2,
    });
  });
});

describe('Events content is never required elsewhere (plan T9.4 #3, #4)', () => {
  it('puts no Great Beast or quarry in the bestiary', () => {
    const names = new Set(Object.values(monsters).map((m) => m.name));
    for (const c of [...BOSS_IDS.map((b) => bosses[b]), ...QUARRY_IDS.map((q) => quarries[q])])
      expect(names.has(c.name), c.name).toBe(false);
  });

  it('has a manifest row (a placeholder) for each of the six creatures', () => {
    expect(EVENT_CREATURE_IDS).toHaveLength(6);
    for (const c of EVENT_CREATURE_IDS)
      expect(assetById.get(eventCreaturePortraitId(c))?.source, c).toBe('placeholder');
  });
});
