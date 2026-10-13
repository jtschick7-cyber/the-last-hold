import type { DamageType, FamilyId, LocationId } from '../../content/damage';
import { monsters, type MonsterId } from '../../content/monsters';
import { num } from '../balance-access';
import type { Combatant } from './types';

// GDD §5.0 combat modifiers: stat_eff = (base × levelScale + Σ flat) × (1 + Σ stat%)
// × (1 + Σ status%). Only +, −, ×, ÷ here (technical design §7.4).

export const standing = (c: Combatant): boolean => c.health > 0;
/** Can act, be healed and be targeted: standing and not carried off (Riverhorse). */
export const present = (c: Combatant): boolean => c.health > 0 && c.awayLeft === 0;

/** Draugr's Swell: Armor +50% (stat%) below half Health. */
const swellBonus = (c: Combatant): number => {
  for (const a of c.abilities) {
    if (a.kind === 'swell' && c.health < c.maxHealth * a.belowHealth) return a.armorBonus;
  }
  return 0;
};

export const mightEff = (c: Combatant): number =>
  (c.base.might + c.flat.might) * (1 + c.statPct.might) * (1 + c.statusPct.might);

export const armorEff = (c: Combatant): number =>
  (c.base.armor + c.flat.armor) * (1 + c.statPct.armor + swellBonus(c)) * (1 + c.statusPct.armor);

export const speedEff = (c: Combatant): number =>
  (c.base.speed + c.flat.speed) * (1 + c.statPct.speed) * (1 + c.statusPct.speed);

export const healthPct = (c: Combatant): number => c.health / c.maxHealth;

export interface FightContext {
  readonly location: LocationId;
  readonly family: FamilyId;
  readonly monsterId: MonsterId;
  /** The monster's attacks per action. */
  readonly attacks: number;
}

/** outgoing% bucket: traits vs a location or family, Fire-touched (GDD §5.0). */
export const outgoingPct = (a: Combatant, type: DamageType, ctx: FightContext): number => {
  let sum = 0;
  for (const e of a.traits) {
    if (e.kind === 'mightOnLocation' && e.location === ctx.location) sum += e.amount;
    else if (e.kind === 'mightVsFamily' && e.family === ctx.family) sum += e.amount;
    else if (e.kind === 'damageType' && e.type === type) sum += e.dealt;
  }
  return sum;
};

/** The hit chance for a hunter's attack: base plus party bonuses (Lantern-bearer). */
export const hitChance = (
  attacker: Combatant,
  party: readonly Combatant[],
  ctx: FightContext,
): number => {
  let chance = num('combat.hitChance');
  if (attacker.side === 'hunter') {
    for (const h of party) {
      for (const e of h.traits) {
        if (e.kind === 'partyHitOnLocation' && e.location === ctx.location) chance += e.amount;
      }
    }
  }
  return chance;
};

/**
 * taken% bucket for a defender: reductions add together, capped at 75%, applied
 * after Armor (GDD §5.0, B2). Only hunters have any (Shieldwall, Fire-touched,
 * Emberwright Plate).
 */
export const takenReduction = (
  defender: Combatant,
  type: DamageType,
  party: readonly Combatant[],
): number => {
  if (defender.side !== 'hunter') return 0;
  let sum = 0;
  for (const ally of party) {
    if (ally === defender || !present(ally)) continue;
    for (const e of ally.traits) {
      if (e.kind === 'alliesTakenWhileStanding') sum += -e.amount;
    }
  }
  if (type === 'fire') {
    for (const e of defender.traits) {
      if (e.kind === 'damageType' && e.type === 'fire') sum += -e.taken;
    }
    sum += defender.fireTakenReduction;
  }
  const cap = num('combat.takenCap');
  return sum > cap ? cap : sum;
};

export const monsterFamily = (id: MonsterId): FamilyId => monsters[id].family;
