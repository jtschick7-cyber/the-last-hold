import { upgrades, type UpgradeId } from '../../content/warden-upgrades';
import type { Explained } from '../breakdown/breakdown';
import { roundHalfUp } from '../combat/build';
import { intPow } from '../math';
import type { GameState } from '../state/game-state';

// GDD §5.9.5 and §8.9 (D111): The Hearth. Level L of an upgrade costs
// `cost × growth^(L − 1)` Embers, rounded to a whole Ember; no re-spending in v0.4.

/** The Embers the next level costs, or null at the maximum. */
export const upgradeCost = (state: GameState, id: UpgradeId): Explained | null => {
  const def = upgrades[id];
  const next = state.upgrades[id] + 1;
  if (next > def.maxLevel) return null;
  const value = roundHalfUp(def.cost * intPow(def.growth, next - 1));
  return {
    value,
    breakdown: {
      label: `${def.name} level ${next} (Embers)`,
      value,
      formula: `${def.cost} × ${def.growth}^${next - 1}, rounded`,
      children: [
        { label: 'Level 1 cost', value: def.cost },
        { label: 'Growth per level', value: def.growth },
      ],
    },
  };
};
