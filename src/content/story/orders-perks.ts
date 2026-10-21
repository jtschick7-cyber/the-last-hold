import type { IngredientId } from '../ingredients';
import type { ConsumableId } from '../consumables';
import type { VillageId } from '../villages';

// lore-secrets §33 Part E (v0.10 flesh-out, D411, D423): the story and knowledge perks, WORD FOR WORD.
// tests/content/orders-texts.test.ts compares every string to the lore file. E3 and E4 come in T10.10.

/** E1: the Thanes' Moot. A head's notice line and Villages-panel entry, by Moot level (seated only). */
export interface MootHeadLine {
  readonly level: 1 | 2 | 3 | 4;
  readonly head: string;
  readonly village: VillageId;
  /** The very end of a contract notice from that village (after the trust line, if one is shown). */
  readonly noticeLine: string;
  /** Under "What the heads say about you" on the Villages panel. */
  readonly panelEntry: string;
}

export const mootHeadLines: readonly MootHeadLine[] = [
  {
    level: 1,
    head: 'Marta Dubska',
    village: 'dubno-ford',
    noticeLine: 'The ferry is running. Keep it so.',
    panelEntry: '"Does what it says. I\'ve told the others so, though not in those words."',
  },
  {
    level: 2,
    head: 'Gunnar Ravnsson',
    village: 'velkvik',
    noticeLine: 'There is fish on the table for your hunters.',
    panelEntry: '"The fells don\'t ask the hold to explain itself. We ask it to turn up."',
  },
  {
    level: 3,
    head: 'Ilona Sváteková',
    village: 'mirograd',
    noticeLine: 'Mirograd pays what it owes.',
    panelEntry:
      '"Mirograd will say it likes the hold when the ledger says so, and the ledger is close."',
  },
  {
    level: 4,
    head: 'Sólveig Arnadóttir',
    village: 'ravenfell',
    noticeLine: '(A pinch of salt is folded into the paper.)',
    panelEntry: 'She has said nothing. She has sent salt.',
  },
  {
    level: 4,
    head: 'Bohdan Kozel',
    village: 'kozly-hollow',
    noticeLine: 'Noted.',
    panelEntry: '"The Hollow will listen. That is all it has said."',
  },
];

/**
 * What a Grey Wives hint says about its brew, as data the test checks against GDD §8.6 (the ingredient
 * properties): a hint names a brew and never an ingredient, but each claim must be true.
 */
export type HintClaim =
  /** Some ingredient that carries the brew is grown in the Herb Garden. */
  | { readonly kind: 'carrierFrom'; readonly source: 'herb-garden' }
  /** At least `n` of the ingredients that carry the brew are village gifts. */
  | { readonly kind: 'giftCarriersAtLeast'; readonly n: number }
  /** Exactly `n` ingredients carry the brew, and they do not share a source. */
  | { readonly kind: 'carriersExactly'; readonly n: number; readonly unlike: true }
  /** The brew is carried by exactly these ingredients. */
  | { readonly kind: 'carriersAre'; readonly ingredients: readonly IngredientId[] };

/** E2: one hint per Grey Wives level, and the elder's note that replaces it once the Book has the brew. */
export interface GreyWivesHint {
  readonly level: 1 | 2 | 3 | 4;
  readonly brew: ConsumableId;
  readonly claim: HintClaim;
  readonly hint: string;
  readonly elderNote: string;
}

export const greyWivesHints: readonly GreyWivesHint[] = [
  {
    level: 1,
    brew: 'steadfast-draught',
    claim: { kind: 'carrierFrom', source: 'herb-garden' },
    hint: 'A plain herb from the garden has a quiet use in a Steadfast Draught.',
    elderNote: '"A kettle remembers what was put in it. Don\'t scour it too clean."',
  },
  {
    level: 2,
    brew: 'owl-eye-drops',
    claim: { kind: 'giftCarriersAtLeast', n: 2 },
    hint: 'Look first at what the villages send. Owl-Eye Drops are in more than one of their gifts.',
    elderNote: '"Write down nothing you can\'t say aloud."',
  },
  {
    level: 3,
    brew: 'coldwater-draught',
    claim: { kind: 'carriersExactly', n: 2, unlike: true },
    hint: "Coldwater Draught is not one thing's work. Two unlike things carry it.",
    elderNote: '"Two hands. One to hold, one to give."',
  },
  {
    level: 4,
    brew: 'wrights-oil',
    claim: { kind: 'carriersAre', ingredients: ['pitch', 'grave-dust'] },
    hint: "Wright's Oil wants what burns slowly and what lies still.",
    elderNote: '"Leave a cup out."',
  },
];
