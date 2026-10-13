import { gear } from '../../content/gear';
import { traits } from '../../content/traits';
import { monsters } from '../../content/monsters';
import { num } from '../balance-access';
import { intPow } from '../math';
import type { Combatant, HunterSnapshot, MonsterInstance } from './types';

// GDD §5.3.2 and §7.4: hunters scale with level (Health and Might only), monsters
// with tier above their base tier. Health is always a whole number: round half up.

export const roundHalfUp = (x: number): number => Math.floor(x + 0.5);

const zero = { might: 0, armor: 0, speed: 0 } as const;

export const buildHunter = (h: HunterSnapshot, slot: number): Combatant => {
  const scale = 1 + num('hunter.levelStatGrowth') * (h.level - 1);
  const effects = h.traits.map((t) => traits[t].effect);
  const weapon = h.weapon ? gear[h.weapon] : null;
  const armor = h.armorGear ? gear[h.armorGear] : null;
  let varianceLo = num('combat.varianceLo');
  let varianceHi = num('combat.varianceHi');
  let critMult = num('combat.critMult');
  let speedFlat = 0;
  for (const e of effects) {
    if (e.kind === 'varianceRange') {
      varianceLo = e.lo;
      varianceHi = e.hi;
    } else if (e.kind === 'critMult') critMult = e.mult;
    else if (e.kind === 'speedFlat') speedFlat += e.amount;
  }
  const maxHealth = roundHalfUp(h.base.health * scale);
  return {
    side: 'hunter',
    id: h.id,
    name: h.name,
    role: h.role,
    slot,
    health: maxHealth,
    maxHealth,
    meter: 0,
    base: { might: h.base.might * scale, armor: h.base.armor, speed: h.base.speed },
    flat: {
      might: weapon?.might ?? 0,
      armor: armor?.armor ?? 0,
      speed: speedFlat,
    },
    statPct: { ...zero },
    statusPct: { ...zero },
    damage: h.damage,
    resist: null,
    varianceLo,
    varianceHi,
    critChance: h.role === 'striker' ? num('striker.critChance') : num('combat.critChance'),
    critMult,
    speed: h.base.speed + speedFlat,
    traits: effects,
    fireTakenReduction: armor?.fireTakenReduction ?? 0,
    silverSubHit: weapon?.silverSubHit ?? false,
    abilities: [],
    actions: 0,
    lostActions: 0,
    hamstringLeft: 0,
    nextHitTakenMult: 1,
    awayLeft: 0,
    secondSoulUsed: false,
    noonHeatSuppressed: 0,
  };
};

export const buildMonster = (m: MonsterInstance): Combatant => {
  const def = monsters[m.monster];
  const steps = m.tier - def.tiers[0];
  const statScale = intPow(num('monster.statGrowth'), steps);
  const armorScale = intPow(num('monster.armorGrowth'), steps);
  const maxHealth = roundHalfUp(def.health * statScale);
  return {
    side: 'monster',
    id: def.id,
    name: def.name,
    role: null,
    slot: 0,
    health: maxHealth,
    maxHealth,
    meter: 0,
    base: { might: def.might * statScale, armor: def.armor * armorScale, speed: def.speed },
    flat: { ...zero },
    statPct: { ...zero },
    statusPct: { ...zero },
    damage: 'steel',
    resist: def.resist,
    varianceLo: num('combat.varianceLo'),
    varianceHi: num('combat.varianceHi'),
    critChance: num('combat.critChance'),
    critMult: num('combat.critMult'),
    speed: def.speed,
    traits: [],
    fireTakenReduction: 0,
    silverSubHit: false,
    abilities: def.abilities,
    actions: 0,
    lostActions: 0,
    hamstringLeft: 0,
    nextHitTakenMult: 1,
    awayLeft: 0,
    secondSoulUsed: false,
    noonHeatSuppressed: 0,
  };
};
