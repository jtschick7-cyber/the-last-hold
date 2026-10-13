import { monsters } from '../../content/monsters';
import type { IngredientId } from '../../content/ingredients';
import { villages } from '../../content/villages';
import { stream } from '../rng';
import type { ContractInstance } from '../state/game-state';

// GDD §8.6 (D87): a success yields `tier` units of each of the species' drops, plus one
// gift reagent from the village, one of its listed gifts picked by the reagent stream.

export const reagentsFor = (
  gameSeed: string,
  contract: Pick<ContractInstance, 'id' | 'monster' | 'tier' | 'village'>,
): Partial<Record<IngredientId, number>> => {
  const out: Partial<Record<IngredientId, number>> = {};
  for (const drop of monsters[contract.monster].drops) out[drop] = (out[drop] ?? 0) + contract.tier;
  const gifts = villages[contract.village].gifts;
  const pick = Math.min(
    gifts.length - 1,
    Math.floor(stream(gameSeed, 'reagents', contract.id).next() * gifts.length),
  );
  const gift = gifts[pick];
  if (gift) out[gift] = (out[gift] ?? 0) + 1;
  return out;
};
