import type { IngredientId } from './ingredients';
import type { BrewId } from './brews-v06';

// GDD §5.8.1 and §8.6 (v0.6, D197, D202): every ingredient carries 3 hidden
// properties, each named by the brew it makes. The table is content, the same in
// every game, so every brew can be guaranteed makeable. The order within an
// ingredient is the reveal order of an experiment that shares nothing (§5.8.3).
// `known` marks the 15 that the nine v0.3 recipes prove (D200): the book opens
// with them. Recipes arrive in T6.4; saved state in T6.3.

export interface IngredientProperty {
  readonly brew: BrewId;
  /** Proved by a v0.3 recipe, so known from the start. */
  readonly known: boolean;
}

const p = (brew: BrewId, known = false): IngredientProperty => ({ brew, known });

export const ingredientProperties: Readonly<
  Record<IngredientId, readonly [IngredientProperty, IngredientProperty, IngredientProperty]>
> = {
  yarrow: [p('drowned-bane-oil', true), p('mending-draught', true), p('hardwood-tonic')],
  mugwort: [p('thornbane-oil', true), p('quickfoot-tincture', true), p('steadfast-draught')],
  juniper: [p('grave-oil', true), p('hardwood-tonic', true), p('steadfast-draught')],
  honeycomb: [p('mending-draught', true), p('owl-eye-drops'), p('poppy-smoke')],
  'hares-foot': [p('quickfoot-tincture', true), p('hidebane-oil'), p('owl-eye-drops')],
  pitch: [p('fire-pot', true), p('wrights-oil'), p('drowned-bane-oil')],
  'rime-salt': [p('frost-pot', true), p('saltburst', true), p('grave-oil')],
  'grave-dust': [p('grave-oil', true), p('wrights-oil'), p('saltburst')],
  'river-pearl': [p('drowned-bane-oil', true), p('coldwater-draught'), p('frost-pot')],
  thornwood: [p('thornbane-oil', true), p('hardwood-tonic', true), p('fire-pot')],
  'wolf-fang': [p('hidebane-oil'), p('owl-eye-drops'), p('steadfast-draught')],
  'noon-poppy': [p('coldwater-draught'), p('poppy-smoke'), p('mending-draught')],
};
