import { apply } from '../../src/core/commands';
import type { Command } from '../../src/core/commands';
import { syncBoardOpen } from '../../src/core/contracts/board';
import type { GameState } from '../../src/core/state/game-state';
import { createNewGame } from '../../src/core/state/new-game';
import { freshHunter } from '../../src/core/state/hunters-state';
import type { HunterId } from '../../src/content/hunters';

export const HOUR = 3_600_000;
export const T0 = Date.UTC(2026, 9, 12, 7, 0, 0);

/** A Hamlet game with a Mine already built, so the board is open. */
export const hamletWithMine = (seed = 'flow'): GameState => {
  const s = createNewGame(seed, T0);
  s.buildings.mine = 1;
  syncBoardOpen(s);
  return s;
};

/** A well-supplied Keep: all tiers unlocked, rich, and a full roster. */
export const keepRich = (seed = 'flow'): GameState => {
  const s = createNewGame(seed, T0);
  s.cycle.age = 'keep';
  s.resources = { food: 1e7, wood: 1e7, iron: 1e7, silver: 1e6 };
  Object.assign(s.buildings, { cottage: 20, farm: 5, mine: 4, smithy: 6, barracks: 5 });
  s.board.tierWins = [3, 3, 3, 3, 0];
  for (const h of ['ostap', 'bjarna', 'vesna', 'radek', 'sigrun', 'toma'] as const) {
    s.hunters[h] = freshHunter();
    s.roster.active.push(h);
  }
  syncBoardOpen(s);
  return s;
};

export const run = (s: GameState, cmd: Command) => apply(s, cmd, s.time);

export const give = (s: GameState, ...ids: HunterId[]): void => {
  for (const id of ids) {
    if (!s.hunters[id]) s.hunters[id] = freshHunter();
    if (!s.roster.active.includes(id)) s.roster.active.push(id);
  }
};
