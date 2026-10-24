// Plan KV.8 (D546): the Vigilant's shard, and the probe measures without changing anything.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { num } from '../src/core/balance-access';
import { loadEnvelope } from '../src/core/save';
import { catchUpNow } from '../src/core/sim/offline';
import { previewInputFor } from '../src/core/stand/from-state';
import { previewStand } from '../src/core/stand/preview';
import { suggestSix } from '../src/core/stand/suggest';
import { stateAtVigilLevel } from '../src/core/systems/vigil';
import { shardOf, specsOfShard } from './shards';
import { buildSpecs } from './specs';
import { probeVigil, stepFor, withConstant } from './vigil-probe';
import { curveMarkdown } from './vigil-curve';
import type { RunResult } from './run';

describe('the vigil shard', () => {
  it("holds the Vigilant's five Monday runs and nobody else", () => {
    const full = buildSpecs({
      policies: [
        'opening',
        'light',
        'standard',
        'heavy',
        'delver',
        'eventer',
        'orderer',
        'vigilant',
      ],
      days: 14,
      seeds: 5,
      starts: ['mon', 'sat'],
      fast: false,
    });
    const mine = specsOfShard(full, 'vigil');
    expect(mine).toHaveLength(5);
    expect(mine.every((r) => r.policy === 'vigilant' && r.start === 'mon')).toBe(true);
    expect(full.filter((r) => shardOf(r) === 'vigil')).toEqual(mine);
  });
});

describe('the probe', () => {
  const state = (() => {
    const r = loadEnvelope(
      JSON.parse(
        readFileSync(new URL('../tests/saves/fixtures/v13-played.json', import.meta.url), 'utf8'),
      ),
    );
    if (!r.ok) throw new Error(r.error);
    catchUpNow(r.value.state, r.value.state.time);
    r.value.state.cycle.age = 'bastion';
    return r.value.state;
  })();
  const party = suggestSix(state);
  const stand = { type: 'stand.make' as const, party, prep: { oils: {}, potions: {} } };

  it('puts the constants back and shows level 0 as the ordinary stand', () => {
    const s = num('vigil.strengthPerLevel');
    const e = num('vigil.embersPerLevel');
    const off = stateAtVigilLevel(state, 0);
    const plain = previewStand(previewInputFor(off, party, stand.prep, 8));
    const grid = {
      sGrid: [0.2, 0.4],
      eGrid: [0.1, 0.2, 0.3],
      kinds: ['additive', 'compounding'],
    } as const;
    const p = probeVigil(state, stand, 8, [state.threat], grid);
    expect(num('vigil.strengthPerLevel')).toBe(s);
    expect(num('vigil.embersPerLevel')).toBe(e);
    const t = p.threats[0];
    expect(t?.base.median).toBe(plain.median);
    expect(t?.base.embers).toBe(plain.embersNow.value);
    expect(p.levels).toBe(10);
    for (const kind of grid.kinds) {
      const waves = t?.waves[kind] ?? [];
      expect(waves).toHaveLength(2);
      expect(waves[0]).toHaveLength(11);
      expect(waves[0]?.[0]?.median).toBe(plain.median);
      const embers = t?.embers[kind] ?? [];
      expect(embers[0]).toHaveLength(3);
      // Level 0 pays the ordinary Embers at every e.
      expect(embers[0]?.[0]?.[0]).toBe(plain.embersNow.value);
    }
  }, 60_000);

  it('with no grid given, it tries the shipped constants and the additive step only', () => {
    const p = probeVigil(state, stand, 4, [state.threat]);
    expect(p.kinds).toEqual(['additive']);
    expect(p.sGrid).toEqual([num('vigil.strengthPerLevel')]);
    expect(p.eGrid).toEqual([num('vigil.embersPerLevel')]);
  }, 60_000);

  it('a stronger step never holds more waves', () => {
    const strong = (x: number) =>
      withConstant('vigil.strengthPerLevel', x, () => {
        const on = stateAtVigilLevel(state, 1);
        return previewStand(previewInputFor(on, party, stand.prep, 8)).median;
      });
    expect(strong(0.8)).toBeLessThanOrEqual(strong(0.1));
  }, 30_000);

  it('the compounding step adds (1 + s)^L − 1 over L levels', () => {
    expect(stepFor('additive', 0.2, 3) * 3).toBeCloseTo(0.6);
    expect(stepFor('compounding', 0.2, 3) * 3).toBeCloseTo(1.2 ** 3 - 1);
  });
});

describe('the curve report', () => {
  it('renders without a run that has a probe', () => {
    const none = [
      { spec: { policy: 'vigilant', seed: 'sim-1', start: 'mon', days: 14 } },
    ] as unknown as RunResult[];
    expect(curveMarkdown(none)).toContain('Rising Vigil curve');
  });
});
