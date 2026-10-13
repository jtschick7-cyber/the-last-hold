import type { MonsterAbility, MonsterId } from '../monsters';

// setting-primer §6.4: every bestiary entry has a blurb (2–3 sentences, in the voice
// of a hunter's notebook, drawn from folklore, practical and a little wry) and a
// "What it was" line (one sentence on whose grief or which burial made this one).
// The Upyr and Rusalka "What it was" lines are the primer's own.
// Nothing here may tell more of the Fall than the primer's public story.

export interface BestiaryText {
  readonly blurb: string;
  readonly whatItWas: string;
}

export const bestiaryText: Readonly<Record<MonsterId, BestiaryText>> = {
  wolf: {
    blurb:
      'Wolves grown wrong in the fog: grey, gaunt and too quiet. A real wolf howls to be heard; these only watch from the tree line until the flock has been counted. Keep your back to something solid, and watch your footing.',
    whatItWas:
      'What it was: a winter pack that ate what the villages left on the barrow-hills after the Fall, and kept eating.',
  },
  kikimora: {
    blurb:
      'A household spirit that went sour, usually in a house where nobody swept the hearth. It starts with knotted wool and spoiled milk and ends with the babies. Carry nothing you mean to use later when you go in.',
    whatItWas:
      'What it was: a housewife left alone in a marsh cottage, who kept the kettle on for a family that never came back.',
  },
  upyr: {
    blurb:
      'The dead who would not stay dead, and drink the living to make up the difference. It is hungry and heavier than it looks. What it takes from you it keeps, so do not stand next to it longer than you have to.',
    whatItWas:
      'What it was: a miller buried in a hurry in the plague year, with no one left to watch the grave.',
  },
  rusalka: {
    blurb:
      'A drowned girl who sings from the reeds on warm nights. She does not want to kill anyone; she wants company, and the river does the rest. Cover your ears if you have no one to pull you back.',
    whatItWas:
      "What it was: a girl from Dubno Ford who walked into the river the spring her betrothed didn't come home.",
  },
  poludnitsa: {
    blurb:
      'Lady Midday walks the fields when the sun is highest, and asks field-hands a question. If they answer wrong, or not at all, the heat finds them. Hunters work her early or late, and never in the open with an empty skin of water.',
    whatItWas:
      'What it was: a harvest-wife who collapsed in an August field with the sheaves half bound, and was left there until evening.',
  },
  vodyanoy: {
    blurb:
      'The old man of the mill-pond: green-bearded, slow, and strong as a weir. He keeps the water for himself and drags down what comes too near the wheel. Do not fight him on his own bank.',
    whatItWas:
      'What it was: a miller who drowned in his own race, and whose mill kept grinding long after anyone could say whose it was.',
  },
  draugr: {
    blurb:
      'A barrow-dead, swollen with cold and heavy with what was buried alongside him. He guards the grave goods by holding on to anyone who reaches for them. Fire first, and break the grip before he closes it.',
    whatItWas:
      'What it was: a chieftain laid in a barrow with his gold and his grudge, when the folk still believed one could take the other along.',
  },
  bies: {
    blurb:
      'A malice out of the wild places, sour at everything that eats, sleeps or sings. It starts small and gets worse with every hour you keep it angry. End it quickly or not at all.',
    whatItWas:
      'What it was: a hermit who lost the last argument of his life in the wood and spent the winter nursing it.',
  },
  leshy: {
    blurb:
      'The lord of the forest, tall as a pine in the fog and small as a stump by the road. He turns paths and calls from behind you in a voice you know. Take a rope, and do not follow any call you cannot place.',
    whatItWas:
      'What it was: the oldest tree in the wood, and the charcoal-burner who stayed with it the night it was felled.',
  },
  strzyga: {
    blurb:
      'Born with two souls, and when the body dies one of them gets up. She goes hunting in the evening, hungry and quick, and she is not finished when you think she is. Count on two fights where you only counted one.',
    whatItWas:
      "What it was: a midwife's daughter born with two teeth, who died unburied and unforgiven in the long winter.",
  },
  huldra: {
    blurb:
      "A lovely woman at the edge of the wood, with a cow's tail she hides under her skirts. She asks for a dance and then she asks for something worse. Go three together, and send the one who is most easily charmed to the back.",
    whatItWas:
      'What it was: a dairymaid sent up to the summer pasture alone, who was never fetched down in the autumn.',
  },
  nix: {
    blurb:
      'A white horse at the ford at dusk, saddled and patient. Anyone who climbs up is carried into the river, and the river is deeper than it looks. Salt turns it; a steady hand and a short rope turn the rider.',
    whatItWas:
      "What it was: the ferryman's horse, standing at the water-steps the night he rowed out after a child and did not return.",
  },
};

/**
 * A Mastered species shows a counter-tip for each of its abilities (GDD §5.6.2). Each tip
 * names something the game really does: a consumable, a trait or a rule of the fight.
 */
export const abilityTips: Readonly<Record<MonsterAbility['kind'], string>> = {
  hamstring:
    'A Quickfoot Tincture buys back the lost Speed, and a Saltburst cancels the first one that lands and the next three actions after it.',
  spoil:
    'Leave the Mending Draught at home: it ruins an unused potion. Tonics and Tinctures are drunk before its first hit, so they are safe.',
  bloodfeast:
    'Hit it hard and fast so it has less to drink. A Saltburst stops the healing for three actions.',
  drowningSong:
    'The song takes the lowest-Armor hunter, so keep your frailest hunter out of the front, or answer with a Saltburst on the first note.',
  noonHeat:
    'A Frost Pot quiets it for three actions, and a Saltburst cancels the first burn. Fire-touched hunters and an Emberwright plate take less.',
  dragUnder:
    'Bring a Hardwood Tonic for the doubled hit, or a Saltburst to cancel the first grab and the two after it.',
  barrowGrip:
    'Silver or Rune steel shortens the fight; a Saltburst cancels the first grip and the next three actions.',
  swell:
    'Its Armor rises once it is half-dead, so open with heavy hits and bring Fire or Frost, which ignore Armor in a bomb.',
  malice:
    'It gets worse every action, so end the fight early; a Frost Pot slows it and a Saltburst stops it growing for a while.',
  leadAstray:
    'A Saltburst cancels the first time it works. Otherwise bring a party deep enough to cover a lost action.',
  rootWall:
    'A burst of damage beats its regrowth: use Thornbane Oil and a Fire Pot, and a Saltburst stops the mending for three actions.',
  secondSoul:
    'It gets up once, so save your best hits for the second life. A Saltburst going off when it falls keeps it down.',
  enthrall:
    'It always takes your strongest hunter first, so do not put every eggshell in one basket; a Saltburst cancels the first charm.',
  riverhorse:
    'It takes the hunter with the least Health, so keep everyone topped up, or set a Saltburst and the horse carries nobody.',
};
