import type { DocumentDef } from './documents';

// lore-secrets §26 (D209–D214): Act III, The Night. Witness: Arvid Netmender,
// Yrsa's shield-companion. Texts word for word. Four names are in Arvid's account II
// (#30, #32, #33, #36), and Eirik's (#37) is on the strip in D3-05; Leif (#34) is
// Arvid's level-5 letter, counted apart from the act's five (lore §8).
// Not in `acts` until T6.7 gives the core the two new conditions.

/** The four Wrights who stood up with Yrsa (lore §26, D209); their names carry the link. */
export const properNouns: readonly string[] = [
  'Torvald Aslaksson',
  'Hrefna Sigvaldsdóttir',
  'Běla Dvorská',
  'Sindri Eyvindsson',
];

/** Arvid's arrival lines (lore §26): the new-warden sheet as Act III begins, and on load (D214). */
export const arvidArrival =
  'Ilse is back from Velkvik with the archive, and an old man with a net-needle and an axe.';
export const arvidArrivalOnLoad =
  'Ilse comes up the road early, with an old man carrying a net-needle and an axe.';

export const act3Documents: readonly DocumentDef[] = [
  {
    id: 'D3-01',
    act: 3,
    heading: 'The net-mender',
    type: 'scene',
    witness: 'Pechko, Arvid',
    condition: { kind: 'arvidArrives' },
    body: [
      'Arvid stops in the Hearth Hall doorway and comes no further. Pechko comes out from behind the stove and looks at him a long while.',
      '"Netmender. You got old."',
      '"You didn\'t."',
      '"Sit. The stool\'s the same."',
    ],
    names: [],
  },
  {
    id: 'D3-02',
    act: 3,
    heading: "He's gone up to you",
    type: 'letter',
    witness: 'Thane Gunnar Ravnsson',
    condition: { kind: 'contractWon', nth: 1, village: 'velkvik' },
    body: [
      'Warden —',
      "Arvid Netmender has gone up to you with your archivist. I'll tell you what Velkvik knows of him, which is less than you'd think for a man we've had back twenty-six years.",
      "He went up to the order the same spring as the Varn boy. The morning after the sky went out, he came down off the fell alone, with his hands black from the cold and no hammer, and he hasn't said a word about that night since. Not in my hall, not in his cups, not to his own sister.",
      'The lowlands say no Wright came down from the hold that night. One did. He came down our side.',
    ],
    signature: '— Gunnar Ravnsson, thane of Velkvik',
    names: [],
  },
  {
    id: 'D3-03',
    act: 3,
    heading: "Arvid's account, I: the Varns",
    type: 'testament',
    witness: 'Arvid',
    condition: { kind: 'contractWon', nth: 2, village: 'velkvik' },
    body: [
      "Warden — Ilse wants the Night written down. I'll start further back, because the Night makes no sense without the Varns.",
      "Yrsa was five years older than me and could row the fjord in a gale; you'll have heard that. Her brother Eirik was a year younger than me and couldn't row to save his life. He drew. Boats, birds, the thane's dog. He drew me once and gave me bigger ears than I have.",
      'He and I went up to Kamenfell the same spring. He was chosen before the snow was off the roof. They rang the bell, and he went off in the cart before light, so as not to make a fuss.',
      'Yrsa was Hearthblade by then. She sat up at the Stanholm gate three nights running, to see him once on his way south. The cart never came through. They told her it had gone the long way round.',
      'She believed that for eight years. So did I.',
    ],
    signature: '— Arvid',
    names: [],
  },
  {
    id: 'D3-04',
    act: 3,
    heading: "Arvid's account, II: the page",
    type: 'testament',
    witness: 'Arvid',
    condition: { kind: 'rankReached', age: 'citadel' },
    body: [
      "Warden — This is the hall where she read it to us. They've put the roof back. It looks smaller.",
      'A winter night in 280. Most of the Wrights were at supper. Yrsa came in with a page torn out of a book, stood on the anvil step and read it. Every line: a year, a name, a village, and the same one word.',
      "When she finished, five of us stood up. I'll set down who, and who they had on that page, because they'd want it written:",
      'Torvald Aslaksson, for his brother, Finn Aslaksson, of Velkvik, the spring of 258.\nHrefna Sigvaldsdóttir, for her brother, Ulf Sigvaldsson, of Ravenfell, 262.\nBěla Dvorská, for her sister, Hana Dvorská, of Mirograd, 264.\nSindri Eyvindsson, for his twin, Tova Eyvindsdóttir, of Velkvik, 270.\nAnd me. I had mine.',
      "The last line on the page was her brother's.",
      "Everyone who stood up had someone on it. The ones who stayed in their seats didn't.",
    ],
    signature: '— Arvid',
    names: [30, 32, 33, 36],
  },
  {
    id: 'D3-05',
    act: 3,
    heading: 'One line',
    type: 'scene',
    witness: "Arvid; the order's clerk",
    condition: { kind: 'rankReached', age: 'bastion' },
    body: [
      'Arvid stands at the foot of the Bastion stair, in front of the door with its thirty-nine ribbons. He takes a strip of paper out of his net-needle case and holds it out without looking at it.',
      "\"She tore his line off the foot of the page and kept it in her glove. At the top of this stair she put it in my hand. 'If I'm not up by morning, somebody should know his name.'",
      '"She wasn\'t up by morning. Put it in the book."',
    ],
    // The ledger strip the scene hands over, filed in the Library beside it.
    attachment: {
      heading: 'A strip from the foot of a ledger page',
      type: 'ledger',
      preface: 'A STRIP FROM THE FOOT OF A LEDGER PAGE',
      body: ['272 · Eirik Varn · Velkvik · ribboned · onward'],
      ilseNote:
        "The same clerk's hand as the Mirograd roll. I never did get an answer from the south about 'onward'. — I.M.",
    },
    names: [37],
  },
  {
    id: 'D3-06',
    act: 3,
    heading: 'The Night from below',
    type: 'testament',
    witness: 'Arvid',
    condition: { kind: 'actStand' },
    body: [
      'Ilse says a testament should be plain. Here it is plain.',
      "We went down the stair under the hold after midnight, six of us, with lanterns. The door at the bottom wasn't sealed then. Past it there's a hearth the size of a hall, with rings cut in the floor around it and chains of runes running in from the rings like the spokes of a wheel. It was warm down there. Kitchen-warm. I'd been a Wright seven years and never known it was there.",
      'At the top of the stair Yrsa stopped us and said the vow. All of it. "The fire for the folk; the folk never for the fire." She said the second half had been cut off the anvil before any of us was born.',
      'Then we took our hammers to the chains.',
      'When the last one broke, the warmth went out of the room like a door opening in winter, and something came up out of the floor that was only cold. Yrsa sent us back up the stair. She took a lantern and went the other way.',
      "Torvald and Hrefna held the stair. Sindri and Běla got me to the top. I don't know how far behind me they were. I went over the wall at first light and down the fell to Velkvik, and nobody asked me anything, and I didn't tell.",
      "Yrsa was right. I've never said that aloud in Velkvik. I'm saying it here.",
    ],
    signature: '— Arvid Netmender, once a Wright of Stanholm',
    names: [],
  },
  {
    id: 'D3-07',
    act: 3,
    heading: 'Two bowls',
    type: 'scene',
    witness: 'Pechko',
    condition: { kind: 'nextWarden' },
    body: [
      'That night Pechko sets out two bowls by the stove instead of one, and puts Arvid on the good stool.',
      '"He told you, then," he says to you, not to Arvid. "Good. I\'ve carried it long enough by myself."',
      'Arvid looks at him. Pechko bangs the stove door.',
    ],
    names: [],
  },
  {
    id: 'D3-08',
    act: 3,
    heading: 'The gate',
    type: 'scene',
    witness: 'Arvid, Sigrun',
    // Both at the hold in Act III's cycle or later, after D2-08 has been found (D213).
    condition: { kind: 'huntersTogether', hunters: ['arvid', 'sigrun'], after: 'D2-08' },
    body: [
      'Sigrun and Arvid are mending a net by the gatehouse. Neither is talking. Then Arvid says, without looking up:',
      '"I had the gate, the spring of 278. A girl came across the yard at a run, past midnight, holding one hand in the other. I opened the gate."',
      '"I know," Sigrun says. "I\'ve waited nearly thirty years for you to say so."',
      '"I didn\'t ask why. I should have asked why."',
      'Sigrun ties off the knot. "Then you\'d only have carried it two years longer."',
    ],
    names: [],
  },
];
