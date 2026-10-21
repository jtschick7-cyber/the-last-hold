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

/** The Library's shelf "The Remembering" (lore §34.8): shown once one entry is reached. */
export const rememberingShelfTitle = 'The Remembering';
export const rememberingShelfEntries = {
  later: { title: 'Later', blurb: 'Pechko, when you were not ready.' },
} as const;
