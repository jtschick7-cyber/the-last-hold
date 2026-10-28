import { consumables, type ConsumableId } from '../../content/consumables';
import { roundHalfUp } from './build';
import { emit, type Fight } from './fight-state';
import { finalDamage, heal, hurt } from './formula';
import { speedEff, unthaw } from './stats';
import type { Combatant, HunterPotion, HunterSnapshot } from './types';
import type { Preparation } from '../state/game-state';
import { traits } from '../../content/traits';
import { talentTotals } from './talents';

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
  const tal = talentTotals(h.talents);
  let power = tal.potionPower; // Herbs talents (GDD §8.11)
  for (const t of h.traits) {
    const e = traits[t].effect;
    if (e.kind === 'potionPower') power += e.amount;
  }
  const e = def?.effect;
  const potion: HunterPotion | null =
    def &&
    e &&
    (e.kind === 'heal' ||
      e.kind === 'armorUntilAction' ||
      e.kind === 'speedWholeFight' ||
      e.kind === 'fireTaken' ||
      e.kind === 'hitChance' ||
      e.kind === 'steadfast')
      ? {
          id: def.id,
          name: def.name,
          effect: e,
          power,
          below: e.kind === 'heal' ? (tal.mendingBelow ?? e.belowHealth) : 0,
          used: false,
        }
      : null;
  return { oilFamily: oilEffect?.kind === 'oil' ? oilEffect.family : null, potion };
};

const percent = (x: number): string => `${Math.round(x * 1000) / 10}%`;

/** One hunter's potion that works from the first tick fires now (also when a reserve steps in, GDD §5.15.10). */
export const startPotion = (f: Fight, h: Combatant): void => {
  const p = h.potion;
  if (!p) return;
  if (p.effect.kind === 'speedWholeFight') {
    const bonus = p.effect.speedBonus * (1 + p.power) * f.potency;
    h.statPct.speed += bonus;
    h.speed = speedEff(h);
    p.used = true;
    emit(f, {
      actor: h.id,
      kind: 'prep',
      text: () => `${h.name} drinks ${p.name} (+${percent(bonus)} Speed for the fight)`,
      rolls: [],
    });
  } else if (p.effect.kind === 'fireTaken') {
    // GDD §5.8.5: Coldwater Draught, drunk at the start; Herbwise strengthens it.
    const cut = p.effect.takenCut * (1 + p.power) * f.potency;
    h.fireTakenPotion += cut;
    p.used = true;
    emit(f, {
      actor: h.id,
      kind: 'prep',
      text: () => `${h.name} drinks ${p.name} (−${percent(cut)} Fire damage taken for the fight)`,
      rolls: [],
    });
  } else if (p.effect.kind === 'hitChance') {
    // GDD §5.8.5: Owl-Eye Drops, put in at the start; the bonus is points of hit chance.
    const points = p.effect.hitChance * (1 + p.power) * f.potency;
    h.hitBonus += points;
    p.used = true;
    emit(f, {
      actor: h.id,
      kind: 'prep',
      text: () =>
        `${h.name} uses ${p.name} (+${Math.round(points * 1000) / 10} points to hit for the fight)`,
      rolls: [],
    });
  } else if (p.effect.kind === 'steadfast') {
    // Held until an ability would cost the holder an action; Spoil can still ruin it (D92).
    h.steadfastLeft = p.effect.uses;
  } else if (p.effect.kind === 'armorUntilAction') {
    const bonus = p.effect.armorBonus * (1 + p.power) * f.potency;
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
};

/** One bomb is thrown at `m` (the front monster at tick 1; a Descent bomb may pick another, GDD §5.15.10). */
export const throwBomb = (f: Fight, id: ConsumableId, m: Combatant): void => {
  const shown = (x: number): number => Math.round(x * f.potency * 100) / 100;
  const e = consumables[id].effect;
  if (e.kind === 'burn' || e.kind === 'chill') {
    const resist = m.resist ? m.resist[e.damageType] : 1;
    const dealt = e.initial * f.potency * resist;
    const amount = finalDamage(dealt, m, resist, false, 0, 1);
    hurt(m, amount);
    // A Fire Pot is a Fire hit: it cracks a Rimewrought's rime (Unthawed, D176).
    const cracked = e.damageType === 'fire' ? unthaw(m) : null;
    const slow = e.kind === 'chill';
    if (e.kind === 'burn') {
      // A status with the same name refreshes rather than stacks (GDD §5.0).
      m.burnLeft = e.actions;
      m.burnAmount = e.perAction * f.potency;
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
        `The party throws a ${consumables[id].name} — ${e.damageType[0]?.toUpperCase()}${e.damageType.slice(1)} ${shown(e.initial)}` +
        `${resist === 1 ? '' : resist === 0 ? ' immune' : ` ×${resist} resist`} = ${amount}` +
        `${slow ? `, and the ${m.name} slows (−${percent(e.speedCut)} Speed for ${e.actions} actions)` : `, and the ${m.name} burns (${shown(e.perAction)} Fire on each of its next ${e.actions} actions)`}` +
        `${cracked ? `; ${cracked}` : ''}` +
        ` · ${m.name} ${m.health}/${m.maxHealth}`,
      rolls: [],
      amount,
      targetHealth: m.health,
    });
  } else if (e.kind === 'smoke') {
    // GDD §5.8.5: Poppy Smoke, no damage type: the monster loses its next action(s).
    m.lostActions += e.lostActions;
    emit(f, {
      actor: 'party',
      kind: 'bomb',
      text: () =>
        `The party throws a ${consumables[id].name}: the ${m.name} loses its next ${e.lostActions === 1 ? 'action' : `${e.lostActions} actions`}`,
      rolls: [],
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
};

/** Potions that work from the first tick fire now; then the bombs are thrown, in order. */
export const startOfFight = (f: Fight): void => {
  f.tick = 1;
  for (const h of f.hunters) startPotion(f, h);
  const m = f.monster;
  if (f.volley > 0) {
    // GDD §5.9.2: Steel that ignores Armor, like a bomb (no oil, trait or knowledge bonus).
    const resist = m.resist ? m.resist.steel : 1;
    const amount = finalDamage(f.volley * resist, m, resist, false, 0, 1);
    hurt(m, amount);
    emit(f, {
      actor: 'party',
      kind: 'volley',
      text: () =>
        `The Watchtower looses a volley — Steel ${f.volley}` +
        `${resist === 1 ? '' : resist === 0 ? ' immune' : ` ×${resist} resist`} = ${amount}` +
        ` · ${m.name} ${m.health}/${m.maxHealth}`,
      rolls: [],
      amount,
      targetHealth: m.health,
    });
  }
  for (const id of f.bombs) throwBomb(f, id, m);
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

/**
 * Called after any damage to a hunter: the Mending Draught, then Ferryman's Coin. Each fires once,
 * below its threshold, and only while the holder still stands.
 */
export const checkPotion = (f: Fight, h: Combatant): void => {
  drinkPotion(f, h);
  ferrymansCoin(f, h);
};

const drinkPotion = (f: Fight, h: Combatant): void => {
  const p = h.potion;
  if (!p || p.used || p.effect.kind !== 'heal' || h.health <= 0) return;
  if (h.health >= h.maxHealth * p.below) return;
  p.used = true;
  const healed = heal(
    h,
    roundHalfUp(h.maxHealth * p.effect.healFraction * (1 + p.power) * f.potency),
  );
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

/** GDD §8.12 Ferryman's Coin: once a fight, the first time the holder drops below the line and is still standing. */
const ferrymansCoin = (f: Fight, h: Combatant): void => {
  const e = h.keepsake?.effect;
  if (e?.kind !== 'healOnceBelow' || h.coinUsed || h.health <= 0) return;
  if (h.health >= h.maxHealth * e.below) return;
  h.coinUsed = true;
  const healed = heal(h, roundHalfUp(h.maxHealth * e.heal));
  emit(f, {
    actor: h.id,
    kind: 'keepsake',
    target: h.id,
    text: () =>
      `${h.name}'s ${h.keepsake?.name} warms: +${healed} · ${h.name} ${h.health}/${h.maxHealth}`,
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
  target.steadfastLeft = 0; // a ruined Steadfast Draught keeps nothing (v0.6)
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
