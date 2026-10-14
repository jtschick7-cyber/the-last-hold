import { INGREDIENT_IDS, type IngredientId } from '../../content/ingredients';
import { SKILL_IDS } from '../../content/skills';
import { BANDS, type Band } from '../../content/story/scenes';
import { balance } from '../../content/balance';
import type { KettleJob } from '../state/game-state';
import {
  pairKey,
  startingBook,
  type PropertyIndex,
  type RecipeBook,
  type SkillXp,
} from '../state/book-state';
import { RESOURCE_IDS } from '../../content/resources';
import {
  arr,
  consumableId,
  count,
  finite,
  idRecord,
  Invalid,
  obj,
  oneOf,
  orNull,
  str,
} from './guards';

// Technical design §5.2 (v6, plan T6.3): the recipe book, warden skills, kettle jobs and
// the Alchemy level, as the save guard reads them.

export const bookFrom = (v: unknown, warnings: string[]): RecipeBook => {
  const o = obj(v, 'book');
  const props = obj(o.properties, 'book.properties');
  const start = startingBook();
  const properties = Object.fromEntries(
    INGREDIENT_IDS.map((id) => {
      if (!(id in props)) {
        warnings.push(`book.properties had no "${id}"; reset to what the book starts with.`);
        return [id, start.properties[id]];
      }
      const seen = arr(props[id], `book.properties.${id}`).map((x, i) =>
        Number(oneOf(String(x), ['0', '1', '2'], `book.properties.${id}[${i}]`)),
      ) as PropertyIndex[];
      if (new Set(seen).size !== seen.length)
        throw new Invalid(`book.properties.${id} lists one twice.`);
      return [id, [...seen].sort() as PropertyIndex[]];
    }),
  ) as Record<IngredientId, PropertyIndex[]>;
  for (const k of Object.keys(props))
    if (!(INGREDIENT_IDS as readonly string[]).includes(k))
      warnings.push(`Dropped unknown book.properties entry "${k}".`);
  const tried = arr(o.tried, 'book.tried').map((x, i) => {
    const key = str(x, `book.tried[${i}]`);
    const [a, b, extra] = key.split('+');
    const ok =
      extra === undefined &&
      (INGREDIENT_IDS as readonly string[]).includes(a ?? '') &&
      (INGREDIENT_IDS as readonly string[]).includes(b ?? '') &&
      a !== b &&
      pairKey(a as IngredientId, b as IngredientId) === key;
    if (!ok) throw new Invalid(`book.tried[${i}] isn't a pair of ingredients.`);
    return key;
  });
  if (new Set(tried).size !== tried.length) throw new Invalid('book.tried lists one twice.');
  return { properties, tried };
};

export const skillsFrom = (v: unknown, warnings: string[]): SkillXp =>
  idRecord(v, SKILL_IDS, 'skills', count, warnings);

/** A warden's Alchemy level, frozen on a fight or stand record (D206). */
export const alchemyLevel = (v: unknown, where: string): number => {
  const n = count(v, where);
  if (n > balance.skill.maxLevel.value) throw new Invalid(`${where} is above the highest level.`);
  return n;
};

export const band = (v: unknown, where: string): Band => oneOf<Band>(v, BANDS, where);

const ingredientId = (v: unknown, where: string): IngredientId =>
  oneOf<IngredientId>(v, INGREDIENT_IDS, where);

export const kettleJob = (v: unknown, where: string): KettleJob => {
  const r = obj(v, where);
  const doneAt = orNull(r.doneAt, (x) => finite(x, `${where}.doneAt`));
  if (r.kind === 'experiment') {
    const a = ingredientId(r.a, `${where}.a`);
    const b = ingredientId(r.b, `${where}.b`);
    if (a === b) throw new Invalid(`${where} uses one ingredient twice.`);
    return { kind: 'experiment', a, b, units: count(r.units, `${where}.units`), doneAt };
  }
  const paid = obj(r.paid, `${where}.paid`);
  const ingredients = obj(paid.ingredients, `${where}.paid.ingredients`);
  const resources = obj(paid.resources, `${where}.paid.resources`);
  return {
    kind: oneOf(r.kind, ['brew'] as const, `${where}.kind`),
    item: consumableId(r.item, `${where}.item`),
    doneAt,
    paid: {
      ingredients: Object.fromEntries(
        Object.entries(ingredients).map(([k, n]) => [
          ingredientId(k, `${where}.paid.ingredients`),
          count(n, `${where}.paid.ingredients.${k}`),
        ]),
      ),
      resources: Object.fromEntries(
        Object.entries(resources).map(([k, n]) => [
          oneOf(k, RESOURCE_IDS, `${where}.paid.resources`),
          count(n, `${where}.paid.resources.${k}`),
        ]),
      ),
    },
  };
};
