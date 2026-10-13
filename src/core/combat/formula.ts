import { K } from './constants';
import { roundHalfUp } from './build';
import { armorEff } from './stats';
import type { Combatant } from './types';

// GDD §5.0: the last steps of the damage formula, shared by attacks and abilities.

/** Applies final damage and clamps Health at 0. Death checks happen after the whole action. */
export const hurt = (target: Combatant, amount: number): void => {
  target.health = target.health > amount ? target.health - amount : 0;
};

/**
 * Armor, then taken%, then rounding (GDD §5.0). Immunity (resist 0) is 0 damage;
 * the 1-damage floor applies only when resist is above 0 (B5).
 */
export const finalDamage = (
  dealt: number,
  target: Combatant,
  resistance: number,
  armorApplies: boolean,
  taken: number,
  hitMult: number,
): number => {
  if (resistance === 0) return 0;
  const afterArmor = armorApplies ? Math.max(0, dealt - armorEff(target)) : dealt;
  const rounded = roundHalfUp(afterArmor * (1 - taken) * hitMult);
  const floor = K.minDamage;
  return rounded < floor ? floor : rounded;
};
