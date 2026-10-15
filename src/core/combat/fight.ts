import { K } from './constants';
import { speciesOf } from './species';
import { buildHunter, buildMonster, roundHalfUp } from './build';
import { endOfMonsterAction, heal, startOfMonsterAction } from './abilities';
import { burnTick, cancelsAbility, startOfFight } from './prep';
import { directAttack } from './damage';
import { cap, emit, type Fight } from './fight-state';
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

/**
 * Each monster at 0 Health may be raised once by Second Soul; the fight is won when every
 * monster of the group is down (D251), lost when every hunter is.
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
  }
  if (!anyUp) {
    f.over = 'monster-down';
    return;
  }
  if (f.hunters.every((h) => !standing(h))) f.over = 'party-down';
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

const hunterAct = (f: Fight, c: Combatant): void => {
  const mender = c.role === 'mender';
  if (mender) {
    const threshold = K.healBelow;
    let patient: Combatant | null = null;
    for (const h of f.hunters) {
      if (!present(h) || healthPct(h) >= threshold) continue;
      if (!patient || healthPct(h) < healthPct(patient)) patient = h; // ties: slot order
    }
    if (patient) {
      let bonus = 0;
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
      return;
    }
  }
  // D251: the Vanguard, and the Mender when she attacks, hit the front monster; the Striker the weakest.
  const target = c.role === 'striker' ? weakestMonster(f) : frontMonster(f);
  directAttack(f, c, target, mender ? { mightMult: K.menderAttack } : {});
  resolveEnds(f);
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
  const hunters = input.party.map((h, i) => buildHunter(h, i + 1, input.prep));
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
    knowledgePct: knowledgeBonus(input.monster.knowledge ?? 0),
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
      else if (c.side === 'hunter') hunterAct(f, c);
      else monsterAct(f, c);
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
    potionsUsed: hunters.filter((h) => h.potion?.used === true).map((h) => h.id),
  };
};
