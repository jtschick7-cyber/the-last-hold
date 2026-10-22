// lore-secrets §34 (v0.11, D446–D460), word for word. Pechko's near-scene, the Remembering card and
// the ready line. Before the player taps Remember Them, no text here says, asks for or begins the
// Sent's names (D386, D467): they only count, point at the Names page and the Bestiary, and wait.

export interface RememberingScene {
  readonly id: 'R-01' | 'R-02';
  readonly title: string;
  readonly paragraphs: readonly string[];
}

/** R-01: the gate is not yet open when the scene plays. */
export const nearSceneClosed: RememberingScene = {
  id: 'R-01',
  title: 'The line along the wall',
  paragraphs: [
    'Pechko has swept the frost into a line along the foot of the wall. The frost has let him.',
    '"It\'s near," he says. "I can tell by how the stove sits. But the roll isn\'t full yet, and there are beasts we haven\'t learned properly."',
    'He nods at the Names page, and then at the Bestiary, the way you would nod at two people at a back table.',
    '"No hurry. The cold has waited this long."',
  ],
};

/** R-02: the gate is already open when the scene plays. */
export const nearSceneOpen: RememberingScene = {
  id: 'R-02',
  title: 'Everything on the table',
  paragraphs: [
    "Pechko is standing when you come in, which he never is. The stove is ticking in a way you haven't heard before, slow, like someone counting under their breath.",
    '"It\'s all there," he says. "Everything we were short of. The roll is full and the beasts are known."',
    'He looks at the crack, and then at you.',
    '"Whenever you like. Or not yet. Either is allowed."',
  ],
};

/** The card (lore §34.2). The counts are worked out, never stored. */
export const rememberingCard = {
  title: 'The Remembering',
  notOpen: { near: "Pechko says it's near.", names: 'Names', bestiary: 'Bestiary' },
  open: {
    line: "Everything's on the table.",
    remember: { name: 'Remember Them', text: 'Read the roll aloud, in the Hearth Hall.' },
    vigil: { name: 'Keep the Vigil', text: 'Not yet. The hold goes on as it is.' },
  },
  afterVigil: {
    line: 'You are keeping the vigil. The roll can be read whenever you say.',
    remember: 'Remember Them',
  },
  afterRemember: {
    line: 'The roll was read. It is in the Library whenever you want it again.',
    again: 'Read it again',
  },
} as const;

export const creaturesKnownLine = (known: number, total: number): string =>
  `Creatures known well: ${known} of ${total}.`;

/** v1.0 (D493): the species met but not yet Studied, named on the card while the ending is not open. */
export const creaturesMissingLine = (names: readonly string[]): string =>
  `Not yet known well: ${names.join(', ')}.`;

/** The ready line (D466 (1)): once, on the first away or result sheet after the gate opens. */
export const rememberingReadyLine = 'The Remembering is ready. Pechko is waiting by the stove.';

/** R-10 (lore §34.4): played once, when Keep the Vigil is chosen; the Library's "Later" replays it. */
export const vigilScene = {
  id: 'R-10',
  title: 'Later',
  paragraphs: [
    'You tell Pechko you are not ready to read it yet.',
    'He nods, as if you had told him the weather. "Aye. It\'s a lot, to read aloud in a room."',
    'He leans the broom against the stove. "The cold has learned patience. We can learn it too. Brana will keep the roll with the lamps. It\'ll be here."',
    'Brana puts the kettle on, which is how she says the matter is closed. The frost along the foot of the wall stays where it is, patient as a dog at a door.',
  ],
} as const;

/** R-03 (lore §34.3): plays when Remember Them is tapped; the reading starts when it is closed. */
export const rememberScene = {
  id: 'R-03',
  title: 'The roll',
  paragraphs: [
    'Ilse has carried the roll down from the archive and set it on the table, and then, not trusting the table, picked it up again. Brana has lit every lamp in the Hall. Pechko is by the crack.',
    '"You read," Ilse says. "I\'ve read them to myself so many times I\'m no use."',
    'It is the first time anyone has asked you to read something aloud in this room.',
    "The frost on the floor has gathered at the edge of the crack. It isn't writing. It is listening.",
  ],
} as const;

/** The Unlit's answer, on the floor of the card after the fortieth name (lore §34.5). */
export const unlitLine = {
  heading: '— in rime, on the Hearth Hall floor —',
  text: 'Forty. Known, every one. I can put the count down.',
} as const;

/** The reading screen's controls (not story text). */
export const readingControls = {
  skip: 'Skip',
  tap: 'Tap for the next name.',
  done: 'Continue',
} as const;

/** The Library's shelf "The Remembering" (lore §34.8): shown once one entry is reached. */
export const rememberingShelfTitle = 'The Remembering';
export const rememberingShelfEntries = {
  reading: { title: 'The reading', blurb: 'The roll, read aloud in the Hearth Hall.' },
  later: { title: 'Later', blurb: 'Pechko, when you were not ready.' },
} as const;

/** The mark on the Roll of Wardens entry of the warden in office when Remember Them was chosen (lore §34.7). */
export const rollMarkText = 'Read the roll aloud.';

/** The Rime shelf's sub-heading for R-11 (lore §34.7). */
export const afterTheEnding = 'After the ending';

/** Resident lines after Remember Them (lore §34.7): shown only once the ending is recorded; they replace nothing. */
export const afterEndingLines: readonly {
  readonly speaker: 'pechko' | 'brana' | 'ilse';
  readonly text: string;
}[] = [
  {
    speaker: 'pechko',
    text: 'I sat up for the crack, out of habit. It had nothing to say. I sat up anyway.',
  },
  { speaker: 'pechko', text: "The stove is better company now it isn't working so hard." },
  { speaker: 'pechko', text: 'Frost on the sill this morning. Plain frost. I was glad of it.' },
  { speaker: 'brana', text: "Kettle boiled first go this morning. I'll not question it." },
  { speaker: 'brana', text: 'Hunters still go out and still come back. That part is ours.' },
  { speaker: 'brana', text: 'I stopped checking the lamps at night. Then I started again. Habit.' },
  { speaker: 'ilse', text: "I've started a new page in the archive. It has no heading yet." },
  {
    speaker: 'ilse',
    text: "People ask me to read the roll to them. I say it's in the Library. They ask again.",
  },
];
