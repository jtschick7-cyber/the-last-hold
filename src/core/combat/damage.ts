import { num } from '../balance-access';
import { finalDamage, hurt } from './formula';
import { emit, fmt2, type Fight } from './fight-state';
import { afterOwnHit } from './abilities';
import { armorEff, hitChance, mightEff, outgoingPct, standing, takenReduction } from './stats';
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
}

/** One direct attack by `attacker` on `target`. Returns whether it hit. */
export const directAttack = (
  f: Fight,
  attacker: Combatant,
  target: Combatant,
  opts: AttackOptions = {},
): boolean => {
  const used: number[] = [...(opts.pre ?? [])];
  const draw = (): number => {
    const r = f.rolls.next();
    used.push(r);
    return r;
  };
  const who = `${attacker.name}${roleTag(attacker)}`;
  const party = f.hunters;
  const chance = hitChance(attacker, party, f.ctx);
  if (!(draw() < chance)) {
    emit(f, {
      actor: attacker.id,
      kind: 'miss',
      target: target.id,
      text: `${who} misses ${the(target)}`,
      rolls: used,
      amount: 0,
      targetHealth: target.health,
    });
    return false;
  }
  const variance = attacker.varianceLo + (attacker.varianceHi - attacker.varianceLo) * draw();
  const crit = draw() < attacker.critChance;
  const mult = opts.mightMult ?? 1;
  const raw = mightEff(attacker) * mult * variance;
  const resistance = target.resist ? target.resist[attacker.damage] : 1;
  const typed = raw * resistance;
  const outgoing = outgoingPct(attacker, attacker.damage, f.ctx);
  const dealt = typed * (1 + outgoing) * (crit ? attacker.critMult : 1);
  const taken = takenReduction(target, attacker.damage, party);
  const hitMult = target.nextHitTakenMult;
  target.nextHitTakenMult = 1;
  const amount = finalDamage(dealt, target, resistance, true, taken, hitMult);
  hurt(target, amount);
  const notes = afterOwnHit(f, attacker, target, amount, draw);
  const bits = [`${cap(attacker.damage)} ${fmt2(dealt)}`];
  if (resistance !== 1) bits.push(resistance === 0 ? 'immune' : `(×${resistance} resist)`);
  bits.push(`−${fmt2(armorEff(target))} armor`);
  const floored = resistance > 0 && amount === 1 && dealt - armorEff(target) < 1;
  emit(f, {
    actor: attacker.id,
    kind: crit ? 'crit' : 'hit',
    target: target.id,
    text:
      `${who} ${crit ? 'crits' : 'hits'} ${the(target)} — ${bits.join(' ')} = ${amount}` +
      `${floored ? ' (floor)' : ''} · ${target.name} ${target.health}/${target.maxHealth}` +
      notes.map((n) => ` · ${n}`).join(''),
    rolls: used,
    dealt,
    amount,
    targetHealth: target.health,
  });
  if (attacker.silverSubHit && standing(target)) silverSubHit(f, attacker, target, variance, crit);
  return true;
};

/** GDD §5.3.6 (B3): a separate Silver sub-hit, no Armor, logged as its own line. */
const silverSubHit = (
  f: Fight,
  attacker: Combatant,
  target: Combatant,
  variance: number,
  crit: boolean,
): void => {
  const resistance = target.resist ? target.resist.silver : 1;
  const dealt =
    num('gear.silveredFraction') *
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
    text:
      `${attacker.name}'s silver also hits ${the(target)} — Silver ${fmt2(dealt)} ` +
      `${resistance === 0 ? 'immune' : ''}= ${amount} · ${target.name} ${target.health}/${target.maxHealth}`,
    rolls: [],
    dealt,
    amount,
    targetHealth: target.health,
  });
};
