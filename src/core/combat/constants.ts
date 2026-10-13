import { num } from '../balance-access';

// The balance table is fixed at build time, so combat reads the constants it uses
// in its hot loop once, here, instead of looking each one up on every attack.
export const K = {
  hitChance: num('combat.hitChance'),
  minDamage: num('combat.minDamage'),
  takenCap: num('combat.takenCap'),
  meterThreshold: num('combat.meterThreshold'),
  maxTicks: num('combat.maxTicks'),
  vanguardWeight: num('target.vanguardWeight'),
  otherWeight: num('target.otherWeight'),
  healBelow: num('mender.healBelow'),
  healMult: num('mender.healMult'),
  menderAttack: num('mender.attackMult'),
  oilBonus: num('oil.familyBonus'),
} as const;
