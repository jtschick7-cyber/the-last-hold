// Plan T8.16 (GDD §6.2 v0.8): the hunter-depth numbers a run reports: stars, Wrights and items per
// cycle, the Legendaries found, and the Delver's Delve XP. Reported only, so this checks the record
// and its words, not any target.
import { describe, expect, it } from 'vitest';
import { depthLines } from './report';
import { runOne } from './run';

describe('the hunter-depth record', () => {
  const r = runOne({ policy: 'standard', seed: 'sim-1', start: 'mon', days: 2 });

  it('has an entry for the cycle the run ended in, with whole numbers', () => {
    expect(r.depth.cycles.length).toBeGreaterThanOrEqual(1);
    const last = r.depth.cycles[r.depth.cycles.length - 1];
    expect(Number.isInteger(last?.stars)).toBe(true);
    expect(Number.isInteger(last?.wrights)).toBe(true);
    expect(Object.keys(last?.items ?? {})).toEqual(['fine', 'rare', 'heroic']);
    expect(r.depth.delveXp).toBe(0); // Standard never Delves
  });

  it('is written out for Standard and Delver runs only', () => {
    expect(depthLines([r])).toHaveLength(1);
    expect(depthLines([r])[0]).toMatch(
      /^- standard mon sim-1: cycle 1: \d+ stars, \d+ Wrights, items \d+\/\d+\/\d+; Legendaries: /,
    );
    const light = { ...r, spec: { ...r.spec, policy: 'light' as const } };
    expect(depthLines([light])).toEqual([]);
  });
});
