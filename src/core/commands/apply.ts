import type { GameState } from '../state/game-state';
import { ageUp } from './age';
import { buy, upgrade } from './build';
import { addResources, runPolicy, setSeed, skip, unlockAge } from './debug';
import { add, fill, remove, setAutoSettle, setPriority } from './peasants';
import { setSettings } from './settings';
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
    case 'peasants.autoSettle':
      return setAutoSettle(state, cmd.on);
    case 'peasants.priority':
      return setPriority(state, cmd.order);
    case 'age.up':
      return ageUp(state);
    case 'settings.set':
      return setSettings(state, cmd.patch);
    case 'debug.skip':
      return skip(state, cmd.ms, now);
    case 'debug.runPolicy':
      return runPolicy(state, cmd.policy, cmd.ms, now);
    case 'debug.addResources':
      return addResources(state, cmd.bundle);
    case 'debug.setSeed':
      return setSeed(state, cmd.seed);
    case 'debug.unlockAge':
      return unlockAge(state, cmd.age);
    default:
      return refuse('Unknown command.');
  }
};
