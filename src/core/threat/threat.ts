import { perkFactor, perkLines } from '../systems/orders-perks';
import { ages } from '../../content/ages';
import { BUILDING_IDS, buildings } from '../../content/buildings';
import { constantAt, num } from '../balance-access';
import type { Breakdown, Explained } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';
import { MS_PER_HOUR } from '../time';

// GDD §5.9.1 (D108): Threat rises every hour by the Rank's rate, slowed by the
// defenses; failed contracts add to it and completed ones take it down; it never
// goes below 0. It counts only once a pre-v0.4 save has had its first Long Night
// (`arrivalDue`, GDD §5.9.8). Only the Last Stand and its payout read it.

const counts = (state: GameState): boolean => !state.arrivalDue;

/** Threat per hour now: the Rank's rate × (1 − what defenses take off). */
export const threatRate = (state: GameState): Explained => {
  const age = state.cycle.age;
  const rates = constantAt('threat.ratePerHour').value as Readonly<Record<string, number>>;
  const rankRate = rates[age] ?? 0;
  const defenses: Breakdown[] = [];
  let slow = 0;
  for (const id of BUILDING_IDS) {
    for (const e of buildings[id].effects) {
      if (e.kind !== 'threatSlow' || state.buildings[id] === 0) continue;
      const off = state.buildings[id] * num(e.perLevelKey);
      slow += off;
      defenses.push({
        label: `${buildings[id].name} level ${state.buildings[id]}`,
        value: -off,
        formula: `${state.buildings[id]} × ${num(e.perLevelKey)}`,
        key: e.perLevelKey,
      });
    }
  }
  slow = Math.min(1, slow);
  // GDD §5.13.5: the Quenchers' factor slows the hourly rate only, never Threat from failed contracts.
  const value = counts(state) ? rankRate * (1 - slow) * perkFactor(state, 'quenchers') : 0;
  return {
    value,
    breakdown: {
      label: 'Threat per hour',
      value,
      formula: counts(state) ? `${rankRate} × (1 − ${slow})` : 'counts after your first Long Night',
      children: [
        { label: `${ages[age].name} rate`, value: rankRate, key: 'threat.ratePerHour' },
        { label: 'Defenses slow it', value: -slow, children: defenses },
        ...perkLines(state, 'quenchers'),
      ],
    },
  };
};

/** Adds the Threat of `ms` milliseconds at the current rate (called by advance()). */
export const accrueThreat = (state: GameState, ms: number): void => {
  if (ms <= 0 || !counts(state)) return;
  state.threat += (threatRate(state).value * ms) / MS_PER_HOUR;
};

/** A contract finished: a failure adds f × tier, a success takes off c × tier, floored at 0. */
export const applyContractThreat = (state: GameState, tier: number, success: boolean): void => {
  if (!counts(state)) return;
  const record = state.cycles[state.cycles.length - 1];
  if (success) {
    const off = num('threat.completedPerTier') * tier;
    state.threat = Math.max(0, state.threat - off);
    if (record) record.contractThreat.removed += off;
  } else {
    const add = num('threat.failedPerTier') * tier;
    state.threat += add;
    if (record) record.contractThreat.added += add;
  }
};

/** GDD §9.13: the meter's value, with the rate now and what contracts did this cycle. */
export const threatMeter = (state: GameState): Explained => {
  const record = state.cycles[state.cycles.length - 1];
  const tally = record?.contractThreat ?? { added: 0, removed: 0 };
  return {
    value: state.threat,
    breakdown: {
      label: 'Threat',
      value: state.threat,
      formula: 'time × rate + failed contracts − completed contracts, never below 0',
      children: [
        threatRate(state).breakdown,
        {
          label: 'Failed contracts this cycle',
          value: tally.added,
          formula: `${num('threat.failedPerTier')} × tier each`,
          key: 'threat.failedPerTier',
        },
        {
          label: 'Completed contracts this cycle',
          value: -tally.removed,
          formula: `${num('threat.completedPerTier')} × tier each`,
          key: 'threat.completedPerTier',
        },
      ],
    },
  };
};
