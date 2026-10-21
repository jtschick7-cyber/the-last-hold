// Plan T8.3 (D300–D328): the v0.8 mechanics content matches GDD §5.11, §7.10, §8.5b, §8.11 and
// §8.12, and the D20 content test holds for the new Delve rewards. Texts and numbers are read from
// the docs themselves, so a doc edit and a content edit can't drift.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { balance } from '../../src/content/balance';
import { delveRewards } from '../../src/content/delves/rewards';
import { FAMILY_IDS } from '../../src/content/damage';
import { gear, GEAR_IDS } from '../../src/content/gear';
import { HUNTER_IDS, hunters, ROLE_IDS } from '../../src/content/hunters';
import {
  BONUS_LINE_IDS,
  bonusLines,
  CRAFT_FROM_SCRATCH,
  guardianLootBases,
  itemRarities,
  LOOT_RARITY_IDS,
  lootBases,
  reworkNext,
} from '../../src/content/items';
import { LEGENDARY_IDS, legendaries } from '../../src/content/legendaries';
import { hunterRanks, STAR_KEYS } from '../../src/content/ranks';
import { allDocuments } from '../../src/content/story/acts';
import { TALENT_BRANCHES, talents, talentsOf } from '../../src/content/talents';
import { USE_SKILL_IDS, useSkillOf, useSkills } from '../../src/content/use-skills';
import { constantAt } from '../../src/core/balance-access';

const gdd = readFileSync(new URL('../../docs/gdd.md', import.meta.url), 'utf8');
const flat = (s: string): string => s.replace(/\s+/g, ' ').replace(/\*/g, '').trim();
const part = (from: string, to: string): string => {
  const i = gdd.indexOf(from);
  if (i < 0) throw new Error(`No heading ${from}`);
  const j = gdd.indexOf(to, i + from.length);
  return gdd.slice(i, j < 0 ? undefined : j);
};
const cells = (row: string): string[] =>
  row
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => flat(c));
const tableRows = (text: string): string[][] =>
  text
    .split('\n')
    .filter((l) => l.startsWith('|') && !l.includes('---'))
    .map(cells);

describe('the §7.10 constants (D325)', () => {
  it('start at the GDD values', () => {
    expect(balance.loot.chanceBase.value).toBe(0.1);
    expect(balance.loot.chancePerTier.value).toBe(0.05);
    expect(balance.loot.rarityWeights.value).toEqual({ fine: 65, rare: 27, heroic: 8 });
    expect(balance.loot.lines.value).toEqual({
      might: 0.06,
      health: 0.08,
      armor: 2,
      speed: 1,
      crit: 0.04,
      bane: 0.12,
    });
    expect(balance.salvage.share.value).toBe(0.25);
    expect(balance.salvage.perLine.value).toBe(20);
    expect(balance.rank.wrightTrophies.value).toBe(10); // 20 at the flesh-out; tuned in T8.18 (D354)
    expect(balance.rank.masterTrophies.value).toBe(60);
    expect(balance.star.embersPerStar.value).toBe(20);
    expect(balance.star.trophiesPerStar.value).toBe(10);
    expect(balance.star.growthPerStar.value).toBe(0.01);
    expect(balance.yard.share.value).toBe(0.25);
    expect(balance.delve.xpPerTier.value).toBe(10);
    expect(balance.delve.guardianXpPerTier.value).toBe(20);
    expect(balance.delve.guardianLootWeights.value).toEqual({ fine: 50, rare: 35, heroic: 15 });
  });

  it('lock exactly the eight D325 names, and nothing else of the new keys', () => {
    expect(balance.stores.cap).toMatchObject({ value: 40, locked: true });
    expect(balance.star.max).toMatchObject({ value: 5, locked: true });
    expect(balance.keepsake.slots).toMatchObject({ value: 1, locked: true });
    expect(balance.talent.points).toMatchObject({
      value: { apprentice: 1, wright: 3, masterWright: 5 },
      locked: true,
    });
    expect(balance.talent.tierStars).toMatchObject({ value: [0, 2, 4], locked: true });
    expect(balance.rank.wrightLevel).toMatchObject({ value: 5, locked: true });
    expect(balance.rank.masterLevel).toMatchObject({ value: 10, locked: true });
    expect(balance.yard.capRank).toMatchObject({ value: 3, locked: true });
    const tunables = [
      balance.loot.chanceBase,
      balance.loot.rarityWeights,
      balance.loot.lines,
      balance.salvage.share,
      balance.rank.wrightTrophies,
      balance.star.embersPerStar,
      balance.star.growthPerStar,
      balance.yard.share,
      balance.delve.xpPerTier,
      balance.delve.guardianLootWeights,
    ];
    for (const c of tunables) expect(c.locked).toBe(false);
  });
});

describe('items (GDD §5.3.6, §5.11.1–§5.11.2, D304–D305)', () => {
  const s536 = part('#### 5.3.6 Gear', '#### 5.3.7');
  const rows = tableRows(s536).slice(1);

  it('the seven Common items equal the gear table number for number', () => {
    const bonus = (name: string): { might: number; armor: number } => {
      const effect =
        rows.find(
          (r) => flat(r[0] ?? '').replace(/^Wright's Blade.*/, "Wright's Blade") === name,
        )?.[1] ?? '';
      return {
        might: Number(/\+(\d+) Might/.exec(effect)?.[1] ?? 0),
        armor: Number(/\+(\d+) Armor/.exec(effect)?.[1] ?? 0),
      };
    };
    for (const id of GEAR_IDS) {
      const g = gear[id];
      expect(bonus(g.name), g.name).toEqual({ might: g.might, armor: g.armor });
    }
    expect(GEAR_IDS).toHaveLength(7);
  });

  it('crafts the first tier from scratch and reworks one tier up, never across slots', () => {
    expect([...CRAFT_FROM_SCRATCH].sort()).toEqual(['hide-armor', 'iron-blade']);
    for (const id of GEAR_IDS) {
      const next = reworkNext[id];
      if (next === null) continue;
      expect(gear[next].slot, id).toBe(gear[id].slot);
      expect(gear[next].tier, id).toBe(gear[id].tier + 1);
    }
    // The Wright's Blade is reached only by rework (D304): no loot table has it.
    const dropped = [...lootBases.flatMap((b) => [b.weapon, b.armor]), ...guardianLootBases];
    expect(dropped).not.toContain('wrights-blade');
    expect(Object.values(reworkNext)).toContain('wrights-blade');
  });

  it('drops the base pieces of GDD §5.11.2 by contract tier, and the guardian’s two', () => {
    const s = part('#### 5.11.2 Loot', '#### 5.11.3');
    expect(lootBases.map((b) => b.tier)).toEqual([1, 2, 3, 4, 5]);
    const names = (id: keyof typeof gear): string => gear[id].name;
    for (const b of lootBases) {
      expect(gear[b.weapon].slot).toBe('weapon');
      expect(gear[b.armor].slot).toBe('armor');
    }
    expect(flat(s)).toContain(
      `tiers 1–2 ${names(lootBases[0]?.weapon ?? 'iron-blade')} or ${names(lootBases[0]?.armor ?? 'hide-armor')}`,
    );
    expect(flat(s)).toContain(`tier 3 ${names('steel-blade')} or ${names('mail')}`);
    expect(flat(s)).toContain(`tier 4 ${names('silvered-blade')} or ${names('mail')}`);
    expect(flat(s)).toContain(`tier 5 ${names('silvered-blade')} or ${names('emberwright-plate')}`);
    expect(guardianLootBases.map(names)).toEqual(['Silvered Blade', 'Emberwright Plate']);
  });

  it('has the rarities and the line pool of GDD §5.11.2', () => {
    expect(Object.values(itemRarities).map((r) => [r.name, r.lines])).toEqual([
      ['Common', 0],
      ['Fine', 1],
      ['Rare', 2],
      ['Heroic', 3],
    ]);
    expect(LOOT_RARITY_IDS).toEqual(['fine', 'rare', 'heroic']);
    expect(Object.keys(balance.loot.rarityWeights.value)).toEqual([...LOOT_RARITY_IDS]);
    expect(Object.keys(balance.delve.guardianLootWeights.value)).toEqual([...LOOT_RARITY_IDS]);
    expect(Object.keys(balance.loot.lines.value)).toEqual([...BONUS_LINE_IDS]);
    const pool = tableRows(part('- **The line pool**', '- Loot is seeded')).slice(1);
    const expected: Record<string, [string, string]> = {
      Might: ['stat%', '+6%'],
      Health: ['stat%', '+8% max Health'],
      Armor: ['flat', '+2'],
      Speed: ['flat', '+1'],
      Crit: ['crit chance', '+4 points'],
      'Bane of a family': ['outgoing% vs one contract family (rolled)', '+12%'],
    };
    for (const [name, bucket, size] of pool)
      expect([bucket, size], name).toEqual(expected[name ?? '']);
    expect(pool).toHaveLength(6);
    expect(bonusLines.bane.rollsFamily).toBe(true);
    expect(FAMILY_IDS).toHaveLength(5);
  });
});

describe('ranks and stars (GDD §5.11.3, D309, D310)', () => {
  it('read their requirements from real balance keys', () => {
    expect(Object.keys(hunterRanks)).toEqual(['apprentice', 'wright', 'masterWright']);
    for (const r of Object.values(hunterRanks)) {
      if (r.levelKey) expect(() => constantAt(r.levelKey as never)).not.toThrow();
      if (r.trophiesKey) expect(() => constantAt(r.trophiesKey as never)).not.toThrow();
      expect(Object.keys(balance.talent.points.value)).toContain(r.pointsField);
    }
    for (const key of Object.values(STAR_KEYS)) expect(() => constantAt(key)).not.toThrow();
    expect(hunterRanks.masterWright.name).toBe('Master-Wright');
  });
});

describe('use-skills (GDD §5.11.4, §8.5b, D312, D314)', () => {
  const rows = tableRows(part('#### 8.5b', '### 8.6'))
    .filter((r) => r.length === 4)
    .slice(1);

  it('are fourteen (eleven of v0.8 and the three of v0.9), one per hunter, with the GDD’s names, triggers and effects word for word', () => {
    expect(USE_SKILL_IDS).toHaveLength(14);
    expect(rows).toHaveLength(14);
    expect(new Set(HUNTER_IDS.map((h) => useSkillOf(h).id)).size).toBe(HUNTER_IDS.length);
    for (const [hunter, name, trigger, effect] of rows) {
      const id = HUNTER_IDS.find((h) => hunters[h].name === hunter);
      expect(id, hunter).toBeDefined();
      const u = useSkillOf(id ?? 'halvar');
      expect(u.name).toBe(name);
      expect(u.triggerText).toBe(trigger);
      // A row may end in an italic design note ("*New in v0.9: ...*"); the sheet shows what comes before it.
      expect(flat(u.text)).toBe(flat(effect ?? '').split(' New in v0.9')[0]);
    }
  });

  it('have the numbers of the table', () => {
    expect(useSkills['banked-smoke'].trigger).toEqual({
      kind: 'everyNth',
      n: 3,
      insteadOfAttack: true,
    });
    expect(useSkills['banked-smoke'].effect).toEqual({
      kind: 'partyTakenUntilNextAction',
      amount: -0.2,
    });
    expect(useSkills.boathook.effect).toEqual({ kind: 'knockBackOnHit', amount: 30 });
    expect(useSkills['bonesetters-hands'].trigger).toMatchObject({ n: 4 });
    expect(useSkills['bonesetters-hands'].effect).toEqual({ kind: 'healMultiplier', mult: 2 });
    expect(useSkills['rime-dipped'].effect).toEqual({
      kind: 'slowOnHit',
      amount: 0.25,
      actions: 2,
    });
    expect(useSkills['stopping-root'].effect).toEqual({
      kind: 'venomOverTime',
      mightShare: 1,
      actions: 3,
    });
    expect(useSkills['rattle-the-pots'].effect).toEqual({ kind: 'knockBackAll', amount: 40 });
    expect(useSkills['rattle-the-pots'].trigger).toEqual({
      kind: 'firstAction',
      insteadOfAttack: true,
    });
  });
});

describe('talents (GDD §5.11.5, §8.11, D313, D314)', () => {
  const s = part('### 8.11 Talents', '### 8.12');

  it('are 27: per role 3 branches × 3 tiers, each with a single effect', () => {
    expect(talents).toHaveLength(27);
    expect(new Set(talents.map((t) => t.id)).size).toBe(27);
    for (const role of ROLE_IDS) {
      expect(talentsOf(role)).toHaveLength(9);
      expect(TALENT_BRANCHES[role]).toHaveLength(3);
      for (const b of TALENT_BRANCHES[role])
        expect(
          talentsOf(role)
            .filter((t) => t.branch === b.id)
            .map((t) => t.tier),
        ).toEqual([1, 2, 3]);
    }
  });

  it('match the GDD tables: branch names and every cell word for word', () => {
    const blocks = s.split(/\*\*(Vanguard|Striker|Mender)\*\*/).slice(1);
    expect(blocks).toHaveLength(6);
    for (let i = 0; i < blocks.length; i += 2) {
      const role = (blocks[i] ?? '').toLowerCase() as (typeof ROLE_IDS)[number];
      const [head, ...body] = tableRows(blocks[i + 1] ?? '');
      expect(head?.slice(1)).toEqual(TALENT_BRANCHES[role].map((b) => b.name));
      expect(body).toHaveLength(3);
      body.forEach((row, t) => {
        TALENT_BRANCHES[role].forEach((b, c) => {
          const talent = talentsOf(role).find((x) => x.branch === b.id && x.tier === t + 1);
          expect(talent?.text, `${role} ${b.name} ${t + 1}`).toBe(row[c + 1]);
        });
      });
    }
  });

  it('say that the Herbs branch does nothing in Delves', () => {
    expect(flat(s)).toContain('The Herbs branch does nothing in Delves');
  });
});

describe('Legendaries (GDD §5.11.6, §8.12, D306, D314)', () => {
  const rows = tableRows(part('### 8.12 Legendaries', 'On the Act V stand')).slice(1);

  it('are the six of the GDD, word for word, each with exactly one milestone', () => {
    expect(LEGENDARY_IDS).toHaveLength(6);
    expect(rows).toHaveLength(6);
    rows.forEach(([name, found, effect], i) => {
      const l = legendaries[LEGENDARY_IDS[i] as (typeof LEGENDARY_IDS)[number]];
      expect(l.name).toBe(name);
      expect(l.foundText).toBe(found);
      expect(flat(l.text)).toBe(effect);
    });
    const milestones = Object.values(legendaries).map((l) => JSON.stringify(l.milestone));
    expect(new Set(milestones).size).toBe(6);
  });

  it('are never random and never Delve-only: a family of contract species Mastered, or an Act V document', () => {
    const families = Object.values(legendaries).flatMap((l) =>
      l.milestone.kind === 'familyMastered' ? [l.milestone.family] : [],
    );
    expect([...families].sort()).toEqual([...FAMILY_IDS].sort());
    for (const l of Object.values(legendaries))
      if (l.milestone.kind === 'documentFound') {
        const id = l.milestone.id;
        expect(allDocuments.find((d) => d.id === id)?.condition.kind).toBe('actStand');
      }
  });
});

describe('the D20 content test for v0.8 (D316)', () => {
  it('gives Delve XP, Command XP and the guardian item their idle sources', () => {
    for (const id of ['hunter-xp', 'command-xp', 'guardian-item']) {
      const r = delveRewards.find((x) => x.id === id);
      expect(r?.idleSource, id).toBeDefined();
    }
  });
});
