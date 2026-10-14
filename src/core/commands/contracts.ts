import { HUNTER_IDS, type HunterId } from '../../content/hunters';
import { ALL_SCENE_IDS, type SceneId } from '../../content/text/scenes';
import { slotFreed } from '../contracts/board';
import { computeOdds } from '../contracts/odds';
import { monsterFor, oddsTarget } from '../investigation/knowledge';
import { releaseSlot } from '../investigation/lodge';
import { maxPartySize } from '../contracts/party';
import { contractDurationMs, provisions } from '../contracts/rewards';
import { prepProblem, spendPrep } from '../contracts/prep';
import { noPreparation, type GameState, type Preparation } from '../state/game-state';
import { availableHunters, snapshotOf } from '../systems/hunters';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.4.2 launching, §5.4.1 declining, §5.4.3 collecting.

const knownHunter = (id: unknown): id is HunterId =>
  typeof id === 'string' && (HUNTER_IDS as readonly string[]).includes(id);

export const launch = (
  state: GameState,
  contractId: string,
  party: HunterId[],
  confirmReckless: boolean,
  prep: Preparation = noPreparation(),
): ApplyResult => {
  const contract = state.board.open.find((c) => c.id === contractId);
  if (!contract) return refuse('That contract is no longer on the board.');
  if (!Array.isArray(party) || party.length < 1) return refuse('Choose at least one hunter.');
  if (party.some((h) => !knownHunter(h))) return refuse('That hunter does not exist.');
  if (new Set(party).size !== party.length) return refuse('A hunter can only be sent once.');
  const max = maxPartySize(contract.tier, state.cycle.age);
  if (party.length > max) return refuse(`This contract takes at most ${max} hunters.`);
  const free = availableHunters(state);
  const notFree = party.find((h) => !free.includes(h));
  if (notFree) return refuse('Every hunter sent must be on the active roster and ready.');
  const problem = prepProblem(state, party, prep);
  if (problem) return refuse(problem);
  const food = provisions(state, party.length, contract.tier).value;
  if (state.resources.food < food) return refuse('Not enough food for provisions.');
  const snapshots = party.map((h) => snapshotOf(state, h));
  const odds = computeOdds({
    gameSeed: state.meta.gameSeed,
    contractId: contract.id,
    party: snapshots,
    monster: oddsTarget(state, contract),
    location: contract.location,
    rank: state.cycle.age,
    prep,
  });
  if (odds.reckless && !confirmReckless) {
    return refuse('This contract is Reckless: the hunters could die. Confirm to send them anyway.');
  }
  state.resources.food -= food;
  spendPrep(state, prep);
  state.board.open = state.board.open.filter((c) => c.id !== contractId);
  releaseSlot(state, contractId);
  slotFreed(state);
  state.running.push({
    contract,
    party: [...party],
    snapshots,
    launchedAt: state.time,
    endsAt: state.time + contractDurationMs(state, contract.tier),
    reckless: odds.reckless,
    prep: structuredClone(prep),
    knowledge: monsterFor(state, contract).knowledge,
    winChance: odds.winChance,
  });
  return ok;
};

export const decline = (state: GameState, contractId: string): ApplyResult => {
  const before = state.board.open.length;
  state.board.open = state.board.open.filter((c) => c.id !== contractId);
  if (state.board.open.length === before) return refuse('That contract is no longer on the board.');
  releaseSlot(state, contractId);
  slotFreed(state);
  return ok;
};

/** A scene was shown: remember it so it plays once. Harmless to repeat. */
export const markSeen = (state: GameState, scene: SceneId): ApplyResult => {
  if (!(ALL_SCENE_IDS as readonly string[]).includes(scene))
    return refuse('That scene does not exist.');
  if (!state.scenes.includes(scene)) state.scenes.push(scene);
  return ok;
};

/** Collect only acknowledges: the rewards were applied when the timers ended (B9). */
export const collect = (state: GameState): ApplyResult => {
  if (state.results.length === 0) return refuse('Nothing to collect.');
  state.results = [];
  return ok;
};
