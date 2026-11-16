// Plan T18.6 & T18.7 (GDD §9.21, §9.26): locked UI strings for Arrange Hold (v1.8), Hold Look,
// Courtyard Marks, tactical Breakdowns, and v7 Stand / Wave Log tactical lines.
// tests/content/v18-text.test.ts enforces word-for-word parity with docs/gdd.md §9.21 & §9.26.

/** Reconciled v1.8 Arrange Hold strings locked in GDD §9.21 (`Q76`, `Q77`, `Q78`). */
export const ARRANGE_TEXT = {
  layoutMode: 'Layout mode',
  modeBalanced: 'Balanced',
  modeEconomy: 'Economy',
  modeFortress: 'Fortress',
  presets: 'Presets',
  slot: (n: number | string) => `Slot ${n}`,
  empty: 'Empty',
  placedCount: (n: number | string) => `${n} placed`,
  save: 'Save',
  apply: 'Apply',
  tacticsBar: (status: string, links: number | string, screened: number | string) =>
    `Hearth Hall: ${status} · ${links} linked · ${screened} Screened`,
  warded: 'Warded',
  exposed: 'Exposed',
  screened: 'Screened',
  linked: (n: number | string) => `${n} linked`,
} as const;

/** Hold Look, Courtyard Marks, tactical Breakdowns & v7 Stand/WaveLog strings locked in GDD §9.26. */
export const V18_TEXT = {
  holdLookButton: 'Hold Look ▸',
  holdLookTitle: 'Hold Look',
  holdLookIntro:
    'Show or hide earned Courtyard Marks and bought Hold accents across the Grid and Scene.',
  courtyardMarks: 'Courtyard Marks',
  riftglassShop: 'Riftglass Shop',
  earnedSource: (source: string) => `Earned · ${source}`,
  lockedSource: (source: string) => `Locked · ${source}`,
  boughtShop: 'Bought in Riftglass shop',
  buyShop: 'Buy in the Riftglass shop (Rank ▸)',
  shown: 'Shown',
  hidden: 'Hidden',
  locked: 'Locked',
  holdTactics: 'Hold tactics',
  millLinks: (n: number | string) => `Mill links (${n})`,
  sawpitLinks: (n: number | string) => `Sawpit links (${n})`,
  smithyLinks: (n: number | string) => `Smithy links (${n})`,
  alchemistLinks: (n: number | string) => `Alchemist links (${n})`,
  warmCottages: (n: number | string) => `Warm Cottages (${n})`,
  trophyLink: 'Trophy Hall link',
  wardedPlots: (n: number | string) => `Warded plots (${n})`,
  wardedHearthHall: 'Warded Hearth Hall',
  brewTime: 'Brew time',
  experimentTime: 'Experiment time',
  baseTime: 'Base time',
  connectedRampart: (p: number | string) => `Connected rampart (+${p}%)`,
  screenedBonus: (p: number | string) => `Screened (+${p}%)`,
  sectorSupport: (p: number | string) => `Sector support (+${p}%)`,
  rampartTag: (p: number | string) => `Rampart +${p}%`,
  sectorTag: (p: number | string) => `Sector +${p}%`,
  screenedCount: (n: number | string) => `${n} Screened`,
  waveLogDefenses: 'Defenses',
} as const;
