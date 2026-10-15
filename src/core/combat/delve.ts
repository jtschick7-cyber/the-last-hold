import { blessingById } from '../../content/delves/blessings';
import type { BlessingEffect, BlessingRule } from '../../content/delves/blessing-types';
import { delveRelics, type DelveRelicId } from '../../content/delves/relics';
import type { DamageType } from '../../content/damage';
import { gear } from '../../content/gear';
import type { HunterSnapshot } from './types';

// GDD §5.10.5 and §8.8 (D254, D255, D257, D261): what a Delve run's blessings and relics do inside
// a fight. Simple ones go through the existing buckets (§5.0); the ★ rules are Delve-only and are
// switched on per fight from `FightRules`. Location traits do not apply (as in the Last Stand).
// Nothing here runs unless a fight is given `delve` options, so contract fights and stands are
// exactly what they were.

/** The ★ rules and Unlit switches in force this fight. */
export interface FightRules {
  readonly smithsMark: number;
  readonly forgeWelded: boolean;
  readonly oneThread: number;
  readonly mendedCloth: number;
  readonly packGrows: { readonly perKill: number; readonly max: number } | null;
  readonly wolfsShare: boolean;
  readonly pricePaid: { readonly healthLost: number; readonly might: number } | null;
  readonly longVigil: number;
  readonly toll: number;
  readonly struckBronze: boolean;
  readonly knockback: { readonly every: number; readonly amount: number } | null;
  readonly monsterStartMeter: number;
  readonly knowledgeOff: boolean;
  readonly nothingRestores: boolean;
  readonly menderNeverHeals: boolean;
  readonly actionDrain: number;
}

export const NO_RULES: FightRules = {
  smithsMark: 0,
  forgeWelded: false,
  oneThread: 0,
  mendedCloth: 0,
  packGrows: null,
  wolfsShare: false,
  pricePaid: null,
  longVigil: 0,
  toll: 0,
  struckBronze: false,
  knockback: null,
  monsterStartMeter: 0,
  knowledgeOff: false,
  nothingRestores: false,
  menderNeverHeals: false,
  actionDrain: 0,
};

/** Everything a hunter gains or loses, added up from the blessings and relics (§5.0 buckets). */
export interface HunterBoost {
  healthPct: number;
  mightPct: number;
  mightFlat: number;
  armorFlat: number;
  speedFlat: number;
  critPoints: number;
  hitPoints: number;
  critMult: number;
  dealtBonus: number;
  takenAll: number;
  takenByType: Partial<Record<DamageType, number>>;
  vanguardShield: number;
  healBonus: number;
  healThreshold: number | null;
  lowHealth: { below: number; amount: number } | null;
}

export interface MonsterBoost {
  speedPct: number;
  mightPct: number;
  hitPoints: number;
}

export interface ActiveEffects {
  readonly effects: readonly BlessingEffect[];
  readonly rules: readonly BlessingRule[];
}

/** The effects of the blessings taken and the Delve relics owned (relics work only in Delves, D261). */
export const activeEffects = (
  blessingIds: readonly string[],
  relicIds: readonly DelveRelicId[],
): ActiveEffects => {
  const effects: BlessingEffect[] = [];
  const rules: BlessingRule[] = [];
  for (const id of blessingIds) {
    const b = blessingById(id);
    if (!b) continue;
    effects.push(...b.effects, ...(b.drawbacks ?? []));
    if (b.rule) rules.push(b.rule);
  }
  for (const id of relicIds) {
    const e = delveRelics[id].effect;
    if (e.kind === 'mightPct') effects.push({ kind: 'mightPct', amount: e.amount });
    else if (e.kind === 'takenPct') effects.push({ kind: 'takenPct', amount: e.amount });
  }
  return { effects, rules };
};

const param = (
  rules: readonly BlessingRule[],
  id: BlessingRule['rule'],
  key: string,
): number | null => {
  const r = rules.find((x) => x.rule === id);
  return r ? (r.params[key] ?? 0) : null;
};

export const rulesFrom = ({ effects, rules }: ActiveEffects): FightRules => {
  const pack = param(rules, 'pack-grows', 'perKill');
  const price = param(rules, 'price-paid', 'healthLost');
  const knock = effects.find((e) => e.kind === 'knockbackEveryNth');
  let startMeter = 0;
  let knowledgeOff = false;
  let nothing = false;
  let menderNever = false;
  let drain = 0;
  for (const e of effects) {
    if (e.kind === 'monsterStartMeter') startMeter = e.value;
    else if (e.kind === 'switch') {
      if (e.switch === 'knowledge-off') knowledgeOff = true;
      else if (e.switch === 'nothing-restores') nothing = true;
      else if (e.switch === 'mender-never-heals') menderNever = true;
      else if (e.switch === 'health-per-action') drain = e.amount ?? 0;
    }
  }
  return {
    smithsMark: param(rules, 'smiths-mark', 'subHit') ?? 0,
    forgeWelded: param(rules, 'forge-welded', 'minimum') !== null,
    oneThread: param(rules, 'one-thread', 'share') ?? 0,
    mendedCloth: nothing ? 0 : (param(rules, 'mended-cloth', 'health') ?? 0),
    packGrows:
      pack === null ? null : { perKill: pack, max: param(rules, 'pack-grows', 'max') ?? 0 },
    wolfsShare: param(rules, 'wolfs-share', 'extraActions') !== null,
    pricePaid:
      price === null
        ? null
        : { healthLost: price, might: param(rules, 'price-paid', 'might') ?? 0 },
    longVigil: nothing ? 0 : (param(rules, 'long-vigil', 'health') ?? 0),
    toll: param(rules, 'toll', 'knockback') ?? 0,
    struckBronze: rules.some((r) => r.rule === 'struck-bronze'),
    knockback:
      knock && knock.kind === 'knockbackEveryNth'
        ? { every: knock.every, amount: knock.amount }
        : null,
    monsterStartMeter: startMeter,
    knowledgeOff,
    nothingRestores: nothing,
    menderNeverHeals: menderNever,
    actionDrain: drain,
  };
};

const tierOf = (id: HunterSnapshot['weapon']): number => (id ? gear[id].tier : 0);

/** What the effects do to one hunter, given the whole party (the per-role and per-type ones need it). */
export const boostFor = (
  h: HunterSnapshot,
  party: readonly HunterSnapshot[],
  { effects }: ActiveEffects,
): HunterBoost => {
  const roles = new Set(party.map((p) => p.role)).size;
  const types = new Set(party.map((p) => p.damage)).size;
  const b: HunterBoost = {
    healthPct: 0,
    mightPct: 0,
    mightFlat: 0,
    armorFlat: 0,
    speedFlat: 0,
    critPoints: 0,
    hitPoints: 0,
    critMult: 0,
    dealtBonus: 0,
    takenAll: 0,
    takenByType: {},
    vanguardShield: 0,
    healBonus: 0,
    healThreshold: null,
    lowHealth: null,
  };
  const weaponTier = tierOf(h.weapon);
  const armorTier = h.armorGear ? gear[h.armorGear].tier : 0;
  for (const e of effects) {
    switch (e.kind) {
      case 'mightPct':
        b.mightPct += e.amount;
        break;
      case 'mightPerWeaponTier':
        b.mightFlat += e.amount * weaponTier;
        break;
      case 'mightPctPerRole':
        b.mightPct += e.amount * roles;
        break;
      case 'mightPctBelowHealth':
        b.lowHealth = { below: e.below, amount: e.amount };
        break;
      case 'armorFlat':
        b.armorFlat += e.amount;
        break;
      case 'armorPerArmorTier':
        b.armorFlat += e.amount * armorTier;
        break;
      case 'healthPct':
        b.healthPct += e.amount;
        break;
      case 'speedFlat':
        b.speedFlat += e.amount;
        break;
      case 'speedPerRole':
        b.speedFlat += e.amount * roles;
        break;
      case 'dealtPct':
        if (e.minWeaponTier === undefined || weaponTier >= e.minWeaponTier)
          b.dealtBonus += e.amount;
        break;
      case 'dealtPctPerDamageType':
        b.dealtBonus += e.amount * types;
        break;
      case 'takenPct':
        if (e.types) for (const t of e.types) b.takenByType[t] = (b.takenByType[t] ?? 0) + e.amount;
        else b.takenAll += e.amount;
        break;
      case 'takenPctPerRole':
        b.takenAll += e.amount * roles;
        break;
      case 'takenPctOthersWhileVanguard':
        b.vanguardShield += e.amount;
        break;
      case 'healPct':
        b.healBonus += e.amount;
        break;
      case 'menderThreshold':
        b.healThreshold = e.value;
        break;
      case 'critPoints':
        b.critPoints += e.amount;
        break;
      case 'hitPoints':
        b.hitPoints += e.amount;
        break;
      case 'critMult':
        b.critMult = Math.max(b.critMult, e.value);
        break;
      default:
        break; // monster effects, recovery and the switches are read elsewhere
    }
  }
  return b;
};

export const monsterBoostFrom = ({ effects }: ActiveEffects): MonsterBoost => {
  const b: MonsterBoost = { speedPct: 0, mightPct: 0, hitPoints: 0 };
  for (const e of effects) {
    if (e.kind === 'monsterSpeedPct') b.speedPct += e.amount;
    else if (e.kind === 'monsterMightPct') b.mightPct += e.amount;
    else if (e.kind === 'monsterHitPoints') b.hitPoints += e.amount;
  }
  return b;
};
