// Plan TB.10 (technical design §15, §23, D593 (e), D594): debug.breach.freeze shows the lane table the
// stand would freeze now. It saves nothing, marks debugUsed, and there is no command that sets lanes.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply } from '../../src/core/commands/apply';
import { createNewGame } from '../../src/core/state/new-game';
import { describeFreeze, laneTableFor } from '../../src/core/systems/breach';
import { canonicalLayout } from '../../src/core/systems/layout-catalog';

const T0 = 1_760_000_000_000;
const bastion = () => {
  const s = createNewGame('freeze-seed', T0);
  s.cycle.age = 'bastion';
  s.buildings.walls = 15;
  s.buildings.watchtower = 15;
  s.layout = canonicalLayout();
  return s;
};

describe('debug.breach.freeze', () => {
  it('marks debugUsed and changes nothing else', () => {
    const s = bastion();
    const before = structuredClone(s);
    expect(apply(s, { type: 'debug.breach.freeze' }, T0).ok).toBe(true);
    expect(s.meta.debugUsed).toBe(true);
    s.meta.debugUsed = before.meta.debugUsed;
    expect(s).toEqual(before);
  });

  it('works below Bastion too (and says there are no lanes yet)', () => {
    const s = createNewGame('freeze-seed', T0);
    expect(apply(s, { type: 'debug.breach.freeze' }, T0).ok).toBe(true);
    expect(s.meta.debugUsed).toBe(true);
    expect(describeFreeze(s)).toBe('No lanes before Bastion.');
  });

  it('shows the table a stand started now would freeze', () => {
    const s = bastion();
    const table = laneTableFor(s);
    const text = describeFreeze(s);
    expect(text).toContain(JSON.stringify(table.pieces));
    expect(text).toContain(JSON.stringify(table.towerCols));
    expect(
      apply(s, { type: 'stand.make', party: s.roster.active.slice(0, 6) as never }, T0).ok,
    ).toBe(true);
    expect(s.cycles.find((c) => c.stand)?.stand?.lanes).toEqual(table);
  });

  it('there is no command that sets lanes', () => {
    const types = readFileSync(
      new URL('../../src/core/commands/types.ts', import.meta.url),
      'utf8',
    );
    const names = [...types.matchAll(/type: '([^']+)'/g)].map((m) => m[1] ?? '');
    expect(names).toContain('debug.breach.freeze');
    expect(names.filter((n) => /lane/i.test(n))).toEqual([]);
  });
});
