// Plan TB.11b (D589): the Tactician, the breach shard and the probe.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from '../src/core/commands';
import { POLICY_IDS, play } from '../src/core/policies';
import { arrangeHold } from '../src/core/systems/breach';
import { createNewGame } from '../src/core/state/new-game';
import { laneTableFor, tacticianCommands } from '../src/core/systems/breach';
import {
  tacticalBrewFactor,
  tacticalProductionFactor,
  tacticalThreatFactor,
} from '../src/core/systems/layout-tactics';
import { apply } from '../src/core/commands';
import { badLayoutCommands, carelessLayoutCommands } from './breach-probe';
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

  it('probes Auto-arrange, its own layout, the bad layout, v5 rules, and v1.8 mode comparisons on one state', () => {
    const probe = run?.breach?.probe;
    expect(probe?.points.map((p) => p.variant)).toEqual(['auto', 'tactician', 'bad', 'v5']);
    expect(probe?.points.find((p) => p.variant === 'v5')?.pieces).toEqual([]);
    // Suggest/Tactician never holds fewer waves than Auto-arrange, and bad cannot beat both.
    const m = (v: string): number => probe?.points.find((p) => p.variant === v)?.median ?? -1;
    expect(m('tactician')).toBeGreaterThanOrEqual(m('auto'));
    expect(m('bad')).toBeLessThanOrEqual(Math.max(m('auto'), m('tactician')));

    // v1.8 mode comparison: Careless obeys strict 1.0x floor, Economy & Balanced beat Careless in tactics,
    // and Fortress & Tactician beat Careless at max defenses in v7 Breach waves held.
    const byMode = new Map((probe?.modes ?? []).map((x) => [x.mode, x]));
    expect([...byMode.keys()]).toEqual([
      'economy',
      'balanced',
      'fortress',
      'tactician',
      'careless',
    ]);
    const careless = byMode.get('careless');
    const economy = byMode.get('economy');
    const balanced = byMode.get('balanced');
    const fortress = byMode.get('fortress');
    const tact = byMode.get('tactician');
    expect(careless?.foodMult).toBe(1);
    expect(careless?.woodMult).toBe(1);
    expect(careless?.ironMult).toBe(1);
    expect(careless?.silverMult).toBe(1);
    expect(careless?.brewMult).toBe(1);
    expect(careless?.threatMult).toBe(1);
    expect(careless?.hearthWarded).toBe(false);
    expect(careless?.links).toBe(0);
    expect(economy?.foodMult).toBeGreaterThan(careless?.foodMult ?? 99);
    expect(balanced?.foodMult).toBeGreaterThan(careless?.foodMult ?? 99);
    expect(fortress?.screenedTowers).toBeGreaterThanOrEqual(1);
    expect(fortress?.connectedWalls).toBeGreaterThanOrEqual(2);
    expect(fortress?.sectorLanes).toBeGreaterThanOrEqual(careless?.sectorLanes ?? 99);
    expect(fortress?.maxWaves.median).toBeGreaterThan(careless?.maxWaves.median ?? 99);
    expect(tact?.maxWaves.median).toBeGreaterThan(careless?.maxWaves.median ?? 99);
  });

  it('builds Screened Watchtowers, connected ramparts, and Sector Support at Bastion via tacticianCommands', () => {
    const s = createNewGame('v18-tact-bastion', Date.UTC(1970, 0, 5, 7));
    expect(apply(s, { type: 'debug.layoutFillBastion' }, s.time).ok).toBe(true);
    const cmds = tacticianCommands(s);
    expect(cmds.length).toBeGreaterThan(0);
    for (const cmd of cmds) {
      expect(['layout.unplace', 'layout.place']).toContain(cmd.type);
      expect(apply(s, cmd, s.time).ok, cmd.type).toBe(true);
    }
    const table = laneTableFor(s);
    expect(table.screened?.some(Boolean)).toBe(true);
    expect(table.rampartCols?.filter(Boolean).length).toBeGreaterThanOrEqual(4);
    expect(table.sectorCols?.filter((n) => n > 0).length).toBeGreaterThanOrEqual(5);

    // Careless layout on the same full Bastion hold drops every scalar tactical modifier back to 1.0x.
    const careless = structuredClone(s);
    for (const cmd of carelessLayoutCommands(careless)) {
      expect(apply(careless, cmd, careless.time).ok, cmd.type).toBe(true);
    }
    expect(tacticalProductionFactor(careless, 'food')).toBeNull();
    expect(tacticalProductionFactor(careless, 'wood')).toBeNull();
    expect(tacticalProductionFactor(careless, 'iron')).toBeNull();
    expect(tacticalProductionFactor(careless, 'silver')).toBeNull();
    expect(tacticalBrewFactor(careless)).toBeNull();
    expect(tacticalThreatFactor(careless)).toBeNull();
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
