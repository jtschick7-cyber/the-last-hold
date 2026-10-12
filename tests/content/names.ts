// Technical design §14: every proper noun in src/content/ that has passed the
// GDD §2.3 collision search against the influences (The Witcher, Elder Scrolls,
// Warcraft, Age of Empires, Warhammer 40K, Hades, Dark Souls), with the date.
// "generic" = a real or everyday word, which §2.3 allows without a search.
// A collision found later gets a decisions row and a replacement name, never an
// edit here to make the test pass.
export interface CheckedName {
  readonly name: string;
  readonly checked: string;
  readonly result: 'clear' | 'generic';
  readonly note?: string;
}

const generic = (name: string): CheckedName => ({ name, checked: '2026-10-12', result: 'generic' });

export const checkedNames: readonly CheckedName[] = [
  // Searched 2026-10-12 (plan T1.6); no match in any influence.
  { name: 'Stanholm', checked: '2026-10-12', result: 'clear' },
  { name: 'Brana Kolar', checked: '2026-10-12', result: 'clear' },
  { name: 'Brana', checked: '2026-10-12', result: 'clear', note: 'Short form of Brana Kolar.' },
  {
    name: 'Pechko',
    checked: '2026-10-12',
    result: 'clear',
    note: 'Unrelated: "MazM: Pechka" (Switch) shares the Russian word for stove.',
  },
  {
    name: 'Hearth Hall',
    checked: '2026-10-12',
    result: 'clear',
    note: "Skyrim's Hearthfire DLC has Heljarchen Hall; no Hearth Hall.",
  },
  { name: 'Roll of Honor', checked: '2026-10-12', result: 'clear' },
  {
    name: 'Silver Seam',
    checked: '2026-10-12',
    result: 'clear',
    note: 'Hades II mines silver deposits; nothing named Silver Seam.',
  },
  {
    name: "Woodcutter's Camp",
    checked: '2026-10-12',
    result: 'clear',
    note: 'Skyrim has lumber camps and chopping blocks, not this name.',
  },
  { name: 'Bell Tower', checked: '2026-10-12', result: 'clear' },
  {
    name: 'The Last Hold',
    checked: '2026-10-12',
    result: 'clear',
    note: 'Not an influence: a 2023 itch.io jam game "Death & Taxes: The Last Hold".',
  },
  // Palette candidates (plan T1.28): credits for other people's work, not
  // in-game names. Real published names, so there's nothing to collide with.
  ...['DawnBringer 32', 'Endesga 32', 'Zughy 32'].map((name): CheckedName => ({
    name,
    checked: '2026-10-12',
    result: 'clear',
    note: 'Palette name (credit only).',
  })),
  // Everyday words (GDD §2.3: generic words are allowed). Hamlet and Keep are
  // the generic Age names §2.3 explicitly permits.
  ...[
    'Food',
    'Wood',
    'Iron',
    'Silver',
    'Farmer',
    'Woodcutter',
    'Miner',
    'Silver-digger',
    'Cottage',
    'Farm',
    'Mine',
    'Mill',
    'Sawpit',
    'Smithy',
    'Hamlet',
    'Keep',
    'Steward',
    'Domovoi',
  ].map(generic),
];
