import { consumables } from '../../content/consumables';
import { roundHalfUp } from './build';
import { emit, type Fight } from './fight-state';
import { finalDamage, heal, hurt } from './formula';
import { speedEff } from './stats';
import type { Combatant, HunterPotion, HunterSnapshot } from './types';
import type { Preparation } from '../state/game-state';
import { traits } from '../../content/traits';

// GDD §5.7: preparation in the fight. Oils coat a weapon for the whole fight; each
// hunter's potion fires on its own condition; up to two bombs are thrown at tick 1
// (a Saltburst waits for the monster's first ability). The readings where the GDD is
// silent are in decisions D92.

/** The oil family and the potion one hunter carries, from the party's preparation. */
export const hunterKit = (
  h: HunterSnapshot,
  prep: Preparation | undefined,
): { oilFamily: Combatant['oilFamily']; potion: HunterPotion | null } => {
  const oil = prep?.oils[h.id];
  const oilEffect = oil ? consumables[oil].effect : null;
  const potionId = prep?.potions[h.id];
  const def = potionId ? consumables[potionId] : null;
  let power = 0;
  for (const t of h.traits) {
    const e = traits[t].effect;
    if (e.kind === 'potionPower') power += e.amount;
  }
  const e = def?.effect;
  const potion: HunterPotion | null =
    def && e && (e.kind === 'heal' || e.kind === 'armorUntilAction' || e.kind === 'speedWholeFight')
      ? { id: def.id, name: def.name, effect: e, power, used: false }
      : null;
  return { oilFamily: oilEffect?.kind === 'oil' ? oilEffect.family : null, potion };
};

const percent = (x: number): string => `${Math.round(x * 1000) / 10}%`;

/** Potions that work from the first tick fire now; then the bombs are thrown, in order. */
export const startOfFight = (f: Fight): void => {
  f.tick = 1;
  for (const h of f.hunters) {
    const p = h.potion;
    if (!p) continue;
    if (p.effect.kind === 'speedWholeFight') {
      const bonus = p.effect.speedBonus * (1 + p.power);
      h.statPct.speed += bonus;
      h.speed = speedEff(h);
      p.used = true;
      emit(f, {
        actor: h.id,
        kind: 'prep',
        text: () => `${h.name} drinks ${p.name} (+${percent(bonus)} Speed for the fight)`,
        rolls: [],
      });
    } else if (p.effect.kind === 'armorUntilAction') {
      const bonus = p.effect.armorBonus * (1 + p.power);
      h.statusPct.armor += bonus;
      h.tonicLeft = p.effect.untilAction;
      p.used = true;
      emit(f, {
        actor: h.id,
        kind: 'prep',
        text: () =>
          `${h.name} drinks ${p.name} (+${percent(bonus)} Armor for ${p.effect.kind === 'armorUntilAction' ? p.effect.untilAction : 0} actions)`,
        rolls: [],
      });
    }
  }
  const m = f.monster;
  for (const id of f.bombs) {
    const e = consumables[id].effect;
    if (e.kind === 'burn' || e.kind === 'chill') {
      const resist = m.resist ? m.resist[e.damageType] : 1;
      const dealt = e.initial * resist;
      const amount = finalDamage(dealt, m, resist, false, 0, 1);
      hurt(m, amount);
      const slow = e.kind === 'chill';
      if (e.kind === 'burn') {
        // A status with the same name refreshes rather than stacks (GDD §5.0).
        m.burnLeft = e.actions;
        m.burnAmount = e.perAction;
      } else {
        m.chillLeft = e.actions;
        m.statusPct.speed = -e.speedCut;
        m.speed = speedEff(m);
        for (const a of m.abilities)
          if (a.kind === 'noonHeat') m.noonHeatSuppressed = a.frostSuppressActions;
      }
      emit(f, {
        actor: 'party',
        kind: 'bomb',
        text: () =>
          `The party throws a ${consumables[id].name} — ${e.damageType[0]?.toUpperCase()}${e.damageType.slice(1)} ${e.initial}` +
          `${resist === 1 ? '' : resist === 0 ? ' immune' : ` ×${resist} resist`} = ${amount}` +
          `${slow ? `, and the ${m.name} slows (−${percent(e.speedCut)} Speed for ${e.actions} actions)` : `, and the ${m.name} burns (${e.perAction} Fire on each of its next ${e.actions} actions)`}` +
          ` · ${m.name} ${m.health}/${m.maxHealth}`,
        rolls: [],
        amount,
        targetHealth: m.health,
      });
    } else if (e.kind === 'saltburst') {
      f.saltburstArmed = true;
      emit(f, {
        actor: 'party',
        kind: 'bomb',
        text: () => `The party sets a Saltburst at the ${m.name}'s feet`,
        rolls: [],
      });
    }
  }
};

/** A burning monster takes its Fire damage at the start of each of its next actions. */
export const burnTick = (f: Fight, m: Combatant): void => {
  if (m.burnLeft <= 0) return;
  m.burnLeft -= 1;
  const resist = m.resist ? m.resist.fire : 1;
  const dealt = m.burnAmount * resist;
  const amount = finalDamage(dealt, m, resist, false, 0, 1);
  hurt(m, amount);
  emit(f, {
    actor: m.id,
    kind: 'burn',
    text: () =>
      `The ${m.name} burns — Fire ${m.burnAmount}${resist === 1 ? '' : resist === 0 ? ' immune' : ` ×${resist} resist`} = ${amount} · ${m.name} ${m.health}/${m.maxHealth}`,
    rolls: [],
    amount,
    targetHealth: m.health,
  });
};

/** Mending Draught: once, below its threshold, the holder drinks it (checked after any damage). */
export const checkPotion = (f: Fight, h: Combatant): void => {
  const p = h.potion;
  if (!p || p.used || p.effect.kind !== 'heal' || h.health <= 0) return;
  if (h.health >= h.maxHealth * p.effect.belowHealth) return;
  p.used = true;
  const healed = heal(h, roundHalfUp(h.maxHealth * p.effect.healFraction * (1 + p.power)));
  emit(f, {
    actor: h.id,
    kind: 'prep',
    target: h.id,
    text: () => `${h.name} drinks ${p.name}, +${healed} · ${h.name} ${h.health}/${h.maxHealth}`,
    rolls: [],
    amount: healed,
    targetHealth: h.health,
  });
};

/** Kikimora's Spoil: its first hit on each hunter ruins that hunter's unused potion. */
export const spoilHit = (target: Combatant, monster: Combatant): string | null => {
  const p = target.potion;
  if (!p || p.used) return null;
  p.used = true;
  return `${monster.name}'s Spoil ruins ${target.name}'s ${p.name}`;
};

/**
 * True if one of the monster's abilities does nothing right now (GDD §5.7): either a
 * Saltburst's blocking window is open, or an armed Saltburst goes off on this, the first
 * trigger, and cancels it. `what` names the ability for the log.
 */
export const cancelsAbility = (f: Fight, m: Combatant, what: string): boolean => {
  if (m.abilitiesBlocked > 0) return true;
  if (!f.saltburstArmed) return false;
  const e = f.bombs.map((b) => consumables[b].effect).find((x) => x.kind === 'saltburst');
  const block = e?.kind === 'saltburst' ? e.blockActions : 3;
  f.saltburstArmed = false;
  f.saltburstCancelled = true;
  // The action it goes off in does not count as one of the blocked actions.
  m.abilitiesBlocked = block + (f.monsterActing ? 1 : 0);
  emit(f, {
    actor: 'party',
    kind: 'bomb',
    text: () =>
      `The Saltburst goes off: the ${m.name}'s ${what} is cancelled, and it cannot use its abilities for ${block} actions`,
    rolls: [],
  });
  return true;
};
