// Plan TB.11b (D589): the Tactician, the breach shard and the probe.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from '../src/core/commands';
import { POLICY_IDS, play } from '../src/core/policies';
import { arrangeHold } from '../src/core/systems/breach';
import { createNewGame } from '../src/core/state/new-game';
import { badLayoutCommands } from './breach-probe';
import { runOne } from './run';
import { shardOf, specsOfShard } from './shards';
import { buildSpecs } from './specs';

const full = buildSpecs({
  policies: [...POLICY_IDS],
  days: 14,
  seeds: 5,
  starts: ['mon', 'sat'],
  fast: false,
});
const spec = specsOfShard(full, 'breach')[0];

describe('the breach shard', () => {
  it("holds the Tactician's five Monday runs, each to play 3 cycles, and nobody else", () => {
    const mine = specsOfShard(full, 'breach');
    expect(mine).toHaveLength(5);
    expect(mine.every((r) => r.policy === 'tactician' && r.start === 'mon')).toBe(true);
    expect(full.filter((r) => shardOf(r) === 'breach')).toEqual(mine);
    expect(mine.every((r) => r.minCycles === 3 && r.untilContent === undefined)).toBe(true);
  });
});

describe('the Tactician and the probe', () => {
  // A short real run (8 days: past its first stand), so `npm run check` stays fast. The full 3-cycle run
  // (about 9 s here, limit 60 s) is what the `breach` shard plays in `sim.yml`, whose step times it.
  const run = spec
    ? runOne({ ...spec, days: 8, minCycles: undefined, maxDays: undefined })
    : undefined;

  it('plays through its first stand, which carries a lane table', () => {
    expect(run?.breach?.stands.length).toBeGreaterThanOrEqual(1);
    expect(run?.breach?.probe).not.toBeNull();
  });

  it('probes Auto-arrange, its own layout, the bad layout and the version 5 rules on one state', () => {
    const probe = run?.breach?.probe;
    expect(probe?.points.map((p) => p.variant)).toEqual(['auto', 'tactician', 'bad', 'v5']);
    expect(probe?.points.find((p) => p.variant === 'v5')?.pieces).toEqual([]);
    // Suggest never scores below Auto-arrange, and the bad layout cannot beat both.
    const m = (v: string): number => probe?.points.find((p) => p.variant === v)?.median ?? -1;
    expect(m('tactician')).toBeGreaterThanOrEqual(0);
    expect(m('bad')).toBeLessThanOrEqual(Math.max(m('auto'), m('tactician')));
  });

  it('issues layout commands only through arrangeHold: Auto-arrange for everyone, the Suggest rule for the Tactician', () => {
    // No policy file names a layout command; they all go through the one helper in the Breach module.
    const dir = join(process.cwd(), 'src/core/policies');
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts') && !x.endsWith('.test.ts')))
      expect(readFileSync(join(dir, f), 'utf8'), f).not.toMatch(/'layout\./);
    const state = createNewGame('probe-1', Date.UTC(1970, 0, 5, 7));
    play(state, { policy: 'standard', startedAt: state.time, until: state.time + 72 * 3_600_000 });
    const sent: string[] = [];
    const act = (c: Command): boolean => sent.push(c.type) > 0;
    expect(arrangeHold(act)).toBe(true);
    expect(sent).toEqual(['layout.autoArrange']);
    sent.length = 0;
    expect(arrangeHold(act, state)).toBe(true);
    expect(sent.length).toBeGreaterThan(0);
    for (const k of sent) expect(['layout.unplace', 'layout.place']).toContain(k);
    // Unplaces come first, then places.
    expect(sent.join().replace(/layout\.unplace,?/g, '')).not.toContain('layout.unplace');
  });

  it('fills the bad layout in the fixed tile order, towers before walls, nothing else', () => {
    const state = createNewGame('probe-2', Date.UTC(1970, 0, 5, 7));
    const cmds = badLayoutCommands(state);
    expect(cmds.every((c) => c.type === 'layout.unplace' || c.type === 'layout.place')).toBe(true);
    const placed = cmds.flatMap((c) => (c.type === 'layout.place' ? [`${c.x},${c.y}`] : []));
    const order = ['0,0', '0,1', '0,2', '1,0', '1,1', '1,2'];
    expect(placed).toEqual(order.filter((t) => placed.includes(t)));
  });
});
