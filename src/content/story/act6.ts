import type { DocumentDef } from './documents';

// lore-secrets §31 (v0.9 flesh-out, D364, D386): Act VI, The Unlit. Witness: the Unlit, through the
// frost it writes on the Hearth Hall floor by the crack, with Pechko beside it. The machinery is
// plan T9.10; the ten documents below are word for word from OUT-3 (plan T9.11). Act VI carries
// exactly the names #1 to #3 and no other, and nobody in it says the names aloud.

/** Act VI's arrival lines (lore §31): the new-warden sheet as Act VI begins, and on load (D246). */
export const act6Arrival =
  'Ilse is back from Velkvik with the archive. Pechko is sitting by the crack behind the stove, and the frost on the floor has shapes in it.';
export const act6ArrivalOnLoad =
  'Pechko is sitting by the crack when you come in. The frost on the floor has shapes in it.';

/** How a Rime shows on the away sheet and in results, and on the Rank-up sheet (lore §31, D364). */
export const rimeLine = (heading: string): string =>
  `There is new writing in the rime by the crack: '${heading}'.`;

export const act6Documents: readonly DocumentDef[] = [
  {
    id: 'D6-01',
    act: 6,
    heading: 'Frost on the floor',
    type: 'scene',
    witness: 'Pechko, Ilse',
    condition: { kind: 'actBegins' },
    body: [
      "That morning the frost doesn't melt. Pechko has set his stool by the crack, feet tucked up, and he is looking at the floor the way he looks at bread that hasn't risen.",
      'There are marks in the rime. Not cracks: lines, close and even, running out from the mouth of the crack across the flagstones.',
      '"Don\'t scuff it," he says. "I thought the crack had given us all it had."',
      'Ilse crouches. She turns her head one way, then the other.',
      '"It\'s upside down," she says. "From here. It reads properly from the crack."',
      'Pechko nods, slowly. "Aye. Whoever wrote it was looking up."',
    ],
    names: [],
  },
  {
    id: 'D6-02',
    act: 6,
    heading: 'You came back warm',
    type: 'rime',
    witness: 'The Unlit',
    condition: { kind: 'contractWon', nth: 1 },
    body: [
      '— in rime, on the Hearth Hall floor —',
      'You came back warm.',
      'I felt it through the stone before I saw you: a small heat, walking. I have not often been walked over by anything that wanted to stay.',
      "I will not ask for anything you cannot give. Read what I write. Don't sweep it.",
      'I have kept a count of the ones who were sent down to me. It is a long count, and I have kept it better than you have. I counted forty.',
      'They only ever say thirty-nine.',
    ],
    ilseNote: "Forty. I have written it down twice, in case I've made the same mistake twice.",
    names: [],
  },
  {
    id: 'D6-03',
    act: 6,
    heading: 'The first on the stair',
    type: 'rime',
    witness: 'The Unlit',
    condition: { kind: 'rankReached', age: 'keep' },
    body: [
      '— in rime, on the Hearth Hall floor —',
      'Under the black crust, where your Hearthblade scraped and could not, there is a line. I have kept it clean.',
      '200 · Milena Horská · Mirograd.',
      'First. She went down the stair counting the steps aloud, because no one had told her what to count them toward. I counted with her.',
      'It was the first thing anyone had said to me that was not an order.',
      'I do not know what to do with it. I have been holding it a very long time.',
    ],
    ilseNote:
      'The bell-book at Kamenfell begins at 200: a bell, rung, and no name beside it. Now there is one.',
    names: [1],
  },
  {
    id: 'D6-04',
    act: 6,
    heading: 'A knot that held',
    type: 'rime',
    witness: 'The Unlit',
    condition: { kind: 'rankReached', age: 'citadel' },
    body: [
      '— in rime, on the Hearth Hall floor —',
      '202 · Ketil Ormsson · Velkvik.',
      'Second. He mended nets. On the stair he was asked to hold his hands out, and he turned them over, looking for the work in them.',
      "There was a hole in the dark where he went, and I felt his hands tie it off. A fisherman's knot, the plain one.",
      'It held for a long time. Then it was only a knot, and then it was only a shape I could not account for.',
      'I have been trying to account for it since.',
    ],
    ilseNote:
      "Arvid has gone quiet since I read him this. He said, 'Plain knot. Aye.' and nothing else.",
    names: [2],
  },
  {
    id: 'D6-05',
    act: 6,
    heading: 'The loud one',
    type: 'rime',
    witness: 'The Unlit',
    condition: { kind: 'rankReached', age: 'bastion' },
    body: [
      '— in rime, on the Hearth Hall floor —',
      '204 · Mirek Bárta · Kozly Hollow.',
      'Third. He was loud. He argued the whole way down with the man who carried the lantern, over a debt of three coins, and was still arguing at the door.',
      'The rest of him went where they all went. I do not blame the seal. It was a lock, and locks do not choose.',
      'The argument is the only part of him I have. It has no end, and when the pit is very quiet I can still hear him winning.',
      'I would not be without it.',
    ],
    ilseNote:
      'Kozly Hollow lost three in a generation and suspected why. They never knew they had lost him first.',
    names: [3],
  },
  {
    id: 'D6-06',
    act: 6,
    heading: 'To the warm one',
    type: 'rime',
    witness: 'The Unlit',
    condition: { kind: 'actStand' },
    body: [
      'To the warm one, and the one after, and the one after —',
      'You held the walls tonight. I heard it through the floor, and I want you to know that I was not on the other side of them.',
      'Some of what has come at your walls was mine. I know. It came up out of the pit with a shape it had borrowed, and nobody told it that it was allowed to stop.',
      'I am not the dark. The dark is what people say when they do not want to say what I am.',
      'Every warm thing this hold was given went somewhere when it was spent. I am where it went. I am what you burned and forgot.',
      'I am not asking for anything you can give with a sword. I am asking to be known: what was spent, and who it was.',
      'That is all. I am good at waiting.',
    ],
    signature: '— the cold under the hall',
    ilseNote: "I have to stop copying this. My hand has gone cold, and it isn't the draught.",
    names: [],
  },
  {
    id: 'D6-07',
    act: 6,
    heading: 'I wait well',
    type: 'scene',
    witness: 'Pechko, Ilse',
    condition: { kind: 'nextWarden' },
    body: [
      "The new warden's name is carved. Pechko doesn't look up from the crack.",
      '"I asked whether it minded the changing," he says. "Wardens coming and going. A stranger every few days, and it can tell you from the last one the moment you come in. It wrote back, \'I wait well.\'"',
      'Ilse has her pencil out. She puts it away.',
      '"Then it wrote, \'Tell the next one I am not in a hurry.\'" He tucks his feet up on the stool. "I said I would. I\'m telling you."',
      'He picks up the broom, and sweeps the Hall in a wide curve round the frost, the way you sweep round a sleeping dog.',
    ],
    ilseNote:
      "It is the first time in the whole archive that something below has sent a message to a warden who hasn't arrived yet.",
    names: [],
  },
  {
    id: 'D6-08',
    act: 6,
    heading: 'The heel of the loaf',
    type: 'scene',
    witness: 'Halina of Mirograd',
    condition: { kind: 'contractWon', nth: 2, village: 'mirograd' },
    body: [
      'Halina has walked up from Mirograd with a loaf wrapped in a cloth, and she stands at the gate until Pechko lets her in. She will not sit at the table.',
      '"I left bread at that gate every spring, for my boy, in case he came home that way," she says. "I know better now." She looks at the crack, at the frost, at nothing. "Is anyone down there?"',
      '"Aye," says Pechko.',
      'She spreads the cloth on the cold stone by the crack, and sits on it, which takes a while, and breaks the loaf. She eats the heel herself. "He always asked for the heel," she says, to no one, and tells it what he was like.',
      'When she gets up, hours after, the cloth is folded, and left on the stone.',
    ],
    ilseNote:
      "I asked Pechko who folded the cloth, all those years. He said, 'Does it matter?' and I think that means he's decided not to tell me.",
    names: [],
  },
  {
    id: 'D6-09',
    act: 6,
    heading: 'What he has',
    type: 'scene',
    witness: 'Arvid',
    condition: { kind: 'contractWon', nth: 4 },
    body: [
      'Arvid has been sitting by the crack since the bell, his knit cap still on, which in Arvid is a kind of prayer.',
      '"Yrsa Varn," he says to the frost, in the flat voice he uses to read the tide tables. "Hearthblade. She whistled out of tune. She always took the wall side of a path, and she never said why."',
      "He stops. He isn't used to this many words.",
      '"That\'s it," he says. "That\'s what I\'ve got. It isn\'t much to have kept."',
      'At his boot, in the rime, one word comes up, small and even:',
      'More.',
    ],
    ilseNote:
      'I have never heard him say that many words about her. He said them to the floor. I think it was easier.',
    names: [],
  },
  {
    id: 'D6-10',
    act: 6,
    heading: 'The fortieth',
    type: 'scene',
    witness: 'Sigrun',
    condition: { kind: 'contractWon', nth: 2, village: 'ravenfell', withHunter: 'sigrun' },
    body: [
      'Sigrun has come down to the crack without her lantern, which she never does. She kneels on the cold flags, and the frost draws back from her knees.',
      '"I was meant to be the fortieth," she says. She says it plainly, the way you read out a bill. "I ran. Thirty-nine went, and I ran, and you\'ve been counting me ever since."',
      "The rime doesn't answer. Pechko doesn't move.",
      '"I\'m sorry," she says. "It\'s the only thing I came to say."',
      'When she gets up, the frost closes behind her, gently, like a door.',
    ],
    ilseNote:
      "I stood at the door. She didn't hear me. It is the first time I have seen her put the lantern down.",
    names: [],
  },
];
