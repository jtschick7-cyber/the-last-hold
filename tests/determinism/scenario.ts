// Technical design §14: the cross-engine determinism scenario. The same code
// runs under Node (Vitest) and in each browser (Playwright, tests/e2e), and
// must give byte-identical output everywhere. It touches what an engine could
// get wrong: the PRNG, the portable math, and a whole simulated game played
// through apply(), advance() and the offline catch-up.

import { maxAffordable, geometricCost, intPow } from '../../src/core/math';
import { play } from '../../src/core/policies';
import { seeded, stream } from '../../src/core/rng';
import { catchUpNow } from '../../src/core/sim';
import { createNewGame } from '../../src/core/state/new-game';

const HOUR = 3_600_000;
const MON_7 = Date.UTC(2024, 0, 1, 7);

export const runScenario = (): string => {
  const rolls = ['alpha', 'beta', 'gamma'].map((seed) => {
    const r = seeded(seed);
    return Array.from({ length: 8 }, () => r.next());
  });
  const streamed = Array.from({ length: 4 }, (_, i) => stream('game', 'contract', i).next());
  const math = [1.15, 1.75, 2.2].flatMap((g) =>
    [0, 1, 7, 30, 100].map((n) => [
      intPow(g, n),
      geometricCost(40, g, n),
      maxAffordable(46, g, 1e3 * (n + 1)),
    ]),
  );
  const game = createNewGame('determinism', MON_7);
  play(game, { policy: 'standard', startedAt: MON_7, until: MON_7 + 3 * 24 * HOUR });
  const away = catchUpNow(game, game.time + 13 * HOUR);
  return JSON.stringify({ rolls, streamed, math, game, away });
};
