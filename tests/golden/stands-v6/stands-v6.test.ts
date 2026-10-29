// Plan TB.13 (technical design §23.4, D593): the version 6 stand goldens, owner-approved additions
// recorded after the final constants (D598), one per layout. Each replays line for line from the saved
// record (its frozen lane table), whatever the current `breach.*` numbers are.
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { balance } from '../../../src/content/balance';
import { replayStand } from '../../../src/core/stand/replay';
import type { StandRecord } from '../../../src/core/state/game-state';
import { standLines } from './lines';

const DIR = new URL('./', import.meta.url);
const goldens = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .map(
    (f) =>
      JSON.parse(readFileSync(new URL(f, DIR), 'utf8')) as {
        name: string;
        record: StandRecord;
        wavesHeld: number;
        lines: string[];
      },
  );

describe('the version 6 stand goldens', () => {
  it('has the five layouts of the plan', () => {
    expect(goldens.map((g) => g.name).sort()).toEqual([
      'auto-arrange',
      'bad-layout',
      'edges-only',
      'no-towers',
      'suggest',
    ]);
  });

  it.each(goldens.map((g) => [g.name, g] as const))('%s replays line for line', (_name, g) => {
    expect(g.record.lanes, 'a version 6 stand carries its lane table').toBeDefined();
    const result = replayStand(g.record);
    expect(result.wavesHeld).toBe(g.wavesHeld);
    expect(standLines(result)).toEqual(g.lines);
  });

  it('replays the same after `breach.*` is tuned, because the table keeps its own numbers', () => {
    const g = goldens[0];
    if (!g) throw new Error('no golden');
    const b = balance.breach as unknown as Record<string, { value: unknown }>;
    const saved = b.volleyScale?.value;
    try {
      (b.volleyScale as { value: unknown }).value = 0.5;
      expect(standLines(replayStand(g.record))).toEqual(g.lines);
    } finally {
      (b.volleyScale as { value: unknown }).value = saved;
    }
  });
});
