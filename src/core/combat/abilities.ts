import { roundHalfUp } from './build';
import { finalDamage, hurt } from './formula';
import { emit, type Fight } from './fight-state';
import { armorEff, mightEff, present, standing, takenReduction } from './stats';
import type { Combatant } from './types';

// GDD §8.3 abilities in turn-meter form. Order inside a monster action [JC, D70]:
//   1. start-of-action effects (Root-Wall, Lead Astray, Drowning Song, Enthrall, Riverhorse);
//   2. its attacks (skipped on a Drowning Song action);
//   3. end-of-action effects (Noon Heat, Malice).
// "Every Nth action" counts the monster's own actions, 1-based (1st, 4th, 7th for
// every 3; 1st, 5th, 9th for every 4). Durations count the holder's own actions.

export const heal = (c: Combatant, amount: number): number => {
  const before = c.health;
  c.health = Math.min(c.maxHealth, c.health + amount);
  return c.health - before;
};

const lowestBy = (
  list: readonly Combatant[],
  key: (c: Combatant) => number,
  pickHigher: boolean,
): Combatant | null => {
  let best: Combatant | null = null;
  for (const c of list) {
    if (!best) best = c;
    else if (pickHigher ? key(c) > key(best) : key(c) < key(best)) best = c; // ties: slot order
  }
  return best;
};

const lose = (c: Combatant, n = 1): void => {
  c.lostActions += n;
};

/** Effects that fire when an attack by `attacker` hits; returns log notes. */
export const afterOwnHit = (
  f: Fight,
  attacker: Combatant,
  target: Combatant,
  amount: number,
  draw: () => number,
): string[] => {
  const notes: string[] = [];
  for (const a of attacker.abilities) {
    switch (a.kind) {
      case 'hamstring':
        // The ability roll is drawn only when the attack hit (GDD §5.5).
        if (draw() < a.chance) {
          target.hamstringLeft = a.actions;
          target.statusPct.speed = -a.speedCut;
          notes.push(
            `${target.name} is hamstrung (Speed −${Math.round(a.speedCut * 100)}% for ${a.actions} actions)`,
          );
        }
        break;
      case 'bloodfeast': {
        const healed = heal(attacker, roundHalfUp(amount * a.healFraction));
        if (healed > 0) notes.push(`${attacker.name} drinks, +${healed}`);
        break;
      }
      case 'barrowGrip':
        if (attacker.actions % a.every === 0) {
          lose(target);
          notes.push(`${target.name} is held (loses their next action)`);
        }
        break;
      case 'dragUnder':
        if (attacker.actions % a.every === 0) {
          lose(target);
          target.nextHitTakenMult = a.nextHitMult;
          notes.push(
            `${target.name} is dragged under (loses their next action, takes ×${a.nextHitMult} next)`,
          );
        }
        break;
      default:
        break;
    }
  }
  return notes;
};

const everyNth = (action: number, every: number): boolean => (action - 1) % every === 0;

/** Start-of-action effects. Returns true if the monster doesn't attack this action. */
export const startOfMonsterAction = (f: Fight, m: Combatant): boolean => {
  let skipAttack = false;
  const standingHunters = f.hunters.filter(present);
  // Carried-off hunters return as the Nix's actions pass.
  for (const h of f.hunters) {
    if (h.awayLeft > 0 && m.actions > 1) {
      h.awayLeft -= 1;
      if (h.awayLeft === 0) {
        const lost = roundHalfUp(h.maxHealth * riverhorseLoss(m));
        h.health = h.health > lost ? h.health - lost : 0;
        emit(f, {
          actor: m.id,
          kind: 'ability',
          target: h.id,
          text: () =>
            `${h.name} is returned by the river, having lost ${lost} Health · ${h.name} ${h.health}/${h.maxHealth}`,
          rolls: [],
          amount: lost,
          targetHealth: h.health,
        });
      }
    }
  }
  for (const a of m.abilities) {
    switch (a.kind) {
      case 'rootWall': {
        const healed = heal(m, roundHalfUp(m.maxHealth * a.regenFraction));
        if (healed > 0) {
          emit(f, {
            actor: m.id,
            kind: 'ability',
            text: () =>
              `${m.name}'s Root-Wall mends it, +${healed} · ${m.name} ${m.health}/${m.maxHealth}`,
            rolls: [],
            amount: healed,
            targetHealth: m.health,
          });
        }
        break;
      }
      case 'leadAstray': {
        const used: number[] = [];
        const r = f.rolls.next();
        used.push(r);
        if (r < a.chance && standingHunters.length > 0) {
          const pick = f.rolls.next();
          used.push(pick);
          const idx = Math.min(
            standingHunters.length - 1,
            Math.floor(pick * standingHunters.length),
          );
          const victim = standingHunters[idx];
          if (victim) {
            lose(victim);
            emit(f, {
              actor: m.id,
              kind: 'ability',
              target: victim.id,
              text: () => `${m.name} leads ${victim.name} astray (loses their next action)`,
              rolls: used,
            });
            break;
          }
        }
        emit(f, {
          actor: m.id,
          kind: 'ability-roll',
          text: () => `${m.name}'s Lead Astray fails`,
          rolls: used,
        });
        break;
      }
      case 'drowningSong':
        if (everyNth(m.actions, a.every)) {
          const victim = lowestBy(standingHunters, armorEff, false);
          if (victim) {
            lose(victim);
            skipAttack = true;
            emit(f, {
              actor: m.id,
              kind: 'ability',
              target: victim.id,
              text: () =>
                `${m.name} sings, and ${victim.name} is charmed (loses their next action)`,
              rolls: [],
            });
          }
        }
        break;
      case 'enthrall':
        if (everyNth(m.actions, a.every)) {
          const victim = lowestBy(standingHunters, mightEff, true);
          if (victim) {
            lose(victim);
            const healed = heal(m, roundHalfUp(m.maxHealth * a.healFraction));
            emit(f, {
              actor: m.id,
              kind: 'ability',
              target: victim.id,
              text: () =>
                `${m.name} enthralls ${victim.name} (loses their next action), +${healed} · ${m.name} ${m.health}/${m.maxHealth}`,
              rolls: [],
              amount: healed,
              targetHealth: m.health,
            });
          }
        }
        break;
      case 'riverhorse':
        if (m.actions === 1) {
          const victim = lowestBy(standingHunters, (h) => h.health, false);
          if (victim) {
            victim.awayLeft = a.awayActions + 1; // returns at the start of the 3rd action after this one
            emit(f, {
              actor: m.id,
              kind: 'ability',
              target: victim.id,
              text: () => `${m.name} carries ${victim.name} off into the river`,
              rolls: [],
            });
          }
        }
        break;
      default:
        break;
    }
  }
  return skipAttack;
};

const riverhorseLoss = (m: Combatant): number => {
  for (const a of m.abilities) if (a.kind === 'riverhorse') return a.healthLossFraction;
  return 0;
};

/** End-of-action effects: Noon Heat, then Malice stacking. */
export const endOfMonsterAction = (f: Fight, m: Combatant): void => {
  for (const a of m.abilities) {
    if (a.kind === 'noonHeat') {
      if (m.noonHeatSuppressed > 0) {
        m.noonHeatSuppressed -= 1;
        continue;
      }
      for (const h of f.hunters) {
        if (!standing(h)) continue;
        // Fire ignores Armor, but taken% (Fire-touched, Plate) still applies (B4).
        const raw = h.maxHealth * a.maxHealthFraction;
        const amount = finalDamage(raw, h, 1, false, takenReduction(h, 'fire', f.hunters), 1);
        hurt(h, amount);
        emit(f, {
          actor: m.id,
          kind: 'ability',
          target: h.id,
          text: () =>
            `Noon Heat burns ${h.name}: Fire ${raw.toFixed(2)} = ${amount} · ${h.name} ${h.health}/${h.maxHealth}`,
          rolls: [],
          amount,
          targetHealth: h.health,
        });
      }
    } else if (a.kind === 'malice') {
      m.statusPct.might += a.mightPerAction;
    }
  }
};
