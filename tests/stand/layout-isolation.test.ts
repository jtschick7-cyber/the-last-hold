// Plan TB.5 (technical design §23.4, CLAUDE.md v1.5 rule 1): the layout moves nothing outside the
// Last Stand. The same cycle played twice, once with the layout left alone and once with every piece
// lifted to the Tray, gives identical contracts, logs and results. (The five systems that must never read
// the layout are also kept out by tests/lint/breach-coupling.test.ts.)
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
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

/** Launches what the board offers, runs five days, and returns the state without its layout. */
const play = (clearLayout: boolean): Record<string, unknown> => {
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
  const plain = JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
  delete plain.layout;
  return plain;
};

describe('a layout change moves nothing outside the Last Stand', () => {
  it('contracts, events, Delves, income and logs are identical with the layout cleared', () => {
    const kept = play(false);
    const cleared = play(true);
    expect(cleared).toEqual(kept);
    // The run did something: contracts were launched and fought.
    expect(launched).toBeGreaterThan(0);
  });
});
