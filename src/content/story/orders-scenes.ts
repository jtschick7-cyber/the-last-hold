import type { OrderId } from '../orders';

// lore-secrets §33 Parts C and D (v0.10 flesh-out, D423): the Orders' scene texts, WORD FOR WORD.
// Nothing here is invented; tests/content/orders-texts.test.ts compares every string to the lore
// file and runs the Part F checks. Author notes (*Wrongness*, *Threshold*) are not shipped.
// This file holds the Thanes' Moot and the Grey Wives (T10.9); the other two come in T10.10.

export interface OrderScene {
  readonly id: string;
  readonly title: string;
  readonly order: OrderId;
  readonly kind: 'opening' | 'chapter';
  /** The paragraphs; for a two-ending chapter, the part before the endings. */
  readonly body: readonly string[];
  /** Chapter 4 of the Moot and the Quenchers: variant A (the opposed Order is also seated). */
  readonly variantA?: readonly string[];
  /** Variant B (it is not). */
  readonly variantB?: readonly string[];
  /** Played after the variant, in both. */
  readonly ending?: readonly string[];
  /** A note of Ilse's shown in the Library under the chapter. */
  readonly libraryNote?: string;
}

export const mootGreyWivesScenes: readonly OrderScene[] = [
  {
    id: 'OS-M',
    title: 'A seat at the table',
    order: 'moot',
    kind: 'opening',
    body: [
      'Brana comes up from the gate with a folded paper and the look she keeps for bad weather.',
      '"Marta Dubska sent this by the ferry boy. It isn\'t a notice. It\'s an invitation, which is worse, because you have to answer it." She sets it down. "The five heads want a table with the hold at it. Not a council, she says. A habit."',
      'Pechko, from behind the stove: "Habits are how you tell a house from a heap of stones."',
      'Brana sniffs, and goes to see about the chairs.',
    ],
  },
  {
    id: 'OS-G',
    title: 'A basket on the step',
    order: 'greyWives',
    kind: 'opening',
    body: [
      'Someone has left a basket on the Hut step, under a cloth. Dried yarrow tied with red thread. A twist of honeycomb. A small card with a kettle drawn on it and five words in a careful hand: *For whoever keeps these kettles.*',
      'Brana turns the card over. Nothing on the back. "Herbwives, by the knot," she says. "They call themselves the Grey Wives."',
      'Pechko, from the doorway: "Leave the thread on. It\'s tied that way for a reason."',
    ],
  },
  {
    id: 'OR-M1',
    title: 'A table at the gate',
    order: 'moot',
    kind: 'chapter',
    body: [
      'Brana has put a long table under the gatehouse arch, which is not where she keeps tables. Five chairs on the long sides. The two ends are bare.',
      'Marta Dubska arrives first and counts the chairs twice. Gunnar Ravnsson comes up from the fell road with fish scales on his sleeve. Ilona Sváteková has brought a ledger and does not open it. Sólveig Arnadóttir sits with her hands folded over a small cloth bundle. Bohdan Kozel takes the chair nearest the door and says nothing at all.',
      '"I\'ll say it plain," Marta says. "Will the hearth still be lit in the spring?"',
      'You tell her it will.',
      '"Then tell the others."',
      'You do. Gunnar nods at the table. Ilona writes one line and shuts the book. Sólveig does not move.',
      'Brana puts out bread. Nobody takes an end chair. When the meal is over, the ends of the table are still bare, and nobody mentions it.',
    ],
  },
  {
    id: 'OR-M2',
    title: 'Salt and a ledger',
    order: 'moot',
    kind: 'chapter',
    body: [
      'The heads have come back. Gunnar has brought his complaint in the form of a fish, which he lays on the table.',
      '"Ravenfell\'s barrow road has gone bad," he says. "Send a hunter up there before the snow."',
      '"Mirograd\'s mill road has been bad for a month," Ilona says. "Markets don\'t wait for barrows."',
      'Marta looks from one to the other. "The hold has hunters. It hasn\'t got a dozen."',
      'Sólveig reaches into her bundle, takes a pinch of salt, and sets it on the table between the fish and the ledger. She says nothing. Everyone looks at it.',
      '"That\'s a yes," Gunnar says at last. "Or a no."',
      '"It\'s salt," says Ilona.',
      'They settle it over the bread: one hunter to the barrow road, one to the mill road, and the ferry will wait its turn. Bohdan, who has not spoken, takes the last piece of bread and eats it standing.',
    ],
  },
  {
    id: 'OR-M3',
    title: 'The one who leaves',
    order: 'moot',
    kind: 'chapter',
    body: [
      'Today the argument is about the grain store. Marta wants it kept at Dubno Ford, where the ferry can reach it. Gunnar wants it at Velkvik, because the fells always run short first. Ilona has a number for each, and it is not a number either of them likes.',
      'It is Gunnar who says it: "There\'s a wall of names in your gatehouse. Open, and written down, so nobody can say a thing was forgotten."',
      '"The Roll of Honor," Marta says.',
      'Ilona closes her ledger and stands. She looks at no one. She goes out through the gatehouse arch, and the door does not bang, because she closes it with her hand flat against the wood.',
      'Nobody speaks for a while. Then Marta says, "Mirograd\'s vote goes where mine goes," and rules the grain store into two halves, one at the Ford and one at Velkvik.',
      "Ilona's place at the bread stays empty. Bohdan looks at her chair as if it might explain itself.",
    ],
  },
  {
    id: 'OR-M4',
    title: 'What is it for?',
    order: 'moot',
    kind: 'chapter',
    body: [
      'The five heads have come to ask one question, and they have written it down so that none of them can change it. Marta reads it out.',
      '"What is the hold for?"',
      'It is a shorter question than you expected, and a longer one than it looks.',
    ],
    variantA: [
      'You have barely begun when the door opens. Bohdan Kozel is standing in it.',
      'He has not come to sit. He stands, and he says that Kozly Hollow will listen to the answer and will not vote on it.',
      '"I\'m not a guest," he says. "I\'m not a head tonight either. I\'m somebody who would like to hear what you say."',
      'Marta moves her chair six inches to the left. Nobody remarks on it. You give your answer, and the heads listen to all of it.',
    ],
    variantB: [
      "You give your answer. The heads put it to a vote: Marta, Gunnar and Ilona raise a hand, and Sólveig lays a pinch of salt in front of her place. Kozly Hollow's chair stays empty. Nobody says Bohdan's name.",
    ],
    ending: [
      'When it is over there is a sixth chair at the table. Brana brought it in without being asked. It stands at the head, and nobody sits in it.',
    ],
  },
  {
    id: 'OR-G1',
    title: 'The kettle test',
    order: 'greyWives',
    kind: 'chapter',
    body: [
      'Vesna of the Weir comes into the Hut with a very old woman on her arm and sets her down on the stool by the first kettle without explanation.',
      '"She asked to see where it\'s done," Vesna says. "That\'s all I\'m allowed to say."',
      'The old woman is small, grey from her shawl to her boots. She lifts the lid of every kettle in turn and breathes in. She says nothing about any brew. She does not look at the shelves.',
      'At the last kettle she stops, and speaks for the first time.',
      '"Which herb do you never use?"',
      'You think about it. It takes a while to find the answer, and you tell her. She nods as if she had known.',
      '"Use it once," she says, "and tell Vesna what happens."',
    ],
  },
  {
    id: 'OR-G2',
    title: 'Tea for a recipe',
    order: 'greyWives',
    kind: 'chapter',
    body: [
      'The eldest Grey Wife has come back, and she has brought a recipe in her head and nothing else. She will trade it, she says, for a cup of plain tea, and she will say it once.',
      'Ilse has her pencil out before the kettle boils.',
      '"Not written," the old woman says. "Say it back to me until you can say it without the paper."',
      'Ilse\'s pencil stops. "It will be lost if I don\'t."',
      '"It has been carried by mouth for a long time. It hasn\'t been lost yet."',
      'Ilse puts the pencil down. She says it back, and says it back again. The old woman drinks her tea and corrects her twice.',
    ],
    libraryNote: 'Recipe received, not recorded. I can recite it. This feels like an admission.',
  },
  {
    id: 'OR-G3',
    title: 'Two hands',
    order: 'greyWives',
    kind: 'chapter',
    body: [
      'Ostap and Vesna are arguing in the Hut, politely, the way two people argue who have each been right a good many times.',
      '"Set the bone first," Ostap says. "Then the tea, once the pain\'s gone quiet."',
      '"Tea first," says Vesna. "A frightened patient won\'t hold still for a splint."',
      '"A frightened patient won\'t keep tea down."',
      "The eldest Grey Wife sits between them with her hands folded. She has not said a word. She looks at Ostap's hands, then at Vesna's, then at Ostap's again.",
      '"Two hands," she says at last. "One to hold. One to give." She does not say whose is which.',
      'Ostap grunts. Vesna smiles into her cup. Neither of them concedes anything.',
    ],
  },
  {
    id: 'OR-G4',
    title: "What can't be mended",
    order: 'greyWives',
    kind: 'chapter',
    body: [
      'The eldest Grey Wife asks the question she has plainly come to ask.',
      '"What does the hold do for someone it can\'t mend?"',
      'Nobody answers quickly. Ostap looks at his hands. Vesna looks at the old woman.',
      'You say what you think. The old woman listens to all of it and does not say whether you were right.',
      'When she goes, she leaves a cup on the table by the kettles. It is full. It has not been given to anyone.',
      '"For whoever comes," Vesna says. "It\'s how it\'s done."',
      'The tea goes cold. Nobody pours it out.',
    ],
  },
];
