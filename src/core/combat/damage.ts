import { num } from '../balance-access';
import { abilityTaken, finalDamage, hurt } from './formula';
import { cap as capName, emit, fmt2, type Fight } from './fight-state';
import { afterOwnHit } from './abilities';
import { rimeSlow, skillOf, stairHolder } from './skills';
import { knockBack } from './fight-state';
import { checkPotion } from './prep';
import {
  armorEff,
  groupLightlessCut,
  hitChance,
  knowledgeBonus,
  mightEff,
  outgoingPct,
  standing,
  takenReduction,
  unthaw,
} from './stats';
import type { Combatant } from './types';

// GDD §5.5 "Attack resolution": rolls are drawn in a fixed order (target roll if
// any, then hit, variance, crit, then ability rolls only if the attack hit), and
// damage follows the §5.0 formula. Armor applies to direct attacks only.

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const roleTag = (c: Combatant): string => (c.role ? ` (${cap(c.role)})` : '');
const the = (c: Combatant): string => (c.side === 'monster' ? `the ${c.name}` : c.name);

export interface AttackOptions {
  /** Mender attack at 50% Might, and similar. */
  readonly mightMult?: number;
  /** Rolls already drawn for this attack (the target roll). */
  readonly pre?: readonly number[];
  /** Their labels, same length as `pre`. */
  readonly preNotes?: readonly string[];
}

/** A roll as the log shows it: three decimals. */
export const fmt3 = (x: number): string => x.toFixed(3);
export const pct = (x: number): string => `${Math.round(x * 1000) / 10}%`;

/** One direct attack by `attacker` on `target`. Returns whether it hit. */
export const directAttack = (
  f: Fight,
  attacker: Combatant,
  initialTarget: Combatant,
  opts: AttackOptions = {},
): boolean => {
  let target = initialTarget;
  f.lastCrit = false;
  const used: number[] = f.logging ? [...(opts.pre ?? [])] : [];
  const labels: string[] = f.logging ? [...(opts.preNotes ?? [])] : [];
  // `label` runs only when the fight is logged (odds previews build no text).
  const draw = (label: (r: number) => string): number => {
    const r = f.rolls.next();
    if (f.logging) {
      used.push(r);
      labels.push(label(r));
    }
    return r;
  };
  const who = (): string => `${capName(attacker.name)}${roleTag(attacker)}`;
  const party = f.hunters;
  // A group's Lightless is the largest cut among the swarms standing (D251); a single monster's is constant.
  const chance =
    f.monsters.length === 1
      ? hitChance(attacker, party, f.ctx)
      : hitChance(attacker, party, f.ctx, groupLightlessCut(f.monsters));
  const hitRoll = draw((r) =>
    r < chance ? `Hit ${fmt3(r)} < ${pct(chance)} → hit` : `Hit ${fmt3(r)} ≥ ${pct(chance)} → miss`,
  );
  if (!(hitRoll < chance)) {
    emit(f, {
      actor: attacker.id,
      kind: 'miss',
      target: target.id,
      text: () => `${who()} misses ${the(target)}`,
      rolls: used,
      rollNotes: labels,
      amount: 0,
      targetHealth: target.health,
    });
    return false;
  }
  const spread = draw((r) => {
    const v = attacker.varianceLo + (attacker.varianceHi - attacker.varianceLo) * r;
    return `Damage spread ${fmt3(r)} → ×${fmt2(v)}`;
  });
  const variance = attacker.varianceLo + (attacker.varianceHi - attacker.varianceLo) * spread;
  const critChance = attacker.critChance;
  const rolledCrit =
    draw((r) =>
      r < critChance
        ? `Crit ${fmt3(r)} < ${pct(critChance)} → crit`
        : `Crit ${fmt3(r)} ≥ ${pct(critChance)} → no crit`,
    ) < critChance;
  // The Other Hand (GDD §8.5b): Sigrun's first hit in a fight is a crit. The crit roll is still drawn.
  const otherHand = attacker.skill === 'the-other-hand' && !attacker.skillUsed;
  if (otherHand) attacker.skillUsed = true;
  const crit = rolledCrit || otherHand;
  f.lastCrit = crit;
  const mult = opts.mightMult ?? 1;
  const raw = mightEff(attacker) * mult * variance;
  const resistance = target.resist ? target.resist[attacker.damage] : 1;
  const typed = raw * resistance;
  const outgoing = outgoingPct(attacker, attacker.damage, f.ctx, target.family ?? f.ctx.family);
  // knowledge% (GDD §5.0): only the hunters' damage, and 0 unless the species is Studied or better.
  // Each group member has its own level (the Unremembering switch turns the bonus off, D257).
  const knowledgeLevel = attacker.side === 'hunter' ? target.knowledgeLevel : 0;
  const knowledge = f.rules.knowledgeOff ? 0 : knowledgeBonus(knowledgeLevel);
  const dealt = typed * (1 + outgoing) * (1 + knowledge) * (crit ? attacker.critMult : 1);
  // Shovelful (GDD §8.5b): the armed attack ignores Armor.
  const armed = attacker.skillArmed ? skillOf(attacker) : null;
  const ignoresArmor = armed?.effect.kind === 'ignoreArmor';
  let taken = takenReduction(target, attacker.damage, party);
  let hitMult = target.nextHitTakenMult;
  target.nextHitTakenMult = 1;
  // The Armor this hit actually met, read before the hit lands (Swell can change it after; Q7).
  let armor = ignoresArmor ? 0 : armorEff(target);
  let amount = finalDamage(dealt, target, resistance, !ignoresArmor, taken, hitMult);
  // Hold the Stair (GDD §8.5b): once a fight, Arvid takes the hit that would down another hunter,
  // after his own Armor and taken% (it can down him). No new dice: the same hit, the same rolls.
  const notes: string[] = [];
  const holder =
    attacker.side === 'monster' && amount >= target.health ? stairHolder(f, target) : null;
  if (holder) {
    const spared = target;
    spared.nextHitTakenMult = hitMult; // the hit did not land on them
    holder.skillUsed = true;
    target = holder;
    taken = takenReduction(target, attacker.damage, party);
    hitMult = target.nextHitTakenMult;
    target.nextHitTakenMult = 1;
    armor = armorEff(target);
    amount = finalDamage(dealt, target, resistance, true, taken, hitMult);
    notes.push(`Hold the Stair: ${holder.name} takes the hit meant for ${spared.name}`);
  }
  hurt(target, amount);
  notes.push(...afterOwnHit(f, attacker, target, amount, draw));
  if (otherHand) notes.push(`The Other Hand: ${attacker.name}'s first hit is a crit`);
  if (armed && attacker.side === 'hunter') hitSkill(armed.effect, target, notes);
  if (attacker.side === 'hunter') delveHitRules(f, attacker, target, crit, notes);
  if (attacker.damage === 'fire') {
    const cracked = unthaw(target);
    if (cracked) notes.push(cracked);
  }
  const floored = resistance > 0 && amount === 1 && dealt - armor < 1;
  const bits = (): string => {
    const out = [`${cap(attacker.damage)} ${fmt2(dealt)}`];
    if (resistance !== 1) out.push(resistance === 0 ? 'immune' : `(×${resistance} resist)`);
    if (knowledge > 0)
      out.push(`(+${pct(knowledge)} ${knowledgeLevel >= 4 ? 'Mastered' : 'Studied'})`);
    out.push(ignoresArmor ? 'ignores armor (Shovelful)' : `−${fmt2(armor)} armor`);
    return out.join(' ');
  };
  emit(f, {
    actor: attacker.id,
    kind: crit ? 'crit' : 'hit',
    target: target.id,
    text: () =>
      `${who()} ${crit ? 'crits' : 'hits'} ${the(target)} — ${bits()} = ${amount}` +
      `${floored ? ' (floor)' : ''} · ${target.name} ${target.health}/${target.maxHealth}` +
      notes.map((n) => ` · ${n}`).join(''),
    rolls: used,
    rollNotes: labels,
    dealt,
    amount,
    targetHealth: target.health,
  });
  if (attacker.side === 'hunter') sealBurn(f, attacker, target, amount);
  if (attacker.silverSubHit && standing(target))
    subHit(f, attacker, target, variance, crit, 'silver');
  if (attacker.runeSubHit && standing(target)) subHit(f, attacker, target, variance, crit, 'rune');
  // The Pale Smith's Smith's Mark (Delve): a Rune sub-hit on every direct hit, beside the blade's own.
  if (attacker.runeMark > 0 && standing(target))
    subHit(f, attacker, target, variance, crit, 'rune', attacker.runeMark, "Smith's Mark");
  if (target.side === 'hunter') checkPotion(f, target);
  return true;
};

/** What an armed use-skill adds when its attack hits (Boathook, Rime-Dipped); notes join the hit's log line. */
const hitSkill = (
  effect: NonNullable<ReturnType<typeof skillOf>>['effect'],
  target: Combatant,
  notes: string[],
): void => {
  if (target.side !== 'monster') return;
  if (effect.kind === 'knockBackOnHit') {
    knockBack(target, effect.amount);
    notes.push(`Boathook: ${target.name}'s turn comes ${effect.amount} later`);
  } else if (effect.kind === 'slowOnHit') {
    rimeSlow(target, effect.amount, effect.actions);
    notes.push(
      `Rime-Dipped: ${target.name} is slowed (Speed −${Math.round(effect.amount * 100)}% for ${effect.actions} actions)`,
    );
  } else if (effect.kind === 'ignoreArmor') notes.push('Shovelful: the blow ignores Armor');
};

/**
 * Delve rules that fire when a hunter's direct attack hits (GDD §8.8): the Drowned Bell's Toll
 * knocks a monster's meter back on each hunter's first hit on it, and Struck Bronze makes a
 * crit cost its target its next action. Notes join the hit's log line.
 */
const delveHitRules = (
  f: Fight,
  attacker: Combatant,
  target: Combatant,
  crit: boolean,
  notes: string[],
): void => {
  if (target.side !== 'monster') return;
  const { toll, struckBronze } = f.rules;
  if (toll > 0) {
    const key = `${attacker.id}>${target.id}`;
    if (!f.tolled.has(key)) {
      f.tolled.add(key);
      knockBack(target, toll);
      notes.push(`the bell tolls: ${target.name}'s turn comes ${toll} later`);
    }
  }
  if (struckBronze && crit && standing(target)) {
    target.lostActions += 1;
    notes.push(`struck bronze: ${target.name} loses their next action`);
  }
};

/**
 * GDD §5.3.6 (B3): a separate sub-hit, no Armor, logged as its own line: Silver from
 * the Silvered Blade, and from v0.5 Rune too from the Wright's Blade (D159).
 */
const subHit = (
  f: Fight,
  attacker: Combatant,
  target: Combatant,
  variance: number,
  crit: boolean,
  type: 'silver' | 'rune',
  fraction?: number,
  label?: string,
): void => {
  const resistance = target.resist ? target.resist[type] : 1;
  const dealt =
    (fraction ?? num(type === 'silver' ? 'gear.silveredFraction' : 'gear.runedFraction')) *
    mightEff(attacker) *
    variance *
    (crit ? attacker.critMult : 1) *
    resistance;
  const amount = finalDamage(dealt, target, resistance, false, 0, 1);
  hurt(target, amount);
  emit(f, {
    actor: attacker.id,
    kind: 'sub-hit',
    target: target.id,
    text: () =>
      `${attacker.name}'s ${label ?? type} also hits ${the(target)} — ${cap(type)} ${fmt2(dealt)} ` +
      `${resistance === 0 ? 'immune' : ''}= ${amount} · ${target.name} ${target.health}/${target.maxHealth}`,
    rolls: [],
    dealt,
    amount,
    targetHealth: target.health,
  });
};

/**
 * GDD §8.3 Seal-burn (Ribbonshade, a passive): a hunter whose direct attack hits it
 * takes a share of the damage dealt back as Fire. Armor doesn't apply; taken% does
 * (Fire-touched, Emberwright Plate), as with Noon Heat (B4). Not cancelled by a
 * Saltburst (D176).
 */
const sealBurn = (f: Fight, attacker: Combatant, target: Combatant, dealt: number): void => {
  for (const a of target.abilities) {
    if (a.kind !== 'sealBurn' || dealt <= 0) continue;
    const raw = dealt * a.reflectFraction;
    const amount = abilityTaken(
      attacker,
      finalDamage(
        raw,
        attacker,
        1,
        attacker.forgeWelded,
        takenReduction(attacker, 'fire', f.hunters),
        1,
      ),
    );
    hurt(attacker, amount);
    emit(f, {
      actor: target.id,
      kind: 'ability',
      target: attacker.id,
      text: () =>
        `${capName(target.name)}'s Seal-burn scorches ${attacker.name}: Fire ${fmt2(raw)} = ${amount} · ${attacker.name} ${attacker.health}/${attacker.maxHealth}`,
      rolls: [],
      amount,
      targetHealth: attacker.health,
    });
    checkPotion(f, attacker);
  }
};
