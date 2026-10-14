// Plan T1.31a: how each game image is built from the owner's CC0 packs. Every
// image is composed from 16 px tiles, then recolored to the palette by
// tools/build-art.ts. Change a recipe and re-run to swap art; never code.
//
// Tile numbers are positions in each pack's packed tilesheet, counted left to
// right, top to bottom from 0 (art-src/packs/<pack>/…; see Tilesheet.txt).

export interface Sheet {
  readonly pack: string;
  readonly path: string;
  readonly cols: number;
  readonly url: string;
}

export const SHEETS = {
  town: {
    pack: 'Tiny Town',
    path: 'art-src/packs/tiny-town/Tilemap/tilemap_packed.png',
    cols: 12,
    url: 'https://kenney.nl/assets/tiny-town',
  },
  bit: {
    pack: '1-Bit Pack',
    path: 'art-src/packs/1-bit-pack/Tilesheet/colored-transparent_packed.png',
    cols: 49,
    url: 'https://kenney.nl/assets/1-bit-pack',
  },
  bitMono: {
    pack: '1-Bit Pack',
    path: 'art-src/packs/1-bit-pack/Tilesheet/monochrome-transparent_packed.png',
    cols: 49,
    url: 'https://kenney.nl/assets/1-bit-pack',
  },
} as const satisfies Record<string, Sheet>;

export type SheetId = keyof typeof SHEETS;

/** Layers drawn in order; later layers cover earlier ones. Grid is rows of tile numbers, null = empty. */
export interface Recipe {
  readonly id: string;
  readonly file: string;
  readonly sheet: SheetId;
  readonly layers: readonly (readonly (readonly (number | null)[])[])[];
  /** Drop the pack's color first, so the palette picks greys (D65: a silvery coin from a gold one). */
  readonly grey?: boolean;
}

const _ = null;

/** A 2×2 building: one grid of tiles, optionally with an overlay grid on top. */
const building = (
  name: string,
  base: (number | null)[][],
  overlay?: (number | null)[][],
): Recipe => ({
  id: `building.${name}`,
  file: `buildings/${name}.png`,
  sheet: 'town',
  layers: overlay ? [base, overlay] : [base],
});

export const recipes: readonly Recipe[] = [
  // Resource icons, 16 px.
  { id: 'icon.resource.food', file: 'icons/food.png', sheet: 'bit', layers: [[[915]]] },
  { id: 'icon.resource.wood', file: 'icons/wood.png', sheet: 'town', layers: [[[106]]] },
  { id: 'icon.resource.iron', file: 'icons/iron.png', sheet: 'town', layers: [[[115]]] },
  {
    id: 'icon.resource.silver',
    file: 'icons/silver.png',
    sheet: 'town',
    layers: [[[93]]],
    grey: true,
  },

  // Buildings, 32 px (2 × 2 tiles).
  building('hearth-hall', [
    [60, 62],
    [88, 90],
  ]),
  building('cottage', [
    [64, 66],
    [84, 85],
  ]),
  building(
    'farm',
    [
      [12, 14],
      [36, 38],
    ],
    [
      [17, _],
      [_, 17],
    ],
  ),
  building(
    'woodcutters-camp',
    [
      [0, 1],
      [0, 0],
    ],
    [
      [16, 4],
      [106, 127],
    ],
  ),
  // No grass base: the dark panel behind shows through the tunnel mouth.
  building('mine', [
    [113, 114],
    [123, 124],
  ]),
  building(
    'silver-seam',
    [
      [96, 98],
      [120, 122],
    ],
    [
      [_, _],
      [115, _],
    ],
  ),
  building(
    'mill',
    [
      [52, 54],
      [72, 74],
    ],
    [
      [_, _],
      [_, 130],
    ],
  ),
  building(
    'sawpit',
    [
      [0, 0],
      [0, 0],
    ],
    [
      [106, 106],
      [80, 82],
    ],
  ),
  building(
    'smithy',
    [
      [60, 62],
      [76, 78],
    ],
    [
      [_, _],
      [128, _],
    ],
  ),
  building('bell-tower', [
    [60, 62],
    [125, 126],
  ]),
  // v0.2: a long stone barracks under a red roof, with an axe by the door; and the
  // Trophy Hall, a blue roof over stone with a target on the wall.
  building(
    'barracks',
    [
      [52, 54],
      [88, 90],
    ],
    [
      [_, _],
      [127, _],
    ],
  ),
  building(
    'trophy-hall',
    [
      [60, 62],
      [88, 90],
    ],
    [
      [_, _],
      [_, 95],
    ],
  ),

  // v0.3 (the owner's icon review): the Hunter's Lodge is a narrow red-gabled lodge with
  // an arrow by the door, the Alchemist's Hut a narrow blue-gabled hut with a jar by the
  // door (no other building has the gable outline), and the Herb Garden is beds of
  // bushes and sprouts on grass.
  building('hunters-lodge', [
    [_, 67],
    [119, 87],
  ]),
  building('alchemists-hut', [
    [_, 63],
    [131, 91],
  ]),
  building(
    'herb-garden',
    [
      [0, 1],
      [0, 0],
    ],
    [
      [5, 17],
      [17, 5],
    ],
  ),

  // v0.4 (plan T4.12): Walls, a crenellated stretch of stone; the Watchtower, a narrow
  // tower with a window beside a tree.
  building('walls', [
    [99, 101],
    [120, 122],
  ]),
  building(
    'watchtower',
    [
      [0, 1],
      [0, 0],
    ],
    [
      [102, _],
      [125, 16],
    ],
  ),

  // v0.4 icons, 16 px, from the 1-Bit Pack: Embers (a flame), Threat (a skull), and
  // the six relics (a spade, a plumb bob, a stick, a bone, a copper pot, a barred shield).
  { id: 'icon.embers', file: 'icons/embers.png', sheet: 'bit', layers: [[[505]]] },
  { id: 'icon.threat', file: 'icons/threat.png', sheet: 'bit', layers: [[[577]]] },
  ...(
    [
      ['plough-share', 287],
      ['masons-plumb', 386],
      ['tally-stick', 161],
      ['bone-whistle', 620],
      ['copper-still', 720],
      ['iron-shutter', 186],
    ] as const
  ).map(([id, tile]): Recipe => ({
    id: `icon.relic.${id}`,
    file: `icons/relic-${id}.png`,
    sheet: 'bit',
    layers: [[[tile]]],
  })),

  // v0.5 icons, 16 px, from the 1-Bit Pack (plan T5.13): the Wright's Blade (a broad
  // sword), the Ribbonshade's ribbon (a small red pennant), and four document types: a
  // letter (a scroll with lines), a journal page (a marked parchment), a ledger page (a
  // scroll with a grid) and a testament (a ruled page).
  ...(
    [
      ['gear', 'wrights-blade', 427],
      ['story', 'ribbon', 409],
      ['doc', 'letter', 768],
      ['doc', 'journal', 767],
      ['doc', 'ledger', 769],
      ['doc', 'testament', 497],
    ] as const
  ).map(([group, id, tile]): Recipe => ({
    id: `icon.${group}.${id}`,
    file: `icons/${group}-${id}.png`,
    sheet: 'bit',
    layers: [[[tile]]],
  })),

  // v0.6 icons, 16 px, from the 1-Bit Pack (plan T6.10): the six new brews (a brown flask,
  // a pale flask, a blue flask, a blue dropper, a green bottle, a round bomb) and the four
  // warden skills (a full flask, a hammer, a scroll, a crown).
  ...(
    [
      ['brew', 'hidebane-oil', 671],
      ['brew', 'wrights-oil', 670],
      ['brew', 'coldwater-draught', 669],
      ['brew', 'owl-eye-drops', 897],
      ['brew', 'steadfast-draught', 964],
      ['brew', 'poppy-smoke', 486],
      ['skill', 'alchemy', 581],
      ['skill', 'smithing', 380],
      ['skill', 'lore', 768],
      ['skill', 'command', 141],
    ] as const
  ).map(([group, id, tile]): Recipe => ({
    id: `icon.${group}.${id}`,
    file: `icons/${group}-${id}.png`,
    sheet: 'bit',
    layers: [[[tile]]],
  })),

  // Hold scenes, 160 × 64 (10 × 4 tiles): the hamlet among the ruins, then the
  // Keep with its restored wall and gatehouse (setting-primer §6.5).
  {
    id: 'scene.hold.hamlet',
    file: 'scenes/hold-hamlet.png',
    sheet: 'town',
    layers: [
      [
        [_, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _],
        [0, 1, 0, 2, 13, 13, 0, 1, 0, 2],
      ],
      [
        [_, _, _, _, _, _, _, _, _, _],
        [16, 4, 64, 66, _, _, 60, 62, 28, 16],
        [28, 5, 84, 85, 44, 46, 88, 90, 5, 4],
        [_, _, _, _, _, _, _, _, _, _],
      ],
    ],
  },
  {
    id: 'scene.hold.keep',
    file: 'scenes/hold-keep.png',
    sheet: 'town',
    layers: [
      [
        [_, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _],
        [0, 1, 0, 2, 13, 13, 0, 1, 0, 2],
      ],
      [
        [_, _, _, _, 60, 62, _, _, _, _],
        [16, 64, 66, 99, 111, 112, 101, 60, 62, 4],
        [5, 84, 85, 96, 113, 114, 98, 88, 90, 28],
        [_, _, _, _, _, _, _, _, _, _],
      ],
    ],
  },
  // v0.4 (D106): the Citadel restores the old Forge Hall (blue roof, its forge mouth
  // dark and cold) and raises a tower; the Bastion closes the wall between two towers,
  // with the door to the stair going down at the foot of the left one.
  {
    id: 'scene.hold.citadel',
    file: 'scenes/hold-citadel.png',
    sheet: 'town',
    layers: [
      [
        [_, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _],
        [0, 1, 0, 2, 13, 13, 0, 1, 0, 2],
      ],
      [
        [_, _, _, _, 60, 62, _, _, _, 102],
        [16, 64, 66, 99, 111, 112, 101, 60, 62, 125],
        [5, 84, 85, 96, 113, 114, 98, 76, 78, 125],
        [_, _, _, _, _, _, _, _, _, _],
      ],
    ],
  },
  {
    id: 'scene.hold.bastion',
    file: 'scenes/hold-bastion.png',
    sheet: 'town',
    layers: [
      [
        [_, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _],
        [_, _, _, _, _, _, _, _, _, _],
        [0, 1, 0, 2, 13, 13, 0, 1, 0, 2],
      ],
      [
        [102, _, 60, 62, 60, 62, 60, 62, _, 102],
        [125, 99, 76, 78, 111, 112, 88, 90, 101, 125],
        [103, 96, 97, 97, 113, 114, 97, 97, 98, 125],
        [_, _, _, _, _, _, _, _, _, _],
      ],
    ],
  },
];
