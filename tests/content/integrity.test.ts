// Plan T1.8 / technical design §5.1: every ID, text key and unlock reference in
// the content resolves. (The GDD §7 key match is in balance.test.ts; balance-key
// references are in v01-content.test.ts.)
import { describe, expect, it } from 'vitest';
import { AGE_IDS, ages } from '../../src/content/ages';
import { BUILDING_IDS, buildings } from '../../src/content/buildings';
import { JOB_IDS, jobs } from '../../src/content/jobs';
import { RESIDENT_IDS } from '../../src/content/residents';
import { RESOURCE_IDS, type ResourceBundle } from '../../src/content/resources';
import { start } from '../../src/content/start';
import { buildingBlurbs } from '../../src/content/text/blurbs';
import { LINE_TRIGGERS, lineTriggerRules, residentLines } from '../../src/content/text/lines';

const has = (list: readonly string[], id: string): boolean => list.includes(id);
const ageIndex = (id: string): number => (AGE_IDS as readonly string[]).indexOf(id);
const bundleIds = (b: ResourceBundle): string[] => Object.keys(b);

describe('IDs resolve', () => {
  it('building costs, jobs and effects name real resources, jobs and Ages', () => {
    for (const b of Object.values(buildings)) {
      expect(has(AGE_IDS, b.availableFrom), b.id).toBe(true);
      if (b.kind !== 'unique')
        for (const r of bundleIds(b.baseCost)) expect(has(RESOURCE_IDS, r), r).toBe(true);
      if (b.kind === 'level')
        for (const a of Object.keys(b.maxLevel)) expect(has(AGE_IDS, a), a).toBe(true);
      for (const e of b.effects) {
        if (e.kind === 'jobSlots') expect(has(JOB_IDS, e.job), e.job).toBe(true);
        if (e.kind === 'production') expect(has(RESOURCE_IDS, e.resource), e.resource).toBe(true);
      }
    }
    for (const j of Object.values(jobs)) expect(has(RESOURCE_IDS, j.produces)).toBe(true);
  });

  it('every job has a building that gives it slots', () => {
    const slotted = Object.values(buildings).flatMap((b) =>
      b.effects.flatMap((e) => (e.kind === 'jobSlots' ? [e.job] : [])),
    );
    for (const job of JOB_IDS) expect(slotted, job).toContain(job);
  });

  it('the starting state names real IDs', () => {
    expect(has(AGE_IDS, start.age)).toBe(true);
    for (const id of Object.keys(start.buildings)) expect(has(BUILDING_IDS, id), id).toBe(true);
    for (const id of Object.keys(start.resources)) expect(has(RESOURCE_IDS, id), id).toBe(true);
    for (const id of start.jobPriority) expect(has(JOB_IDS, id), id).toBe(true);
  });
});

describe('unlocks resolve', () => {
  it('each Age-up requires real buildings that can exist before that Age', () => {
    for (const age of Object.values(ages)) {
      if (!age.ageUp) continue;
      for (const id of Object.keys(age.ageUp.requires.buildings)) {
        expect(has(BUILDING_IDS, id), id).toBe(true);
        const b = buildings[id as keyof typeof buildings];
        expect(ageIndex(b.availableFrom), `${id} must be buildable before ${age.id}`).toBeLessThan(
          ageIndex(age.id),
        );
      }
      for (const r of bundleIds(age.ageUp.cost)) expect(has(RESOURCE_IDS, r), r).toBe(true);
    }
  });

  it('a level building required for an Age-up can reach the required level first', () => {
    for (const age of Object.values(ages)) {
      if (!age.ageUp) continue;
      const before = AGE_IDS[ageIndex(age.id) - 1];
      for (const [id, need] of Object.entries(age.ageUp.requires.buildings)) {
        const b = buildings[id as keyof typeof buildings];
        if (b.kind === 'level' && before)
          expect(b.maxLevel[before] ?? 0, id).toBeGreaterThanOrEqual(need ?? 0);
      }
    }
  });
});

describe('text keys resolve', () => {
  it('every building has a blurb, and every blurb has a building', () => {
    expect(Object.keys(buildingBlurbs).sort()).toEqual([...BUILDING_IDS].sort());
    for (const text of Object.values(buildingBlurbs)) expect(text.trim().length).toBeGreaterThan(0);
  });

  it('every line trigger has 3–5 short variants from a real resident (primer §6.2)', () => {
    expect(Object.keys(residentLines).sort()).toEqual([...LINE_TRIGGERS].sort());
    for (const [trigger, t] of Object.entries(residentLines)) {
      expect(has(RESIDENT_IDS, t.speaker), trigger).toBe(true);
      expect(t.variants.length, trigger).toBeGreaterThanOrEqual(3);
      expect(t.variants.length, trigger).toBeLessThanOrEqual(5);
      for (const v of t.variants) expect(v.length, v).toBeLessThanOrEqual(80);
    }
  });

  it('lines use only the placeholders their trigger fills in', () => {
    for (const [trigger, t] of Object.entries(residentLines)) {
      for (const v of t.variants) {
        for (const [, name] of v.matchAll(/\{(\w+)\}/g)) {
          expect(t.placeholders as readonly string[], `${trigger}: ${v}`).toContain(name);
        }
        expect(v, 'unbalanced braces').not.toMatch(/\{(?!\w+\})|(?<!\{\w+)\}/);
      }
    }
  });

  it('peasant milestones rise', () => {
    const m = lineTriggerRules.peasantMilestones;
    for (let i = 1; i < m.length; i++) expect(m[i]).toBeGreaterThan(m[i - 1] ?? 0);
  });

  it('the Keep restoration has its text (primer §6.5)', () => {
    const r = ages.keep.ageUp?.restores;
    expect(r?.summary).toBeTruthy();
    expect(r?.inscription).toBeTruthy();
  });
});
