import { balance } from '../../content/balance';
import type { Explained } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';
import { MS_PER_DAY } from '../time';
import { delvesOpen } from './access';

// GDD §5.10.8 (D258): the Riftglass allowance. It grows by `riftglass.weeklyCap` ÷ 7 a day,
// continuously, banks up to `riftglass.bankWeeks` × `riftglass.weeklyCap` (140), and earning
// draws it down; when it is empty a run pays no Riftglass. Earned Riftglass has no cap.

export const allowancePerDay = (): number => balance.riftglass.weeklyCap.value / 7;
export const allowanceCap = (): number =>
  balance.riftglass.weeklyCap.value * balance.riftglass.bankWeeks.value;

/**
 * The allowance's clock starts the moment Delves open: when a warden first reaches the Keep, or on
 * the v7 migration for a save that already has (D284). Time before it is not owed.
 */
export const startAllowanceClock = (state: GameState): void => {
  if (state.delve.allowanceAt === null && delvesOpen(state)) state.delve.allowanceAt = state.time;
};

/** Lets the allowance grow to `now`; a clock set back changes nothing. */
export const accrueAllowance = (state: GameState, now: number): void => {
  const d = state.delve;
  if (d.allowanceAt === null || now <= d.allowanceAt) return;
  const grown = ((now - d.allowanceAt) / MS_PER_DAY) * allowancePerDay();
  d.allowance = Math.min(allowanceCap(), d.allowance + grown);
  d.allowanceAt = now;
};

/** Takes up to `wanted` whole Riftglass from the allowance; returns what was paid (D258). */
export const payRiftglass = (state: GameState, wanted: number): number => {
  const paid = Math.max(0, Math.min(wanted, Math.floor(state.delve.allowance)));
  state.delve.allowance -= paid;
  state.delve.riftglass += paid;
  return paid;
};

/** "Riftglass: 40 waiting, banks up to 140" with the numbers behind it (GDD §9.15). */
export const allowanceExplained = (state: GameState): Explained => {
  const waiting = Math.floor(state.delve.allowance);
  return {
    value: waiting,
    breakdown: {
      label: 'Riftglass waiting',
      value: waiting,
      formula: `${allowancePerDay()} a day, banking up to ${allowanceCap()}`,
      children: [
        { label: 'Grows each day', value: allowancePerDay(), key: 'riftglass.weeklyCap' },
        {
          label: 'Banks up to (weeks × weekly cap)',
          value: allowanceCap(),
          key: 'riftglass.bankWeeks',
        },
        { label: 'Waiting now', value: state.delve.allowance },
      ],
    },
  };
};
