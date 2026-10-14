import type { LetterDef } from './letters';

// GDD §5.14.7, lore-secrets §23 (D165): the 17 letters that carry no name, drafted in
// T5.12 and approved by the owner as written (2026-10-14). Each is a letter to the
// warden, at Ilse's asking; none names anyone from the roll.

export const unnamedLetters: readonly LetterDef[] = [
  {
    hunter: 'halvar',
    slot: 0,
    body: [
      "Warden — Ilse says a letter doesn't have to be about anything. I'll hold her to that.",
      "I burned charcoal in the fells for twenty winters. You build the stack, you cover it in turf, and then you leave it alone for ten days, however it sounds in there. That's the whole trade: leaving a fire alone.",
      "People call me calm. I'm patient, which is not the same thing. The difference is what you do with your hands while you wait.",
      "The last stack I burned before I came down knocked from inside on the ninth night. Three knocks, a rest, three more. Settling logs, probably. I didn't open it.",
    ],
    signature: '— Halvar',
  },
  {
    hunter: 'halvar',
    slot: 1,
    body: [
      "Warden — Ilse asked for the strangest thing I ever saw. I told her I'd have to think, and then I thought about it for a week, which she says is a very Halvar answer.",
      "A stack gives off two smokes. White at the start: that's the water leaving. Blue at the end: that's the wood becoming something else. White means wait. Blue means done. There's a third, grey, that you never want, and I saw it once, standing up off a bare hillside where nobody had lit anything.",
      "It rose straight, in no wind. I put my hat over my face and walked home, and I'm not a man who walks home.",
    ],
    signature: '— Halvar',
  },
  {
    hunter: 'zora',
    slot: 0,
    body: [
      "Warden — Ilse wants something about the river, and the river is the only thing I know, so you're getting a small piece of it.",
      "I ran the Dubno ferry most of my life: a flat boat, a rope, a pole. One rule, my mother's. Never cross at dusk when the water goes flat. Flat water at dusk is listening.",
      "I laughed at her. Then the old ferryman rowed out after a child one evening, on water as flat as a plate, and didn't row back. I stopped laughing.",
      "That's why I carry the boathook. It was never for the boat.",
    ],
    signature: '— Zora',
  },
  {
    hunter: 'zora',
    slot: 1,
    body: [
      'Warden — This one is about a passenger, since Ilse says passengers are what ferries are for.',
      "Every Thursday for years a clerk crossed with me: stiff coat, no conversation, coins from a country I couldn't place. He always sat in the stern, facing back toward the bank we'd left. I asked him why once. He said he liked to watch what he was getting away from.",
      "He stopped coming the week the river turned. I looked for him on the road, and at the inn, and in the Dubno ledger, which Marta keeps and lets nobody read. He wasn't in it.",
      "I hope he got away. I'd like to know from what.",
    ],
    signature: '— Zora',
  },
  {
    hunter: 'bjarna',
    slot: 0,
    body: [
      "Warden — Ilse wants a story from the fells. We don't tell stories there. We tell the weather, and the weather is the story.",
      "So: the spring I was fifteen, the fjord froze in April with my father's boat in it. He walked home across the ice, three days out, and left the boat. He said the ice sang to him the whole way, one low note, and kept time with his steps.",
      "I dipped my spear in that same water the day I took it up. It has never quite thawed since. My father says it's a good spear. He's never said anything else about it.",
    ],
    signature: '— Bjarna',
  },
  {
    hunter: 'bjarna',
    slot: 1,
    body: [
      "Warden — In Velkvik we tie a rag to the bow of every boat before the first launch of the year, and we say nothing while we do it. Ilse asked what it's for. I told her luck.",
      "It's so the fjord has something to take that isn't the boat. The rag is always gone by morning.",
      'And every spring, one boat — mine, as often as not — has wet footprints on the deck at dawn. Bare feet. They always lead toward the shore.',
      "I used to scrub them off. I've stopped. Somebody is walking home, and it's none of my business how.",
    ],
    signature: '— Bjarna',
  },
  {
    hunter: 'vesna',
    slot: 0,
    body: [
      "Warden — Ilse asked for a recipe. I don't have recipes, I have habits. Here's one.",
      "Never pick yarrow from a field you haven't walked across first. Walk it slowly and let the field look at you. If the yarrow leans toward you, pick. If it leans away, go home, put the kettle on, and try again tomorrow. I've been called mad for that, usually by people who then ask me for a poultice.",
      "The morning before the sky went black, every plant in every field at the Weir leaned away from me at once. My grandmother said weather. It was the first time I didn't believe her.",
    ],
    signature: '— Vesna',
  },
  {
    hunter: 'vesna',
    slot: 1,
    body: [
      'Warden — Another habit, since the first one went over well enough. I taste before I trust. Not the root: the ground. One grain of soil from where it grew, on the tongue. Good ground tastes of rain. Bad ground tastes of nothing at all.',
      'The week you came, I tasted the soil in the Hearth Hall garden. Warm bread. Not a hint of it; the whole mouthful, the way a kitchen smells when someone has been baking since before dawn.',
      "I've spent the season deciding whether to tell anyone. So I'm telling Ilse, and she can decide.",
    ],
    signature: '— Vesna',
  },
  {
    hunter: 'radek',
    slot: 0,
    body: [
      "Warden — Ilse says everyone has a first grave. Mine was my father's. He dug it himself the winter before, because he didn't trust me with the corners.",
      "He was right. I filled it in crooked, and I've spent every year since getting the corners right on everyone else's.",
      "Mirograd has one rule about the work: dig it three days before you need it, never sooner. I once saw a hole dug a week early fill with black water overnight, on a dry hill, in a dry summer. I don't know why. I've never dug sooner.",
    ],
    signature: '— Radek',
  },
  {
    hunter: 'radek',
    slot: 1,
    body: [
      "Warden — Ilse asked about the shovel. I shod the blade with silver the winter the graves began to rise. That's the part everyone knows.",
      "The part nobody asks is that the silver is cold in my hands. Cold in summer and cold in winter, and that's how I know it's working. Warm would be wrong.",
      "It went warm once, last year, in the Mirograd yard, over a plot nobody had dug. I put a stone on it. The stone's still there. The grass around it is greener than the rest.",
      "I'm leaving it alone, the way you leave a sleeper.",
    ],
    signature: '— Radek',
  },
  {
    hunter: 'stanko',
    slot: 0,
    body: [
      "Warden — Ilse wants something true about wolves. I'll give her two true things.",
      "One: I never named my pup, because you shouldn't name what you might have to put down. She answered to a whistle. Eleven years she slept in the goat-shed with the kids piled on her back, and she never took one.",
      "Two: she died in her sleep, which I only know because I was awake. I'm usually awake. The grey ones come to the shed fence now at night and sit there. They don't want the goats. I've been trying to work out what they do want.",
    ],
    signature: '— Stanko',
  },
  {
    hunter: 'stanko',
    slot: 1,
    body: [
      "Warden — Short one, since I'm not good at writing and you're busy.",
      "Last night I counted the grey ones along the ridge above the shed: seven, standing in a row the way goats stand when the herder's late. I whistled her old whistle, low, just to see. The one in the middle flicked an ear.",
      "I've decided not to tell Toma. He'd make a theory of it, and the theory would be about the price of wool.",
    ],
    signature: '— Stanko',
  },
  {
    hunter: 'herdis',
    slot: 0,
    body: [
      "Warden — Ilse asked how I find what's lost. I look for what's missing, not for where it went.",
      "A ewe leaves the flock for a reason, and the reason has a shape: good grass, a bad smell, a place she thinks is safe. Find the shape and she's at the end of it. I've found every one since I was nine.",
      "The year I turned twelve, a lamb went up the barrow-hill in the snow. I found her on the far side, warm and unhurt, facing the hill. She wouldn't turn round for an hour. When she finally did, she looked at me as if I were late.",
    ],
    signature: '— Herdis',
  },
  {
    hunter: 'herdis',
    slot: 1,
    body: [
      "Warden — Ravenfell counts the flock out and counts it back, and if the number's right, you don't count again. When I was fourteen I counted again, because I'm me. One more than I'd started with.",
      "A ewe I'd never seen, eating at the edge of the flock, with my mark on her ear. The wrong ear. I kept her. She never had a lamb. Every autumn for nine winters she walked out to the barrow, stood facing it for an hour, and walked back.",
      "Nobody in Ravenfell ever said that was strange. I've decided to take that as an answer.",
    ],
    signature: '— Herdis',
  },
  {
    hunter: 'toma',
    slot: 1,
    body: [
      'Warden — Since Ilse is collecting, here is my theory about the Hearthblade, and I want it on record that I held it first.',
      "She wasn't a woman at all. She was three Wrights in one very large coat, taking turns at the front, because no single Wright could have done what she's said to have done. This accounts for every story about her height, and for the three different hair colours.",
      "Brana says the coat is the least believable part. I say it's the only part I can price.",
    ],
    signature: '— Toma',
  },
  {
    hunter: 'sigrun',
    slot: 1,
    body: [
      "Warden — Ilse asks what I do when I can't sleep. I trim lanterns.",
      "Wick square, glass clean, flame low, the way I was shown a long time ago by someone who was better at it. I do it with my left. The right is a half hand and can't tell when the glass is hot, which is the one thing I'd have liked it to keep.",
      "Pechko pretends not to see me. Last week the good oil, the clear kind, was on the shelf where I can reach it. Nobody said anything. That's how I know I'm being looked after. Don't make a thing of it.",
    ],
    signature: '— Sigrun',
  },
  {
    hunter: 'arvid',
    slot: 1,
    body: [
      "Warden — People think netmending is the lesser trade, the one you take up when you can't hold a blade. It isn't. A net is a hundred small promises. One knot lets go, and it's never the one you were watching.",
      "I mended nets in Velkvik for twenty years and hardly lost a fish. I lost something else, once, from my hands, and I've been trying since to say what. I'll tell you when I trust them to hold a pen.",
      "Ilse says that's the most I've said in a letter. She's counting.",
    ],
    signature: '— Arvid',
  },
];
