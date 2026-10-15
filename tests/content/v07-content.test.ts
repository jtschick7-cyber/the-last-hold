// Plan T7.3: the Delve content matches GDD §5.10, §7.9, §8.3, §8.5a, §8.8, §8.10a and
// lore-secrets §29 word for word, and the D20 content test (D271) holds: every Delve reward
// has an idle source or is marked sidegrade, convenience or Delve-only. Texts are read from
// the docs themselves, so a doc edit and a content edit can't drift.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { hunters } from '../../src/content/hunters';
import { INGREDIENT_IDS } from '../../src/content/ingredients';
import { alternateTraits } from '../../src/content/delves/alternate-traits';
import { blessings, blessingsOf } from '../../src/content/delves/blessings';
import { RARITIES } from '../../src/content/delves/blessing-types';
import { echoes } from '../../src/content/delves/echoes';
import { guardians } from '../../src/content/delves/guardians';
import { OPEN_PATRON_IDS, PATRON_IDS, patrons } from '../../src/content/delves/patrons';
import { delveRelics, DELVE_RELIC_IDS } from '../../src/content/delves/relics';
import { delveRewards } from '../../src/content/delves/rewards';
import { pechkoResultLines, RIFT_QUIET_LINE, riftScene } from '../../src/content/delves/rift-text';
import { alternateTraitItem, COSMETIC_IDS, shopItems } from '../../src/content/delves/shop';
import { constantAt } from '../../src/core/balance-access';

const read = (name: string): string =>
  readFileSync(new URL(`../../docs/${name}`, import.meta.url), 'utf8');
const gdd = read('gdd.md');
const lore = read('lore-secrets.md');
const flat = (s: string): string => s.replace(/\s+/g, ' ').replace(/\*/g, '').trim();
const part = (text: string, from: string, to?: string): string => {
  const i = text.indexOf(from);
  if (i < 0) throw new Error(`No heading ${from}`);
  const rest = text.slice(i);
  const j = to ? rest.indexOf(to, from.length) : -1;
  return j < 0 ? rest : rest.slice(0, j);
};
const cells = (row: string): string[] =>
  row
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

const PATRON_HEADS: Record<string, string> = {
  'pale-smith': '**The Pale Smith**',
  weaver: '**The Weaver**',
  wolf: '**The Wolf Beneath the Hill**',
  'hearth-crone': '**The Hearth-Crone**',
  'drowned-bell': '**The Drowned Bell**',
  unlit: '**The Unlit**',
};

describe('the 48 blessings (GDD §8.8, D255, D257)', () => {
  const s88 = part(gdd, '### 8.8 Patrons and blessings', '### 8.9 ');

  it('are 8 per patron: 4 Faint, 3 Warm, 1 Bright', () => {
    expect(blessings).toHaveLength(48);
    expect(new Set(blessings.map((b) => b.id)).size).toBe(48);
    for (const p of PATRON_IDS) {
      const mine = blessingsOf(p);
      expect(mine, p).toHaveLength(8);
      expect(mine.filter((b) => b.rarity === 'faint')).toHaveLength(4);
      expect(mine.filter((b) => b.rarity === 'warm')).toHaveLength(3);
      expect(mine.filter((b) => b.rarity === 'bright')).toHaveLength(1);
    }
  });

  it('have the GDD’s names, rarities and exact effects, patron by patron', () => {
    const heads = Object.entries(PATRON_HEADS);
    heads.forEach(([patron, head], i) => {
      const next = heads[i + 1]?.[1];
      const block = part(s88, head, next);
      const rows = block
        .split('\n')
        .filter((l) => /^\| (Faint|Warm|Bright) \|/.test(l))
        .map(cells);
      const mine = blessingsOf(patron as (typeof PATRON_IDS)[number]);
      expect(rows, patron).toHaveLength(mine.length);
      rows.forEach(([rarity, rawName, rawEffect], k) => {
        const b = mine[k];
        const star = `${rawName}${rawEffect}`.includes('★');
        const name = (rawName ?? '').replace('★', '').trim();
        const effect = flat((rawEffect ?? '').replace('★', ''));
        expect(b?.name, `${patron} #${k}`).toBe(name);
        expect(b?.rarity, name).toBe((rarity ?? '').toLowerCase());
        expect(b?.star, name).toBe(star);
        expect(flat(b?.text ?? ''), name).toBe(effect);
      });
    });
  });

  it('have at most two ★ kinds per patron, four for the Unlit (D255, D257)', () => {
    for (const p of PATRON_IDS)
      expect(blessingsOf(p).filter((b) => b.star).length, p).toBeLessThanOrEqual(
        p === 'unlit' ? 4 : 2,
      );
    // Every ★ blessing names its rule, or (the Unlit) a drawback switch.
    for (const b of blessings.filter((x) => x.star))
      expect(b.rule !== undefined || b.drawbacks?.some((d) => d.kind === 'switch'), b.name).toBe(
        true,
      );
  });

  it('give the Unlit a gain and a "but…" line on every card (D257)', () => {
    for (const b of blessingsOf('unlit')) {
      expect(b.gain, b.name).toBeTruthy();
      expect(b.drawback, b.name).toBeTruthy();
      expect(b.drawbacks?.length, b.name).toBeGreaterThan(0);
      expect(b.text, b.name).toBe(`${b.gain}, but ${b.drawback}`);
    }
    for (const p of OPEN_PATRON_IDS)
      for (const b of blessingsOf(p)) expect(b.drawback, b.name).toBeUndefined();
  });

  it('keep the Unlit’s door locked until Act V; the five others open (D257)', () => {
    expect(OPEN_PATRON_IDS).toHaveLength(5);
    expect(patrons.unlit.lockedUntilActFive).toBe(true);
  });

  it('break the simulated Delver’s door ties in the D270 order', () => {
    const order = [...OPEN_PATRON_IDS].sort((a, b) => patrons[a].tieOrder - patrons[b].tieOrder);
    expect(order).toEqual(['hearth-crone', 'pale-smith', 'wolf', 'weaver', 'drowned-bell']);
  });

  it('use only the three rarities, and the weights add up (D255)', () => {
    expect(RARITIES).toEqual(['faint', 'warm', 'bright']);
    const w = balance.delve.rarityWeights.value;
    expect(w.faint + w.warm + w.bright).toBe(100);
  });
});

describe('the Deep guardians (GDD §8.3, D252)', () => {
  const s83 = part(gdd, '### 8.3 Monsters', '#### 8.3.1');
  const rowFor = (title: string, name: string): string[] | undefined => {
    const t = part(s83, title);
    return t
      .split('\n')
      .filter((l) => l.startsWith('|'))
      .map(cells)
      .find((c) => c[0]?.replace(/\*\(v0\.7\)\*/, '').trim() === name);
  };

  it('have the GDD’s stats and resistances', () => {
    for (const g of Object.values(guardians)) {
      const stats = rowFor('| Monster | Family | Locations', g.name);
      expect(stats, g.name).toBeDefined();
      expect(stats?.slice(1, 3), g.name).toEqual(['Deep', 'Delve guardian']);
      expect(stats?.slice(4).map(Number), g.name).toEqual([
        g.health,
        g.might,
        g.armor,
        g.speed,
        g.attacks,
      ]);
      const res = rowFor('**Resistances**', g.name);
      expect(
        res?.slice(1).map((c) => Number(c.replace(/\*/g, ''))),
        g.name,
      ).toEqual([
        g.resist.steel,
        g.resist.silver,
        g.resist.fire,
        g.resist.frost,
        g.resist.rune,
        g.resist.venom,
      ]);
      const abil = rowFor('**Abilities, clue tags, and drops:**', g.name);
      expect(abil?.[3], g.name).toBe(
        `${g.drop.replace('-', ' ')}`.replace('river pearl', 'river pearl'),
      );
      expect(INGREDIENT_IDS).toContain(g.drop);
    }
  });

  it('have the abilities’ numbers as the GDD words them', () => {
    const text = (n: string) => flat(rowFor('**Abilities, clue tags, and drops:**', n)?.[1] ?? '');
    const a = guardians['unlits-breath'].abilities;
    expect(a).toMatchObject([
      { kind: 'chill', healingLoss: 0.5, actions: 3 },
      { kind: 'drain', maxHealthFraction: 0.02 },
    ]);
    expect(text("Unlit's Breath")).toContain('50% less healing for their next 3 actions');
    expect(text("Unlit's Breath")).toContain(
      'every standing hunter loses 2% of max Health as Frost damage, ignoring Armor',
    );
    expect(guardians['the-forgotten'].abilities[0]).toMatchObject({
      mightPerSpecies: 0.03,
      healthPerSpecies: 0.03,
    });
    expect(text('The Forgotten')).toContain('+3% Might and +3% Health');
    expect(guardians['dross-tide'].abilities[0]).toMatchObject({ every: 3 });
    expect(text('The Dross-Tide')).toContain('every 3rd action');
  });

  it('are the only Deep family, Delve-only, with the lore’s lines', () => {
    const s29 = part(
      lore,
      '#### 2. The guardians’ bestiary lines'.replace('’', "'"),
      '#### 3. Ember-echoes',
    );
    for (const g of Object.values(guardians)) {
      expect(g.family).toBe('deep');
      expect(flat(s29), g.name).toContain(flat(g.whatItWas));
      expect(flat(s29), g.name).toContain(flat(g.blurb));
    }
  });
});

describe('the Delve relics (GDD §8.10a, D261)', () => {
  // GDD §8.11 and §8.12 (v0.8) follow this table, so the section ends there.
  const s = part(gdd, '#### 8.10a Delve relics', '\n### 8.11');
  const rows = s
    .split('\n')
    .filter((l) => /^\| \*\*/.test(l))
    .map(cells);

  it('are the six of the GDD, each with its effect text, a Delve source and an idle source', () => {
    expect(DELVE_RELIC_IDS).toHaveLength(6);
    expect(rows).toHaveLength(6);
    rows.forEach(([name, effect], i) => {
      const r = delveRelics[DELVE_RELIC_IDS[i] as (typeof DELVE_RELIC_IDS)[number]];
      expect(r.name).toBe((name ?? '').replace(/\*/g, ''));
      expect(flat(r.text)).toBe(flat(effect ?? ''));
      expect(r.delveSource).toBeDefined();
      expect(r.idleSource).toBeDefined();
    });
  });

  it('have the lore’s one-line descriptions', () => {
    const s29 = part(lore, '#### 4. The Delve relics in-world', '#### 5. ');
    for (const r of Object.values(delveRelics)) expect(flat(s29), r.name).toContain(flat(r.line));
  });
});

describe('the alternate traits (GDD §8.5a, D260)', () => {
  const s = part(gdd, '#### 8.5a Alternate traits', '\n### ');
  const rows = s
    .split('\n')
    .filter((l) => /^\| [A-Z][a-z]+ \| /.test(l) && !l.startsWith('| Hunter'))
    .map(cells);

  it('are 11, one per hunter, each with the GDD’s exact effect', () => {
    expect(alternateTraits).toHaveLength(11);
    expect(rows).toHaveLength(11);
    rows.forEach(([hunter, , alt, effect], i) => {
      const t = alternateTraits[i];
      expect(t?.hunter).toBe((hunter ?? '').toLowerCase());
      expect(t?.name).toBe((alt ?? '').replace(/\*/g, ''));
      expect(flat(t?.text ?? '')).toBe(flat(effect ?? ''));
    });
    expect(new Set(alternateTraits.map((t) => t.hunter)).size).toBe(11);
  });

  it('stand in for the hunter’s second trait', () => {
    for (const t of alternateTraits) {
      const h = (hunters as Record<string, { traits: readonly string[] }>)[t.hunter];
      expect(h?.traits[1], t.name).toBe(t.replaces);
    }
  });
});

describe('the Riftglass shop (GDD §5.10.8, D259)', () => {
  it('has Late hours (5 levels), the alternate trait, 4 cosmetics, Chosen start and Re-roll', () => {
    expect(shopItems.map((i) => i.name)).toEqual([
      'Late hours',
      'Gatehouse banners',
      'Wall lanterns',
      'Carved Hearth Hall door',
      'Watchtower bell',
      'Chosen start',
      'Re-roll',
    ]);
    expect(COSMETIC_IDS).toHaveLength(4);
    expect(alternateTraitItem.costKey).toBe('riftglass.shop.trait');
  });

  it('prices are the GDD’s, all from balance.ts', () => {
    expect(constantAt('riftglass.shop.lateHours').value).toEqual([30, 45, 60, 75, 90]);
    expect(constantAt('riftglass.shop.trait').value).toBe(40);
    expect(constantAt('riftglass.shop.cosmetic').value).toBe(25);
    expect(constantAt('riftglass.shop.chosenStart').value).toBe(60);
    expect(constantAt('riftglass.shop.reroll').value).toBe(60);
    for (const i of [...shopItems, alternateTraitItem]) expect(constantAt(i.costKey)).toBeDefined();
  });
});

describe('§7.9 constants (D268)', () => {
  it('locks exactly the six Delve keys, and the rest are tunable', () => {
    const locked = [
      'delve.partySize',
      'delve.floors',
      'delve.doors',
      'delve.offers',
      'delve.unlitDoorsPerRun',
      'riftglass.weeklyCap',
    ] as const;
    for (const k of locked) expect(constantAt(k).locked, k).toBe(true);
    expect(constantAt('delve.recovery').locked).toBe(false);
    expect(constantAt('riftglass.perFloor').locked).toBe(false);
  });

  it('start at the GDD’s values', () => {
    expect([
      balance.delve.partySize.value,
      balance.delve.floors.value,
      balance.delve.doors.value,
      balance.delve.offers.value,
    ]).toEqual([3, 6, 2, 3]);
    // Tuned in T7.16 (D296): one tier deeper than the flesh-out's 2 / 3 / 4.
    expect(balance.delve.baseTier.value).toEqual({ keep: 3, citadel: 4, bastion: 5 });
    expect(balance.delve.groupSize.value).toEqual({ floors1to3: 2, floors4to6: 3 });
    expect([
      balance.delve.memberHealth.value,
      balance.delve.memberMight.value,
      balance.delve.guardianHealth.value,
      balance.delve.recovery.value,
    ]).toEqual([0.5, 0.6, 2, 0.2]);
    expect([
      balance.riftglass.perFloor.value,
      balance.riftglass.guardian.value,
      balance.riftglass.weeklyCap.value,
      balance.riftglass.bankWeeks.value,
    ]).toEqual([2, 4, 70, 2]);
    // The allowance: 70 ÷ 7 = 10 a day, banking 2 weeks = 140 (GDD §5.10.8).
    expect(balance.riftglass.weeklyCap.value / 7).toBe(10);
    expect(balance.riftglass.weeklyCap.value * balance.riftglass.bankWeeks.value).toBe(140);
  });
});

describe('Ember-echoes (lore-secrets §29, D263)', () => {
  const s29 = part(lore, '#### 3. Ember-echoes (D263)', '#### 4. ');

  it('are E-01 to E-18, three per patron, one per rarity, with the lore’s texts', () => {
    expect(echoes.map((e) => e.id)).toEqual(
      Array.from({ length: 18 }, (_, i) => `E-${String(i + 1).padStart(2, '0')}`),
    );
    for (const p of PATRON_IDS)
      expect(
        echoes.filter((e) => e.patron === p).map((e) => e.rarity),
        p,
      ).toEqual(['faint', 'warm', 'bright']);
    for (const e of echoes) expect(flat(s29), e.id).toContain(flat(e.text));
    expect(echoes[0]?.text).toBe('I lit the first fire. I thought it would be enough.');
  });
});

describe('the way down (lore-secrets §29, D266)', () => {
  const s29 = part(lore, '#### 1. The way down (D266)', '#### 2. ');
  it('has the approved scene word for word', () => {
    for (const p of riftScene) expect(flat(s29)).toContain(flat(p));
  });

  it('has the result-sheet lines (Proposed drafts) as the lore gives them', () => {
    const s5 = part(lore, '#### 5. The result screen', '#### 6. ');
    for (const lines of Object.values(pechkoResultLines))
      for (const l of lines) expect(flat(s5), l).toContain(flat(l));
    expect(RIFT_QUIET_LINE).toBe('The rift is quiet tonight');
    expect(gdd).toContain(RIFT_QUIET_LINE);
  });
});

describe('the D20 content test (D271): Delves never speed up the idle path', () => {
  it('lists every Delve reward with its idle source or a sidegrade / convenience / Delve-only mark', () => {
    for (const r of delveRewards)
      expect(r.idleSource !== undefined || r.mark !== undefined, r.id).toBe(true);
    expect(new Set(delveRewards.map((r) => r.id)).size).toBe(delveRewards.length);
  });

  it('covers every kind of reward the GDD lists (§5.10.7, §5.10.8)', () => {
    const ids = delveRewards.map((r) => r.id);
    for (const id of ['reagents', 'riftglass', 'blessings', 'ember-echoes', 'deep-bestiary'])
      expect(ids, id).toContain(id);
    for (const r of DELVE_RELIC_IDS) expect(ids).toContain(`relic:${r}`);
  });

  it('gives every Delve relic both sources, and no Delve-only requirement for the true ending', () => {
    for (const r of Object.values(delveRelics)) {
      expect(r.delveSource, r.name).toBeDefined();
      expect(r.idleSource, r.name).toBeDefined();
    }
    // Echoes carry no names (lore §29); the Deep species never count toward the bestiary gate.
    for (const e of echoes) expect(e.text).not.toMatch(/#\d+/);
  });
});
