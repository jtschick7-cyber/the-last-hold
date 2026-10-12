// Plan T1.5: the v0.1 content is internally consistent. (Cross-file integrity,
// text keys and the name list come in T1.6–T1.8.)
import { describe, expect, it } from 'vitest';
import { AGE_IDS, ages } from '../../src/content/ages';
import { balance } from '../../src/content/balance';
import { BUILDING_IDS, buildings, type BuildingDef } from '../../src/content/buildings';
import { JOB_IDS, jobs } from '../../src/content/jobs';
import { RESOURCE_IDS, resources } from '../../src/content/resources';
import { start } from '../../src/content/start';
import { flattenBalance } from './flatten-balance';

const constants = flattenBalance(balance);
const KEBAB = /^[a-z]+(-[a-z]+)*$/;

const balanceKeysIn = (b: BuildingDef): string[] => [
  ...b.effects.flatMap((e) => ('perLevelKey' in e ? [e.perLevelKey] : [])),
  ...(b.kind === 'count' && b.maxCountKey ? [b.maxCountKey] : []),
];

describe('v0.1 content', () => {
  it.each([
    ['resources', RESOURCE_IDS, resources],
    ['jobs', JOB_IDS, jobs],
    ['buildings', BUILDING_IDS, buildings],
    ['ages', AGE_IDS, ages],
  ] as const)('%s: ids are kebab-case and match their records', (_, ids, table) => {
    expect(Object.keys(table).sort()).toEqual([...ids].sort());
    for (const id of ids) {
      expect(id).toMatch(KEBAB);
      expect((table as Record<string, { id: string }>)[id]?.id).toBe(id);
    }
  });

  it('every balance key that content names exists', () => {
    const named = [
      ...Object.values(jobs).map((j) => j.rateKey),
      ...Object.values(buildings).flatMap(balanceKeysIn),
      ...Object.values(ages).flatMap((a) => (a.ageUp ? [a.ageUp.allProductionKey] : [])),
    ];
    for (const key of named) expect(constants.has(key), key).toBe(true);
  });

  it('caps Silver Seams with the locked silverSeam.max (G1)', () => {
    const seam = buildings['silver-seam'];
    expect(seam.kind === 'count' && seam.maxCountKey).toBe('silverSeam.max');
    expect(constants.get('silverSeam.max')?.locked).toBe(true);
  });

  it('level buildings only allow levels from the Age they become available', () => {
    for (const b of Object.values(buildings)) {
      if (b.kind !== 'level') continue;
      const firstAge = AGE_IDS.indexOf(b.availableFrom);
      for (const age of Object.keys(b.maxLevel)) {
        expect(AGE_IDS.indexOf(age as (typeof AGE_IDS)[number])).toBeGreaterThanOrEqual(firstAge);
      }
    }
  });

  it('every cost is positive and every effect amount is positive', () => {
    for (const b of Object.values(buildings)) {
      if (b.kind !== 'unique') {
        for (const v of Object.values(b.baseCost)) expect(v).toBeGreaterThan(0);
      }
      for (const e of b.effects) if ('amount' in e) expect(e.amount).toBeGreaterThan(0);
    }
  });

  it('only the first Age has no Age-up', () => {
    expect(ages[AGE_IDS[0]].ageUp).toBeUndefined();
    for (const id of AGE_IDS.slice(1)) expect(ages[id].ageUp).toBeDefined();
  });
});

describe('starting state (GDD §5.1.4)', () => {
  const owned = (id: keyof typeof start.buildings): number => start.buildings[id] ?? 0;
  const peasants = Object.values(start.jobs).reduce((a, b) => a + b, 0);

  it('fits its own housing', () => {
    const housing = Object.values(buildings).reduce(
      (sum, b) =>
        sum +
        owned(b.id) * b.effects.reduce((h, e) => h + (e.kind === 'housing' ? e.amount : 0), 0),
      0,
    );
    expect(peasants).toBeLessThanOrEqual(housing);
  });

  it('puts every starting peasant in a real job slot', () => {
    for (const job of JOB_IDS) {
      const slots = Object.values(buildings).reduce(
        (sum, b) =>
          sum +
          owned(b.id) *
            b.effects.reduce(
              (s, e) => s + (e.kind === 'jobSlots' && e.job === job ? e.amount : 0),
              0,
            ),
        0,
      );
      expect(start.jobs[job], job).toBeLessThanOrEqual(slots);
    }
  });

  it('starts in the first Age with only buildings available there', () => {
    expect(start.age).toBe(AGE_IDS[0]);
    for (const id of Object.keys(start.buildings)) {
      expect(buildings[id as keyof typeof buildings].availableFrom).toBe(start.age);
    }
  });

  it('lists every job exactly once in the priority order', () => {
    expect([...start.jobPriority].sort()).toEqual([...JOB_IDS].sort());
  });
});
