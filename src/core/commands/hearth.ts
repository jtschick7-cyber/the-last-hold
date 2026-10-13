import { UPGRADE_IDS, upgrades, type UpgradeId } from '../../content/warden-upgrades';
import { upgradeCost } from '../long-night/hearth';
import type { GameState } from '../state/game-state';
import { ok, refuse, type ApplyResult } from './types';

// GDD §5.9.5: buying a warden upgrade on The Hearth, open at any time.
export const buyUpgrade = (state: GameState, id: UpgradeId): ApplyResult => {
  if (!(UPGRADE_IDS as readonly string[]).includes(id)) return refuse('No such upgrade.');
  const cost = upgradeCost(state, id);
  if (!cost) return refuse(`${upgrades[id].name} is at its highest level.`);
  if (state.embers < cost.value) return refuse('Not enough Embers.');
  state.embers -= cost.value;
  state.upgrades[id] += 1;
  return ok;
};
