// Technical design §14: the cross-engine determinism scenario. The same code
// runs under Node (Vitest) and in each browser (Playwright, tests/e2e), and
// must give byte-identical output everywhere. It touches what an engine could
// get wrong: the PRNG, the portable math, and a whole simulated game played
// through apply(), advance() and the offline catch-up.

import { hunters, type HunterId } from '../../src/content/hunters';
import { runFight, type HunterSnapshot } from '../../src/core/combat';
import { maxAffordable, geometricCost, intPow } from '../../src/core/math';
import { play } from '../../src/core/policies';
import { scripted, seeded, stream } from '../../src/core/rng';
import { catchUpNow } from '../../src/core/sim';
import { createNewGame } from '../../src/core/state/new-game';

const HOUR = 3_600_000;
const MON_7 = Date.UTC(2024, 0, 1, 7);

const snapshot = (id: HunterId): HunterSnapshot => {
  const h = hunters[id];
  return {
    id,
    name: h.name,
    role: h.role,
    damage: h.damage,
    level: 1,
    base: h.stats,
    traits: h.traits,
    weapon: null,
    armorGear: null,
  };
};

// The GDD §5.5.1 roll sequence, so the golden fight itself runs in every engine.
const GOLDEN_ROLLS = [
  0.4, 0.5, 0.7, 0.2, 0.6, 0.95, 0.95, 0.1, 0.3, 0.5, 0.3, 0.9, 0.1, 0.5, 0.2, 0.8, 0.6, 0.5, 0.4,
  0.7, 0.8, 0.3, 0.2, 0.4, 0.6, 0.1, 0.5, 0.15, 0.8, 0.6, 0.3, 0.3, 0.7, 0.9,
];

/** Combat (plan T2.8): the golden fight, then seeded fights that use many abilities. */
const combat = (): unknown => {
  const golden = runFight({
    party: [snapshot('zora')],
    monster: { monster: 'kikimora', tier: 1 },
    location: 'field',
    rolls: scripted(GOLDEN_ROLLS),
  });
  const party = (['halvar', 'zora', 'ostap'] as const).map(snapshot);
  const seeded3 = (['upyr', 'rusalka', 'draugr', 'nix', 'leshy', 'strzyga'] as const).map((m, i) =>
    runFight({
      party,
      monster: { monster: m, tier: i < 2 ? 2 : 3 },
      location: m === 'upyr' ? 'field' : m === 'rusalka' || m === 'nix' ? 'river' : 'barrow',
      rolls: stream('determinism', 'fight', m),
    }),
  );
  return { golden, seeded3 };
};

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
  return JSON.stringify({ rolls, streamed, math, game, away, combat: combat() });
};
