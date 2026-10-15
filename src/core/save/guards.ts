import { CONSUMABLE_IDS, type ConsumableId } from '../../content/consumables';
import { DAMAGE_TYPES, FAMILY_IDS } from '../../content/damage';
import { BONUS_LINE_IDS } from '../../content/items';
import { GEAR_IDS, type GearId } from '../../content/gear';
import { HUNTER_IDS, ROLE_IDS, type HunterId } from '../../content/hunters';
import { TRAIT_IDS, type TraitId } from '../../content/traits';
import type { HunterSnapshot } from '../combat';
import type { Preparation } from '../state/game-state';
import type { ItemLine } from '../state/item-state';

// Technical design §9.4: the shared readers of the hand-written save guard. Each
// takes plain JSON and a path for the error message, and throws `Invalid` when
// the value can't be used.

export class Invalid extends Error {}

export type Obj = Record<string, unknown>;

export const obj = (v: unknown, where: string): Obj => {
  if (typeof v !== 'object' || v === null || Array.isArray(v))
    throw new Invalid(`${where} is missing.`);
  return v as Obj;
};
export const finite = (v: unknown, where: string): number => {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Invalid(`${where} isn't a number.`);
  return v;
};
export const nonNegative = (v: unknown, where: string): number => {
  const n = finite(v, where);
  if (n < 0) throw new Invalid(`${where} is negative.`);
  return n;
};
export const count = (v: unknown, where: string): number => {
  const n = nonNegative(v, where);
  if (!Number.isInteger(n)) throw new Invalid(`${where} isn't a whole number.`);
  return n;
};
export const unit = (v: unknown, where: string): number => {
  const n = nonNegative(v, where);
  if (n > 1) throw new Invalid(`${where} is above 1.`);
  return n;
};
export const bool = (v: unknown, where: string): boolean => {
  if (typeof v !== 'boolean') throw new Invalid(`${where} isn't true or false.`);
  return v;
};
export const str = (v: unknown, where: string): string => {
  if (typeof v !== 'string') throw new Invalid(`${where} isn't text.`);
  return v;
};

/** A record keyed by content IDs: unknown keys dropped (warned), missing ones 0 (warned). */
export const idRecord = <K extends string>(
  v: unknown,
  ids: readonly K[],
  where: string,
  read: (x: unknown, w: string) => number,
  warnings: string[],
): Record<K, number> => {
  const o = obj(v, where);
  for (const k of Object.keys(o)) {
    if (!(ids as readonly string[]).includes(k))
      warnings.push(`Dropped unknown ${where} entry "${k}".`);
  }
  return Object.fromEntries(
    ids.map((id) => {
      if (!(id in o)) {
        warnings.push(`${where} had no "${id}"; set to 0.`);
        return [id, 0];
      }
      return [id, read(o[id], `${where}.${id}`)];
    }),
  ) as Record<K, number>;
};

export const arr = (v: unknown, where: string): unknown[] => {
  if (!Array.isArray(v)) throw new Invalid(`${where} is missing.`);
  return v;
};
export const oneOf = <T extends string>(v: unknown, allowed: readonly T[], where: string): T => {
  if (typeof v !== 'string' || !(allowed as readonly string[]).includes(v))
    throw new Invalid(`${where} isn't one we know.`);
  return v as T;
};
export const orNull = <T>(v: unknown, read: (x: unknown) => T): T | null =>
  v === null ? null : read(v);

export const hunterId = (v: unknown, where: string): HunterId => oneOf(v, HUNTER_IDS, where);
export const gear = (v: unknown, where: string): GearId | null =>
  orNull(v, (x) => oneOf(x, GEAR_IDS, where));

export const snapshot = (v: unknown, where: string): HunterSnapshot => {
  const o = obj(v, where);
  const base = obj(o.base, `${where}.base`);
  return {
    id: hunterId(o.id, `${where}.id`),
    name: str(o.name, `${where}.name`),
    role: oneOf(o.role, ROLE_IDS, `${where}.role`),
    damage: oneOf(o.damage, DAMAGE_TYPES, `${where}.damage`),
    level: count(o.level, `${where}.level`),
    base: {
      health: nonNegative(base.health, `${where}.base.health`),
      might: nonNegative(base.might, `${where}.base.might`),
      armor: nonNegative(base.armor, `${where}.base.armor`),
      speed: nonNegative(base.speed, `${where}.base.speed`),
    },
    traits: arr(o.traits, `${where}.traits`).map((t, i) =>
      oneOf<TraitId>(t, TRAIT_IDS, `${where}.traits[${i}]`),
    ),
    weapon: gear(o.weapon, `${where}.weapon`),
    armorGear: gear(o.armorGear, `${where}.armorGear`),
    ...(o.lines === undefined ? {} : { lines: itemLines(o.lines, `${where}.lines`) }),
    ...(o.stars === undefined ? {} : { stars: count(o.stars, `${where}.stars`) }),
  };
};

const itemLine = (v: unknown, where: string): ItemLine => {
  const o = obj(v, where);
  const kind = oneOf(o.kind, BONUS_LINE_IDS, `${where}.kind`);
  const family =
    o.family === undefined ? undefined : oneOf(o.family, FAMILY_IDS, `${where}.family`);
  if ((kind === 'bane') !== (family !== undefined))
    throw new Invalid(`${where}: only a bane line names a family, and it must.`);
  const size = nonNegative(o.size, `${where}.size`);
  return family === undefined ? { kind, size } : { kind, size, family };
};

export const itemLines = (v: unknown, where: string): ItemLine[] =>
  arr(v, where).map((l, i) => itemLine(l, `${where}[${i}]`));

export const knowledgeLevel = (v: unknown, where: string): number => {
  const n = count(v, where);
  if (n > 4) throw new Invalid(`${where} is above 4.`);
  return n;
};

export const consumableId = (v: unknown, where: string): ConsumableId =>
  oneOf<ConsumableId>(v, CONSUMABLE_IDS, where);

/** A hunter → consumable map; both sides must be known, or the entry is a hard error. */
export const perHunter = (v: unknown, where: string): Partial<Record<HunterId, ConsumableId>> => {
  const out: Partial<Record<HunterId, ConsumableId>> = {};
  for (const [k, x] of Object.entries(obj(v, where))) {
    out[hunterId(k, `${where}.${k}`)] = consumableId(x, `${where}.${k}`);
  }
  return out;
};

export const preparation = (v: unknown, where: string): Preparation => {
  const o = obj(v, where);
  return {
    oils: perHunter(o.oils, `${where}.oils`),
    potions: perHunter(o.potions, `${where}.potions`),
    bombs: arr(o.bombs, `${where}.bombs`).map((b, i) => consumableId(b, `${where}.bombs[${i}]`)),
  };
};

/** A sparse count record keyed by content IDs; unknown keys are dropped with a warning. */
export const sparseCounts = <K extends string>(
  v: unknown,
  ids: readonly K[],
  where: string,
  warnings: string[],
): Partial<Record<K, number>> => {
  const o = obj(v, where);
  const out: Partial<Record<K, number>> = {};
  for (const [k, x] of Object.entries(o)) {
    if (!(ids as readonly string[]).includes(k)) {
      warnings.push(`Dropped unknown ${where} entry "${k}".`);
      continue;
    }
    out[k as K] = count(x, `${where}.${k}`);
  }
  return out;
};
