// Plan TD.4c (technical design §22.2, §22.4, §10.1, D561, S10): Suggest marching order, and the
// Descent preview that runs in the odds worker. The preview is the engine on its own dice.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply, type Command } from '../../src/core/commands';
import { HUNTER_IDS, hunters, type HunterId } from '../../src/content/hunters';
import { marginFor } from '../../src/core/contracts/odds';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import { runDescent } from '../../src/core/systems/descent-fight';
import { suggestDescentOrder } from '../../src/core/systems/descent-order';
import { descentPreviewSeed, previewDescent } from '../../src/core/systems/descent-odds';
import {
  descentInputFor,
  descentPreviewInputFor,
  descentProblem,
  eligibleForDescent,
} from '../../src/core/systems/descent-record';
import { requestDescentPreview } from '../../src/ui/app/odds-client';

const load = (f: string): GameState => {
  const r = loadEnvelope(
    JSON.parse(readFileSync(new URL(`../saves/fixtures/${f}`, import.meta.url), 'utf8')),
  );
  if (!r.ok) throw new Error(r.error);
  return r.value.state;
};
const run = (s: GameState, cmd: Command) => apply(s, cmd, s.time);
const open = (): GameState => {
  const s = load('v14.json');
  catchUpNow(s, s.time);
  run(s, { type: 'debug.rememberingFinishActVI' });
  run(s, { type: 'debug.rememberingOpenGate' });
  s.cycle.age = 'bastion';
  return s;
};
const ready = (): GameState => {
  const s = open();
  run(s, { type: 'debug.prepareEndgameRoster' });
  return s;
};
const none = { oils: {}, potions: {} };
const level = (s: GameState, id: HunterId): number => s.hunters[id]?.level ?? 0;

describe('suggestDescentOrder', () => {
  it('is deterministic and valid on the fixtures', () => {
    for (const s of [open(), ready()]) {
      const a = suggestDescentOrder(s);
      expect(suggestDescentOrder(s)).toEqual(a);
      expect(descentProblem(s, a, none)).toBeNull();
      expect([...a].sort()).toEqual([...eligibleForDescent(s)].sort());
    }
  });

  it('puts a Vanguard and a Mender in the front 6, even when they are the lowest levels', () => {
    const s = ready();
    const owned = eligibleForDescent(s);
    const setLevel = (id: HunterId, n: number): void => {
      const h = s.hunters[id];
      if (h) h.level = n;
    };
    for (const id of owned) setLevel(id, 10);
    const van = owned.filter((id) => hunters[id].role === 'vanguard');
    const mend = owned.filter((id) => hunters[id].role === 'mender');
    expect(van.length).toBeGreaterThan(0);
    expect(mend.length).toBeGreaterThan(0);
    for (const id of [...van, ...mend]) setLevel(id, 1);
    const front = suggestDescentOrder(s).slice(0, 6);
    expect(front.some((id) => hunters[id].role === 'vanguard')).toBe(true);
    expect(front.some((id) => hunters[id].role === 'mender')).toBe(true);
    // The best Vanguard and the best Mender (by level, then roster order) are the ones taken.
    expect(front).toContain(van[0]);
    expect(front).toContain(mend[0]);
  });

  it('orders the front and the reserve by level, ties in roster order', () => {
    const s = ready();
    const order = suggestDescentOrder(s);
    expect(order).toHaveLength(14);
    for (const part of [order.slice(0, 6), order.slice(6)])
      for (let i = 1; i < part.length; i++) {
        const [a, b] = [part[i - 1] as HunterId, part[i] as HunterId];
        expect(
          level(s, a) > level(s, b) ||
            (level(s, a) === level(s, b) && HUNTER_IDS.indexOf(a) < HUNTER_IDS.indexOf(b)),
        ).toBe(true);
      }
  });

  it('keeps everyone eligible, in the reserve when the front is full', () => {
    const s = open();
    const order = suggestDescentOrder(s);
    expect(order).toHaveLength(eligibleForDescent(s).length);
    expect(order.length).toBeGreaterThan(6);
  });
});

describe('the preview equals the engine on the same seeds', () => {
  it('reports exactly what 100 engine runs on the practice seeds say', () => {
    const s = ready();
    const order = suggestDescentOrder(s);
    const input = descentPreviewInputFor(s, order, none);
    const p = previewDescent(input);
    const runs = Array.from({ length: 100 }, (_, i) =>
      runDescent({
        ...descentInputFor(s, order, none).input,
        seed: `${s.meta.gameSeed}:descentodds:1:${i}`,
        log: true,
      }),
    );
    const wins = runs.filter((r) => r.outcome === 'win').length;
    expect(p.samples).toBe(100);
    expect(p.winChance).toBe(wins / 100);
    expect(p.margin).toBe(marginFor(wins / 100, 100));
    const sorted = (xs: number[]) => xs.sort((a, b) => a - b);
    const downed = sorted(runs.map((r) => r.downedCount));
    const cleared = sorted(runs.map((r) => r.stagesCleared));
    expect(p.downed).toEqual({ median: downed[49], p10: downed[9], p90: downed[89] });
    expect(p.stagesCleared).toBe(cleared[49]);
    expect(p.outcome).toBe(cleared[49] === 3 ? 'win' : 'loss');
  });

  it('uses its own dice, never the real attempt seed, and the same dice for any party', () => {
    const s = ready();
    const a = descentPreviewInputFor(s, suggestDescentOrder(s), none);
    const b = descentPreviewInputFor(s, suggestDescentOrder(s).slice(0, 6), {
      oils: {},
      potions: { zora: 'mending-draught' },
    });
    expect(a.attempt).toBe(1);
    expect(descentPreviewSeed(a.gameSeed, a.attempt, 7)).toBe(`${s.meta.gameSeed}:descentodds:1:7`);
    expect(a.gameSeed).toBe(b.gameSeed);
    expect(a.attempt).toBe(b.attempt);
    expect(descentPreviewSeed(a.gameSeed, 1, 0)).not.toBe(descentInputFor(s, [], none).input.seed);
  });

  it('is the same on a second run, and a preview changes nothing in the hold', () => {
    const s = ready();
    const before = JSON.stringify(s);
    const input = descentPreviewInputFor(s, suggestDescentOrder(s), none, 10);
    expect(previewDescent(input)).toEqual(previewDescent(input));
    expect(JSON.stringify(s)).toBe(before);
  });

  it('moves to the next attempt after a real one, and its Why? adds up', () => {
    const s = ready();
    expect(descentPreviewInputFor(s, suggestDescentOrder(s), none).attempt).toBe(1);
    run(s, { type: 'descent.start', order: suggestDescentOrder(s) });
    expect(descentPreviewInputFor(s, suggestDescentOrder(s), none).attempt).toBe(2);
    const p = previewDescent(descentPreviewInputFor(s, suggestDescentOrder(s), none, 5));
    const wins = p.why.children?.find((c) => c.label === 'Runs that won')?.value;
    expect(wins).toBe(Math.round(p.winChance * 5));
    expect(p.why.value).toBe(p.winChance);
  });
});

describe('the client drops stale preview requests', () => {
  it('answers only the newest request', async () => {
    const s = ready();
    const order = suggestDescentOrder(s);
    const first = requestDescentPreview(descentPreviewInputFor(s, order, none, 3));
    const second = requestDescentPreview(descentPreviewInputFor(s, order.slice(0, 6), none, 3));
    expect(await first).toBeNull();
    const answer = await second;
    expect(answer?.preview.samples).toBeGreaterThan(0);
  });
});
