import { consumables, type ConsumableId } from '../../content/consumables';
import { HUNTER_IDS, type HunterId } from '../../content/hunters';
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
  const def = monsters[monster];
  const matchingOil = Object.values(prep.oils).some((id) => {
    const e = consumables[id].effect;
    return e.kind === 'oil' && e.family === def.family;
  });
  const weakBomb = prep.bombs.some((id) => {
    const e = consumables[id].effect;
    return (
      (e.kind === 'burn' || e.kind === 'chill') && def.resist[e.damageType] >= num('prep.weakAt')
    );
  });
  return matchingOil && (weakBomb || saltburstCancelled);
};
