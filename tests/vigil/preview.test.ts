// Plan KV.5 (GDD §5.9.3, §5.9.10, §9.23, technical design §21.5, D544 (3)): the stand preview
// (expected waves, Embers now, Embers tomorrow) is worked out with the level the stand would have,
// and with the switch Off it is exactly the preview of before v1.3.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply } from '../../src/core/commands';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import { previewInputFor } from '../../src/core/stand/from-state';
import { previewStand } from '../../src/core/stand/preview';
import type { GameState } from '../../src/core/state/game-state';
import { vigilLevelFor } from '../../src/core/systems/vigil';

const load = (f: string): GameState => {
  const env = JSON.parse(readFileSync(new URL(`../saves/fixtures/${f}`, import.meta.url), 'utf8'));
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  catchUpNow(r.value.state, r.value.state.time);
  return r.value.state;
};
const party = (s: GameState) => s.roster.active.slice(0, 6) as never;
const kit = { oils: {}, potions: {} };
const SAMPLES = 20; // the same seeds and samples on both sides; the count only keeps the test quick
/** The input as it was before v1.3: no level field at all. */
const asBefore = (s: GameState) => {
  const input = previewInputFor(s, party(s), kit, SAMPLES);
  const { vigilLevel: _level, ...stand } = input.stand;
  void _level;
  return { ...input, stand };
};

/** A save with the gate open and the stand screen reachable (Bastion). */
const open = (): GameState => {
  const s = load('v13-played.json');
  s.cycle.age = 'bastion';
  s.threat = 30;
  return s;
};

describe('the request carries the level the stand would have', () => {
  it('level 0 adds no field; level n adds vigilLevel n', () => {
    const s = open();
    s.vigil = { on: false, stands: 3 };
    expect(previewInputFor(s, party(s), kit).stand).not.toHaveProperty('vigilLevel');
    expect(apply(s, { type: 'vigil.set', on: true }, s.time).ok).toBe(true);
    expect(vigilLevelFor(s)).toBe(4);
    expect(previewInputFor(s, party(s), kit).stand.vigilLevel).toBe(4);
  });

  it('the level follows the count the player has reached', () => {
    const s = open();
    for (const stands of [0, 1, 5, 12]) {
      s.vigil = { on: true, stands };
      expect(previewInputFor(s, party(s), kit).stand.vigilLevel).toBe(stands + 1);
    }
  });
});

describe('the preview at a level equals a stand fought at that level', () => {
  it('same seeds, same samples: the practice stands, the median and both Embers figures', () => {
    const s = open();
    s.vigil = { on: true, stands: 5 };
    const input = previewInputFor(s, party(s), kit, SAMPLES);
    const direct = previewStand({ ...asBefore(s), stand: { ...asBefore(s).stand, vigilLevel: 6 } });
    expect(previewStand(input)).toEqual(direct);
  });

  it('shows the Rising Vigil line in the Embers breakdown, and not without it', () => {
    const s = open();
    s.vigil = { on: true, stands: 2 };
    const on = previewStand(previewInputFor(s, party(s), kit, SAMPLES));
    const labels = (b: typeof on.embersNow.breakdown) => (b.children ?? []).map((c) => c.label);
    expect(
      labels(on.embersNow.breakdown).some((l) =>
        /^Rising Vigil: \+\d+% on the waves part$/.test(l),
      ),
    ).toBe(true);
    expect(labels(on.embersTomorrow.breakdown).some((l) => l.startsWith('Rising Vigil'))).toBe(
      true,
    );
    s.vigil.on = false;
    const off = previewStand(previewInputFor(s, party(s), kit, SAMPLES));
    expect(labels(off.embersNow.breakdown).some((l) => l.startsWith('Rising Vigil'))).toBe(false);
  });

  it('a higher level never holds more waves in the median (on this save, Threat 30)', () => {
    const s = open();
    let last = Infinity;
    for (const stands of [0, 4, 9, 19]) {
      s.vigil = { on: true, stands };
      const median = previewStand(previewInputFor(s, party(s), kit, SAMPLES)).median;
      expect(median).toBeLessThanOrEqual(last);
      last = median;
    }
  });
});

describe('with the switch Off the preview is the preview of before v1.3', () => {
  const states: [string, () => GameState][] = [
    ['switch Off, count 0', () => ({ ...open(), vigil: { on: false, stands: 0 } })],
    ['switch Off, count 3', () => ({ ...open(), vigil: { on: false, stands: 3 } })],
    [
      'switch On with the gate closed',
      () => {
        const s = load('v13.json');
        s.cycle.age = 'bastion';
        s.vigil = { on: true, stands: 2 };
        return s;
      },
    ],
    ['Threat 0', () => ({ ...open(), threat: 0, vigil: { on: false, stands: 1 } })],
    ['Threat 120', () => ({ ...open(), threat: 120, vigil: { on: false, stands: 1 } })],
  ];
  it.each(states)('%s', (_name, make) => {
    const s = make();
    expect(previewStand(previewInputFor(s, party(s), kit, SAMPLES))).toEqual(
      previewStand(asBefore(s)),
    );
  });
});
