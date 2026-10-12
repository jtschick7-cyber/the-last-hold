import { num } from '../balance-access';
import type { Explained } from '../breakdown/breakdown';
import { intPow } from '../math';

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
