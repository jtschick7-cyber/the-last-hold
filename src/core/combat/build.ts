import { gear } from '../../content/gear';
import { traits } from '../../content/traits';
import { num } from '../balance-access';
import { intPow } from '../math';
import { hunterKit } from './prep';
import type { Preparation } from '../state/game-state';
import { speciesOf } from './species';
import type { Combatant, FightMonster, HunterSnapshot } from './types';

// GDD §5.3.2 and §7.4: hunters scale with level (Health and Might only), monsters
// with tier above their base tier. Health is always a whole number: round half up.

export const roundHalfUp = (x: number): number => Math.floor(x + 0.5);

const zero = { might: 0, armor: 0, speed: 0 } as const;

const kit = {
  spoiled: false,
  burnLeft: 0,
  burnAmount: 0,
  chillLeft: 0,
  healCutLeft: 0,
  healCut: 0,
  abilitiesBlocked: 0,
  hitBonus: 0,
  fireTakenPotion: 0,
  steadfastLeft: 0,
  tonicLeft: 0,
  extraTaken: 0,
} as const;

export const buildHunter = (h: HunterSnapshot, slot: number, prep?: Preparation): Combatant => {
  const { oilFamily, potion } = hunterKit(h, prep);
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
    family: null,
    attacks: 1,
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
    runeSubHit: weapon?.runeSubHit ?? false,
    abilities: [],
    actions: 0,
    lostActions: 0,
    hamstringLeft: 0,
    nextHitTakenMult: 1,
    awayLeft: 0,
    secondSoulUsed: false,
    unthawed: false,
    noonHeatSuppressed: 0,
    oilFamily,
    potion,
    ...kit,
  };
};

/** `strength` multiplies Health and Might: Threat in the Last Stand (GDD §5.9.1); 1 elsewhere. */
export interface MemberOptions {
  /** Group order, 0-based (D251). */
  readonly slot: number;
  /** Unique within the fight; the species id for the first of its kind. */
  readonly id: string;
  /** "first Upyr" when a species appears twice; the species name otherwise. */
  readonly name: string;
}

export const buildMonster = (
  m: FightMonster,
  strength = 1,
  member?: MemberOptions,
  nameless = 0,
): Combatant => {
  const def = speciesOf(m);
  const steps = m.tier - def.baseTier;
  const tierScale = intPow(num('monster.statGrowth'), steps);
  const statScale = strength === 1 ? tierScale : tierScale * strength;
  const armorScale = intPow(num('monster.armorGrowth'), steps);
  // The Forgotten's Nameless (a passive, GDD §8.3): +3% Might and Health (stat%) per contract species not yet Studied.
  let namelessHealth = 1;
  let namelessMight = 1;
  for (const a of def.abilities)
    if (a.kind === 'nameless') {
      namelessHealth = 1 + a.healthPerSpecies * nameless;
      namelessMight = 1 + a.mightPerSpecies * nameless;
    }
  const healthBase =
    m.healthMult === undefined ? def.health * statScale : def.health * statScale * m.healthMult;
  const maxHealth = roundHalfUp(namelessHealth === 1 ? healthBase : healthBase * namelessHealth);
  const mightBase =
    m.mightMult === undefined ? def.might * statScale : def.might * statScale * m.mightMult;
  const might = namelessMight === 1 ? mightBase : mightBase * namelessMight;
  return {
    side: 'monster',
    id: member?.id ?? def.id,
    name: member?.name ?? def.name,
    role: null,
    family: def.family,
    attacks: def.attacks,
    slot: member?.slot ?? 0,
    health: maxHealth,
    maxHealth,
    meter: 0,
    base: { might, armor: def.armor * armorScale, speed: def.speed },
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
    runeSubHit: false,
    abilities: def.abilities,
    actions: 0,
    lostActions: 0,
    hamstringLeft: 0,
    nextHitTakenMult: 1,
    awayLeft: 0,
    secondSoulUsed: false,
    unthawed: false,
    noonHeatSuppressed: 0,
    oilFamily: null,
    potion: null,
    ...kit,
  };
};
