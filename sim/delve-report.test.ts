// Plan T7.14: the report shows the Delver's Delves (Riftglass a week, floors a run, relics), reported only.
import { describe, expect, it } from 'vitest';
import type { RunResult } from './run';
import { delveLines } from './report';

const delver = {
  spec: { policy: 'delver', seed: 'sim-1', start: 'mon', days: 14 },
  delve: {
    runs: [
      {
        hours: 60,
        cycle: 1,
        floors: 7,
        outcome: 'guardian',
        guardianBeaten: true,
        riftglass: 16,
        relics: ['salt-ring'],
      },
      {
        hours: 60,
        cycle: 1,
        floors: 4,
        outcome: 'defeated',
        guardianBeaten: false,
        riftglass: 8,
        relics: [],
      },
      {
        hours: 130,
        cycle: 2,
        floors: 7,
        outcome: 'guardian',
        guardianBeaten: true,
        riftglass: 16,
        relics: [],
      },
    ],
    riftglassHeld: 12,
    lateHours: 1,
    chosenStart: true,
    reroll: false,
    relics: [{ id: 'salt-ring', cycle: 1 }],
    totalHours: 336,
  },
} as unknown as RunResult;

describe('the Delves section of the report', () => {
  it('lists runs, guardians, floors, Riftglass a week, shop and relics for each Delver run', () => {
    const text = delveLines([delver]).join('\n');
    expect(text).toContain('delver mon sim-1: 3 runs');
    expect(text).toContain('guardian beaten in 2');
    expect(text).toContain('median 7 floors a run');
    // 40 earned over 2 weeks.
    expect(text).toContain('20.0 Riftglass a week (12 held, bought: Chosen start, Late hours 1)');
    expect(text).toContain('1 of 6 relics');
    expect(text).toContain('first guardian in cycle 1 (60.00 h)');
  });

  it('says nothing for a policy that never Delves', () => {
    const standard = { ...delver, spec: { ...delver.spec, policy: 'standard' } } as RunResult;
    expect(delveLines([standard])).toEqual([]);
  });
});
