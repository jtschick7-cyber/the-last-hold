import { useSkills, type UseSkillDef } from '../../content/use-skills';
import { finalDamage, hurt } from './formula';
import { emit, knockBack, type Fight } from './fight-state';
import { mightEff, present, speedEff, standing } from './stats';
import type { Combatant } from './types';

// GDD §5.11.4, §8.5b (v0.8, D312, D314): a Wright's use-skill fires on its own, on a fixed trigger.
// No new dice: an effect that replaces a roll still draws it (the crit of The Other Hand), and an
// effect with no roll draws none. Each firing writes its own log line. Everything here is neutral
// for a combatant with no skill, so Apprentices, monsters and every old fight are untouched.

export const skillOf = (c: Combatant): UseSkillDef | null => (c.skill ? useSkills[c.skill] : null);

const FIRST = 1;

/**
 * Whether a skill with an "every Nth action" or "first action" trigger fires on the action being
 * taken (`c.actions` already counts it, lost actions included). Extra actions never count.
 */
export const firesThisAction = (c: Combatant): UseSkillDef | null => {
  const def = skillOf(c);
  if (!def) return null;
  const t = def.trigger;
  if (t.kind === 'everyNth') return c.actions % t.n === 0 ? def : null;
  if (t.kind === 'firstAction') return c.actions === FIRST && !c.skillUsed ? def : null;
  return null;
};

const label = (c: Combatant, def: UseSkillDef): string => `${c.name} (${def.name})`;

/** Banked Smoke and Rattle the Pots: the skills that replace the attack. Returns true if the action was spent. */
export const replaceAction = (f: Fight, c: Combatant, def: UseSkillDef): boolean => {
  const e = def.effect;
  if (e.kind === 'partyTakenUntilNextAction') {
    for (const h of f.hunters) h.useTaken = -e.amount;
    f.smokeHolder = c;
    emit(f, {
      actor: c.id,
      kind: 'skill',
      text: () =>
        `${label(c, def)} banks the smoke: every hunter takes ${Math.round(e.amount * 100)}% damage until ${c.name}'s next action`,
      rolls: [],
    });
    return true;
  }
  if (e.kind === 'knockBackAll') {
    c.skillUsed = true;
    for (const m of f.monsters) if (standing(m)) knockBack(m, e.amount);
    emit(f, {
      actor: c.id,
      kind: 'skill',
      text: () => `${label(c, def)} rattles the pots: every monster's turn comes ${e.amount} later`,
      rolls: [],
    });
    return true;
  }
  return false;
};

/** Banked Smoke ends at its holder's next action, or when the holder goes down. */
export const clearSmoke = (f: Fight): void => {
  for (const h of f.hunters) h.useTaken = 0;
  f.smokeHolder = null;
};

/** Rime-Dipped: the target is slowed for its next actions; a fresh hit refreshes it (GDD §5.0). */
export const rimeSlow = (target: Combatant, cut: number, actions: number): void => {
  if (target.rimeLeft === 0) target.statusPct.speed -= cut;
  target.rimeLeft = actions;
  target.rimeCut = cut;
  target.speed = speedEff(target);
};

/** The monster's own action ends: Rime-Dipped counts down and gives the Speed back. */
export const endRime = (c: Combatant): void => {
  if (c.rimeLeft === 0) return;
  c.rimeLeft -= 1;
  if (c.rimeLeft === 0) {
    c.statusPct.speed += c.rimeCut;
    c.rimeCut = 0;
    c.speed = speedEff(c);
  }
};

/** Stopping Root: Vesna's first attack leaves a root in the target (hit or miss, GDD §8.5b). */
export const plantRoot = (f: Fight, c: Combatant, def: UseSkillDef, target: Combatant): void => {
  const e = def.effect;
  if (e.kind !== 'venomOverTime' || c.skillUsed || !standing(target)) return;
  c.skillUsed = true;
  target.rootLeft = e.actions;
  target.rootAmount = mightEff(c) * e.mightShare;
  emit(f, {
    actor: c.id,
    kind: 'skill',
    target: target.id,
    text: () =>
      `${label(c, def)} presses a root against the ${target.name}: Venom ${Math.round(target.rootAmount)} at the start of each of its next ${e.actions} actions`,
    rolls: [],
  });
};

/** A rooted monster takes its Venom at the start of its action: no Armor, its Venom resistance. */
export const rootTick = (f: Fight, m: Combatant): void => {
  if (m.rootLeft <= 0) return;
  m.rootLeft -= 1;
  const resist = m.resist ? m.resist.venom : 1;
  const dealt = m.rootAmount * resist;
  const amount = finalDamage(dealt, m, resist, false, 0, 1);
  hurt(m, amount);
  emit(f, {
    actor: m.id,
    kind: 'skill',
    text: () =>
      `The root burns the ${m.name} — Venom ${Math.round(m.rootAmount)}${resist === 1 ? '' : resist === 0 ? ' immune' : ` ×${resist} resist`} = ${amount} · ${m.name} ${m.health}/${m.maxHealth}`,
    rolls: [],
    amount,
    targetHealth: m.health,
  });
};

/** Shepherd's Crook: the healed hunter is freed of slowed (Hamstring), held, charmed and Chill. */
export const clearAbilityEffects = (c: Combatant): string[] => {
  const cleared: string[] = [];
  if (c.hamstringLeft > 0) {
    c.hamstringLeft = 0;
    c.statusPct.speed = 0;
    c.speed = speedEff(c);
    cleared.push('slowed');
  }
  if (c.lostActions > 0) {
    c.lostActions = 0;
    cleared.push('held');
  }
  if (c.healCutLeft > 0) {
    c.healCutLeft = 0;
    c.healCut = 0;
    cleared.push('chilled');
  }
  return cleared;
};

/** Hold the Stair: a standing Arvid who has not yet used it, and is not the one hit. */
export const stairHolder = (f: Fight, hit: Combatant): Combatant | null => {
  if (hit.side !== 'hunter') return null;
  for (const h of f.hunters) {
    if (h === hit || h.skill !== 'hold-the-stair' || h.skillUsed || !present(h)) continue;
    return h;
  }
  return null;
};
