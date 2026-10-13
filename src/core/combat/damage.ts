import { num } from '../balance-access';
import { finalDamage, hurt } from './formula';
import { emit, fmt2, type Fight } from './fight-state';
import { afterOwnHit } from './abilities';
import { checkPotion } from './prep';
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
  target: Combatant,
  opts: AttackOptions = {},
): boolean => {
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
  const who = (): string => `${attacker.name}${roleTag(attacker)}`;
  const party = f.hunters;
  const chance = hitChance(attacker, party, f.ctx);
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
  const crit =
    draw((r) =>
      r < critChance
        ? `Crit ${fmt3(r)} < ${pct(critChance)} → crit`
        : `Crit ${fmt3(r)} ≥ ${pct(critChance)} → no crit`,
    ) < critChance;
  const mult = opts.mightMult ?? 1;
  const raw = mightEff(attacker) * mult * variance;
  const resistance = target.resist ? target.resist[attacker.damage] : 1;
  const typed = raw * resistance;
  const outgoing = outgoingPct(attacker, attacker.damage, f.ctx);
  // knowledge% (GDD §5.0): only the hunters' damage, and 0 unless the species is Studied or better.
  const knowledge = attacker.side === 'hunter' ? f.knowledgePct : 0;
  const dealt = typed * (1 + outgoing) * (1 + knowledge) * (crit ? attacker.critMult : 1);
  const taken = takenReduction(target, attacker.damage, party);
  const hitMult = target.nextHitTakenMult;
  target.nextHitTakenMult = 1;
  // The Armor this hit actually met, read before the hit lands (Swell can change it after; Q7).
  const armor = armorEff(target);
  const amount = finalDamage(dealt, target, resistance, true, taken, hitMult);
  hurt(target, amount);
  const notes = afterOwnHit(f, attacker, target, amount, draw);
  const floored = resistance > 0 && amount === 1 && dealt - armor < 1;
  const bits = (): string => {
    const out = [`${cap(attacker.damage)} ${fmt2(dealt)}`];
    if (resistance !== 1) out.push(resistance === 0 ? 'immune' : `(×${resistance} resist)`);
    if (knowledge > 0)
      out.push(`(+${pct(knowledge)} ${f.knowledge >= 4 ? 'Mastered' : 'Studied'})`);
    out.push(`−${fmt2(armor)} armor`);
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
  if (attacker.silverSubHit && standing(target)) silverSubHit(f, attacker, target, variance, crit);
  if (target.side === 'hunter') checkPotion(f, target);
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
    text: () =>
      `${attacker.name}'s silver also hits ${the(target)} — Silver ${fmt2(dealt)} ` +
      `${resistance === 0 ? 'immune' : ''}= ${amount} · ${target.name} ${target.health}/${target.maxHealth}`,
    rolls: [],
    dealt,
    amount,
    targetHealth: target.health,
  });
};
