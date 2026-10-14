// Plan T5.1: the v0.5 content matches the GDD tables (§5.3.6, §7.7, §8.2–§8.5)
// and is internally consistent. The tables are read from the GDD itself, so a
// doc edit and a content edit can't drift apart.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { CLUE_TAGS } from '../../src/content/clues';
import { V05_CLUE_TAGS, v05ClueTexts } from '../../src/content/clues-v05';
import { CURSED_IDS, cursed, type CursedId } from '../../src/content/cursed';
import { DAMAGE_TYPES } from '../../src/content/damage';
import { gear } from '../../src/content/gear';
import { arvid, v05Traits } from '../../src/content/hunters-v05';
import { roleBaselines } from '../../src/content/hunters';
import { INGREDIENT_IDS } from '../../src/content/ingredients';
import { traits as traitDefs } from '../../src/content/traits';
import { RUIN_VILLAGES, villages } from '../../src/content/villages';

const gdd = readFileSync(new URL('../../docs/gdd.md', import.meta.url), 'utf8');
const cells = (line: string): string[] =>
  line
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());
/** The table row whose first cell starts with `first` (bold and markers stripped). */
const row = (first: string, after = ''): string[] => {
  const from = after ? gdd.indexOf(after) : 0;
  const line = gdd
    .slice(from)
    .split('\n')
    .find((l) => l.startsWith('|') && cells(l)[0]?.replace(/\*/g, '').startsWith(first));
  if (!line) throw new Error(`No GDD row for ${first}`);
  return cells(line);
};
const num = (s: string): number => Number(s.replace(/\*/g, ''));

describe('the Cursed creatures (GDD §8.3, D158)', () => {
  it('have the GDD stats, tiers and locations', () => {
    for (const id of CURSED_IDS) {
      const m = cursed[id];
      const [, family, locations, tiers, h, mi, a, s, atk] = row(m.name, '### 8.3 Monsters');
      expect(family, id).toBe('Cursed');
      expect(locations, id).toBe('ruin');
      expect(tiers, id).toBe(`${m.tiers[0]}–${m.tiers[1]}`);
      expect(
        [h, mi, a, s, atk].map((x) => num(x ?? '')),
        id,
      ).toEqual([m.health, m.might, m.armor, m.speed, m.attacks]);
    }
  });

  it('have the GDD resistances', () => {
    const header = gdd.slice(gdd.indexOf('**Resistances**'));
    for (const id of CURSED_IDS) {
      const r = row(cursed[id].name, '**Resistances**').slice(1).map(num);
      expect(r, id).toEqual(DAMAGE_TYPES.map((t) => cursed[id].resist[t]));
    }
    expect(header).toContain('| Steel | Silver | Fire | Frost | Rune | Venom |');
  });

  it('have the GDD clue tags and drops', () => {
    const drops: Record<CursedId, string> = {
      'gloam-moths': 'thornwood',
      ribbonshade: 'grave dust',
      'anvil-wight': 'grave dust',
      rimewrought: 'rime salt',
    };
    for (const id of CURSED_IDS) {
      const [, , tags, drop] = row(cursed[id].name, '**Abilities, clue tags, and drops:**');
      expect(tags, id).toBe(cursed[id].clueTags.join(', '));
      expect(drop, id).toBe(drops[id]);
      expect(
        cursed[id].drops.map((d) => d.replace('-', ' ')),
        id,
      ).toEqual([drops[id]]);
      for (const d of cursed[id].drops) expect(INGREDIENT_IDS).toContain(d);
    }
  });

  it('have the GDD ability numbers', () => {
    expect(cursed['gloam-moths'].abilities).toEqual([
      { kind: 'lightless', name: 'Lightless', hitChanceCut: 0.1 },
    ]);
    expect(cursed.ribbonshade.abilities).toEqual([
      { kind: 'sealBurn', name: 'Seal-burn', reflectFraction: 0.1 },
    ]);
    expect(cursed['anvil-wight'].abilities).toEqual([
      { kind: 'reForge', name: 'Re-forge', every: 3, healFraction: 0.1 },
    ]);
    expect(cursed.rimewrought.abilities).toEqual([
      { kind: 'unthawed', name: 'Unthawed', armorStrip: 0.3 },
    ]);
    const text = gdd.slice(gdd.indexOf('**Abilities, clue tags, and drops:**'));
    expect(text).toContain("every hunter's hit chance is 10 points lower");
    expect(text).toContain('takes 10% of the damage dealt back as Fire');
    expect(text).toContain('every 3rd action, instead of attacking, it restores 10% of max Health');
    expect(text).toContain('strips 30% of its Armor');
  });

  it('use only clue tags that have texts, each with at least three, the first being the GDD example', () => {
    const known = new Set<string>([...CLUE_TAGS, ...V05_CLUE_TAGS]);
    for (const id of CURSED_IDS)
      for (const t of cursed[id].clueTags) expect(known.has(t), t).toBe(true);
    for (const t of V05_CLUE_TAGS) {
      expect(CLUE_TAGS as readonly string[]).toContain(t); // joined in T5.4
      const texts = v05ClueTexts[t];
      expect(texts.length, t).toBeGreaterThanOrEqual(3);
      expect(new Set(texts).size, t).toBe(texts.length);
      const example = row(t, '### 8.4 Clue library')[1]?.replace(/^"|"$/g, '');
      expect(texts[0], t).toBe(example);
    }
    // Every new tag is used by a Cursed creature (D158: night and cold are reused).
    const used = new Set(CURSED_IDS.flatMap((id) => cursed[id].clueTags));
    for (const t of V05_CLUE_TAGS) expect(used.has(t), t).toBe(true);
  });

  it('fill the ruin row of the coverage table (GDD §8.3.1), and its rules hold', () => {
    const coverage = row('Ruin', '#### 8.3.1');
    const short: Record<string, CursedId> = {
      Moths: 'gloam-moths',
      Ribbonshade: 'ribbonshade',
      'Anvil-wight': 'anvil-wight',
      Rimewrought: 'rimewrought',
    };
    for (let tier = 2; tier <= 5; tier++) {
      const pool = CURSED_IDS.filter(
        (id) => cursed[id].tiers[0] <= tier && cursed[id].tiers[1] >= tier,
      );
      const doc = (coverage[tier] ?? '').split(', ').map((n) => short[n]);
      expect(pool, `ruin T${tier}`).toEqual(doc);
      // Rules 2 and 3: two or more species, all with different tag sets.
      expect(pool.length).toBeGreaterThanOrEqual(2);
      const keys = pool.map((id) => [...cursed[id].clueTags].sort().join('+'));
      expect(new Set(keys).size).toBe(keys.length);
    }
    expect(coverage[1]).toContain('not generated');
  });
});

describe('ruins in the villages (GDD §8.2, D157)', () => {
  it('are Kozly Hollow, Velkvik and Ravenfell, as the GDD table says', () => {
    for (const id of Object.keys(villages) as (keyof typeof villages)[]) {
      const tags = row(villages[id].name, '### 8.2 Villages')[2] ?? '';
      expect(RUIN_VILLAGES.includes(id), id).toBe(tags.includes('ruin'));
    }
  });
});

const wrightsBlade = gear['wrights-blade'];

describe("the Wright's Blade (GDD §5.3.6, D159, D170)", () => {
  it('is the fourth weapon tier, with the GDD numbers and requirements', () => {
    expect(wrightsBlade).toMatchObject({
      slot: 'weapon',
      tier: 4,
      might: 12,
      silverSubHit: true,
      runeSubHit: true,
      cost: { iron: 600, silver: 300 },
      requires: { building: 'smithy', level: 8 },
      requiresAge: 'citadel',
    });
    const r = row("Wright's Blade", '#### 5.3.6');
    expect(r[1]).toContain('+12 Might');
    expect(r[2]).toBe('600 iron, 300 silver');
    expect(r[3]).toBe('Smithy 8 and the Citadel (the Forge Hall)');
    // Strictly better than the Silvered Blade.
    expect(wrightsBlade.might).toBeGreaterThan(gear['silvered-blade'].might);
    expect(balance.gear.runedFraction.value).toBe(0.25);
  });
});

describe('Arvid Netmender (GDD §8.5, D154)', () => {
  it('matches his GDD row', () => {
    const [, role, damage, origin, traits, , stats] = row('Arvid Netmender', 'v0.5 adds Arvid');
    expect(role).toBe('Vanguard');
    expect(damage).toBe('Rune');
    expect(origin).toBe('Highland');
    expect(traits).toBe(arvid.traits.map((t) => traitDefs[t].name).join(', '));
    const s = arvid.stats;
    expect(stats).toBe(`${s.health}/${s.might}/${s.armor}/${s.speed}`);
    expect(arvid).toMatchObject({ role: 'vanguard', damage: 'rune', origin: 'highland' });
    expect(arvid.recruitPrice).toBe(0);
    expect(arvid.story).toBe(true);
    expect(arvid.unlock).toEqual({ kind: 'actBegins', act: 3 });
  });

  it('is within the role spread of a Vanguard (±10% or 1 point)', () => {
    const base = roleBaselines.vanguard;
    for (const k of ['health', 'might', 'armor', 'speed'] as const) {
      const limit = Math.max(base[k] * 0.1, 1);
      expect(Math.abs(arvid.stats[k] - base[k]), k).toBeLessThanOrEqual(limit);
    }
  });

  it('has the GDD trait effects', () => {
    expect(v05Traits['shield-companion'].effect).toEqual({
      kind: 'lowestHealthTakenWhileStanding',
      amount: 0.15,
    });
    expect(v05Traits['old-wright'].effect).toEqual({
      kind: 'mightVsFamily',
      family: 'cursed',
      amount: 0.2,
    });
    expect(row('Shield-companion', '**Traits:**')[1]).toContain('takes −15% damage');
    expect(row('Old Wright', '**Traits:**')[1]).toBe('+20% Might vs the Cursed family');
  });
});

describe('the v0.5 balance keys (GDD §7.7, D166)', () => {
  it('have the GDD starting values, all tunable', () => {
    expect(balance.band.heldFrom).toMatchObject({ value: 9, locked: false });
    expect(balance.band.triumphantFrom).toMatchObject({ value: 12, locked: false });
    expect(balance.trust.stepContracts).toMatchObject({ value: [10, 15, 20, 25], locked: false });
    expect(balance.letters.levels).toMatchObject({ value: [5, 8], locked: false });
    expect(balance.gear.runedFraction.locked).toBe(false);
  });
});
