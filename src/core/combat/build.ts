import type { FamilyId } from '../../content/damage';
import { gear } from '../../content/gear';
import { traits } from '../../content/traits';
import { num } from '../balance-access';
import { intPow } from '../math';
import { hunterKit } from './prep';
import type { Preparation } from '../state/game-state';
import { K } from './constants';
import type { HunterBoost } from './delve';
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
  dealtBonus: 0,
  baneVs: {},
  skill: null,
  skillUsed: false,
  skillArmed: false,
  useTaken: 0,
  rimeLeft: 0,
  rimeCut: 0,
  rootLeft: 0,
  rootAmount: 0,
  knowledgeLevel: 0,
  takenByType: {},
  vanguardShield: 0,
  healBonus: 0,
  healThreshold: K.healBelow,
  lowHealth: null,
  runeMark: 0,
  forgeWelded: false,
  noHealing: false,
  menderHeals: true,
  actionDrain: 0,
  abilityHalved: false,
} as const;

export const buildHunter = (
  h: HunterSnapshot,
  slot: number,
  prep?: Preparation,
  boost?: HunterBoost,
): Combatant => {
  const { oilFamily, potion } = hunterKit(h, prep);
  // GDD §5.3.2, §5.11.3: growth per level is 10% plus 1 point per star.
  const scale =
    1 +
    (num('hunter.levelStatGrowth') + num('star.growthPerStar') * (h.stars ?? 0)) * (h.level - 1);
  const effects = h.traits.map((t) => traits[t].effect);
  const weapon = h.weapon ? gear[h.weapon] : null;
  const armor = h.armorGear ? gear[h.armorGear] : null;
  let varianceLo = num('combat.varianceLo');
  let varianceHi = num('combat.varianceHi');
  let critMult = num('combat.critMult');
  let speedFlat = 0;
  // v0.7 alternate traits (GDD §8.5a): crit points, max Health, flat Armor, halved ability damage.
  let traitCrit = 0;
  let traitHealth = 0;
  let traitArmor = 0;
  let abilityHalved = false;
  for (const e of effects) {
    if (e.kind === 'critPoints') traitCrit += e.amount;
    else if (e.kind === 'maxHealthPct') traitHealth += e.amount;
    else if (e.kind === 'armorFlat') traitArmor += e.amount;
    else if (e.kind === 'abilityDamageHalved') abilityHalved = true;
    if (e.kind === 'varianceRange') {
      varianceLo = e.lo;
      varianceHi = e.hi;
    } else if (e.kind === 'critMult') critMult = e.mult;
    else if (e.kind === 'speedFlat') speedFlat += e.amount;
  }
  // v0.8 (D305): the bonus lines of the worn items, each into its bucket (GDD §5.11.2).
  let lineMight = 0;
  let lineHealth = 0;
  let lineArmor = 0;
  let lineCrit = 0;
  const bane: Partial<Record<FamilyId, number>> = {};
  for (const l of h.lines ?? []) {
    if (l.kind === 'might') lineMight += l.size;
    else if (l.kind === 'health') lineHealth += l.size;
    else if (l.kind === 'armor') lineArmor += l.size;
    else if (l.kind === 'speed') speedFlat += l.size;
    else if (l.kind === 'crit') lineCrit += l.size;
    else if (l.family) bane[l.family] = (bane[l.family] ?? 0) + l.size;
  }
  const healthPct = (boost?.healthPct ?? 0) + traitHealth + lineHealth;
  const maxHealth = roundHalfUp(
    healthPct !== 0 ? h.base.health * scale * (1 + healthPct) : h.base.health * scale,
  );
  const hunter: Combatant = {
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
      armor: (armor?.armor ?? 0) + traitArmor + lineArmor,
      speed: speedFlat,
    },
    statPct: { ...zero },
    statusPct: { ...zero },
    damage: h.damage,
    resist: null,
    varianceLo,
    varianceHi,
    critChance:
      (h.role === 'striker' ? num('striker.critChance') : num('combat.critChance')) +
      (boost ? boost.critPoints / 100 : 0) +
      traitCrit / 100 +
      lineCrit,
    // Heavy Jaw: the higher multiplier applies (with Cold-blooded too).
    critMult: boost && boost.critMult > critMult ? boost.critMult : critMult,
    speed: h.base.speed + speedFlat + (boost?.speedFlat ?? 0),
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
  hunter.abilityHalved = abilityHalved;
  hunter.skill = h.skill ?? null;
  hunter.statPct.might += lineMight;
  hunter.baneVs = bane;
  if (boost) {
    hunter.statPct.might += boost.mightPct;
    hunter.flat.might += boost.mightFlat;
    hunter.flat.armor += boost.armorFlat;
    hunter.flat.speed += boost.speedFlat;
    hunter.hitBonus += boost.hitPoints / 100;
    hunter.dealtBonus = boost.dealtBonus;
    hunter.extraTaken += boost.takenAll;
    hunter.takenByType = boost.takenByType;
    hunter.vanguardShield = boost.vanguardShield;
    hunter.healBonus = boost.healBonus;
    if (boost.healThreshold !== null) hunter.healThreshold = boost.healThreshold;
    hunter.lowHealth = boost.lowHealth;
  }
  return hunter;
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
    knowledgeLevel: m.knowledge ?? 0,
  };
};
