// GDD §9.22 (D520, D608): the ten sounds, the 19 moments that play them, and which sound wins when
// several are due at once. Pure: no audio, no browser. Anything not listed here is silent.
export const SOUND_IDS = [
  'build',
  'launch',
  'place',
  'win',
  'lose',
  'fanfare',
  'nightfall',
  'brace',
  'discover',
  'strike',
] as const;
export type SoundId = (typeof SOUND_IDS)[number];

/** Strongest first (D522 (10), D608): the one that plays when several are due at once. */
export const SOUND_ORDER: readonly SoundId[] = [
  'fanfare',
  'nightfall',
  'win',
  'lose',
  'discover',
  'brace',
  'build',
  'launch',
  'place',
  'strike',
];

export const MOMENT_SOUNDS = {
  'hold.buy': 'build', // a building level or plot (an upgrade or another copy)
  'hold.newBuilding': 'build',
  'contract.launch': 'launch',
  'arrange.place': 'place', // a completed move or swap
  'contract.won': 'win',
  'delve.floorCleared': 'win',
  'contract.lost': 'lose',
  'delve.runLost': 'lose',
  'hunter.rankUp': 'fanfare',
  'hold.rankUp': 'fanfare', // Hamlet → Keep → Citadel → Bastion
  'beast.milestone': 'fanfare',
  'beast.kill': 'fanfare',
  'legendary.unlocked': 'fanfare',
  'delve.guardianBeaten': 'fanfare',
  'longNight.arrives': 'nightfall',
  'stand.brace': 'brace', // Last Stand commit (Start -> Confirm)
  'arrange.useLayout': 'brace', // Arrange Hold -> Use this layout
  'experiment.discovered': 'discover', // live-tick Alchemy experiment revealing >= 1 property
  'combat.strike': 'strike', // watched Arena step hitting an enemy or hunter
} as const satisfies Record<string, SoundId>;
export type Moment = keyof typeof MOMENT_SOUNDS;

export const soundFor = (moment: Moment): SoundId => MOMENT_SOUNDS[moment];

/** The winner among sounds due together, or null when none are due. */
export const strongest = (due: readonly SoundId[]): SoundId | null =>
  SOUND_ORDER.find((id) => due.includes(id)) ?? null;
