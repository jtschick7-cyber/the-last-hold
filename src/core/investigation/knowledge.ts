import { type MonsterId } from '../../content/monsters';
import { candidatesFor } from '../contracts/candidates';
import type { ContractInstance, GameState } from '../state/game-state';
import { isIdentified } from './clues';

// GDD §5.6.2: knowledge levels per species. 0 Unknown is "not in the bestiary".

export type Level = 0 | 1 | 2 | 3 | 4;

export const levelOf = (state: GameState, monster: MonsterId): Level =>
  state.bestiary[monster]?.level ?? 0;

/** Raises a species to at least `level` (1 Sighted or 2 Identified); never lowers it. */
export const raiseTo = (state: GameState, monster: MonsterId, level: 1 | 2): void => {
  const entry = state.bestiary[monster];
  if (!entry) state.bestiary[monster] = { level, kills: 0 };
  else if (entry.level < level) entry.level = level;
};

/**
 * A contract has arrived. If it names its species, that species is Identified; otherwise
 * every species it could be is Sighted: "it appears as a possibility on any contract".
 */
export const noteArrival = (state: GameState, contract: ContractInstance): void => {
  if (isIdentified(state.meta.gameSeed, contract)) raiseTo(state, contract.monster, 2);
  else for (const m of candidatesFor(contract.location, contract.tier)) raiseTo(state, m, 1);
};

/** Clues a contract arrives with: all three for a Mastered species, else none (GDD §5.6.2). */
export const arrivalClues = (state: GameState, monster: MonsterId): number =>
  levelOf(state, monster) >= 4 ? 3 : 0;
