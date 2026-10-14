import { INGREDIENT_IDS, type IngredientId } from '../../content/ingredients';
import { ingredientProperties } from '../../content/properties';
import { SKILL_IDS, type SkillId } from '../../content/skills';

// Technical design §5.2 (v6, plan T6.3): the recipe book and the warden skills
// (GDD §5.8). Both are kept forever; the Long Night resets neither.

/** Which of an ingredient's three properties (0–2, in the §8.6 order) the book shows. */
export type PropertyIndex = 0 | 1 | 2;

export interface RecipeBook {
  /** Revealed property indexes per ingredient, ascending. */
  properties: Record<IngredientId, PropertyIndex[]>;
  /** Pairs already tried, as `pairKey` (GDD §5.8.3). */
  tried: string[];
}

/** An experiment pair as one key, in ingredient-list order, so (a, b) and (b, a) are the same. */
export const pairKey = (a: IngredientId, b: IngredientId): string =>
  INGREDIENT_IDS.indexOf(a) <= INGREDIENT_IDS.indexOf(b) ? `${a}+${b}` : `${b}+${a}`;

/** The book as a new game opens it: the 15 properties the nine v0.3 recipes prove (D200). */
export const startingBook = (): RecipeBook => ({
  properties: Object.fromEntries(
    INGREDIENT_IDS.map((id) => [
      id,
      ingredientProperties[id].flatMap((p, i) => (p.known ? [i as PropertyIndex] : [])),
    ]),
  ) as Record<IngredientId, PropertyIndex[]>,
  tried: [],
});

/** XP per warden skill (GDD §5.8.6); the level is derived from it. */
export type SkillXp = Record<SkillId, number>;

export const startingSkills = (): SkillXp =>
  Object.fromEntries(SKILL_IDS.map((id) => [id, 0])) as SkillXp;
