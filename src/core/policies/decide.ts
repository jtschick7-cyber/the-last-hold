import { BUILDING_IDS, buildings, type BuildingId } from '../../content/buildings';
import { JOB_IDS, jobs, type JobId } from '../../content/jobs';
import { apply, type Command } from '../commands';
import type { GameState } from '../state/game-state';
import { buildingCost } from '../systems/costs';
import { idlePeasants, jobSlots } from '../systems/housing';
import { bundleValue, deltaRateValue, payback, rateValue } from '../systems/valuation';
import { contractMoves, firstContractFood, refillRoster } from './contracts';
import { defenseMoves, emberMoves, freshMemory, standMove, type PolicyMemory } from './long-night';
import {
  addBundles,
  affordable,
  affordableWith,
  bottleneck,
  buildable,
  missingProducers,
  missingRequirements,
  recruitHold,
  reserveFor,
  shouldSave,
  policyAgeUp,
  silverWanted,
  slotBuildingFor,
  unproduced,
  type Bundle,
} from './goals';

// GDD §6.1: what a simulated player does at a check-in. Every choice is a
// Command through apply(), the same path as a tap (technical design §4.3).
// Purchases are greedy by payback with the ● hint's own valuation (GDD §5.1.2,
// B7). GDD §5.1.2 leaves items that add nothing right now to explicit policy
// rules; these are the rules (D60), in the order they run:
//   1. Staff: idle peasants take the most valuable open slot. Jobs the Age-up
//      needs come first, moving a worker over if nobody is idle.
//   2. Save for the Age-up once it's affordable by the check-in after next,
//      with auto-settle off meanwhile so settling doesn't spend its food.
//   3. Build the first producer of a resource the Age-up needs (the first
//      Mine), Silver Seams while silver is short, then the Age-up's buildings.
//   4. Work on the bottleneck: Cottage-plus-slots pairs for the Age-up
//      resource furthest from affordable.
//   5. Greedy by payback, where a Cottage-plus-slots pair counts as one item,
//      since each half alone adds nothing once housing and slots are full.

export interface CheckInDecision {
  readonly commands: readonly Command[];
  /** Buildings bought, levels added and Age-ups: GDD §6.3's meaningful actions. */
  readonly purchases: number;
  readonly agedUp: boolean;
  /** True if anything (a building or the Age-up) was affordable before acting. */
  readonly hadOption: boolean;
  /** True if the policy held back to save for the Age-up. */
  readonly saving: boolean;
}

interface Pick {
  readonly id: BuildingId;
  readonly payback: number;
}

/** Guards the loops against a bug that makes purchases free. */
const MAX_COMMANDS = 10_000;
const HOUSING: BuildingId = 'cottage';

const buyCommand = (id: BuildingId): Command =>
  buildings[id].kind === 'level'
    ? { type: 'build.upgrade', building: id }
    : { type: 'build.buy', building: id, count: 1 };

const slotBuildings = BUILDING_IDS.filter((id) =>
  buildings[id].effects.some((e) => e.kind === 'jobSlots'),
);

const neededJob = (state: GameState, job: JobId): boolean =>
  unproduced(state).includes(jobs[job].produces) ||
  (jobs[job].produces === 'silver' && silverWanted(state));

/** The open job whose next worker matters most: needed jobs first, then value. */
const bestOpenJob = (state: GameState): JobId | null => {
  const open = JOB_IDS.filter((j) => state.peasants.jobs[j] < jobSlots(state, j).value);
  const needed = open.find((j) => neededJob(state, j));
  if (needed) return needed;
  let best: JobId | null = null;
  let bestGain = 0;
  const now = rateValue(state);
  for (const job of open) {
    state.peasants.jobs[job] += 1;
    const gain = rateValue(state) - now;
    state.peasants.jobs[job] -= 1;
    if (gain > bestGain) {
      best = job;
      bestGain = gain;
    }
  }
  return best;
};

const better = (a: Pick | null, b: Pick | null): Pick | null =>
  b && b.payback < (a?.payback ?? Number.POSITIVE_INFINITY) ? b : a;

/** The best single item by payback, affordable with `reserve` left over. */
const bestSingle = (state: GameState, reserve: Bundle): Pick | null =>
  BUILDING_IDS.reduce<Pick | null>(
    (best, id) =>
      affordable(state, id, reserve)
        ? better(best, { id, payback: payback(state, id).value })
        : best,
    null,
  );

const pairCost = (state: GameState, slots: BuildingId): Bundle =>
  addBundles(buildingCost(state, HOUSING).bundle, buildingCost(state, slots).bundle);

/** The best Cottage-plus-slots pair by payback, valued as one purchase. */
const bestPair = (state: GameState, reserve: Bundle): Pick | null => {
  if (!buildable(state, HOUSING)) return null;
  let best: Pick | null = null;
  for (const id of slotBuildings) {
    const cost = pairCost(state, id);
    if (!buildable(state, id) || !affordableWith(state, cost, reserve)) continue;
    const withSlots = structuredClone(state);
    withSlots.buildings[id] += 1;
    const gain = deltaRateValue(state, id) + deltaRateValue(withSlots, HOUSING);
    if (gain > 0) best = better(best, { id, payback: bundleValue(cost) / gain });
  }
  return best;
};

/** Decides one check-in on a copy of the state; the caller applies the commands. */
export const decideCheckIn = (
  state: GameState,
  /** Time from now to the check-in after next (GDD §6.1's "within 2 check-ins"). */
  horizonMs: number,
  /** What the player remembers between check-ins (the stand rule's last Embers per day). */
  memory: PolicyMemory = freshMemory(),
): CheckInDecision => {
  const s = structuredClone(state);
  const commands: Command[] = [];
  let purchases = 0;
  let agedUp = false;
  const act = (cmd: Command): boolean => {
    if (commands.length >= MAX_COMMANDS || !apply(s, cmd, s.time).ok) return false;
    commands.push(cmd);
    return true;
  };
  const staff = (): void => {
    while (idlePeasants(s) > 0) {
      const job = bestOpenJob(s);
      if (!job || !act({ type: 'peasants.add', job })) return;
    }
    // A needed job still empty: move someone from the biggest other job.
    for (let job = bestOpenJob(s); job && neededJob(s, job); job = bestOpenJob(s)) {
      const from = JOB_IDS.filter((j) => j !== job && !neededJob(s, j)).sort(
        (a, b) => s.peasants.jobs[b] - s.peasants.jobs[a],
      )[0];
      if (!from || s.peasants.jobs[from] < 2) return;
      if (!act({ type: 'peasants.remove', job: from }) || !act({ type: 'peasants.add', job })) {
        return;
      }
    }
  };
  const buy = (id: BuildingId, reserve?: Bundle): boolean => {
    if (!affordable(s, id, reserve) || !act(buyCommand(id))) return false;
    purchases += 1;
    staff();
    return true;
  };
  const buyPair = (slots: BuildingId, reserve: Bundle): boolean =>
    affordableWith(s, pairCost(s, slots), reserve) && buy(HOUSING) && buy(slots);

  const hadOption = policyAgeUp(s)?.ready === true || BUILDING_IDS.some((id) => affordable(s, id));
  // v0.4 (GDD §6.1, D114): the stand first (it ends the cycle), then Embers on The Hearth.
  // v0.5 (D167): the roster is filled before anything else uses it, the stand included.
  refillRoster(s, act);
  if (standMove(s, act, memory)) purchases += 1;
  purchases += emberMoves(s, act);
  staff();
  if (policyAgeUp(s)?.ready && act({ type: 'age.up' })) {
    purchases += 1;
    agedUp = true;
  }
  // v0.2 (D75): contracts and hunters, before the building rules, so launches start their timers.
  purchases += contractMoves(s, act, reserveFor(s), recruitHold(s, horizonMs));
  // The first contract's provisions are held back from everything else, and settling
  // pauses so it doesn't spend that food (D75).
  const hold = firstContractFood(s);
  const reserve = (): Bundle => {
    const r = reserveFor(s);
    return hold > 0 ? { ...r, food: r.food + hold } : r;
  };
  const saving = !agedUp && shouldSave(s, horizonMs);
  const pause = saving || hold > 0;
  // GDD §5.1.1: auto-settle can be turned off to save food. The policy does
  // that while it saves for the Age-up, and turns it back on afterwards.
  if (s.peasants.autoSettle === pause) act({ type: 'peasants.autoSettle', on: !pause });
  if (saving) return { commands, purchases, agedUp, hadOption, saving };

  for (const id of missingProducers(s)) buy(id);
  if (silverWanted(s)) while (buy('silver-seam'));
  // The reserve changes as purchases land, so it's read afresh each time.
  for (const id of missingRequirements(s)) {
    while (missingRequirements(s).includes(id) && buy(id, reserve()));
  }
  // v0.4: Walls and the Watchtower in turn, from the Citadel.
  purchases += defenseMoves(s, act, reserve);
  // From the Keep, auto-settle sends new peasants to the bottleneck's job first, so the
  // slots bought for it fill (D132).
  const short = bottleneck(s);
  const shortJob = short ? JOB_IDS.find((j) => jobs[j].produces === short) : undefined;
  if (shortJob && s.cycle.age !== 'hamlet' && s.peasants.priority[0] !== shortJob) {
    act({
      type: 'peasants.priority',
      order: [shortJob, ...s.peasants.priority.filter((j) => j !== shortJob)],
    });
  }
  for (;;) {
    const r = bottleneck(s);
    const id = r ? slotBuildingFor(r) : undefined;
    if (!id || !buildable(s, id) || !buyPair(id, reserve())) break;
  }
  for (;;) {
    const held = reserve();
    const single = bestSingle(s, held);
    const pair = bestPair(s, held);
    const bought =
      pair && better(single, pair) === pair
        ? buyPair(pair.id, held)
        : single && buy(single.id, held);
    if (!bought) break;
  }
  return { commands, purchases, agedUp, hadOption, saving };
};
