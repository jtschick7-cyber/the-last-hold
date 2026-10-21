import type { DamageType, FamilyId, LocationId } from '../../content/damage';
import { monsters, type MonsterId } from '../../content/monsters';
import { num } from '../balance-access';
import { K } from './constants';
import type { Combatant, FightAbility } from './types';

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
  (c.base.might + c.flat.might) *
  (1 + c.statPct.might + lowHealthMight(c)) *
  (1 + c.statusPct.might);

/** Blood in the Snow (Delve): +Might (stat%) while below a share of Health. */
const lowHealthMight = (c: Combatant): number =>
  c.lowHealth !== null && c.health < c.maxHealth * c.lowHealth.below ? c.lowHealth.amount : 0;

export const armorEff = (c: Combatant): number =>
  (c.base.armor + c.flat.armor) * (1 + c.statPct.armor + swellBonus(c)) * (1 + c.statusPct.armor);

export const speedEff = (c: Combatant): number =>
  (c.base.speed + c.flat.speed) * (1 + c.statPct.speed) * (1 + c.statusPct.speed);

export const healthPct = (c: Combatant): number => c.health / c.maxHealth;

export interface FightContext {
  /** Null in the Last Stand (no location traits). */
  readonly location: LocationId | null;
  readonly family: FamilyId | 'deep';
  readonly monsterId: string;
  /** The monster's attacks per action. */
  readonly attacks: number;
  /** Gloam-moths' Lightless: hunters' hit chance is this much lower while it stands (v0.5). */
  readonly hitCut: number;
  /** Ill Luck (Likho): every hunter's crit chance is this much lower; absent elsewhere (v0.9, GDD §8.14). */
  readonly critCut?: number;
  /** The oil bonus this fight: `oil.familyBonus`, made stronger by Alchemy (GDD §5.8.6). */
  readonly oilBonus: number;
}

/** GDD §8.3 Lightless (a passive): the cut to every hunter's hit chance. */
export const lightlessCut = (def: { readonly abilities: readonly FightAbility[] }): number => {
  for (const a of def.abilities) if (a.kind === 'lightless') return a.hitChanceCut;
  return 0;
};

/** GDD §8.14 Ill Luck (a passive): the cut to every hunter's crit chance, in the fight's own units (0.10 = 10 points). */
export const illLuck = (def: { readonly abilities: readonly FightAbility[] }): number => {
  for (const a of def.abilities) if (a.kind === 'illLuck') return a.critCut / 100;
  return 0;
};

/**
 * knowledge% bucket (GDD §5.0): the damage bonus against a species the hunters know,
 * +5% Studied (level 3) and +10% Mastered (level 4).
 */
export const knowledgeBonus = (level: number): number =>
  level >= 4 ? num('knowledge.masteredDamage') : level >= 3 ? num('knowledge.studiedDamage') : 0;

/** outgoing% bucket: traits vs a location or family, Fire-touched (GDD §5.0). */
export const outgoingPct = (
  a: Combatant,
  type: DamageType,
  ctx: FightContext,
  family: FamilyId | 'deep' = ctx.family,
): number => {
  let sum = 0;
  for (const e of a.traits) {
    if (e.kind === 'mightOnLocation' && e.location === ctx.location) sum += e.amount;
    else if (e.kind === 'mightVsFamily' && e.family === family) sum += e.amount;
    else if (e.kind === 'damageType' && e.type === type) sum += e.dealt;
  }
  sum += a.dealtBonus; // Delve blessings (v0.7); 0 elsewhere
  sum += a.useDealt; // Torch Held High (v0.9); 0 elsewhere
  if (family !== 'deep') sum += a.baneVs[family] ?? 0; // bane lines on worn items (v0.8)
  // Oils (GDD §5.7): the weapon is coated for the whole fight; a mismatched oil does nothing.
  if (a.oilFamily !== null && a.oilFamily === family) sum += ctx.oilBonus;
  return sum;
};

/** The hit chance for a hunter's attack: base plus party bonuses (Lantern-bearer). */
export const hitChance = (
  attacker: Combatant,
  party: readonly Combatant[],
  ctx: FightContext,
  cut: number = ctx.hitCut,
): number => {
  let chance = K.hitChance;
  if (attacker.side === 'hunter') {
    chance -= cut;
    chance += attacker.hitBonus; // Owl-Eye Drops (v0.6)
    for (const h of party) {
      for (const e of h.traits) {
        if (e.kind === 'partyHitOnLocation' && e.location === ctx.location) chance += e.amount;
        // Tall Torch (v0.9): while its Vanguard is standing, the party's hit chance is higher.
        else if (e.kind === 'partyHitWhileStanding' && present(h)) chance += e.amount;
      }
    }
  } else chance += attacker.hitBonus; // Low Tide (Delve): monsters' hit chance; 0 elsewhere
  return chance;
};

/**
 * taken% bucket for a defender: reductions add together, capped at 75%, applied
 * after Armor (GDD §5.0, B2). Only hunters have any (Shieldwall, Fire-touched,
 * Emberwright Plate).
 */
/** The present party member with the lowest % Health; ties by party slot. */
const lowestHealth = (party: readonly Combatant[]): Combatant | null => {
  let best: Combatant | null = null;
  for (const c of party) {
    if (!present(c)) continue;
    if (!best || healthPct(c) < healthPct(best)) best = c;
  }
  return best;
};

export const takenReduction = (
  defender: Combatant,
  type: DamageType,
  party: readonly Combatant[],
): number => {
  if (defender.side !== 'hunter') return 0;
  let sum =
    defender.extraTaken +
    (defender.takenByType[type] ?? 0) +
    defender.useTaken +
    defender.talentTaken;
  if (defender.vanguardShield > 0) {
    // Warp and Weft (Delve): the others take less while a Vanguard stands.
    for (const ally of party)
      if (ally !== defender && present(ally) && ally.role === 'vanguard') {
        sum += defender.vanguardShield;
        break;
      }
  }
  for (const ally of party) {
    if (!present(ally)) continue;
    for (const e of ally.traits) {
      if (e.kind === 'alliesTakenWhileStanding' && ally !== defender) sum += -e.amount;
      // Shield-companion (v0.5): the lowest % Health member, the holder included (D177).
      else if (e.kind === 'lowestHealthTakenWhileStanding' && lowestHealth(party) === defender)
        sum += e.amount;
    }
  }
  if (type === 'fire') {
    for (const e of defender.traits) {
      if (e.kind === 'damageType' && e.type === 'fire') sum += -e.taken;
    }
    sum += defender.fireTakenReduction;
    sum += defender.fireTakenPotion; // Coldwater Draught (v0.6)
  }
  const cap = K.takenCap;
  return sum > cap ? cap : sum;
};

/**
 * Lightless across a group (D251): while any swarm stands the cut applies once. Two passives of
 * the same name don't stack (§5.0), so it is the largest cut among the monsters standing.
 */
export const groupLightlessCut = (monsters: readonly Combatant[]): number => {
  let cut = 0;
  for (const m of monsters) {
    if (!standing(m)) continue;
    for (const a of m.abilities)
      if (a.kind === 'lightless' && a.hitChanceCut > cut) cut = a.hitChanceCut;
  }
  return cut;
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

/** GDD §5.8.6: every number in a brew's effect is this much stronger at an Alchemy level (1 at level 0). */
export const alchemyPotency = (level: number): number => 1 + num('skill.alchemyPotency') * level;
