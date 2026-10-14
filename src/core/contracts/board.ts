import { LOCATION_IDS, type LocationId } from '../../content/damage';
import { VILLAGE_IDS, villages } from '../../content/villages';
import { constantAt, num } from '../balance-access';
import { arrivalClues, noteArrival } from '../investigation/knowledge';
import { candidatesFor } from './candidates';
import { stream } from '../rng';
import { ribbonName } from '../story/names';
import type { ContractInstance, GameState } from '../state/game-state';
import { MS_PER_SECOND } from '../time';

// GDD §5.4.1: the contract board. One contract arrives every 2 h up to a cap of
// 6, each generated from a seed when it arrives. The board opens when the first
// Mine is built (G6). Contracts never expire; declining is free (A2).

const intervalMs = (): number => num('board.interval') * MS_PER_SECOND;

/** The highest tier the current Rank allows (Hamlet 1, Keep 5). */
export const tierCap = (state: GameState): number =>
  (constantAt('contract.ageTierCap').value as Readonly<Record<string, number>>)[state.cycle.age] ??
  1;

/** Tier t+1 unlocks after 3 successes at tier t (B8), up to the Rank's cap. */
export const highestUnlockedTier = (state: GameState): number => {
  const need = num('contract.unlockSuccesses');
  let tier = 1;
  while (tier < 5 && (state.board.tierWins[tier - 1] ?? 0) >= need) tier += 1;
  return Math.min(tier, tierCap(state));
};

/**
 * One contract from its seed (technical design §7.2: `${gameSeed}:board:${index}`).
 * Rolls, in order: tier mix, lower-tier pick, village, location, monster.
 * Tier mix: 60% at the highest unlocked tier, 40% spread evenly over the lower
 * ones (all at the highest while only one is unlocked). Barrow starts at tier 2 (A3).
 */
export const generateContract = (
  state: GameState,
  index: number,
  arrivedAt: number,
): ContractInstance => {
  const rolls = stream(state.meta.gameSeed, 'board', index);
  const top = highestUnlockedTier(state);
  const mix = rolls.next();
  const lowerPick = rolls.next();
  const tier =
    top === 1 || mix < 0.6 ? top : Math.min(top - 1, Math.floor(lowerPick * (top - 1)) + 1);
  const village =
    villages[
      VILLAGE_IDS[
        Math.min(VILLAGE_IDS.length - 1, Math.floor(rolls.next() * VILLAGE_IDS.length))
      ] ?? VILLAGE_IDS[0]
    ];
  const places: readonly LocationId[] = village.locations.filter(
    // Barrows and ruins start at tier 2 (A3, D157), so never in the Hamlet.
    (l) => LOCATION_IDS.includes(l) && ((l !== 'barrow' && l !== 'ruin') || tier >= 2),
  );
  const location =
    places[Math.min(places.length - 1, Math.floor(rolls.next() * places.length))] ?? 'field';
  const species = candidatesFor(location, tier);
  let monster = species[Math.min(species.length - 1, Math.floor(rolls.next() * species.length))];
  if (!monster) throw new Error(`No monster for ${location} at tier ${tier}.`);
  // GDD §5.14.4 (Q17, D190): until all six Ribbonshade names are found, a share of ruin
  // contracts is a Ribbonshade. Rolled last, so no other contract changes.
  const ribbonRoll = rolls.next();
  if (
    location === 'ruin' &&
    ribbonName(state.story.ribbonshades + 1) !== null &&
    species.includes('ribbonshade') &&
    ribbonRoll < num('ruin.ribbonshadeShare')
  )
    monster = 'ribbonshade';
  // GDD §5.6.2: a contract arrives with no clues, unless its species is Mastered.
  const revealed = arrivalClues(state, monster);
  return { id: `c${index}`, village: village.id, monster, tier, location, arrivedAt, revealed };
};

/** The first Mine opens the board, with its first contract due at once. */
export const syncBoardOpen = (state: GameState): void => {
  if (!state.board.opened && state.buildings.mine > 0) {
    state.board.opened = true;
    state.board.nextArrivalAt = state.time;
  }
};

/** When the next contract arrives (it may already be due), or null while the board waits. */
export const nextArrivalTime = (state: GameState): number | null =>
  state.board.opened ? state.board.nextArrivalAt : null;

/** Applies one arrival. The caller has moved the clock to the arrival time. */
export const applyArrival = (state: GameState): ContractInstance | null => {
  const due = state.board.nextArrivalAt;
  if (!state.board.opened || due === null) return null;
  const contract = generateContract(state, state.board.arrivals, Math.min(due, state.time));
  state.board.open.push(contract);
  noteArrival(state, contract);
  state.board.arrivals += 1;
  state.board.nextArrivalAt =
    state.board.open.length >= num('board.cap') ? null : due + intervalMs();
  return contract;
};

/** A slot opened (a decline or a launch): if the board had been full, its timer starts now. */
export const slotFreed = (state: GameState): void => {
  if (state.board.opened && state.board.nextArrivalAt === null) {
    state.board.nextArrivalAt = state.time + intervalMs();
  }
};

export { candidatesFor };
