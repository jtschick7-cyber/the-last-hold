import { arriveV05, nameWarden, readArchive, runV05Arrival } from './wardens';
import type { GameState } from '../state/game-state';
import { ageUp } from './age';
import { collect, decline, launch, markSeen } from './contracts';
import { cancelBrew, queueBrew } from './brew';
import { assign, stop } from './investigate';
import { recruit, setActive, upgradeGear } from './roster';
import { buy, upgrade } from './build';
import {
  addEmbers,
  addResources,
  runArrival,
  runPolicy,
  setSeed,
  skip,
  unlockAge,
  addArvid,
} from './debug';
import { add, fill, remove, setAutoSettle, setPriority, settle } from './peasants';
import { setSettings } from './settings';
import { makeStand, markStandSeen } from './stand';
import { buyUpgrade } from './hearth';
import { refuse, type ApplyResult, type Command } from './types';

/**
 * Technical design §4.3: applies one player action. Validates first, so a
 * refused command never changes state. The caller has already advanced the
 * state to `now`; only the debug time skip uses it in v0.1. A clock moved
 * backward is ignored, never refused (D21).
 */
export const apply = (state: GameState, cmd: Command, now: number): ApplyResult => {
  switch (cmd.type) {
    case 'build.buy':
      return buy(state, cmd.building, cmd.count);
    case 'build.upgrade':
      return upgrade(state, cmd.building);
    case 'peasants.add':
      return add(state, cmd.job);
    case 'peasants.remove':
      return remove(state, cmd.job);
    case 'peasants.fill':
      return fill(state, cmd.job);
    case 'peasants.settle':
      return settle(state);
    case 'peasants.autoSettle':
      return setAutoSettle(state, cmd.on);
    case 'peasants.priority':
      return setPriority(state, cmd.order);
    case 'age.up':
      return ageUp(state);
    case 'contract.launch':
      return launch(state, cmd.contract, cmd.party, cmd.confirmReckless === true, cmd.prep);
    case 'contract.decline':
      return decline(state, cmd.contract);
    case 'investigate.assign':
      return assign(state, cmd.contract);
    case 'investigate.stop':
      return stop(state, cmd.contract);
    case 'brew.queue':
      return queueBrew(state, cmd.item);
    case 'brew.cancel':
      return cancelBrew(state, cmd.index);
    case 'results.collect':
      return collect(state);
    case 'scene.seen':
      return markSeen(state, cmd.scene);
    case 'hunter.recruit':
      return recruit(state, cmd.hunter);
    case 'roster.set':
      return setActive(state, cmd.hunter, cmd.active);
    case 'gear.upgrade':
      return upgradeGear(state, cmd.hunter, cmd.slot);
    case 'settings.set':
      return setSettings(state, cmd.patch);
    case 'stand.make':
      return makeStand(state, cmd.party, cmd.prep ?? { oils: {}, potions: {} });
    case 'stand.seen':
      return markStandSeen(state);
    case 'upgrade.buy':
      return buyUpgrade(state, cmd.upgrade);
    case 'debug.skip':
      return skip(state, cmd.ms, now);
    case 'debug.runPolicy':
      return runPolicy(state, cmd.policy, cmd.ms, now);
    case 'debug.addResources':
      return addResources(state, cmd.bundle);
    case 'debug.setSeed':
      return setSeed(state, cmd.seed);
    case 'debug.addEmbers':
      return addEmbers(state, cmd.amount);
    case 'debug.runArrival':
      return runArrival(state);
    case 'debug.unlockAge':
      return unlockAge(state, cmd.age);
    case 'debug.addArvid':
      return addArvid(state);
    case 'warden.name':
      return nameWarden(state, cmd.cycle, cmd.name);
    case 'story.arrive':
      return arriveV05(state, cmd.names);
    case 'debug.runV05Arrival':
      return runV05Arrival(state);
    case 'archive.read':
      return readArchive(state, cmd.key);
    default:
      return refuse('Unknown command.');
  }
};
