import { skillLevel } from '../skills/skills';
import { gearCost } from '../skills/hooks';
import type { HunterId } from '../../content/hunters';
import type { Command } from '../commands';
import { computeOdds } from '../contracts/odds';
import { oddsTarget } from '../investigation/knowledge';
import { maxPartySize } from '../contracts/party';
import { provisions } from '../contracts/rewards';
import type { ContractInstance, GameState, Preparation } from '../state/game-state';
import { copyLimit } from '../systems/costs';
import { availableHunters, candidates, nextGear, rosterCap, snapshotOf } from '../systems/hunters';
import type { Bundle } from './goals';
import { contractIdentity } from '../investigation/view';
import { investigationSlots } from '../investigation/lodge';
import {
  brewMoves,
  experimentMoves,
  investigateMoves,
  labBuildings,
  labFirstSetBuilt,
  prepFor,
} from './lab';
import { ageIndex } from '../systems/ages';
import { hunters } from '../../content/hunters';
import { traits } from '../../content/traits';

/** GDD §6.1 (D114): "within 5 points of the best odds". */
const TRACKER_SLACK = 0.05;

/** Does this hunter have a Tracker trait (an idle one speeds a Lodge slot, GDD §5.6.3)? */
const trackerOf = (id: HunterId): boolean =>
  hunters[id].traits.some((t) => traits[t].effect.kind === 'clueSpeed');

// GDD §6.1 (D75): what the simulated player does about contracts and hunters at
// a check-in. It collects results, hires who it can afford once the next Rank-up
// isn't waiting on silver, upgrades gear, and sends the biggest contract it can
// win without ever going Reckless. Every choice is a Command through apply().

/** Fights the policy runs to judge a party: enough to tell Reckless from not. */
const PROBE_SAMPLES = 60;
/** Never launch below this (the Reckless line, GDD §5.3.7): the policy never goes Reckless. */
const MIN_ODDS = 0.35;

type Act = (cmd: Command) => boolean;

/** The odds the launch panel would show for this party, or null if it can't go (no food, nobody). */
const oddsFor = (
  s: GameState,
  c: ContractInstance,
  party: HunterId[],
  prep: Preparation,
): number | null => {
  if (party.length === 0) return null;
  if (s.resources.food < provisions(s, party.length, c.tier, party).value) return null;
  return computeOdds({
    gameSeed: s.meta.gameSeed,
    contractId: c.id,
    party: party.map((h) => snapshotOf(s, h)),
    monster: oddsTarget(s, c),
    location: c.location,
    rank: s.cycle.age,
    prep,
    alchemy: skillLevel(s, 'alchemy'),
    samples: PROBE_SAMPLES,
  }).winChance;
};

/** D95: an unidentified contract this close to a sure win is sent at once; a closer one waits for its clues. */
const SURE_ENOUGH = 0.9;

/** Hires every candidate it can afford, cheapest first, leaving the next Rank-up's silver untouched. */
const recruit = (s: GameState, act: Act, hold: number): number => {
  let n = 0;
  for (const c of [...candidates(s)].sort((a, b) => a.recruitPrice - b.recruitPrice)) {
    const leaves = s.resources.silver - c.recruitPrice >= hold;
    if (leaves && act({ type: 'hunter.recruit', hunter: c.id })) n += 1;
  }
  return n;
};

/**
 * GDD §6.1 (v0.5, D167): whenever the active roster has room, it fills it from the reserve,
 * highest levels first. Hunters who are hurt or away wait (the move is refused). Returns the moves made.
 */
export const refillRoster = (s: GameState, act: Act): number => {
  let n = 0;
  const reserve = (Object.keys(s.hunters) as HunterId[])
    .filter((id) => !s.roster.active.includes(id))
    .sort((a, b) => (s.hunters[b]?.level ?? 0) - (s.hunters[a]?.level ?? 0));
  for (const id of reserve) {
    if (s.roster.active.length >= rosterCap(s).value) break;
    if (act({ type: 'roster.set', hunter: id, active: true })) n += 1;
  }
  return n;
};

/** Raises the roster cap when hunters wait in the reserve, and upgrades gear, weakest slot first. */
const equip = (s: GameState, act: Act, reserve: Bundle): number => {
  let n = 0;
  const owned = Object.keys(s.hunters).length;
  if (
    owned > rosterCap(s).value &&
    ageIndex(s.cycle.age) >= ageIndex('keep') &&
    s.buildings.barracks < (copyLimit('barracks') ?? 5)
  ) {
    if (act({ type: 'build.upgrade', building: 'barracks' })) n += 1;
  }
  for (const id of s.roster.active) {
    const h = s.hunters[id];
    if (!h) continue;
    for (const slot of ['weapon', 'armor'] as const) {
      const next = nextGear(s, h, slot);
      if (!next) continue;
      const price = gearCost(s, next).cost;
      const clear = (['food', 'wood', 'iron', 'silver'] as const).every(
        (r) => s.resources[r] - price[r] >= reserve[r],
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
  return provisions(s, Math.min(free, maxPartySize(tier, s.cycle.age)), tier).value;
};

/** Contracts worth sending first: the highest tier, then the longest on the board. */
const byValue = (a: ContractInstance, b: ContractInstance): number =>
  b.tier - a.tier || a.arrivedAt - b.arrivedAt;

/**
 * One check-in's contract and hunter moves. Returns how many meaningful actions
 * it took (launches, hires, upgrades), for the simulator's engagement checks.
 */
export const contractMoves = (
  s: GameState,
  act: Act,
  reserve: Bundle,
  /** Silver hires, gear and the Lodge, Hut and Garden leave alone while the policy saves for the Rank-up (goals.recruitHold, D132). */
  silverHold = 0,
  /** v1.0 (report-only): puts the open contracts in another order than Standard's; absent for every player. */
  order?: (s: GameState, inStandardOrder: ContractInstance[]) => ContractInstance[],
): number => {
  if (!s.board.opened) return 0;
  if (s.results.length > 0) act({ type: 'results.collect' });
  // v0.4 (GDD §6.1, D114): from the Keep, the first Lodge, Hut and Garden come before any
  // recruit or gear upgrade; after that the v0.3 order (D95): hires and gear, then the
  // rest of the Lodge, Hut and Garden steps, the clues and the kettles, before the launches.
  let actions = 0;
  const held = { ...reserve, silver: reserve.silver + silverHold };
  if (!labFirstSetBuilt(s)) actions += labBuildings(s, act, held);
  if (labFirstSetBuilt(s))
    actions += recruit(s, act, silverHold) + equip(s, act, held) + labBuildings(s, act, held);
  refillRoster(s, act);
  actions += brewMoves(s, act);
  actions += experimentMoves(s, act);
  const sorted = [...s.board.open].sort(byValue);
  for (const c of order ? order(s, sorted) : sorted) {
    const free = availableHunters(s);
    if (free.length === 0) break;
    // The strongest party the roster can field; dropping weak members never helps odds.
    let party = free.slice(0, maxPartySize(c.tier, s.cycle.age));
    let prep = prepFor(s, c, party);
    let odds = oddsFor(s, c, party, prep);
    // v0.4 (GDD §6.1, D114): a Tracker stays home, speeding a busy Lodge slot, when a party
    // without her is within 5 points of the best odds.
    const tracker = party.find((h) => trackerOf(h));
    if (tracker && odds !== null && s.queues.investigation.length > 0) {
      const alt = free.filter((h) => h !== tracker).slice(0, maxPartySize(c.tier, s.cycle.age));
      const altPrep = prepFor(s, c, alt);
      const altOdds = oddsFor(s, c, alt, altPrep);
      if (altOdds !== null && altOdds >= odds - TRACKER_SLACK) {
        party = alt;
        prep = altPrep;
        odds = altOdds;
      }
    }
    // D95: against a monster it can't name, a player who has Lodge slots waits for the clues
    // when the odds are not already near-certain, instead of sending the party in blind.
    if (
      !contractIdentity(s, c).identified &&
      investigationSlots(s) > 0 &&
      (odds ?? 0) < SURE_ENOUGH
    ) {
      if (s.queues.investigation.some((q) => q.contractId === c.id)) continue;
      if (act({ type: 'investigate.assign', contract: c.id })) continue;
    }
    if (
      odds !== null &&
      odds >= MIN_ODDS &&
      act({ type: 'contract.launch', contract: c.id, party, prep })
    )
      actions += 1;
  }
  // Free Lodge slots go to the best contracts still waiting (they will be clear by the next check-in).
  actions += investigateMoves(s, act);
  return actions;
};
