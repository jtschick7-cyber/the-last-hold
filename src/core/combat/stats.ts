import type { DamageType, FamilyId, LocationId } from '../../content/damage';
import { monsters, type MonsterId } from '../../content/monsters';
import { num } from '../balance-access';
import { K } from './constants';
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
  /** Null in the Last Stand (no location traits). */
  readonly location: LocationId | null;
  readonly family: FamilyId;
  readonly monsterId: MonsterId;
  /** The monster's attacks per action. */
  readonly attacks: number;
  /** Gloam-moths' Lightless: hunters' hit chance is this much lower while it stands (v0.5). */
  readonly hitCut: number;
}

/** GDD §8.3 Lightless (a passive): the cut to every hunter's hit chance. */
export const lightlessCut = (id: MonsterId): number => {
  for (const a of monsters[id].abilities) if (a.kind === 'lightless') return a.hitChanceCut;
  return 0;
};

/**
 * knowledge% bucket (GDD §5.0): the damage bonus against a species the hunters know,
 * +5% Studied (level 3) and +10% Mastered (level 4).
 */
export const knowledgeBonus = (level: number): number =>
  level >= 4 ? num('knowledge.masteredDamage') : level >= 3 ? num('knowledge.studiedDamage') : 0;

/** outgoing% bucket: traits vs a location or family, Fire-touched (GDD §5.0). */
export const outgoingPct = (a: Combatant, type: DamageType, ctx: FightContext): number => {
  let sum = 0;
  for (const e of a.traits) {
    if (e.kind === 'mightOnLocation' && e.location === ctx.location) sum += e.amount;
    else if (e.kind === 'mightVsFamily' && e.family === ctx.family) sum += e.amount;
    else if (e.kind === 'damageType' && e.type === type) sum += e.dealt;
  }
  // Oils (GDD §5.7): the weapon is coated for the whole fight; a mismatched oil does nothing.
  if (a.oilFamily !== null && a.oilFamily === ctx.family) sum += K.oilBonus;
  return sum;
};

/** The hit chance for a hunter's attack: base plus party bonuses (Lantern-bearer). */
export const hitChance = (
  attacker: Combatant,
  party: readonly Combatant[],
  ctx: FightContext,
): number => {
  let chance = K.hitChance;
  if (attacker.side === 'hunter') {
    chance -= ctx.hitCut;
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
  let sum = defender.extraTaken;
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
  const cap = K.takenCap;
  return sum > cap ? cap : sum;
};

export const monsterFamily = (id: MonsterId): FamilyId => monsters[id].family;

/**
 * GDD §8.3 Unthawed (Rimewrought): the first Fire hit it takes strips a share of its
 * Armor for the rest of the fight (stat%). A weakness, so a Saltburst never cancels it
 * (D176). Returns the log note, or null if nothing happened.
 */
export const unthaw = (c: Combatant): string | null => {
  if (c.unthawed) return null;
  for (const a of c.abilities) {
    if (a.kind !== 'unthawed') continue;
    c.unthawed = true;
    c.statPct.armor -= a.armorStrip;
    return `the ${c.name}'s rime cracks (Unthawed: Armor −${Math.round(a.armorStrip * 100)}% for the fight)`;
  }
  return null;
};
