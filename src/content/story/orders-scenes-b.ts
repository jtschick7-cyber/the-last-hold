import type { OrderScene } from './orders-scenes';

// lore-secrets §33 Parts C and D (v0.10 flesh-out, D423): the Orders' scene texts, WORD FOR WORD.
// Nothing here is invented; tests/content/orders-texts.test.ts compares every string to the lore
// file and runs the Part F checks. Author notes (*Wrongness*, *Threshold*) are not shipped.
// This file holds the Bell-Watchers and the Quenchers (T10.10); the other two are in orders-scenes.ts.

export const bellQuenchersScenes: readonly OrderScene[] = [
  {
    id: 'OS-B',
    title: 'Who keeps the bells',
    order: 'bellWatchers',
    kind: 'opening',
    body: [
      'Ilse sets a small pile of letters on the Library table and squares the edges.',
      '"Four families have written to ask whether the hold keeps a bell. Not for a service. They ring for the ones who went onward, they say, and they\'d like to know whether anyone at Stanholm does." She taps the top letter. "They call themselves the Bell-Watchers. I hadn\'t heard it before. Everyone I asked says it has always been so."',
      '"Has it?"',
      '"Nobody I asked could say when it began." She squares the pile again. "That is its own kind of answer."',
    ],
  },
  {
    id: 'OS-Q',
    title: 'Named for the metal',
    order: 'quenchers',
    kind: 'opening',
    body: [
      "Brana puts Věra's letter down beside a second one that has no signature at all.",
      '"Kozly Hollow\'s young ones have given themselves a name," she says. "They call themselves the Quenchers."',
      '"Quenchers," Ilse says, and thinks. "To cool hot metal. Quickly, in water. So it can be handled."',
      '"Or so it stops," says Pechko, who has been listening and pretending not to.',
      'Nobody answers him.',
    ],
  },
  {
    id: 'OR-B1',
    title: 'The second spring',
    order: 'bellWatchers',
    kind: 'chapter',
    body: [
      'Two women stand at the gate in the grey before breakfast, each with a small hand-bell. Halina has come up from Mirograd. Dana Lisová has come from Kozly Hollow, and has walked all night.',
      'They ring once each. The notes are different, thin and a little sour. They stop at the same moment, as if they had agreed.',
      'Ilse, watching from the Library door, says nothing until they have gone in for tea. Then she says to you, quietly, "I asked each of them how often they ring. Halina said every second spring. Dana said every second spring."',
      '"Does it matter?"',
      '"Neither of them said why it isn\'t every spring." She has marked the page. "I don\'t think either of them has asked."',
    ],
  },
  {
    id: 'OR-B2',
    title: 'A list of springs',
    order: 'bellWatchers',
    kind: 'chapter',
    body: [
      'The families have started bringing Ilse their lists. Not names. She says they will not give her names; they give her springs.',
      "There is a sheet from Mirograd in Halina's hand and a sheet from Kozly Hollow in Dana's, and more come in over the week. Each is a column of years in the order's reckoning, one under another, and beside each year a village and nothing else.",
      '"They ring on the springs when a child went up," Ilse says. "Look. Every year on every sheet is an even number."',
      'She runs her finger down the first column. "Nobody told them to keep to evens. They don\'t seem to have noticed."',
      'She puts a small pin in the corner of the sheet, the way she marks a thing she means to come back to.',
    ],
  },
  {
    id: 'OR-B3',
    title: 'What he said at the door',
    order: 'bellWatchers',
    kind: 'chapter',
    body: [
      'Ilse has begun asking a different question. Not where they went, which nobody can answer, but what they said at the door.',
      'Halina: "He asked me not to cry at the gate. I cried at the gate." Dana: "He said he\'d bring me a buckle." The others come in one at a time over the week: something about a dog, something about a roof, a joke that doesn\'t survive being written down. Ilse writes them all, carefully, on the backs of the lists.',
      "One sheet comes back blank. A note is pinned to it in someone else's hand: *We have stopped ringing. Please don't ask us to start.*",
      'Ilse sits with it for a long time.',
      '"I thought that would be the hard one," she says to you. "It\'s the kind one. They did it for as long as they could, and then they didn\'t."',
    ],
  },
  {
    id: 'OR-B4',
    title: 'A bell of our own',
    order: 'bellWatchers',
    kind: 'chapter',
    body: [
      'Halina and Dana Lisová have come up together this time. They have brought nothing in their hands.',
      '"We would like to ask something," Halina says. Dana is looking at the stones.',
      '"A bell," says Dana. "At the gatehouse. Not to ring for anyone in particular. Just there."',
      "Ilse starts to say something about records, and doesn't.",
      'It takes Brana and two peasants an afternoon to hang it from the gatehouse arch, on an iron hook that was already in the stone. It is a small bell of dull bronze, and its clapper is wrapped in cloth.',
      "Halina reaches up and unwraps it. Then she lets go of the cloth, and she doesn't ring it.",
      '"Not yet," she says.',
    ],
  },
  {
    id: 'OR-Q1',
    title: 'Three at the gate',
    order: 'quenchers',
    kind: 'chapter',
    body: [
      'Bohdan Kozel is at the gate with three young people behind him, goatherds by their boots. He takes his cap off, which in Kozly Hollow is a great deal.',
      'He says it plainly: "We\'d like to see the stove. Only see it."',
      'Brana looks at you. You nod.',
      'Pechko is out from behind it before they have crossed the Hall. He sits on his stool with the broom across his knees like a gatekeeper, says nothing, and lets them look.',
      'The three stand at a polite distance and look at the stove for a long time. One of them holds out a hand, palm open, to feel the heat. She takes it back quickly.',
      '"It\'s warm," she says, as if somebody had told her otherwise.',
      '"Aye," says Pechko.',
      'They thank him, which few people do, and Pechko, to his own surprise, tells them to mind the step.',
    ],
  },
  {
    id: 'OR-Q2',
    title: "Věra's chair",
    order: 'quenchers',
    kind: 'chapter',
    body: [
      'Věra has come up from the Hollow on a goat cart, and she sits where she can see both Bohdan and the stove.',
      '"Hear the warden out," she tells him. "Then say your piece. In that order."',
      '"You won\'t stand with us," Bohdan says.',
      '"I wrote what I wrote, and I meant it. That doesn\'t make me one of you. Sit down."',
      "He doesn't sit. He counts on his fingers, the way a man counts who has counted before. Children, sent up with ribbons on their sleeves. Not one came home to show the Hollow what a Wright looks like. Not one letter.",
      '"That\'s what the Hollow gave," he says. "I\'m not saying what it got back, because I\'d like to be fair."',
      'Pechko, from the stove: "That\'s fairer than most."',
      'Věra says nothing more. She does not look at Bohdan again for the rest of the evening.',
    ],
  },
  {
    id: 'OR-Q3',
    title: 'A cold supper',
    order: 'quenchers',
    kind: 'chapter',
    body: [
      'Bohdan has asked your hunters to supper in the Hollow, and they go. It is a good supper: goat, barley, a sour cheese that somebody asks about twice.',
      'At dusk each house in the Hollow sets a lamp in its window, for whoever might be on the road. It is the oldest courtesy the place has. Bohdan sets lamps in three of his windows. The fourth, the one that faces the road up to the hold, stays dark.',
      'One of your hunters notices. None of them says a word.',
      'Bohdan sees them notice. "I\'m not rude," he says. "I gave you supper. I\'ll give you supper again. I won\'t light you home, that\'s all."',
      'Nobody argues. On the road back, somebody says it was the warmest welcome and the coldest goodnight they had ever had, both at once.',
      '"That\'s what it is," says somebody else. "Both at once."',
    ],
  },
  {
    id: 'OR-Q4',
    title: 'The mouth',
    order: 'quenchers',
    kind: 'chapter',
    body: [
      'Bohdan has come to the Hall alone this time. He stands in front of the stove with his cap in his hands.',
      '"Věra wrote it down once," he says. "Her grandmother\'s word. A mouth, not a hearth. I\'d thought it was a figure of speech. I\'ve stopped being sure it is."',
    ],
    variantA: [
      '"I\'d like to say this to the heads," he says. "Not to you. To them."',
      'You send for them. Marta comes, then the others, grumbling, and Bohdan says it again, the same words in the same order. Nobody interrupts him.',
      '"Say it again when we\'re not tired," Marta says. Then, to Bohdan\'s evident surprise: "I\'ll hear it."',
    ],
    variantB: [
      'He takes a stone from his coat, a grey river stone, cold as a well, and sets it on the hearthstone in front of the stove.',
      '"It was in our spring all winter," he says. "It never warmed in my hand."',
      'He leaves it there. He does not look back at the stove as he goes.',
    ],
    ending: [
      'The stove ticks. Pechko says nothing, which is rare.',
      'The question stays where it was left, in the middle of the floor, and everyone steps around it.',
    ],
  },
];
