// The story's short texts outside the documents: Ilse's arrival and return, the
// Ribbonshade scenes, the stand's bands and the residents' lines, the Citadel and
// Bastion inscriptions, and the Roll of Wardens. Sources: GDD §5.14, lore-secrets
// §11, §21.4, §22, §24. Texts are word for word where the docs give them.

// ---- Ilse (GDD §5.14.3, lore §21.4) ----
export const ilseArrival =
  "A woman in a highland coat walks up the road with a satchel of paper and ink on every finger. 'Ilse Marrow. I keep records. Your headwoman at the ford gave me this for you.' She hands over a letter. 'Where do you want the archive?'";
/** For a save from before v0.5 (D149): her line continues, and she hands over what's already found. */
export const ilseArrivalOldSave = "…and I've been catching up on what the hold already knows,";
/** The new-warden sheet in later cycles (D151). */
export const ilseReturns = 'Ilse is back from Velkvik with the archive.';

// ---- Ribbonshades (GDD §5.14.4, lore §21.4) ----
/** The first Ribbonshade defeated: Jaro's ribbon, Halina's blue stitch. */
export const firstRibbon =
  'It went down without a sound. Tied at its wrist, a ribbon with a blue stitch at the hem.';
/** Under Halina's letter (D1-04) once Jaro's name is found. */
export const halinaRibbonNote = 'Ilse sent the ribbon to Mirograd. — I.M.';
export const laterRibbon = (name: string): string =>
  `Tied at its wrist, a ribbon. Stitched into the hem: ${name}.`;
/** After all six names are found (GDD §5.14.4 gives no text; D172, Proposed). */
export const plainRibbon = 'Tied at its wrist, a ribbon. The hem is plain.';

// ---- Sigrun, after her confession (lore §22, D2-08) ----
export const sigrunVow =
  "At the gatehouse next morning, Sigrun says the vow with the others for the first time. She says all of it that's left.";

// ---- Act II ruin notices in the fell villages (lore §22.1) ----
export const kamenfellNoticeEnd = '…up at the old Kamenfell outpost.';

// ---- The stand's band (GDD §5.14.8, D145) ----
export const BANDS = ['broken', 'held', 'triumphant'] as const;
export type Band = (typeof BANDS)[number];

export const bandLabels: Readonly<Record<Band, string>> = {
  broken: 'Broken',
  held: 'Held',
  triumphant: 'Triumphant',
};

/** The stand screen, next to the preview: "Held from 9 waves · Triumphant from 12". */
export const bandThresholdsLine = (heldFrom: number, triumphantFrom: number): string =>
  `Held from ${heldFrom} waves · Triumphant from ${triumphantFrom}`;

/** lore §24: one of Pechko's and one of Brana's, picked by the stand seed. */
export const bandLines: Readonly<
  Record<Band, { readonly pechko: readonly string[]; readonly brana: readonly string[] }>
> = {
  triumphant: {
    pechko: [
      "Hm. The hearth is warm. Sit. You've earned the good stool.",
      'You held them till the sky went grey. The old stones liked that. So did I.',
      "Don't let it go to your head. Do let it go to your supper.",
    ],
    brana: [
      "We held them till dawn. The walls didn't, but the people did. Every one.",
      'Ilse wants to write it down. I told her to write it big.',
      "Granaries held. Mostly. I'll have the count by morning.",
    ],
  },
  held: {
    pechko: [
      "Held. That's the word. Held is what walls are for.",
      "Not the best night. Not the worst. The stove's lit; that's the part that matters.",
      'Long enough is a kind of winning.',
    ],
    brana: [
      "We lost the south sheds and kept the people. I'll take that trade.",
      "Some damage. Nothing a spring can't mend.",
      'The goats have opinions. Otherwise, a normal bad night.',
    ],
  },
  broken: {
    pechko: [
      'Cold hearth. Well. Hearths can be relit. Up, warden.',
      "Bad night. Eat something. Then we count what's left.",
      "The walls went early. The hearth didn't. It never does, while I'm here.",
    ],
    brana: [
      "We lost the east field and the mill wheel. We didn't lose anyone I'd miss. Don't tell Toma.",
      "It's a bad count. I'll make it a good one by spring.",
      "The mill's gone and the stores with it. The people are fine. That's the column I care about.",
    ],
  },
};

// ---- Inscriptions (D160, lore §11): appended to the v0.4 restoration text ----
export const inscriptions = {
  citadel:
    'Over the great anvil, the vow is cut in the stone: "The fire for the folk; the folk —" The rest is chiseled out.',
  bastion: 'Thirty-nine faded ribbons are tied to its handle.',
} as const;

// ---- The Roll of Wardens (GDD §5.14.5, D153) ----
export const wornFirstLine = 'A first line, worn smooth. Pechko dusts it every morning.';
/** A blank name, carved for an earlier warden on a pre-v0.5 save's arrival (D152). */
export const blankWarden = 'the warden before';
export const keepingTheHearth = 'keeping the hearth';
/** D153: cycle n covers years 300 + 3(n − 1) to 300 + 3n of the order. */
export const ROLL_FIRST_YEAR = 300;
export const YEARS_PER_WARDEN = 3;
export const WARDEN_NAME_MAX = 24;
