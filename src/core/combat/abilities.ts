import { roundHalfUp } from './build';
import { cancelsAbility, checkPotion, spoilHit } from './prep';
import { abilityTaken, finalDamage, heal, hurt } from './formula';
import { cap, emit, knockBack, type Fight } from './fight-state';
import { armorEff, mightEff, present, speedEff, standing, takenReduction } from './stats';
import type { Combatant } from './types';

// GDD §8.3 abilities in turn-meter form. Order inside a monster action [JC, D70]:
//   1. start-of-action effects (Root-Wall, Lead Astray, Drowning Song, Enthrall, Riverhorse);
//   2. its attacks (skipped on a Drowning Song action);
//   3. end-of-action effects (Noon Heat, Malice).
// "Every Nth action" counts the monster's own actions, 1-based (1st, 4th, 7th for
// every 3; 1st, 5th, 9th for every 4). Durations count the holder's own actions.

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

/**
 * Costs `c` an action, unless a Steadfast Draught keeps it (GDD §5.8.5: the first time a
 * monster's ability would cost the holder an action, it doesn't; the ability's other
 * effects still apply). True when the action is lost.
 */
const lose = (c: Combatant): boolean => {
  // The Barley Knot (GDD §8.12) works by Steadfast's rule; being free, it goes before a Draught.
  if (c.knotLeft > 0) {
    c.knotLeft = 0;
    c.keptBy = c.keepsake?.name.replace(/^The /, '') ?? 'keepsake';
    return false;
  }
  const p = c.potion;
  if (c.steadfastLeft > 0 && p && !p.used) {
    c.steadfastLeft -= 1;
    if (c.steadfastLeft === 0) p.used = true;
    c.keptBy = p.name;
    return false;
  }
  c.lostActions += 1;
  return true;
};

/** The log words for an action a Steadfast Draught kept. */
const keeps = (c: Combatant): string =>
  `their ${c.keptBy ?? c.potion?.name ?? 'potion'} keeps their action`;

/** Effects that fire when an attack by `attacker` hits; returns log notes. */
export const afterOwnHit = (
  f: Fight,
  attacker: Combatant,
  target: Combatant,
  amount: number,
  draw: (label: (r: number) => string) => number,
): string[] => {
  const notes: string[] = [];
  for (const a of attacker.abilities) {
    switch (a.kind) {
      case 'hamstring': {
        // The ability roll is drawn only when the attack hit (GDD §5.5).
        const hamstrung = draw(
          (r) =>
            `Hamstring ${r.toFixed(3)} ${r < a.chance ? '<' : '≥'} ${Math.round(a.chance * 1000) / 10}% → ${r < a.chance ? 'hamstrung' : 'no effect'}`,
        );
        if (hamstrung < a.chance && !cancelsAbility(f, attacker, 'Hamstring')) {
          target.hamstringLeft = a.actions;
          target.statusPct.speed = -a.speedCut;
          target.speed = speedEff(target);
          notes.push(
            `${target.name} is hamstrung (Speed −${Math.round(a.speedCut * 100)}% for ${a.actions} actions)`,
          );
        }
        break;
      }
      case 'spoil': {
        // Its first hit on each hunter, cancelled or not, uses up the Spoil on that hunter.
        if (target.spoiled) break;
        target.spoiled = true;
        if (cancelsAbility(f, attacker, 'Spoil')) break;
        const ruined = spoilHit(target, attacker);
        if (ruined) notes.push(ruined);
        break;
      }
      case 'bloodfeast': {
        if (cancelsAbility(f, attacker, 'Bloodfeast')) break;
        const healed = heal(attacker, roundHalfUp(amount * a.healFraction));
        if (healed > 0) notes.push(`${attacker.name} drinks, +${healed}`);
        break;
      }
      case 'chill':
        // Unlit's Breath (Deep): the chill refreshes on every hit, and counts the target's own actions.
        if (!cancelsAbility(f, attacker, 'Chill')) {
          target.healCutLeft = a.actions;
          target.healCut = a.healingLoss;
          notes.push(
            `${target.name} is chilled (healing −${Math.round(a.healingLoss * 100)}% for ${a.actions} actions)`,
          );
        }
        break;
      case 'barrowGrip':
        if (attacker.actions % a.every === 0 && !cancelsAbility(f, attacker, 'Barrow-Grip')) {
          notes.push(
            lose(target)
              ? `${target.name} is held (loses their next action)`
              : `${target.name} is held, but ${keeps(target)}`,
          );
        }
        break;
      case 'coil':
        // The Lindworm (GDD §8.13): every 3rd action its attack holds the target, as Barrow-Grip does.
        if (
          attacker.actions % a.every === 0 &&
          attacker.coilAction !== attacker.actions &&
          !cancelsAbility(f, attacker, 'Coil')
        ) {
          attacker.coilAction = attacker.actions; // one target held per action, however many attacks it has
          notes.push(
            lose(target)
              ? `${target.name} is coiled (loses their next action)`
              : `${target.name} is coiled, but ${keeps(target)}`,
          );
        }
        break;
      case 'quickDark': {
        // The Mara (GDD §8.14): her first hit on each hunter ruins that hunter's unused potion, as Spoil does.
        if (target.spoiled) break;
        target.spoiled = true;
        if (cancelsAbility(f, attacker, 'Quick Dark')) break;
        const p = target.potion;
        if (p && !p.used) {
          p.used = true;
          target.steadfastLeft = 0;
          notes.push(`${attacker.name}'s Quick Dark ruins ${target.name}'s ${p.name}`);
        }
        break;
      }
      case 'dragUnder':
        if (attacker.actions % a.every === 0 && !cancelsAbility(f, attacker, 'Drag Under')) {
          const lost = lose(target);
          target.nextHitTakenMult = a.nextHitMult;
          notes.push(
            lost
              ? `${target.name} is dragged under (loses their next action, takes ×${a.nextHitMult} next)`
              : `${target.name} is dragged under, but ${keeps(target)} (takes ×${a.nextHitMult} next)`,
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
        checkPotion(f, h);
      }
    }
  }
  for (const a of m.abilities) {
    switch (a.kind) {
      case 'rootWall': {
        if (cancelsAbility(f, m, 'Root-Wall')) break;
        const healed = heal(m, roundHalfUp(m.maxHealth * a.regenFraction));
        if (healed > 0) {
          emit(f, {
            actor: m.id,
            kind: 'ability',
            text: () =>
              `${cap(m.name)}'s Root-Wall mends it, +${healed} · ${m.name} ${m.health}/${m.maxHealth}`,
            rolls: [],
            amount: healed,
            targetHealth: m.health,
          });
        }
        break;
      }
      case 'leadAstray': {
        const used: number[] = [];
        const notes: string[] = [];
        const r = f.rolls.next();
        used.push(r);
        if (f.logging) {
          notes.push(
            `Lead Astray ${r.toFixed(3)} ${r < a.chance ? '<' : '≥'} ${Math.round(a.chance * 1000) / 10}% → ${r < a.chance ? 'works' : 'fails'}`,
          );
        }
        if (r < a.chance && standingHunters.length > 0 && !cancelsAbility(f, m, 'Lead Astray')) {
          const pick = f.rolls.next();
          used.push(pick);
          const idx = Math.min(
            standingHunters.length - 1,
            Math.floor(pick * standingHunters.length),
          );
          const victim = standingHunters[idx];
          if (f.logging) notes.push(`Pick ${pick.toFixed(3)} → ${victim?.name ?? 'nobody'}`);
          if (victim) {
            const lost = lose(victim);
            emit(f, {
              actor: m.id,
              kind: 'ability',
              target: victim.id,
              text: () =>
                lost
                  ? `${cap(m.name)} leads ${victim.name} astray (loses their next action)`
                  : `${cap(m.name)} leads ${victim.name} astray, but ${keeps(victim)}`,
              rolls: used,
              rollNotes: notes,
            });
            break;
          }
        }
        emit(f, {
          actor: m.id,
          kind: 'ability-roll',
          text: () => `${cap(m.name)}'s Lead Astray fails`,
          rolls: used,
          rollNotes: notes,
        });
        break;
      }
      case 'drowningSong':
        if (everyNth(m.actions, a.every) && !cancelsAbility(f, m, 'Drowning Song')) {
          const victim = lowestBy(standingHunters, armorEff, false);
          if (victim) {
            const lost = lose(victim);
            skipAttack = true;
            emit(f, {
              actor: m.id,
              kind: 'ability',
              target: victim.id,
              text: () =>
                lost
                  ? `${cap(m.name)} sings, and ${victim.name} is charmed (loses their next action)`
                  : `${cap(m.name)} sings, and ${victim.name} is charmed, but ${keeps(victim)}`,
              rolls: [],
            });
          }
        }
        break;
      case 'fjordRoar':
      case 'weirPull': {
        // Fjord Roar: its 1st action and every 5th after; Weir-Pull: every 4th (4th, 8th…). Instead of
        // attacking, every present hunter's turn meter is knocked back (GDD §8.13).
        const due =
          a.kind === 'fjordRoar' ? everyNth(m.actions, a.every) : m.actions % a.every === 0;
        if (due && !cancelsAbility(f, m, a.name)) {
          skipAttack = true;
          for (const h of standingHunters) knockBack(h, a.knockBack);
          emit(f, {
            actor: m.id,
            kind: 'ability',
            text: () =>
              a.kind === 'fjordRoar'
                ? `${cap(m.name)} roars: every hunter's turn comes ${a.knockBack} later`
                : `${cap(m.name)} pulls at the weir: every hunter's turn comes ${a.knockBack} later`,
            rolls: [],
          });
        }
        break;
      }
      case 'mossMend': {
        if (cancelsAbility(f, m, 'Moss-Mend')) break;
        const healed = heal(m, roundHalfUp(m.maxHealth * a.regenFraction));
        if (healed > 0) {
          emit(f, {
            actor: m.id,
            kind: 'ability',
            text: () =>
              `${cap(m.name)}'s Moss-Mend closes its wounds, +${healed} · ${m.name} ${m.health}/${m.maxHealth}`,
            rolls: [],
            amount: healed,
            targetHealth: m.health,
          });
        }
        break;
      }
      case 'nightWeight':
        if (everyNth(m.actions, a.every) && !cancelsAbility(f, m, 'Night-Weight')) {
          const victim = lowestBy(standingHunters, mightEff, true);
          if (victim) {
            const lost = lose(victim);
            emit(f, {
              actor: m.id,
              kind: 'ability',
              target: victim.id,
              text: () =>
                lost
                  ? `${cap(m.name)} settles on ${victim.name} (loses their next action)`
                  : `${cap(m.name)} settles on ${victim.name}, but ${keeps(victim)}`,
              rolls: [],
            });
          }
        }
        break;
      case 'misfortune': {
        // Likho (GDD §8.14): a chance each action that one random hunter loses their next action.
        // The same two rolls as Lead Astray: the chance, then (if it works) who.
        const used: number[] = [];
        const notes: string[] = [];
        const r = f.rolls.next();
        used.push(r);
        if (f.logging)
          notes.push(
            `Misfortune ${r.toFixed(3)} ${r < a.chance ? '<' : '≥'} ${Math.round(a.chance * 1000) / 10}% → ${r < a.chance ? 'strikes' : 'passes'}`,
          );
        if (r < a.chance && standingHunters.length > 0 && !cancelsAbility(f, m, 'Misfortune')) {
          const pick = f.rolls.next();
          used.push(pick);
          const victim =
            standingHunters[
              Math.min(standingHunters.length - 1, Math.floor(pick * standingHunters.length))
            ];
          if (f.logging) notes.push(`Pick ${pick.toFixed(3)} → ${victim?.name ?? 'nobody'}`);
          if (victim) {
            const lost = lose(victim);
            emit(f, {
              actor: m.id,
              kind: 'ability',
              target: victim.id,
              text: () =>
                lost
                  ? `Misfortune follows ${victim.name} (loses their next action)`
                  : `Misfortune follows ${victim.name}, but ${keeps(victim)}`,
              rolls: used,
              rollNotes: notes,
            });
            break;
          }
        }
        emit(f, {
          actor: m.id,
          kind: 'ability-roll',
          text: () => `${cap(m.name)}'s Misfortune passes`,
          rolls: used,
          rollNotes: notes,
        });
        break;
      }
      case 'enthrall':
        if (everyNth(m.actions, a.every) && !cancelsAbility(f, m, 'Enthrall')) {
          const victim = lowestBy(standingHunters, mightEff, true);
          if (victim) {
            const lost = lose(victim);
            const healed = heal(m, roundHalfUp(m.maxHealth * a.healFraction));
            emit(f, {
              actor: m.id,
              kind: 'ability',
              target: victim.id,
              text: () =>
                `${cap(m.name)} enthralls ${victim.name} (${lost ? 'loses their next action' : keeps(victim)}), +${healed} · ${m.name} ${m.health}/${m.maxHealth}`,
              rolls: [],
              amount: healed,
              targetHealth: m.health,
            });
          }
        }
        break;
      case 'reForge':
        // GDD §8.3: every 3rd action (3rd, 6th…, like Barrow-Grip), instead of attacking.
        if (m.actions % a.every === 0 && !cancelsAbility(f, m, 'Re-forge')) {
          skipAttack = true;
          const healed = heal(m, roundHalfUp(m.maxHealth * a.healFraction));
          emit(f, {
            actor: m.id,
            kind: 'ability',
            text: () =>
              `The ${m.name}'s Re-forge mends it at the anvil, +${healed} · ${m.name} ${m.health}/${m.maxHealth}`,
            rolls: [],
            amount: healed,
            targetHealth: m.health,
          });
        }
        break;
      case 'riverhorse':
        if (m.actions === 1 && !cancelsAbility(f, m, 'Riverhorse')) {
          const victim = lowestBy(standingHunters, (h) => h.health, false);
          if (victim) {
            victim.awayLeft = a.awayActions + 1; // returns at the start of the 3rd action after this one
            emit(f, {
              actor: m.id,
              kind: 'ability',
              target: victim.id,
              text: () => `${cap(m.name)} carries ${victim.name} off into the river`,
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
      if (cancelsAbility(f, m, 'Noon Heat')) continue;
      for (const h of f.hunters) {
        if (!standing(h)) continue;
        // Fire ignores Armor, but taken% (Fire-touched, Plate) still applies (B4).
        const raw = h.maxHealth * a.maxHealthFraction;
        const amount = abilityTaken(
          h,
          finalDamage(raw, h, 1, h.forgeWelded, takenReduction(h, 'fire', f.hunters), 1),
        );
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
        checkPotion(f, h);
      }
    } else if (a.kind === 'drain' || a.kind === 'graveChill') {
      // Unlit's Breath (Deep) and the Barrow-King's Grave Chill (v0.9): Frost on every standing
      // hunter, ignoring Armor; taken% still applies.
      if (cancelsAbility(f, m, a.kind === 'drain' ? 'Drain' : 'Grave Chill')) continue;
      for (const h of f.hunters) {
        if (!standing(h)) continue;
        const raw = h.maxHealth * a.maxHealthFraction;
        const amount = abilityTaken(
          h,
          finalDamage(raw, h, 1, h.forgeWelded, takenReduction(h, 'frost', f.hunters), 1),
        );
        hurt(h, amount);
        emit(f, {
          actor: m.id,
          kind: 'ability',
          target: h.id,
          text: () =>
            `${a.kind === 'drain' ? 'The cold drains' : 'The grave chill reaches'} ${h.name}: Frost ${raw.toFixed(2)} = ${amount} · ${h.name} ${h.health}/${h.maxHealth}`,
          rolls: [],
          amount,
          targetHealth: h.health,
        });
        checkPotion(f, h);
      }
    } else if (a.kind === 'malice') {
      if (cancelsAbility(f, m, 'Malice')) continue;
      m.statusPct.might += a.mightPerAction;
    }
  }
};

export { heal };
