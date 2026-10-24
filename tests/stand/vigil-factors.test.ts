// Plan KV.3 (GDD §5.9.10, §7.13, technical design §21.2, D540, D541): the wave-strength factor and
// the Embers multiplier each live in one function, with a breakdown that adds up to the number.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { num } from '../../src/core/balance-access';
import type { Breakdown } from '../../src/core/breakdown/breakdown';
import { embersPayout } from '../../src/core/stand/embers';
import { runStand, type StandInput } from '../../src/core/stand/engine';
import { standInputOf } from '../../src/core/stand/replay';
import { embersMultiplier, waveFactor } from '../../src/core/systems/vigil';
import { snap } from '../combat/helpers';

const THREATS = [0, 1, 7, 23.5, 60, 100, 250];
const sum = (b: Breakdown): number => (b.children ?? []).reduce((a, c) => a + c.value, 0);
const w = num('threat.waveStrengthPerPoint');
const b = num('embers.threatBonus');
const s = num('vigil.strengthPerLevel');
const e = num('vigil.embersPerLevel');

describe('level 0 is the old result, bit for bit (technical design §21.2)', () => {
  it.each(THREATS)('Threat %s: both factors equal the old expressions with ===', (t) => {
    expect(waveFactor(t, 0).value).toBe(1 + w * t);
    expect(embersMultiplier(t, 0).value).toBe(1 + b * t);
  });

  it('a stand with level 0 or none runs identically', () => {
    const base = stand(3);
    expect(runStand({ ...base, vigilLevel: 0 })).toEqual(runStand(base));
  });

  it('the Embers payout and its breakdown with level 0 or none are identical', () => {
    for (const t of THREATS) {
      const plain = embersPayout({ rank: 'bastion', waves: 9, threat: t, trophies: 12 });
      const zero = embersPayout({
        rank: 'bastion',
        waves: 9,
        threat: t,
        trophies: 12,
        vigilLevel: 0,
      });
      expect(zero).toEqual(plain);
      expect(plain.breakdown.children?.some((c) => c.label.includes('Rising Vigil'))).toBe(false);
    }
  });
});

describe('with a level, worked out independently', () => {
  const CASES = THREATS.flatMap((t) => [1, 2, 3, 10, 40].map((l) => [t, l] as const));

  it.each(CASES)('Threat %s, level %s', (t, l) => {
    expect(waveFactor(t, l).value).toBe(1 + w * t + s * l);
    expect(embersMultiplier(t, l).value).toBe(1 + b * t + e * l);
  });

  it('the breakdown lines add up to the number', () => {
    for (const [t, l] of CASES) {
      for (const f of [waveFactor(t, l), embersMultiplier(t, l)]) {
        expect(sum(f.breakdown)).toBe(f.value);
        expect(f.breakdown.value).toBe(f.value);
      }
    }
  });

  it('the Embers payout multiplies the waves part only, and says so on one line', () => {
    const base = embersPayout({ rank: 'bastion', waves: 12, threat: 30, trophies: 20 });
    const up = embersPayout({
      rank: 'bastion',
      waves: 12,
      threat: 30,
      trophies: 20,
      vigilLevel: 3,
    });
    expect(up.trophies).toBe(base.trophies);
    expect(up.waves).toBeGreaterThan(base.waves);
    const y = Math.floor(100 * e * 3);
    const line = up.breakdown.children?.find((c) => c.label.startsWith('Rising Vigil'));
    expect(line?.label).toBe(`Rising Vigil: +${y}% on the waves part`);
    expect(line?.value).toBe(e * 3);
    // Threat line + vigil line = the multiplier the payout used.
    const threatLine = up.breakdown.children?.find((c) => c.label.startsWith('Threat'));
    expect((threatLine?.value ?? 0) + (line?.value ?? 0)).toBe(embersMultiplier(30, 3).value);
  });
});

describe('the level reaches the fight and the rebuild', () => {
  it('a strong level holds fewer waves than level 0, on the same seed and dice', () => {
    for (const k of [1, 2, 3]) {
      const base = stand(k);
      expect(runStand({ ...base, vigilLevel: 60 }).wavesHeld).toBeLessThan(
        runStand(base).wavesHeld,
      );
    }
  });

  it('a stand rebuilt from its record uses the saved level, absent meaning 0', () => {
    const rec = recordOf({ vigilLevel: 3 });
    expect(standInputOf(rec).vigilLevel).toBe(3);
    expect(standInputOf(recordOf({})).vigilLevel).toBeUndefined();
  });
});

describe('each term has one implementation (technical design §21.2)', () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
    });
  const src = files(new URL('../../src/core', import.meta.url).pathname);
  it.each([
    'threat.waveStrengthPerPoint',
    'vigil.strengthPerLevel',
    'embers.threatBonus',
    'vigil.embersPerLevel',
  ])('%s is read in exactly one file under src/core', (key) => {
    const readers = src.filter((f) => readFileSync(f, 'utf8').includes(`'${key}'`));
    expect(readers).toHaveLength(1);
  });
});

const IDS = ['halvar', 'zora', 'ostap', 'bjarna', 'vesna', 'radek'] as const;
function stand(k: number): StandInput {
  return {
    seed: `h:stand:${k}`,
    threat: (k * 7) % 60,
    party: IDS.map((id) => snap(id, { level: 4 + k })),
    prep: { oils: {}, potions: {}, bombs: [] },
    bombs: {},
    defenses: { walls: k, watchtower: k },
    relics: [],
    knowledge: {},
  };
}
function recordOf(extra: { vigilLevel?: number }) {
  const i = stand(2);
  return {
    at: 0,
    seed: i.seed,
    rank: 'bastion' as const,
    threat: i.threat,
    party: [...i.party],
    prep: i.prep,
    bombs: {},
    defenses: i.defenses,
    relics: [],
    knowledge: {},
    rulesVersion: 5,
    wavesHeld: 0,
    embers: { waves: 0, trophies: 0, total: 0 },
    relicsFound: [],
    arrival: false,
    trustSteps: [],
    band: 'broken' as const,
    alchemy: 0,
    seen: false,
    ...extra,
  };
}
