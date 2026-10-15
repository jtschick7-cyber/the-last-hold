import { K } from './constants';
import { speciesOf } from './species';
import { buildHunter, buildMonster, roundHalfUp } from './build';
import { endOfMonsterAction, heal, startOfMonsterAction } from './abilities';
import { burnTick, cancelsAbility, startOfFight } from './prep';
import { directAttack } from './damage';
import { cap, emit, type Fight } from './fight-state';
import { activeEffects, boostFor, monsterBoostFrom, NO_RULES, rulesFrom } from './delve';
import {
  alchemyPotency,
  healthPct,
  knowledgeBonus,
  lightlessCut,
  present,
  speedEff,
  standing,
  type FightContext,
} from './stats';
import type { Combatant, FightInput, FightMonster, FightResult } from './types';

// GDD §5.5: an auto-battle on a turn meter. Each tick every standing combatant's
// meter rises by its Speed; whoever reaches the threshold acts once and loses the
// threshold from the meter. Ties go: higher meter, higher Speed, hunters before
// the monster, party slot order (no randomness is drawn for ties).

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'] as const;

const actsBefore = (a: Combatant, b: Combatant): number =>
  b.meter - a.meter ||
  b.speed - a.speed ||
  (a.side === b.side ? 0 : a.side === 'hunter' ? -1 : 1) ||
  a.slot - b.slot;

/** A status that counts the holder's own actions ends here (Hamstring). */
export const endOwnAction = (c: Combatant): void => {
  if (c.tonicLeft > 0) {
    c.tonicLeft -= 1;
    if (c.tonicLeft === 0) c.statusPct.armor = 0;
  }
  if (c.chillLeft > 0) {
    c.chillLeft -= 1;
    if (c.chillLeft === 0) {
      c.statusPct.speed = 0;
      c.speed = speedEff(c);
    }
  }
  if (c.abilitiesBlocked > 0) c.abilitiesBlocked -= 1;
  if (c.healCutLeft > 0) {
    c.healCutLeft -= 1;
    if (c.healCutLeft === 0) c.healCut = 0;
  }
  if (c.hamstringLeft > 0) {
    c.hamstringLeft -= 1;
    if (c.hamstringLeft === 0) {
      c.statusPct.speed = 0;
      c.speed = speedEff(c);
    }
  }
};

/** A monster of the group is down for good: the Pack Grows counts it (D255). */
const countKill = (f: Fight, m: Combatant): void => {
  if (f.noted.has(m.id)) return;
  f.noted.add(m.id);
  f.kills += 1;
  const pack = f.rules.packGrows;
  if (!pack) return;
  const add = Math.min(pack.perKill, pack.max - f.packGiven);
  if (add <= 0) return;
  f.packGiven += add;
  for (const h of f.hunters) h.statusPct.might += add;
  emit(f, {
    actor: 'party',
    kind: 'rule',
    text: () =>
      `The pack grows: +${Math.round(add * 100)}% Might (${Math.round(f.packGiven * 100)}% in all)`,
    rolls: [],
  });
};

/**
 * Each monster at 0 Health may be raised once by Second Soul; the fight is won when every
 * monster of the group is down (D251), lost when every hunter is. In a Delve, a hunter downed
 * may be lifted by Mended Cloth, and the last one down by the Long Vigil (D255).
 */
const resolveEnds = (f: Fight): void => {
  let anyUp = false;
  for (const m of f.monsters) {
    if (m.health <= 0) {
      const soul = m.abilities.find((a) => a.kind === 'secondSoul');
      if (soul && !m.secondSoulUsed && !cancelsAbility(f, m, 'Second Soul')) {
        m.secondSoulUsed = true;
        m.health = roundHalfUp(m.maxHealth * soul.reviveFraction);
        emit(f, {
          actor: m.id,
          kind: 'ability',
          text: () =>
            `${cap(m.name)} rises again with its second soul · ${m.name} ${m.health}/${m.maxHealth}`,
          rolls: [],
          targetHealth: m.health,
        });
      }
    }
    if (m.health > 0) anyUp = true;
    else countKill(f, m);
  }
  if (!anyUp) {
    f.over = 'monster-down';
    return;
  }
  for (const h of f.hunters) {
    if (h.health > 0 || f.noted.has(h.id)) continue;
    f.noted.add(h.id);
    if (f.rules.mendedCloth > 0 && !f.clothUsed && f.clothPending === null) f.clothPending = h;
  }
  if (f.hunters.every((h) => !standing(h))) {
    if (f.rules.longVigil > 0 && !f.vigilUsed) {
      // The Hearth-Crone's Long Vigil: once per run, when the last hunter falls, all rise.
      f.vigilUsed = true;
      f.clothPending = null;
      for (const h of f.hunters) {
        h.health = Math.max(1, roundHalfUp(h.maxHealth * f.rules.longVigil));
        f.noted.delete(h.id);
      }
      emit(f, {
        actor: 'party',
        kind: 'rule',
        text: () =>
          `The Long Vigil: every hunter gets up at ${Math.round(f.rules.longVigil * 100)}% Health`,
        rolls: [],
      });
      return;
    }
    f.over = 'party-down';
  }
};

/** The front monster: the first standing in group order (D251). */
const frontMonster = (f: Fight): Combatant => f.monsters.find(standing) ?? f.monster;

/** The standing monster with the lowest Health; ties go to group order (D251). */
const weakestMonster = (f: Fight): Combatant => {
  let best: Combatant | null = null;
  for (const m of f.monsters) if (standing(m) && (!best || m.health < best.health)) best = m;
  return best ?? f.monster;
};

const loseAction = (f: Fight, c: Combatant): void => {
  c.lostActions -= 1;
  emit(f, { actor: c.id, kind: 'skip', text: () => `${c.name} loses their action`, rolls: [] });
};

const hunterAct = (f: Fight, c: Combatant, extra = false): void => {
  const mender = c.role === 'mender';
  const pending = f.clothPending;
  if (mender && pending && pending !== c && !extra) {
    // Mended Cloth (Delve): the first hunter downed this floor gets up on the Mender's next action.
    f.clothPending = null;
    f.clothUsed = true;
    pending.health = Math.max(1, roundHalfUp(pending.maxHealth * f.rules.mendedCloth));
    f.noted.delete(pending.id);
    emit(f, {
      actor: c.id,
      kind: 'rule',
      target: pending.id,
      text: () =>
        `${c.name} (Mender) mends ${pending.name} back to their feet · ${pending.name} ${pending.health}/${pending.maxHealth}`,
      rolls: [],
      targetHealth: pending.health,
    });
    return;
  }
  if (mender && c.menderHeals) {
    const threshold = c.healThreshold;
    let patient: Combatant | null = null;
    for (const h of f.hunters) {
      if (!present(h) || healthPct(h) >= threshold) continue;
      if (!patient || healthPct(h) < healthPct(patient)) patient = h; // ties: slot order
    }
    if (patient) {
      let bonus = c.healBonus;
      for (const e of c.traits) if (e.kind === 'healingDone') bonus += e.amount;
      const base = K.healMult * (c.base.might + c.flat.might);
      const healed = heal(patient, roundHalfUp(base * (1 + bonus)));
      emit(f, {
        actor: c.id,
        kind: 'heal',
        target: patient.id,
        text: () =>
          `${c.name} (Mender) heals ${patient.name} for ${healed} · ${patient.name} ${patient.health}/${patient.maxHealth}`,
        rolls: [],
        amount: healed,
        targetHealth: patient.health,
      });
      if (f.rules.oneThread > 0 && healed > 0) {
        // The Weaver's One Thread: every other standing hunter recovers a share of what was healed.
        const share = roundHalfUp(healed * f.rules.oneThread);
        for (const h of f.hunters) {
          if (h === patient || !present(h)) continue;
          const got = heal(h, share);
          if (got > 0)
            emit(f, {
              actor: c.id,
              kind: 'heal',
              target: h.id,
              text: () =>
                `One Thread: ${h.name} recovers ${got} · ${h.name} ${h.health}/${h.maxHealth}`,
              rolls: [],
              amount: got,
              targetHealth: h.health,
            });
        }
      }
      return;
    }
  }
  // D251: the Vanguard, and the Mender when she attacks, hit the front monster; the Striker the weakest.
  const target = c.role === 'striker' ? weakestMonster(f) : frontMonster(f);
  directAttack(f, c, target, mender ? { mightMult: K.menderAttack } : {});
  resolveEnds(f);
  // The Wolf's Share (Delve): a crit that brings a monster down for good earns one extra action at once.
  if (f.rules.wolfsShare && !extra && f.lastCrit && !f.over && target.health <= 0 && standing(c)) {
    emit(f, {
      actor: c.id,
      kind: 'rule',
      text: () => `${c.name} takes the wolf's share: an extra action at once`,
      rolls: [],
    });
    hunterAct(f, c, true);
  }
};

/** After a hunter's action: Drawn Thin's cost, and the Drowned Bell's knock-back every few party actions. */
const partyActed = (f: Fight, c: Combatant): void => {
  if (c.actionDrain > 0 && standing(c) && !f.over) {
    const lost = Math.max(1, roundHalfUp(c.maxHealth * c.actionDrain));
    c.health = c.health > lost ? c.health - lost : 0;
    emit(f, {
      actor: c.id,
      kind: 'rule',
      text: () => `${c.name} grows thinner: -${lost} Health · ${c.name} ${c.health}/${c.maxHealth}`,
      rolls: [],
      amount: lost,
      targetHealth: c.health,
    });
    resolveEnds(f);
  }
  f.partyActions += 1;
  const k = f.rules.knockback;
  if (k && !f.over && f.partyActions % k.every === 0) {
    for (const m of f.monsters) if (standing(m)) m.meter -= k.amount;
    emit(f, {
      actor: 'party',
      kind: 'rule',
      text: () => `The bell rings for the Sent: every monster's turn comes ${k.amount} later`,
      rolls: [],
    });
  }
};

const targetNote = (roll: number, h: Combatant): string => `Target ${roll.toFixed(3)} → ${h.name}`;

/** Picks the target by weight, walking standing hunters in slot order (GDD §5.5 rule 1). */
const pickTarget = (
  f: Fight,
  candidates: readonly Combatant[],
): { target: Combatant; pre: number[]; preNotes: string[] } | null => {
  const first = candidates[0];
  if (!first) return null;
  if (candidates.length === 1) return { target: first, pre: [], preNotes: [] };
  const weight = (h: Combatant): number =>
    h.role === 'vanguard' ? K.vanguardWeight : K.otherWeight;
  const total = candidates.reduce((s, h) => s + weight(h), 0);
  const roll = f.rolls.next();
  const point = roll * total;
  let walked = 0;
  for (const h of candidates) {
    walked += weight(h);
    if (point < walked)
      return { target: h, pre: [roll], preNotes: f.logging ? [targetNote(roll, h)] : [] };
  }
  const last = candidates[candidates.length - 1] ?? first;
  return { target: last, pre: [roll], preNotes: f.logging ? [targetNote(roll, last)] : [] };
};

const monsterAct = (f: Fight, m: Combatant): void => {
  f.monsterActing = true;
  burnTick(f, m);
  resolveEnds(f);
  if (f.over) {
    f.monsterActing = false;
    return;
  }
  const skipAttack = startOfMonsterAction(f, m);
  resolveEnds(f);
  const settling = m.abilities.find((a) => a.kind === 'settling');
  if (
    !skipAttack &&
    settling &&
    m.actions % settling.every === 0 &&
    !cancelsAbility(f, m, 'Settling')
  ) {
    // The Dross-Tide (Deep): every `every`th action its attack reaches every standing hunter, each
    // hit rolled and resolved as a direct attack (Armor applies); no target roll is drawn.
    emit(f, {
      actor: m.id,
      kind: 'ability',
      text: () => `${cap(m.name)} settles over the whole party`,
      rolls: [],
    });
    for (const h of f.hunters.filter(present)) {
      if (f.over || !present(h)) continue;
      directAttack(f, m, h);
      resolveEnds(f);
    }
  } else if (!skipAttack) {
    for (let i = 0; i < m.attacks && !f.over; i++) {
      const picked = pickTarget(f, f.hunters.filter(present));
      if (!picked) break;
      directAttack(f, m, picked.target, { pre: picked.pre, preNotes: picked.preNotes });
      resolveEnds(f);
    }
  }
  if (!f.over) {
    endOfMonsterAction(f, m);
    resolveEnds(f);
  }
  f.monsterActing = false;
};

export const runFight = (input: FightInput): FightResult => {
  // A Delve floor (GDD §5.10): the run's blessings and relics through the buckets and the ★ rules.
  const delve = input.delve;
  const active = delve ? activeEffects(delve.blessings, delve.relics) : null;
  const rules = active ? rulesFrom(active) : NO_RULES;
  const hunters = input.party.map((h, i) =>
    buildHunter(h, i + 1, input.prep, active ? boostFor(h, input.party, active) : undefined),
  );
  const stand = input.stand;
  if (stand) {
    // GDD §5.9.3: Health carries over between waves; Walls and the Iron Shutter reduce damage taken.
    for (const h of hunters) {
      const carried = stand.health[h.id as keyof typeof stand.health];
      if (carried !== undefined) h.health = Math.min(h.maxHealth, carried);
      h.extraTaken = stand.partyTaken;
    }
  }
  // The group in order (D251). A species that appears twice is "first" and "second", with its own id.
  const instances = [input.monster, ...(input.companions ?? [])];
  const seen: Record<string, number> = {};
  const total: Record<string, number> = {};
  const key = (m: FightMonster): string => speciesOf(m).id;
  for (const m of instances) total[key(m)] = (total[key(m)] ?? 0) + 1;
  const monsterList = instances.map((m, slot) => {
    const n = (seen[key(m)] = (seen[key(m)] ?? 0) + 1);
    const def = speciesOf(m);
    if (instances.length === 1)
      return buildMonster(m, stand?.monsterStrength ?? 1, undefined, input.nameless ?? 0);
    return buildMonster(
      m,
      stand?.monsterStrength ?? 1,
      {
        slot,
        id: n === 1 ? def.id : `${def.id}-${n}`,
        name: (total[key(m)] ?? 1) > 1 ? `${ORDINALS[n - 1] ?? `#${n}`} ${def.name}` : def.name,
      },
      input.nameless ?? 0,
    );
  });
  const monster = monsterList[0] as Combatant;
  const noted = new Set<string>();
  if (delve && active) {
    const mb = monsterBoostFrom(active);
    for (const m of monsterList) {
      m.statPct.speed += mb.speedPct;
      m.statPct.might += mb.mightPct;
      m.speed = speedEff(m);
      m.hitBonus += mb.hitPoints / 100;
      m.meter = rules.monsterStartMeter;
    }
    // Pack Grows carries over: Might for the monsters killed on earlier floors, up to the cap.
    const carried = rules.packGrows
      ? Math.min(rules.packGrows.max, rules.packGrows.perKill * delve.kills)
      : 0;
    for (const h of hunters) {
      const share = delve.health[h.id as keyof typeof delve.health];
      if (share !== undefined)
        h.health =
          share <= 0 ? 0 : Math.max(1, Math.min(h.maxHealth, roundHalfUp(h.maxHealth * share)));
      h.runeMark = rules.smithsMark;
      h.forgeWelded = rules.forgeWelded;
      h.noHealing = rules.nothingRestores;
      h.menderHeals = !(h.role === 'mender' && rules.menderNeverHeals);
      h.actionDrain = rules.actionDrain;
      h.statusPct.might += carried;
      if (h.health <= 0) noted.add(h.id); // out for the rest of the run (D253)
    }
  }
  const potency = alchemyPotency(input.alchemy ?? 0);
  const first = speciesOf(input.monster);
  const ctx: FightContext = {
    location: input.location,
    family: first.family,
    monsterId: first.id,
    attacks: first.attacks,
    hitCut: lightlessCut(first),
    oilBonus: K.oilBonus * potency,
  };
  const f: Fight = {
    tick: 0,
    hunters,
    monster,
    monsters: monsterList,
    rolls: input.rolls,
    ctx,
    knowledgePct: rules.knowledgeOff ? 0 : knowledgeBonus(input.monster.knowledge ?? 0),
    rules,
    kills: 0,
    packGiven: rules.packGrows
      ? Math.min(rules.packGrows.max, rules.packGrows.perKill * (delve?.kills ?? 0))
      : 0,
    partyActions: 0,
    clothUsed: false,
    clothPending: null,
    vigilUsed: delve?.vigilUsed ?? false,
    noted,
    tolled: new Set<string>(),
    lastCrit: false,
    knowledge: input.monster.knowledge ?? 0,
    log: [],
    logging: input.log !== false,
    over: null,
    saltburstArmed: false,
    saltburstCancelled: false,
    monsterActing: false,
    bombs: input.prep?.bombs ?? [],
    volley: stand?.volley ?? 0,
    potency,
  };
  // Potions that work from the start, then the bombs, before anyone acts (GDD §5.7).
  startOfFight(f);
  if (rules.pricePaid) {
    // The Hearth-Crone's A Price Paid: each standing hunter pays a share of current Health for Might this floor.
    const price = rules.pricePaid;
    for (const h of hunters) {
      if (!standing(h)) continue;
      const lost = Math.min(h.health - 1, Math.floor(h.health * price.healthLost));
      h.health -= lost;
      h.statusPct.might += price.might;
      emit(f, {
        actor: h.id,
        kind: 'rule',
        text: () =>
          `A price paid: ${h.name} gives up ${lost} Health for +${Math.round(price.might * 100)}% Might · ${h.name} ${h.health}/${h.maxHealth}`,
        rolls: [],
        amount: lost,
        targetHealth: h.health,
      });
    }
  }
  resolveEnds(f);
  const threshold = K.meterThreshold;
  const maxTicks = K.maxTicks;
  let tick = 0;
  const everyone = [...hunters, ...monsterList];
  while (tick < maxTicks && !f.over) {
    tick += 1;
    f.tick = tick;
    // Most ticks nobody acts, so only build the acting list when someone reached the threshold.
    let anyReady = false;
    for (const c of everyone) {
      if (!standing(c) || c.awayLeft > 0) continue;
      c.meter += c.speed;
      if (c.meter >= threshold) anyReady = true;
    }
    if (!anyReady) continue;
    const acting = everyone
      .filter((c) => standing(c) && c.awayLeft === 0 && c.meter >= threshold)
      .sort(actsBefore);
    for (const c of acting) {
      if (f.over) break;
      if (!standing(c) || c.awayLeft > 0) continue; // downed or carried off earlier this tick
      c.meter -= threshold;
      c.actions += 1;
      if (c.lostActions > 0) loseAction(f, c);
      else if (c.side === 'hunter') {
        hunterAct(f, c);
        partyActed(f, c);
      } else monsterAct(f, c);
      endOwnAction(c);
    }
  }
  const endedBy = f.over ?? 'retreat';
  const result = endedBy === 'monster-down' ? 'win' : 'loss';
  emit(f, {
    actor: monster.id,
    kind: 'end',
    text: () =>
      endedBy === 'monster-down'
        ? `Success at tick ${f.tick}`
        : endedBy === 'party-down'
          ? `Failure at tick ${f.tick}: the party is down`
          : `Failure at tick ${f.tick}: the party retreats`,
    rolls: [],
  });
  return {
    result,
    endedBy,
    ticks: f.tick,
    log: f.log,
    hunters: hunters.map((h) => ({
      id: h.id,
      health: h.health,
      maxHealth: h.maxHealth,
      downed: h.health <= 0,
    })),
    monsterHealth: monsterList.reduce((s, m) => s + Math.max(0, m.health), 0),
    monsterMaxHealth: monsterList.reduce((s, m) => s + m.maxHealth, 0),
    monsters: monsterList.map((m) => ({
      id: m.id,
      name: m.name,
      health: m.health,
      maxHealth: m.maxHealth,
    })),
    saltburstCancelled: f.saltburstCancelled,
    ...(delve ? { delve: { kills: delve.kills + f.kills, vigilUsed: f.vigilUsed } } : {}),
    potionsUsed: hunters.filter((h) => h.potion?.used === true).map((h) => h.id),
  };
};
