import { V05_CLUE_TAGS, v05ClueTexts } from './clues-v05';
// GDD §8.4: the clue library. Each tag has several in-world texts; a contract
// draws one text per revealed tag, picked by seed. Species carry three tags each
// (monsters.ts); three clues together always name exactly one species.
// Voice: setting-primer §1 — plain, specific, human, one wrongness at a time.

export const CLUE_TAGS = [
  'tracks',
  'livestock',
  'night',
  'house',
  'swamp',
  'grave',
  'bloodless',
  'cold',
  'treasure',
  'drowned',
  'song',
  'mill',
  'noon',
  'fields',
  'madness',
  'lost',
  'forest-shift',
  'strange-birth',
  'stranger',
  'horse',
  // v0.5: the Cursed's tags (GDD §8.4, D158).
  ...V05_CLUE_TAGS,
] as const;
export type ClueTag = (typeof CLUE_TAGS)[number];

/** At least three texts per tag; the first is the GDD §8.4 example. */
export const clueTexts: Readonly<Record<ClueTag, readonly string[]>> = {
  tracks: [
    'Prints in the mud, too wide for any dog, sunk deep at the heel.',
    'The same tracks circle the sheepfold twice, then stop at the gate as if it had been asked in.',
    'Claw marks on the cart-road, running alongside the wheel ruts for a mile.',
  ],
  livestock: [
    'Three goats dead in the pen. The gate was latched from the inside.',
    'The cow gave blood instead of milk, and the calf will not go near the byre.',
    'Every hen on the farm sits facing the same wall and will not be moved.',
  ],
  night: [
    'It only comes after the last lamp is out.',
    'Nothing has been seen by day. The shepherds bring their dogs in at dusk and do not argue about it.',
    'The watchman swears it began the night the moon went thin, and has not missed one since.',
  ],
  house: [
    'Pots broken in the night, wool tangled into knots no one tied.',
    'The hearth went out three nights running, and the ashes were swept into a neat ring.',
    'Milk soured in the crock by morning. The cat sleeps in the yard now and will not say why.',
  ],
  swamp: [
    'The reeds by the old peat-cut have gone black and stinking.',
    'Marsh-lights hang low over the bog, and the geese have left it.',
    'A cart-horse sank to the hocks on firm ground. It was dry the day before.',
  ],
  grave: [
    "The new grave's soil was turned over, from below.",
    'The burial-mound has a hole in its side the width of a man, edged with clean earth.',
    'Fresh flowers on a grave nobody has tended in years, and not one footprint around it.',
  ],
  bloodless: [
    'The body was pale as tallow, and there was no blood on the bed.',
    'Two small marks on the neck, no wider than a thumbnail. The linen under her was dry.',
    'He died in his sleep, they say. The undertaker says there was nothing in him to bleed.',
  ],
  cold: [
    'Frost on the barrow stones in midsummer.',
    'The candle burned blue in the chapel and the priest could see his own breath.',
    'Water left in the well-bucket froze solid overnight, in the week of the harvest.',
  ],
  treasure: [
    'The tomb-robbers came back raving about gold, and only one came back.',
    "A ring turned up in the miller's purse that no one will own to, and it is older than the village.",
    'Whoever dug there found a chest, and whoever opened it is not talking.',
  ],
  drowned: [
    'Two drowned at the ford this month, both strong swimmers.',
    "The fisherman's boat came back with the oars shipped and nobody aboard.",
    'A child found at the water-steps with wet hair and dry clothes, and no memory of the river.',
  ],
  song: [
    'The fishermen hear a woman singing where no woman should be.',
    'The girls say they heard their names sung from the reeds, in a voice they knew.',
    'A tune with no words, three notes down and one up, and the men who hear it walk toward the water.',
  ],
  mill: [
    'The mill-wheel stops at night, as if something holds it.',
    'Flour in the sacks has turned to river-silt, and the miller keeps finding the pond a hand higher.',
    'The miller will not sleep at the mill any more, and he has not said why.',
  ],
  noon: [
    'The reapers who fell sick all fell at midday.',
    'The heat comes down at noon like a hand, and by the third bell the field is empty and the sickles lie where they dropped.',
    'Nobody works the east field between the sixth and seventh hour, and the old women do not look at it.',
  ],
  fields: [
    'The barley is flattened in a ring, and nothing walked in.',
    'The boundary stones have been turned to face the field instead of the road.',
    'The stooks stand in rows tidier than any reaper made them.',
  ],
  madness: [
    "He came home talking to someone who wasn't there.",
    'The shepherd laughs at nothing and has begun to argue with the sheep, who he says argue back.',
    'She counted the same seven stones all night and could not say what she was counting for.',
  ],
  lost: [
    'Woodcutters walk for hours and come out where they started.',
    'A man walked a road he has known for forty years and found himself at a crossing nobody built.',
    'The children went to gather mushrooms and came home three days later, sure it had been an hour.',
  ],
  'forest-shift': [
    'The old path is gone. The trees stand where it used to run.',
    'The tall oak by the boundary stood by the well in spring. It stands by the road now.',
    'The charcoal-burners marked a trail with white cloth, and in the morning the cloth was on a different tree.',
  ],
  'strange-birth': [
    "The woman's son was born with two teeth, and he died last winter.",
    'Born feet first with a caul over his face, and the midwife left before dawn without her fee.',
    'The baby had eyes of two different colors. The mother says she was told to burn the cradle.',
  ],
  stranger: [
    'A woman no one knew danced at the harvest feast. Three men followed her into the wood.',
    'A tall stranger asked for water at the well and thanked them in the old tongue. The dogs went silent.',
    'A newcomer in a good green dress, who does not seem to have a village to be from.',
  ],
  horse: [
    "A white horse stood by the ford at dusk. The miller's boy climbed on, and it walked into the river.",
    'Wet hoofprints from the river to the lane, and none going back.',
    'The ferryman says a grey horse stands in the shallows every dusk, saddled, and no one has seen its owner.',
  ],
  ...v05ClueTexts,
};
