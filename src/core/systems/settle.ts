import { num } from '../balance-access';
import type { Explained } from '../breakdown/breakdown';
import { intPow, reached } from '../math';
import type { GameState } from '../state/game-state';
import { housing } from './housing';

// GDD §5.1.1: settling the next peasant costs a × g^P food, P = current peasants.
export const settleCost = (peasants: number): Explained => {
  const base = num('peasant.settleBase');
  const growth = num('peasant.settleGrowth');
  const value = base * intPow(growth, peasants);
  return {
    value,
    breakdown: {
      label: 'Settle cost (food)',
      value,
      formula: `${base} × ${growth}^${peasants}`,
      children: [
        { label: 'Base', value: base, key: 'peasant.settleBase' },
        { label: 'Growth per peasant', value: growth, key: 'peasant.settleGrowth' },
        { label: 'Current peasants', value: peasants },
      ],
    },
  };
};

/** Why a peasant can't settle right now, or null if one can (GDD §5.1.1). */
export const settleBlocker = (state: GameState): string | null => {
  const beds = housing(state).value;
  if (state.peasants.total >= beds) return 'No free beds. Build a Cottage to make room.';
  const cost = settleCost(state.peasants.total).value;
  if (!reached(state.resources.food, cost)) return 'Not enough food to settle another peasant.';
  return null;
};
