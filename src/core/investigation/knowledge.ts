import { type MonsterId } from '../../content/monsters';
import { num } from '../balance-access';
import type { MonsterInstance } from '../combat';
import { candidatesFor } from '../contracts/candidates';
import type { ContractInstance, GameState } from '../state/game-state';
import { isIdentified, possibleSpecies } from './clues';

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

/** The species as a fight sees it now: its tier and what the hunters know of it. */
export const monsterFor = (
  state: GameState,
  contract: Pick<ContractInstance, 'monster' | 'tier'>,
): Required<MonsterInstance> => ({
  monster: contract.monster,
  tier: contract.tier,
  knowledge: levelOf(state, contract.monster),
});

/**
 * A fight against this species has finished (GDD §5.6.2): fighting it Identifies it, a win
 * is a kill, 3 kills make it Studied and 10 Mastered. A level is never lowered.
 */
export const recordFight = (state: GameState, monster: MonsterId, won: boolean): void => {
  raiseTo(state, monster, 2);
  const entry = state.bestiary[monster];
  if (!entry) return;
  if (won) entry.kills += 1;
  const level =
    entry.kills >= num('knowledge.masteredKills')
      ? 4
      : entry.kills >= num('knowledge.studiedKills')
        ? 3
        : 2;
  if (level > entry.level) entry.level = level;
};

/**
 * What the odds are about: the one species when the contract is identified, otherwise every
 * species the clues so far leave possible, each at its own knowledge level. It never depends
 * on the true species, so the odds panel cannot give it away.
 */
export const oddsTarget = (
  state: GameState,
  contract: ContractInstance,
): Required<MonsterInstance> | Required<MonsterInstance>[] =>
  isIdentified(state.meta.gameSeed, contract)
    ? monsterFor(state, contract)
    : possibleSpecies(state.meta.gameSeed, contract).map((m) =>
        monsterFor(state, { monster: m, tier: contract.tier }),
      );
