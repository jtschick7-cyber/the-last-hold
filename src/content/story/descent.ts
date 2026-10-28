// lore-secrets §34.11 (v1.4, D560, D563, D570), word for word: the Descent's seven story cards and the
// three resident lines added once 'descent' is recorded. Approved by the owner (Q60); invent nothing here.
// The strings around the cards (stage headings, buttons) are in descent-text.ts (GDD §9.24). Nothing
// here names any of the Sent's forty names.

export const DESCENT_CARD_IDS = ['D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-06', 'D-07'] as const;
export type DescentCardId = (typeof DESCENT_CARD_IDS)[number];

export interface DescentCard {
  readonly id: DescentCardId;
  readonly paragraphs: readonly string[];
}

export const DESCENT_CARDS: Readonly<Record<DescentCardId, DescentCard>> = {
  'D-01': {
    id: 'D-01',
    paragraphs: [
      "Pechko doesn't stand in front of the door at the foot of the Bastion stair. He only holds the lantern up so you can see the thirty-nine faded ribbons on the handle.",
      '"You know what\'s under the stone now," he says. "And you\'re going anyway. Take everyone who can walk. Leave the stove to me."',
    ],
  },
  'D-02': {
    id: 'D-02',
    paragraphs: [
      'The air below the Hearth Hall smells of wet iron and old snow. The shapes that come out of the dark are the ones the rift has been practicing.',
    ],
  },
  'D-03': {
    id: 'D-03',
    paragraphs: [
      "Further down, the steps are cut in the old order's measure. Something heavy shifts against the inner seal, and the dead smiths who built it stand up in the frost.",
    ],
  },
  'D-04': {
    id: 'D-04',
    paragraphs: [
      'The bottom of the stair is dry and very still. There is no forge here, only a wide stone floor and the cold that waited under it before the first stone of Stanholm was laid.',
      'The rime on the wall writes one line and stops:',
      'YOU BROUGHT THEM ALL.',
    ],
  },
  'D-05': {
    id: 'D-05',
    paragraphs: [
      'The cold does not die when the last blow lands. It breaks apart like thin ice on a trough, running back into the narrow cracks of the rock where no hammer can reach.',
      'Up above, the floor of the Hearth Hall shivers once and settles. Those who can stand help the others up the stair. Nobody speaks until the gatehouse air hits their faces.',
      'It is not gone. It is scattered small, into a hundred cold seams under the fells, and it will take a long time to gather itself again.',
    ],
  },
  'D-06': {
    id: 'D-06',
    paragraphs: [
      'Brana counts the hunters at the door, then counts them again before she sits down on the bench and lets her hands shake.',
      'Pechko sets the kettle on the hob. "You broke its grip," he says. "Not for ever. Nothing down there ends for ever. But the villages will sleep through this winter, and the next, and the one after that."',
    ],
  },
  'D-07': {
    id: 'D-07',
    paragraphs: [
      'The cold pushes you back up the stair, step by step, until the Bastion door shuts behind the last hunter.',
      'Pechko is already there with blankets and hot water. "Sit," he says. "Nobody died. The stair will still be there when you\'re ready."',
    ],
  },
};

/** The resident lines of lore §34.11: added to the pool once 'descent' is recorded (GDD §5.15.10). */
export const descentResidentLines: readonly {
  readonly speaker: 'pechko' | 'brana' | 'ilse';
  readonly text: string;
}[] = [
  {
    speaker: 'pechko',
    text: 'The crack behind the stove is quiet today. Just a draught, like any old house.',
  },
  {
    speaker: 'brana',
    text: "Everyone who went down that stair gets the first cut of the roast. I don't care what the ledger says.",
  },
  {
    speaker: 'ilse',
    text: 'I wrote down who went down the stair, and in what order. The next warden ought to know it can be done.',
  },
];
