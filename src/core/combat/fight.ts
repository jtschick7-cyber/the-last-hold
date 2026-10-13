import { monsters } from '../../content/monsters';
import { num } from '../balance-access';
import { buildHunter, buildMonster, roundHalfUp } from './build';
import { endOfMonsterAction, heal, startOfMonsterAction } from './abilities';
import { directAttack } from './damage';
import { emit, type Fight } from './fight-state';
import { healthPct, monsterFamily, present, speedEff, standing, type FightContext } from './stats';
import type { Combatant, FightInput, FightResult } from './types';

// GDD §5.5: an auto-battle on a turn meter. Each tick every standing combatant's
// meter rises by its Speed; whoever reaches the threshold acts once and loses the
// threshold from the meter. Ties go: higher meter, higher Speed, hunters before
// the monster, party slot order (no randomness is drawn for ties).

const actsBefore = (a: Combatant, b: Combatant): number =>
  b.meter - a.meter ||
  speedEff(b) - speedEff(a) ||
  (a.side === b.side ? 0 : a.side === 'hunter' ? -1 : 1) ||
  a.slot - b.slot;

/** A status that counts the holder's own actions ends here (Hamstring). */
const endOwnAction = (c: Combatant): void => {
  if (c.hamstringLeft > 0) {
    c.hamstringLeft -= 1;
    if (c.hamstringLeft === 0) c.statusPct.speed = 0;
  }
};

/** Monster at 0 Health (Second Soul may raise it once); every hunter downed. */
const resolveEnds = (f: Fight): void => {
  const m = f.monster;
  if (m.health <= 0) {
    const soul = m.abilities.find((a) => a.kind === 'secondSoul');
    if (soul && !m.secondSoulUsed) {
      m.secondSoulUsed = true;
      m.health = roundHalfUp(m.maxHealth * soul.reviveFraction);
      emit(f, {
        actor: m.id,
        kind: 'ability',
        text: `${m.name} rises again with its second soul · ${m.name} ${m.health}/${m.maxHealth}`,
        rolls: [],
        targetHealth: m.health,
      });
    } else {
      f.over = 'monster-down';
      return;
    }
  }
  if (f.hunters.every((h) => !standing(h))) f.over = 'party-down';
};

const loseAction = (f: Fight, c: Combatant): void => {
  c.lostActions -= 1;
  emit(f, { actor: c.id, kind: 'skip', text: `${c.name} loses their action`, rolls: [] });
};

const hunterAct = (f: Fight, c: Combatant): void => {
  const mender = c.role === 'mender';
  if (mender) {
    const threshold = num('mender.healBelow');
    let patient: Combatant | null = null;
    for (const h of f.hunters) {
      if (!present(h) || healthPct(h) >= threshold) continue;
      if (!patient || healthPct(h) < healthPct(patient)) patient = h; // ties: slot order
    }
    if (patient) {
      let bonus = 0;
      for (const e of c.traits) if (e.kind === 'healingDone') bonus += e.amount;
      const base = num('mender.healMult') * (c.base.might + c.flat.might);
      const healed = heal(patient, roundHalfUp(base * (1 + bonus)));
      emit(f, {
        actor: c.id,
        kind: 'heal',
        target: patient.id,
        text: `${c.name} (Mender) heals ${patient.name} for ${healed} · ${patient.name} ${patient.health}/${patient.maxHealth}`,
        rolls: [],
        amount: healed,
        targetHealth: patient.health,
      });
      return;
    }
  }
  directAttack(f, c, f.monster, mender ? { mightMult: num('mender.attackMult') } : {});
  resolveEnds(f);
};

/** Picks the target by weight, walking standing hunters in slot order (GDD §5.5 rule 1). */
const pickTarget = (
  f: Fight,
  candidates: readonly Combatant[],
): { target: Combatant; pre: number[] } | null => {
  const first = candidates[0];
  if (!first) return null;
  if (candidates.length === 1) return { target: first, pre: [] };
  const weight = (h: Combatant): number =>
    h.role === 'vanguard' ? num('target.vanguardWeight') : num('target.otherWeight');
  const total = candidates.reduce((s, h) => s + weight(h), 0);
  const roll = f.rolls.next();
  const point = roll * total;
  let walked = 0;
  for (const h of candidates) {
    walked += weight(h);
    if (point < walked) return { target: h, pre: [roll] };
  }
  return { target: candidates[candidates.length - 1] ?? first, pre: [roll] };
};

const monsterAct = (f: Fight, m: Combatant): void => {
  const skipAttack = startOfMonsterAction(f, m);
  resolveEnds(f);
  if (!skipAttack) {
    for (let i = 0; i < f.ctx.attacks && !f.over; i++) {
      const picked = pickTarget(f, f.hunters.filter(present));
      if (!picked) break;
      directAttack(f, m, picked.target, { pre: picked.pre });
      resolveEnds(f);
    }
  }
  if (!f.over) {
    endOfMonsterAction(f, m);
    resolveEnds(f);
  }
};

export const runFight = (input: FightInput): FightResult => {
  const hunters = input.party.map((h, i) => buildHunter(h, i + 1));
  const monster = buildMonster(input.monster);
  const ctx: FightContext = {
    location: input.location,
    family: monsterFamily(input.monster.monster),
    monsterId: input.monster.monster,
    attacks: monsters[input.monster.monster].attacks,
  };
  const f: Fight = {
    tick: 0,
    hunters,
    monster,
    rolls: input.rolls,
    ctx,
    log: [],
    over: null,
  };
  const threshold = num('combat.meterThreshold');
  const maxTicks = num('combat.maxTicks');
  let tick = 0;
  while (tick < maxTicks && !f.over) {
    tick += 1;
    f.tick = tick;
    const all = [...hunters, monster].filter((c) => standing(c) && c.awayLeft === 0);
    for (const c of all) c.meter += speedEff(c);
    const acting = all.filter((c) => c.meter >= threshold).sort(actsBefore);
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
    text:
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
    monsterHealth: monster.health,
    monsterMaxHealth: monster.maxHealth,
  };
};
