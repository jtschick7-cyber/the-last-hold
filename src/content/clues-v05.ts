// GDD §8.4 (v0.5): the clue tags of the ruins' Cursed creatures. Content only
// (plan T5.1); they join CLUE_TAGS and clueTexts with the creatures in T5.4.
// At least three texts per tag; the first is the GDD §8.4 example.
// Voice: setting-primer §1 — plain, specific, human, one wrongness at a time.

export const V05_CLUE_TAGS = [
  'lightless',
  'swarm',
  'ribbon',
  'singed',
  'forge',
  'hammering',
  'iron-tread',
] as const;
export type V05ClueTag = (typeof V05_CLUE_TAGS)[number];

export const v05ClueTexts: Readonly<Record<V05ClueTag, readonly string[]>> = {
  lightless: [
    "Lanterns go out in the old yard, one after another, though there's no wind.",
    'The goatherd lit a fire under the ruined arch. It burned, but it gave no light past his own hands.',
    'Candles carried in come out cold, their wicks still whole, as if they had never been lit.',
  ],
  swarm: [
    'Something rose off the rafters like smoke, and it was wings.',
    'A sound like a hundred moths at a window, coming from a room with no windows left.',
    'The boys who went in for a dare came out grey with dust that was not dust. It moved.',
  ],
  ribbon: [
    'A herd-boy saw a shape at the forge door with a blue ribbon on its sleeve.',
    'A strip of faded cloth tied to the gatepost, knotted fresh, though no one from the village has been up there.',
    'Something stood in the doorway with its arms at its sides, the way a child stands to be looked over. It wore a ribbon.',
  ],
  singed: [
    'The goat that wandered in came out with its coat scorched in the shape of a hand.',
    'The ferns along the path are brown on one side only, the side that faces the old forge.',
    'A shepherd came back with the hair burned off one wrist. He says something took his hand to lead him, gently.',
  ],
  forge: [
    "The marks on the lintel are the old order's: an anvil with a flame on it.",
    'There is soot on the stones inside, and it is new soot. The hearth there has been cold for twenty years.',
    'The children found a pair of tongs in the ruin. They were warm.',
  ],
  hammering: [
    "You can hear hammering from the ruin at night. Nobody's lit that forge in twenty years.",
    'Three blows, a rest, three blows. The same rhythm every night, and it never finishes whatever it is making.',
    'The woodcutters say the ringing carries down the valley on still nights, and the dogs answer it.',
  ],
  'iron-tread': [
    'Footprints in the frost, each one as big as a shield and pressed an inch into rock.',
    'The old bridge below the ruin is cracked across the middle, and the crack is rimed white in summer.',
    'Something walked through the stone wall of the sheepfold rather than over it, and did not hurry.',
  ],
};
