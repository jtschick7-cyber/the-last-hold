// Plan T5.14: the report shows the story's numbers (bands, letters, trust, names), reported only.
import { describe, expect, it } from 'vitest';
import type { RunResult } from './run';
import { storyLines } from './report';

const run = {
  spec: { policy: 'standard', seed: 'sim-1', start: 'mon', days: 14 },
  story: {
    documents: [{ id: 'D1-01', cycle: 1, hours: 3 }],
    names: [{ n: 39, cycle: 1, hours: 30 }],
    letters: [
      { hunter: 'ostap', slot: 0, cycle: 1, hours: 20 },
      { hunter: 'halvar', slot: 0, cycle: 2, hours: 90 },
    ],
    bands: [
      { cycle: 1, band: 'held', waves: 10 },
      { cycle: 2, band: 'triumphant', waves: 13 },
    ],
    trust: [
      { cycle: 1, levels: { mirograd: 'trusting', 'kozly-hollow': 'cold' } },
      { cycle: 2, levels: { mirograd: 'trusting', 'kozly-hollow': 'wary' } },
    ],
    trustRoseInCycle1: 1,
  },
} as unknown as RunResult;

describe('the story section of the report', () => {
  it('lists bands, letters, names, documents and trust for each Standard run', () => {
    const text = storyLines([run]).join('\n');
    expect(text).toContain('standard mon sim-1');
    expect(text).toContain('cycle 1 Held (10 waves)');
    expect(text).toContain('cycle 2 Triumphant (13 waves)');
    expect(text).toContain('2 letters');
    expect(text).toContain('1 of 40 names');
    expect(text).toContain('1 documents');
    expect(text).toContain('kozly-hollow wary');
  });
});
