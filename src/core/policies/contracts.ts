import type { HunterId } from '../../content/hunters';
import type { Command } from '../commands';
import { computeOdds } from '../contracts/odds';
import { maxPartySize } from '../contracts/party';
import { provisions } from '../contracts/rewards';
import type { ContractInstance, GameState } from '../state/game-state';
import { copyLimit } from '../systems/costs';
import { availableHunters, candidates, nextGear, rosterCap, snapshotOf } from '../systems/hunters';
import { rankUpSilver, type Bundle } from './goals';

// GDD §6.1 (D75): what the simulated player does about contracts and hunters at
// a check-in. It collects results, hires who it can afford once the next Rank-up
// isn't waiting on silver, upgrades gear, and sends the biggest contract it can
// win without ever going Reckless. Every choice is a Command through apply().

/** Fights the policy runs to judge a party: enough to tell Reckless from not. */
const PROBE_SAMPLES = 60;
/** Never launch below this (the Reckless line, GDD §5.3.7): the policy never goes Reckless. */
const MIN_ODDS = 0.35;

type Act = (cmd: Command) => boolean;

const sendable = (s: GameState, c: ContractInstance, party: HunterId[]): boolean => {
  if (party.length === 0) return false;
  if (s.resources.food < provisions(party.length, c.tier).value) return false;
  const odds = computeOdds({
    gameSeed: s.meta.gameSeed,
    contractId: c.id,
    party: party.map((h) => snapshotOf(s, h)),
    monster: { monster: c.monster, tier: c.tier },
    location: c.location,
    rank: s.cycle.age,
    samples: PROBE_SAMPLES,
  });
  return odds.winChance >= MIN_ODDS;
};

/** Hires every candidate it can afford, cheapest first, leaving the next Rank-up's silver untouched. */
const recruit = (s: GameState, act: Act): number => {
  let n = 0;
  for (const c of [...candidates(s)].sort((a, b) => a.recruitPrice - b.recruitPrice)) {
    const leaves = s.resources.silver - c.recruitPrice >= rankUpSilver(s);
    if (leaves && act({ type: 'hunter.recruit', hunter: c.id })) n += 1;
  }
  return n;
};

/** Raises the roster cap when hunters wait in the reserve, and upgrades gear, weakest slot first. */
const equip = (s: GameState, act: Act, reserve: Bundle): number => {
  let n = 0;
  const owned = Object.keys(s.hunters).length;
  if (
    owned > rosterCap(s).value &&
    s.cycle.age === 'keep' &&
    s.buildings.barracks < (copyLimit('barracks') ?? 5)
  ) {
    if (act({ type: 'build.upgrade', building: 'barracks' })) n += 1;
  }
  for (const id of s.roster.active) {
    const h = s.hunters[id];
    if (!h) continue;
    for (const slot of ['weapon', 'armor'] as const) {
      const next = nextGear(h, slot);
      if (!next) continue;
      const clear = (['food', 'wood', 'iron', 'silver'] as const).every(
        (r) => s.resources[r] - (next.cost[r] ?? 0) >= reserve[r],
      );
      if (clear && act({ type: 'gear.upgrade', hunter: id, slot })) n += 1;
    }
  }
  return n;
};

/**
 * The food a sensible player holds back for the first contract of a game: the board is
 * open, nothing has ever been sent, and a hunter is free. Zero otherwise. They keep their
 * food for its provisions (and stop settling) instead of spending it on the next Cottage (GDD §6.2
 * "first contract within 15 min of the first Mine", D75).
 */
export const firstContractFood = (s: GameState): number => {
  if (!s.board.opened || s.board.open.length === 0) return 0;
  if (s.stats.contractsWon + s.stats.contractsLost + s.running.length > 0) return 0;
  const free = availableHunters(s).length;
  if (free === 0) return 0;
  const tier = Math.max(...s.board.open.map((c) => c.tier));
  return provisions(Math.min(free, maxPartySize(tier, s.cycle.age)), tier).value;
};

/** Contracts worth sending first: the highest tier, then the longest on the board. */
const byValue = (a: ContractInstance, b: ContractInstance): number =>
  b.tier - a.tier || a.arrivedAt - b.arrivedAt;

/**
 * One check-in's contract and hunter moves. Returns how many meaningful actions
 * it took (launches, hires, upgrades), for the simulator's engagement checks.
 */
export const contractMoves = (s: GameState, act: Act, reserve: Bundle): number => {
  if (!s.board.opened) return 0;
  if (s.results.length > 0) act({ type: 'results.collect' });
  let actions = recruit(s, act) + equip(s, act, reserve);
  for (const c of [...s.board.open].sort(byValue)) {
    const free = availableHunters(s);
    if (free.length === 0) break;
    // The strongest party the roster can field; dropping weak members never helps odds.
    const party = free.slice(0, maxPartySize(c.tier, s.cycle.age));
    if (sendable(s, c, party) && act({ type: 'contract.launch', contract: c.id, party }))
      actions += 1;
  }
  return actions;
};
