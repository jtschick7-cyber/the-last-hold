import { consumables, type ConsumableId } from '../../content/consumables';
import { HUNTER_IDS, type HunterId } from '../../content/hunters';
import type { DamageType, FamilyId } from '../../content/damage';
import { monsters, type MonsterId } from '../../content/monsters';
import { num } from '../balance-access';
import type { GameState, Preparation } from '../state/game-state';

// GDD §5.7: what a party carries. The slots: one oil and one potion per hunter, up to
// `prep.bombSlots` bombs per party. The items are spent when the party sets out.

const known = (id: unknown): id is ConsumableId => typeof id === 'string' && id in consumables;

/** The preparation as seed text, in a fixed order, so the same preparation is always the same seed. */
export const prepIds = (prep: Preparation): string[] => [
  ...HUNTER_IDS.flatMap((h) => (prep.oils[h] ? [`${h}:oil:${prep.oils[h]}`] : [])),
  ...HUNTER_IDS.flatMap((h) => (prep.potions[h] ? [`${h}:potion:${prep.potions[h]}`] : [])),
  ...prep.bombs.map((b) => `bomb:${b}`),
];

/** Every item the preparation uses, with how many of each. */
export const prepCounts = (prep: Preparation): Map<ConsumableId, number> => {
  const out = new Map<ConsumableId, number>();
  const add = (id: ConsumableId): void => void out.set(id, (out.get(id) ?? 0) + 1);
  for (const id of Object.values(prep.oils)) add(id);
  for (const id of Object.values(prep.potions)) add(id);
  for (const id of prep.bombs) add(id);
  return out;
};

/** Null if the preparation fits the slots and the stores; otherwise why not. */
export const prepProblem = (
  state: GameState,
  party: readonly HunterId[],
  prep: Preparation,
): string | null => {
  const slots = (
    kind: 'oil' | 'potion',
    map: Partial<Record<HunterId, ConsumableId>>,
  ): string | null => {
    for (const [hunter, item] of Object.entries(map)) {
      if (!party.includes(hunter as HunterId))
        return 'Preparation is only for hunters in the party.';
      if (!known(item) || consumables[item].kind !== kind)
        return `That does not fit the ${kind} slot.`;
    }
    return null;
  };
  const bad = slots('oil', prep.oils) ?? slots('potion', prep.potions);
  if (bad) return bad;
  if (!Array.isArray(prep.bombs)) return 'Bombs must be a list.';
  if (prep.bombs.length > num('prep.bombSlots'))
    return `A party can throw at most ${num('prep.bombSlots')} bombs.`;
  for (const b of prep.bombs)
    if (!known(b) || consumables[b].kind !== 'bomb') return 'That does not fit a bomb slot.';
  for (const [item, n] of prepCounts(prep))
    if (state.stores[item] < n) return `Not enough ${consumables[item].name} in the stores.`;
  return null;
};

/** Spends the preparation from the stores. */
export const spendPrep = (state: GameState, prep: Preparation): void => {
  for (const [item, n] of prepCounts(prep)) state.stores[item] -= n;
};

/** Does this oil's family match the species? A mismatched oil does nothing (GDD §5.7). */
export const oilMatches = (oil: ConsumableId, monster: MonsterId): boolean => {
  const e = consumables[oil].effect;
  return e.kind === 'oil' && e.family === monsters[monster].family;
};

/** Is the species weak (resistance at or above `prep.weakAt`) to this bomb's damage type? */
export const bombIsWeak = (bomb: ConsumableId, monster: MonsterId): boolean => {
  const e = consumables[bomb].effect;
  return (
    (e.kind === 'burn' || e.kind === 'chill') &&
    monsters[monster].resist[e.damageType] >= num('prep.weakAt')
  );
};

/**
 * GDD §5.7 "well prepared": the contract succeeded with a matching oil on at least one hunter,
 * plus at least one bomb whose damage type the monster is weak to, or a Saltburst that
 * cancelled an ability. The caller checks the contract succeeded.
 */
export const isWellPrepared = (
  monster: MonsterId,
  prep: Preparation,
  saltburstCancelled: boolean,
): boolean => {
  const matchingOil = Object.values(prep.oils).some((id) => oilMatches(id, monster));
  const weakBomb = prep.bombs.some((id) => bombIsWeak(id, monster));
  return matchingOil && (weakBomb || saltburstCancelled);
};

/** Does this oil's family match a named family (a Great Beast or a quarry, GDD §5.12)? */
export const oilFitsFamily = (oil: ConsumableId, family: FamilyId): boolean => {
  const e = consumables[oil].effect;
  return e.kind === 'oil' && e.family === family;
};

/** Is a creature with these resistances weak (at or above `prep.weakAt`) to this bomb's damage type? */
export const bombWeakAgainst = (
  bomb: ConsumableId,
  resist: Readonly<Record<DamageType, number>>,
): boolean => {
  const e = consumables[bomb].effect;
  return (e.kind === 'burn' || e.kind === 'chill') && resist[e.damageType] >= num('prep.weakAt');
};
