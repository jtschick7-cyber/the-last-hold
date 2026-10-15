import type { DocumentDef } from './documents';

// lore-secrets §28 (v0.7 flesh-out, D245–D247): Act IV, The Keeper. Witness: Dobrava
// Halsten, the last Keeper of the Forge, through what Pechko kept for her. Texts word for
// word; the six names (#21, #22, #24–#27) are in the margins of the order's old bestiary
// (D4-02, D4-03). Act IV adds no new proper nouns.

/** Act IV's arrival lines (lore §28): the new-warden sheet as Act IV begins, and on load (D246). */
export const act4Arrival =
  'Ilse is back from Velkvik with the archive. Pechko is waiting at the stove with something wrapped in oilcloth.';
export const act4ArrivalOnLoad =
  "Pechko comes out from behind the stove before you've got your coat off, with something wrapped in oilcloth.";

export const act4Documents: readonly DocumentDef[] = [
  {
    id: 'D4-01',
    act: 4,
    heading: 'The bundle',
    type: 'scene',
    witness: 'Pechko, Ilse',
    condition: { kind: 'actBegins' },
    body: [
      "Ilse has barely set the archive down when Pechko comes out from behind the stove with something wrapped in oilcloth. He doesn't give it to you. He gives it to Ilse.",
      '"Hers. The fisherman\'s had his say, so now it\'s her turn. She told me to wait for that."',
      "Inside is a book in the order's binding, its corners worn round. Ilse opens it and goes still. It's a bestiary, older than yours, and the margins are full of a small, careful hand.",
      '"Whose?" you ask.',
      'Pechko is already halfway back to the stove. "The one who kept the light in the window," he says, and shuts the door.',
    ],
    names: [],
  },
  {
    id: 'D4-02',
    act: 4,
    heading: 'Margins, I: field and forest',
    type: 'ledger',
    witness: 'Dobrava (in the margins)',
    condition: { kind: 'familyWon', nth: 1, family: 'field-and-forest-spirits' },
    preface:
      "THE ORDER'S BESTIARY — FIELD AND FOREST SPIRITS\nWritten in the margins of the kikimora and noon-wife pages, small, in brown ink:",
    body: [
      '240 · Ludmila Hrubá · Mirograd. My first time on the stair. She asked me if the south was warm. I said it was.',
      '242 · Anežka Vrbová · Kozly. Sang all the way down to keep her courage up. Knew every verse.',
      '244 · I was at Kamenfell this spring. The Keeper went down without me. I never learned his name.',
      '246 · Brynja Torsdóttir · Velkvik. Took my hand at the bottom. I let her.',
    ],
    ilseNote: 'The spring of 244 is on the Mirograd roll. — I.M.',
    names: [21, 22, 24],
  },
  {
    id: 'D4-03',
    act: 4,
    heading: 'Margins, II: beasts',
    type: 'ledger',
    witness: 'Dobrava (in the margins)',
    condition: { kind: 'familyWon', nth: 2, family: 'beasts-and-wilds' },
    preface:
      "THE ORDER'S BESTIARY — BEASTS AND WILDS\nIn the margins of the wolf pages, the same hand:",
    body: [
      '248 · Halla Runólfsdóttir · Ravenfell. Asked me my name. I told her.',
      '250 · Božena Stará · Mirograd. Brought bread for the cart and shared it out.',
      '252 · Štěpán Koláček · Mirograd. The last I carried the lantern for. After him the Keeper said I knew the stair.',
      'I have written them where the order kept the things it hunted, because nobody opens this book but me.',
    ],
    names: [25, 26, 27],
  },
  {
    id: 'D4-04',
    act: 4,
    heading: "The Keeper's notes",
    type: 'journal',
    witness: 'Dobrava',
    condition: { kind: 'rankReached', age: 'citadel' },
    body: [
      'My first year as Keeper. The seal wants what it has always wanted. I have told the Masters I will find it something else.',
      "Coal from the southern pits: it doesn't notice. Pitch: nothing. The warmth of old Wrights who die at home, given the way the founders gave theirs: it takes it, and it isn't enough. Not enough of us die at home anymore.",
      "My ninth year. Hearth-fire carried down in lanterns from every village, a hundred kitchens' worth. It warmed the stair. Nothing else.",
      "My fourteenth year. I've stopped writing down what fails. Every year the seal wants a little more than the year before. I put that down to my arithmetic.",
      'My eighteenth year. A Ravenfell girl this spring. I have the cart ready.',
    ],
    names: [],
  },
  {
    id: 'D4-05',
    act: 4,
    heading: 'The binding',
    type: 'scene',
    witness: 'Pechko',
    condition: { kind: 'rankReached', age: 'bastion' },
    body: [
      "Pechko is waiting at the foot of the Bastion stair when you come down. You have never seen him outside the Hearth Hall. He looks at the ribbons on the door and doesn't touch them.",
      '"The night the sky went out, she came down here after them, the Varn girl and her five. Too late. The chains were broken and the cold was coming up the stair like water up a well.',
      '"She could have mended them. There were Wrights still alive on the walls, and she knew the runes. She stood here a long time.',
      '"Then she did something else. She cut the hearth down there loose from the chains and tied it to the one upstairs. Mine. Whoever keeps my stove lit keeps that one lit. A hearth needs a keeper, she said, not a cart.',
      '"Then she went up and sat with me, and kept it. That\'s all. Go back up, warden. It\'s cold down here."',
    ],
    names: [],
  },
  {
    id: 'D4-06',
    act: 4,
    heading: 'To whoever it chooses',
    type: 'testament',
    witness: 'Dobrava',
    condition: { kind: 'actStand' },
    body: [
      'To the warden after me, whoever the warmth chooses —',
      'I am Dobrava Halsten, the last Keeper of the Forge. Some of the Sent went down the stair in my lantern-light before I was Keeper. The rest went on my word. I wrote the first ones down. I could not write the others twice.',
      'I knew what it was. I chose it every second spring, because the other choice was the dark loose in every village from the ford to the fells. Few to save many. I have said that to myself so often it has worn smooth.',
      'When the Hearthblade broke the chains, I did not mend them. I had the runes and I had the Wrights. I did not. I tied the seal to this hall instead, and to whoever keeps it, and I kept it. The light in the window was mine.',
      'It costs a warden what it costs. You will find out. It takes the warmth slowly, and it gives some back to the next one: what you knew, what you loved, a little of your hands. That is the only part of this I am not ashamed of.',
      'I burned every Sending record I could reach, so that no one could ever send another. I was wrong to. Without the names there is no one left to remember. Find them.',
      'I chose. I paid. I would like it to have been enough.',
    ],
    signature: '— Dobrava Halsten, at the Hearth Hall stove',
    names: [],
  },
  {
    id: 'D4-07',
    act: 4,
    heading: 'What the coals are',
    type: 'scene',
    witness: 'Pechko',
    condition: { kind: 'nextWarden' },
    body: [
      'That night Pechko sits on the hearthstone in front of the stove instead of behind it, which he has never done.',
      "\"Ilse says you've been asking what the Embers are. Here it is, plain, because she'd have wanted it plain.",
      "\"The hearth under the hold doesn't take apprentices anymore. It takes the warden. Slowly, the way a stove takes a log. You're the log that's lit now.",
      '"And what\'s left when a warden\'s done, the warm part, comes up here to me, and I hand it to the next one. Those Embers you spend? Your wardens before you. Every one."',
      'He gets up and goes back behind the stove.',
      '"Different face. Same warmth. I did tell you."',
    ],
    names: [],
  },
  {
    id: 'D4-08',
    act: 4,
    heading: 'Bread at the gate',
    type: 'letter',
    witness: 'Halina of Mirograd',
    condition: { kind: 'contractWon', nth: 2, village: 'mirograd' },
    body: [
      'To the warden at Stanholm —',
      'Your archivist writes to everyone, so here is something for her book.',
      'After the night the sky went out, I walked up to the hold every spring with a loaf, for Jaro, in case he came home that way. I left it on the gate-stone. There was no one alive up there; everybody said so.',
      'Every spring, by morning, the loaf was gone, and the cloth was folded and left on the stone.',
      'I never told anyone. I told myself it was him. I know better now. Whoever it was, I hope the bread was good.',
    ],
    signature: '— Halina, of Mirograd, by the well',
    names: [],
  },
];
