import { num } from '../balance-access';
import type { GameState } from '../state/game-state';
import { endingChoosable } from '../story/remembering';
import type { Breakdown, Explained } from '../breakdown/breakdown';

// GDD §5.9.10, §7.13 (D539–D541, technical design §21.2): Rising Vigil's two terms. Each is
// worked out here and nowhere else, with its breakdown built by the same function, so the
// number and its explanation cannot disagree. Level 0 keeps the old expression exactly (no
// added term), so a stand with the switch Off, or any stand before v1.3, is bit for bit what it was.

/** The Threat line of a multiplier: 1 plus the per-point rate times Threat. */
const threatLine = (label: string, value: number, formula: string, key: Breakdown['key']) => ({
  label,
  value,
  formula,
  key,
});

/** Wave Health and Might × this (GDD §5.9.10): 1 + w × Threat + s × level. */
export const waveFactor = (threat: number, level: number): Explained => {
  const w = num('threat.waveStrengthPerPoint');
  const base = 1 + w * threat;
  const children: Breakdown[] = [
    threatLine(
      `Threat ${Math.round(threat)}`,
      base,
      `1 + ${w} × Threat`,
      'threat.waveStrengthPerPoint',
    ),
  ];
  if (level === 0)
    return { value: base, breakdown: { label: 'Wave strength', value: base, children } };
  const s = num('vigil.strengthPerLevel');
  const step = s * level;
  children.push({
    label: `Rising Vigil, level ${level}`,
    value: step,
    formula: `${s} × level`,
    key: 'vigil.strengthPerLevel',
  });
  const value = base + step;
  return { value, breakdown: { label: 'Wave strength', value, children } };
};

/** The waves part of the Embers × this (GDD §5.9.4): 1 + b × Threat + e × level. */
export const embersMultiplier = (threat: number, level: number): Explained => {
  const b = num('embers.threatBonus');
  const base = 1 + b * threat;
  const children: Breakdown[] = [
    threatLine(`Threat ${Math.round(threat)}`, base, `1 + ${b} × Threat`, 'embers.threatBonus'),
  ];
  if (level === 0)
    return { value: base, breakdown: { label: 'Embers multiplier', value: base, children } };
  const e = num('vigil.embersPerLevel');
  const step = e * level;
  // GDD §9.23: whole percent of the base 1, rounded down.
  children.push({
    label: `Rising Vigil: +${Math.floor(100 * step)}% on the waves part`,
    value: step,
    formula: `${e} × level ${level}`,
    key: 'vigil.embersPerLevel',
  });
  const value = base + step;
  return { value, breakdown: { label: 'Embers multiplier', value, children } };
};

/** Rising Vigil can be switched on: the Remembering gate is open (GDD §5.9.10, D539). Never closes again in play. */
export const vigilAvailable = (state: GameState): boolean => endingChoosable(state);

/** The level a stand started now would be fought at: 0 unless the switch is On and the gate open (D544 (2)). */
export const vigilLevelFor = (state: GameState): number =>
  state.vigil.on && vigilAvailable(state) ? state.vigil.stands + 1 : 0;

/** What the Last Stand screen shows for the switch (GDD §9.23): whether the row is shown, its state, and the numbers for its status line. */
export interface VigilView {
  available: boolean;
  on: boolean;
  /** The level this stand would be fought at (0 when Off). */
  level: number;
  /** The level the next On stand would have, or 0 when no stand has been fought On yet (no status line). */
  next: number;
  /** How many stands have been fought with the switch On (the simulated Vigilant counts its levels with it). */
  stands: number;
}

export const vigilView = (state: GameState): VigilView => {
  const available = vigilAvailable(state);
  return {
    available,
    on: available && state.vigil.on,
    level: vigilLevelFor(state),
    next: state.vigil.stands > 0 ? state.vigil.stands + 1 : 0,
    stands: state.vigil.stands,
  };
};

/**
 * A copy of the state as it would be when a stand is made at vigil `level` (0 = switch Off), for the
 * simulator probe (GDD §6.2 v1.3, D546): the level a stand gets is `stands + 1` with the switch On.
 */
export const stateAtVigilLevel = (state: GameState, level: number): GameState => {
  const copy = structuredClone(state);
  copy.vigil.on = level > 0;
  copy.vigil.stands = Math.max(level - 1, 0);
  return copy;
};
