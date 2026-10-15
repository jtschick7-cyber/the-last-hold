import { balance } from '../../content/balance';
import { FAMILY_IDS } from '../../content/damage';
import { GEAR_IDS, gear } from '../../content/gear';
import type { HunterId } from '../../content/hunters';
import { BONUS_LINE_IDS, ITEM_RARITY_IDS, itemRarities } from '../../content/items';
import { LEGENDARY_IDS, type LegendaryId } from '../../content/legendaries';
import { HUNTER_RANK_IDS } from '../../content/ranks';
import { talentById } from '../../content/talents';
import { hunters as hunterContent } from '../../content/hunters';
import type { GameState, HunterState } from '../state/game-state';
import type { ItemLine, ItemState } from '../state/item-state';
import { arr, count, hunterId, Invalid, nonNegative, obj, oneOf, orNull, str } from './guards';

// Technical design §5.2 (v8): the guard for items, Legendaries and the hunter growth fields. An
// unknown id of content that was removed is dropped with a warning; a save whose items disagree
// with its hunters cannot be trusted and refuses to load.

type Growth = Pick<HunterState, 'rank' | 'stars' | 'talents' | 'keepsake'>;

/** A hunter's rank, stars, talents and keepsake. */
export const growthFrom = (
  o: Record<string, unknown>,
  id: HunterId,
  where: string,
  warnings: string[],
): Growth => {
  const stars = count(o.stars, `${where}.stars`);
  if (stars > balance.star.max.value)
    throw new Invalid(`${where}.stars is above ${balance.star.max.value}.`);
  const talents: string[] = [];
  for (const [i, t] of arr(o.talents, `${where}.talents`).entries()) {
    const tid = str(t, `${where}.talents[${i}]`);
    const def = talentById(tid);
    if (!def || def.role !== hunterContent[id].role || talents.includes(tid)) {
      warnings.push(`Dropped talent "${tid}" from ${id}.`);
      continue;
    }
    talents.push(tid);
  }
  return {
    rank: oneOf(o.rank, HUNTER_RANK_IDS, `${where}.rank`),
    stars,
    talents,
    keepsake: orNull(o.keepsake, (x) => oneOf<LegendaryId>(x, LEGENDARY_IDS, `${where}.keepsake`)),
  };
};

const line = (v: unknown, where: string): ItemLine => {
  const o = obj(v, where);
  const kind = oneOf(o.kind, BONUS_LINE_IDS, `${where}.kind`);
  const family =
    o.family === undefined ? undefined : oneOf(o.family, FAMILY_IDS, `${where}.family`);
  if ((kind === 'bane') !== (family !== undefined))
    throw new Invalid(`${where}: only a bane line names a family, and it must.`);
  const size = nonNegative(o.size, `${where}.size`);
  return family === undefined ? { kind, size } : { kind, size, family };
};

const item = (v: unknown, where: string): ItemState => {
  const o = obj(v, where);
  const rarity = oneOf(o.rarity, ITEM_RARITY_IDS, `${where}.rarity`);
  const lines = arr(o.lines, `${where}.lines`).map((l, i) => line(l, `${where}.lines[${i}]`));
  if (lines.length !== itemRarities[rarity].lines)
    throw new Invalid(`${where} has ${lines.length} lines for a ${rarity} item.`);
  const paid = obj(o.paid, `${where}.paid`);
  const w = orNull(o.where, (x) => {
    const p = obj(x, `${where}.where`);
    return {
      hunter: hunterId(p.hunter, `${where}.where.hunter`),
      slot: oneOf(p.slot, ['weapon', 'armor'] as const, `${where}.where.slot`),
    };
  });
  return {
    id: str(o.id, `${where}.id`),
    base: oneOf(o.base, GEAR_IDS, `${where}.base`),
    rarity,
    lines,
    paid: {
      iron: nonNegative(paid.iron, `${where}.paid.iron`),
      silver: nonNegative(paid.silver, `${where}.paid.silver`),
    },
    where: w,
  };
};

export interface ItemsPart {
  items: GameState['items'];
  itemSeq: number;
  legendaries: GameState['legendaries'];
}

/** The items and Legendaries of a save, checked against the hunters that wear them (mutates `owned`'s keepsakes if they must be repaired). */
export const itemsFrom = (
  s: Record<string, unknown>,
  owned: GameState['hunters'],
  warnings: string[],
): ItemsPart => {
  const items = arr(s.items, 'items').map((x, i) => item(x, `items[${i}]`));
  const ids = new Set(items.map((i) => i.id));
  if (ids.size !== items.length) throw new Invalid('items lists one twice.');
  const highest = Math.max(0, ...items.map((i) => Number(/^i(\d+)$/.exec(i.id)?.[1] ?? 0)));
  let itemSeq = count(s.itemSeq, 'itemSeq');
  if (itemSeq < highest) {
    warnings.push('The item counter was repaired.');
    itemSeq = highest;
  }
  for (const [hid, h] of Object.entries(owned) as [HunterId, HunterState][]) {
    for (const slot of ['weapon', 'armor'] as const) {
      const id = slot === 'weapon' ? h.weapon : h.armor;
      if (id === null) continue;
      const it = items.find((x) => x.id === id);
      if (!it) throw new Invalid(`${hid} wears an item (${id}) that does not exist.`);
      if (gear[it.base].slot !== slot) throw new Invalid(`${hid} wears ${id} in the wrong slot.`);
      if (it.where?.hunter !== hid || it.where.slot !== slot)
        throw new Invalid(`${id} is not recorded as worn by ${hid}.`);
    }
  }
  for (const it of items) {
    if (!it.where) continue;
    const h = owned[it.where.hunter];
    const worn = it.where.slot === 'weapon' ? h?.weapon : h?.armor;
    if (!h || worn !== it.id)
      throw new Invalid(`${it.id} is recorded as worn but nobody wears it.`);
  }

  const legendaries: GameState['legendaries'] = [];
  for (const [i, x] of arr(s.legendaries, 'legendaries').entries()) {
    const o = obj(x, `legendaries[${i}]`);
    const id = o.id;
    if (
      !(LEGENDARY_IDS as readonly unknown[]).includes(id) ||
      legendaries.some((l) => l.id === id)
    ) {
      warnings.push(`Dropped unknown or repeated Legendary "${String(id)}".`);
      continue;
    }
    legendaries.push({ id: id as LegendaryId, cycle: count(o.cycle, `legendaries[${i}].cycle`) });
  }
  const worn = new Set<LegendaryId>();
  for (const [hid, h] of Object.entries(owned) as [HunterId, HunterState][]) {
    if (h.keepsake === null) continue;
    if (!legendaries.some((l) => l.id === h.keepsake) || worn.has(h.keepsake)) {
      warnings.push(`${hid}'s keepsake was removed: not found, or already worn.`);
      h.keepsake = null;
    } else worn.add(h.keepsake);
  }
  return { items, itemSeq, legendaries };
};
