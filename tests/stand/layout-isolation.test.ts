// Plan TB.5 / v1.8 Q71 (D619, D626): tactical layouts boost income and hourly Threat (with a 1.0x floor),
// while moving nothing else outside the Last Stand. Running five days with the layout left alone vs.
// lifted to the Tray gives identical contracts, fights, Delves, events, hunters and logs, and keeps
// cleared income <= kept income and cleared Threat >= kept Threat.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RESOURCE_IDS, type ResourceId } from '../../src/content/resources';
import { apply } from '../../src/core/commands/apply';
import { loadEnvelope } from '../../src/core/save';
import { advance } from '../../src/core/sim';
import type { GameState } from '../../src/core/state/game-state';

const load = (): GameState => {
  const env = JSON.parse(
    readFileSync(new URL('../saves/fixtures/v15.json', import.meta.url), 'utf8'),
  ) as unknown;
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  return r.value.state;
};
const DAY = 86_400_000;
let launched = 0;

interface RunSnapshot {
  plain: Record<string, unknown>;
  resources: Record<ResourceId, number>;
  threat: number;
}

/** Launches what the board offers, runs five days, and returns non-economy state + resource/Threat scalars. */
const play = (clearLayout: boolean): RunSnapshot => {
  launched = 0;
  const s = load();
  if (clearLayout) expect(apply(s, { type: 'layout.clear' }, s.time).ok).toBe(true);
  let t = s.time;
  for (let day = 0; day < 5; day++) {
    for (const c of [...s.board.open]) {
      const party = s.roster.active.slice(0, 3);
      const r = apply(
        s,
        { type: 'contract.launch', contract: c.id, party, confirmReckless: true },
        t,
      );
      if (r.ok) launched++;
    }
    t += DAY;
    advance(s, t);
  }
  const resources = { ...s.resources };
  const threat = s.threat;
  const plain = JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
  delete plain.layout;
  delete plain.resources;
  delete plain.threat;
  return { plain, resources, threat };
};

describe('a layout change moves nothing outside economy/Threat and obeys the 1.0x floor', () => {
  it('contracts, events, Delves, hunters and logs stay identical with layout cleared while resources/Threat never outperform kept', () => {
    const kept = play(false);
    const cleared = play(true);
    expect(cleared.plain).toEqual(kept.plain);
    for (const r of RESOURCE_IDS) {
      expect(cleared.resources[r]).toBeLessThanOrEqual(kept.resources[r]);
    }
    expect(cleared.resources.food).toBeLessThan(kept.resources.food);
    expect(cleared.threat).toBeGreaterThanOrEqual(kept.threat);
    // The run did something: contracts were launched and fought.
    expect(launched).toBeGreaterThan(0);
  });
});
