import type { DocumentDef } from './documents';

// lore-secrets §30 (v0.8 flesh-out, D301–D302): Act V, The Hearthblade. Witness: Yrsa Varn, the
// last Hearthblade, through letters she left in oilcloth at the bottom of the crack behind
// Pechko's stove. Texts word for word; the four names (#4–#7) are cut in the outer ring of the old
// hearth (D5-03). Act V adds no new proper nouns, and none of its conditions uses ruin or family
// counts (the family-counter bug of D318 cannot touch it).

/** Act V's arrival lines (lore §30): the new-warden sheet as Act V begins, and on load (D246). */
export const act5Arrival =
  "Ilse is back from Velkvik with the archive. Pechko is kneeling at the crack behind the stove, and he isn't sweeping.";
export const act5ArrivalOnLoad =
  "Pechko calls you over to the crack behind the stove before you've got your coat off.";

/** How a letter of Yrsa's shows on the away sheet and in results, in place of "came with the bounty". */
export const crackLetterLine = (heading: string): string =>
  `Pechko found a letter at the crack: '${heading}'.`;

/** On the Act V stand's result sheet, after D5-06 (GDD §8.12, D314): Yrsa's Thole, a keepsake. */
export const yrsaTholeLine =
  "Wrapped in the same oilcloth: a thole pin of black oak, worn smooth by a rower's hand.";

/** On the Rift card the first time the Unlit's door is open (GDD §5.14.1, D257, D302). */
export const sixthDoorLine = "There's a sixth door in the rift now. It's colder than the others.";

/** Documents that came up through the crack: Yrsa's letters (the away sheet says so, D302). */
export const CRACK_LETTERS: readonly string[] = ['D5-02', 'D5-03', 'D5-04', 'D5-05'];

export const act5Documents: readonly DocumentDef[] = [
  {
    id: 'D5-01',
    act: 5,
    heading: 'The broom',
    type: 'scene',
    witness: 'Pechko, Ilse',
    condition: { kind: 'actBegins' },
    body: [
      'Pechko is on his knees at the crack behind the stove, his broom across his lap. Rime has drifted up over the edge the way snow drifts against a door, and something dark is set in the middle of it.',
      'He breaks it out with his thumbs: a packet in oilcloth, tied with fishing line and stiff with frost. On the outside, in a big square hand: To whoever keeps the hearth.',
      '"I\'ve swept this floor every morning since it opened," he says. "It never gave anything back before. It\'s never been this warm up here before, either."',
      "He doesn't open it. He gives it to Ilse.",
    ],
    names: [],
  },
  {
    id: 'D5-02',
    act: 5,
    heading: 'The first night',
    type: 'letter',
    witness: 'Yrsa',
    condition: { kind: 'contractWon', nth: 1 },
    body: [
      'To whoever keeps the hearth —',
      "I sent Arvid and the others back up and came down with a lantern and no plan. Somebody should know where I went. Somebody should know why, too, but I'll get to that.",
      "Past the hearth with the chains, the floor goes on down: rough steps first, then a slope like the ramp in a mine. I followed the cold, because that's the way it was going.",
      "It wasn't coming after us. I'd been sure it would. It came up out of the floor and went past me the way a dog goes past you to get to the fire, and it settled round the hearth we'd broken, and lay there.",
      "I don't know what it wants with a cold hearth. I'm going to find out.",
    ],
    signature: '— Y. V.',
    names: [],
  },
  {
    id: 'D5-03',
    act: 5,
    heading: 'The rings',
    type: 'letter',
    witness: 'Yrsa',
    condition: { kind: 'contractWon', nth: 1, village: 'ravenfell' },
    body: [
      'To whoever keeps the hearth —',
      'I went back to the hearth today, while the cold was down the slope. I wanted to see the rings close, the ones the chains run out from.',
      "There are names cut in the outermost ring. Proper letters, with the year, the way you'd cut a gravestone. Whoever did it took their time. The first three are under a black crust I couldn't get my knife into. The next four I could read, and I've copied them here, because I'm the only one who's going to:",
      '206 · Hild Aslaugsdóttir · Ravenfell\n208 · Radim Tkadlec · Mirograd\n210 · Ragna Leifsdóttir · Velkvik\n212 · Vít Brodský · Dubno Ford',
      'After 212 the ring is bare all the way round. Whoever cut them stopped. I suppose it got easier.',
    ],
    signature: '— Y. V.',
    ilseNote:
      "Seven springs before the clerk's Mirograd roll begins. The first three are still down there. — I.M.",
    names: [4, 5, 6, 7],
  },
  {
    id: 'D5-04',
    act: 5,
    heading: 'The pit',
    type: 'letter',
    witness: 'Yrsa',
    condition: { kind: 'rankReached', age: 'citadel' },
    body: [
      'To whoever keeps the hearth —',
      "Under the grate of the great hearth there's a pit, as there is under any forge, for what the fire leaves. This one has a chute at the back that runs down out of sight.",
      "What's in it isn't clinker and it isn't soot. It's black and glassy, like the slag off bad iron, and when I picked a piece up my fingers went white to the knuckle. It's colder than anything down here. It's colder than the thing itself.",
      'I lay on my belly and put my lantern down the chute. The cold down there is thickest right where the slag lands.',
      'Two hundred and eighty years of it.',
    ],
    signature: '— Y. V.',
    names: [],
  },
  {
    id: 'D5-05',
    act: 5,
    heading: 'Arithmetic',
    type: 'letter',
    witness: 'Yrsa, to the Keeper',
    condition: { kind: 'rankReached', age: 'bastion' },
    body: [
      'Keeper —',
      "I don't know if anything goes up from here. I'm writing anyway, because you of all of them should know.",
      'Every ember the hearth takes, it leaves a little of that slag behind. The slag goes down the chute. The cold down there grows by it, a little every time, and pushes up a little harder, and the hearth needs a little more to hold it.',
      "You'll have noticed it wants more every year. I'd bet my father's boat you've put that down to your arithmetic.",
      "It isn't your arithmetic. It's the pit.",
    ],
    signature: '— Yrsa',
    ilseNote: "The Keeper's notes, her fourteenth year. Nearly word for word. — I.M.",
    names: [],
  },
  {
    id: 'D5-06',
    act: 5,
    heading: 'The long way round',
    type: 'testament',
    witness: 'Yrsa',
    condition: { kind: 'actStand' },
    body: [
      'To whoever keeps the hearth, last —',
      "The lantern's nearly done, so I'll be plain.",
      "The cold isn't something that crept in under the hold. We made it. Every warm thing the hearth was given, the founders and the Wrights and the children, left its slag in the pit, and the slag is the cold. The order built a fire to hold the cold back, and the fire is what grows it.",
      "I broke the chains to stop them sending children down that stair. I'd do it again. But the cold came up, and the hold fell, and I think whoever keeps the hearth now is still making slag, only slower, one keeper at a time.",
      "I came down to find another way. I haven't found one. I found that the cold doesn't bite. It lies by the broken hearth like a dog by a dead master, and when I talk, it listens.",
      "I don't know what it wants. I don't think it's more.",
      "Tell Eirik's friends I went the long way round.",
    ],
    signature: '— Yrsa Varn, Hearthblade',
    names: [],
  },
  {
    id: 'D5-07',
    act: 5,
    heading: 'By the crack',
    type: 'scene',
    witness: 'Pechko',
    condition: { kind: 'nextWarden' },
    body: [
      "That night Pechko doesn't sweep the crack. He sits beside it on his stool with his feet tucked up, the way a man sits by a sickbed.",
      '"I knew about the pit," he says, without turning round. "A stove knows what it leaves in the pan. I didn\'t know it was the cold. I didn\'t want to."',
      "Cold comes up through the crack and lies against the warm stones. For the first time, it doesn't feel like it's pushing.",
      '"Hear that? Quiet," Pechko says. "She talked to it for two years. It\'s still listening."',
    ],
    names: [],
  },
  {
    id: 'D5-08',
    act: 5,
    heading: 'A mouth, not a hearth',
    type: 'letter',
    witness: 'Věra, eldest of Kozly Hollow',
    condition: { kind: 'contractWon', nth: 2, village: 'kozly-hollow' },
    body: [
      'Warden —',
      "Your archivist has been asking the fells what they know about the cold. I'll tell you what the Hollow says, which is shorter.",
      "Up here, when a goat goes off its milk, we don't blame the goat. We look in its trough. My grandmother said the old fire under the hold was the same: a hearth that wants children isn't a hearth. It's a mouth. Shut it, and let whatever's under it go hungry.",
      "I blessed the Hearthblade all my life for shutting it. I'd thought that was the end of it.",
      'The young ones up here have started saying the same thing about your stove.',
    ],
    signature: '— Věra, eldest of Kozly Hollow',
    names: [],
  },
];
