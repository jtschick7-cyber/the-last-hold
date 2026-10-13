// Plan T3.5: the GDD §8.3.1 "required content-validation test" (its rules are locked, plan §0.6).
// For every location × tier cell any village can generate, it checks that:
//   1. at least 1 species qualifies;
//   2. at least 2 qualify wherever investigation applies (or contracts there arrive identified);
//   3. every pair of species in a cell has different clue-tag sets, so 3 clues always
//      identify exactly one.
// It runs on every content change, so it reads the live content, not a copy of the table.
import { describe, expect, it } from 'vitest';
import { LOCATION_IDS, type LocationId } from '../../src/content/damage';
import { MONSTER_IDS, monsters, type MonsterId } from '../../src/content/monsters';
import { VILLAGE_IDS, villages } from '../../src/content/villages';
import { candidatesFor } from '../../src/core/contracts/board';

const TIERS = [1, 2, 3, 4, 5];

/** Every cell a village can generate: its locations at every tier; barrow starts at tier 2 (A3). */
const cells: { location: LocationId; tier: number; where: string }[] = [];
for (const id of VILLAGE_IDS)
  for (const location of villages[id].locations)
    for (const tier of TIERS)
      if (location !== 'barrow' || tier >= 2) {
        if (!cells.some((c) => c.location === location && c.tier === tier))
          cells.push({ location, tier, where: `${location} T${tier}` });
      }

const tagKey = (m: MonsterId): string => [...monsters[m].clueTags].sort().join('+');

/** What a hunter still can't rule out after seeing these tags (GDD §5.6.3). */
const stillPossible = (pool: readonly MonsterId[], seen: readonly string[]): MonsterId[] =>
  pool.filter((m) => seen.every((t) => (monsters[m].clueTags as readonly string[]).includes(t)));

describe('coverage: location × tier → candidates (GDD §8.3.1)', () => {
  it('finds the cells villages can generate: 4 locations, barrow from tier 2', () => {
    expect(new Set(cells.map((c) => c.location))).toEqual(new Set(LOCATION_IDS));
    expect(cells).toHaveLength(5 + 5 + 5 + 4);
  });

  it('rule 1: every cell has at least one species', () => {
    for (const c of cells)
      expect(candidatesFor(c.location, c.tier).length, c.where).toBeGreaterThan(0);
  });

  it('rule 2: every cell has at least two species, so investigation always has something to find', () => {
    for (const c of cells)
      expect(candidatesFor(c.location, c.tier).length, c.where).toBeGreaterThanOrEqual(2);
  });

  it('rule 3: no two species in a cell share a clue-tag set', () => {
    for (const c of cells) {
      const keys = candidatesFor(c.location, c.tier).map(tagKey);
      expect(new Set(keys).size, c.where).toBe(keys.length);
    }
  });

  it('rule 3, as play sees it: all three clues of any species, in any order, leave exactly that species', () => {
    const orders = [
      [0, 1, 2],
      [0, 2, 1],
      [1, 0, 2],
      [1, 2, 0],
      [2, 0, 1],
      [2, 1, 0],
    ];
    for (const c of cells) {
      const pool = candidatesFor(c.location, c.tier);
      for (const m of pool)
        for (const order of orders) {
          const tags = order.map((i) => monsters[m].clueTags[i] as string);
          expect(stillPossible(pool, tags), `${c.where} ${m} ${order.join('')}`).toEqual([m]);
          // Fewer clues never rule out the true species.
          for (let n = 0; n <= 3; n++) expect(stillPossible(pool, tags.slice(0, n))).toContain(m);
        }
    }
  });

  it('every species has three different tags and is in at least one generated cell', () => {
    for (const m of MONSTER_IDS) {
      expect(new Set(monsters[m].clueTags).size, m).toBe(3);
      expect(
        cells.some((c) => candidatesFor(c.location, c.tier).includes(m)),
        m,
      ).toBe(true);
    }
  });
});
