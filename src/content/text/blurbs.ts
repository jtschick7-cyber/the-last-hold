import type { BuildingId } from '../buildings';

// setting-primer §6.1: 1–2 sentences, present tense; what the building is now,
// with at most one detail of what it was. The Cottage and Smithy lines are the
// primer's own examples.
export const buildingBlurbs: Readonly<Record<BuildingId, string>> = {
  'hearth-hall':
    'The one roof that held. The stove at its heart was warm when you arrived, and nobody will say who lit it.',
  cottage: 'Four walls, a roof, a door that mostly shuts. Someone will call it home by nightfall.',
  farm: 'Three strips of stubborn soil inside the old outer wall. The barley comes up early here, as if it knows it is needed.',
  'woodcutters-camp':
    'A lean-to, a whetstone, and a woodpile that never gets taller than a man. The forest gives up its timber without much argument, so far.',
  mine: 'A cut into the hill below the north wall, shored with new beams. The miners say the first stretch was worked before, and neatly.',
  'silver-seam':
    'A thin bright vein in the cellar rock. It gives slowly, and the diggers lower their voices near it.',
  mill: "The wheel turns on the old hold's millrace again. It complains at every turn, and grinds anyway.",
  sawpit:
    'One sawyer above, one below, and a long blade between them. The planks come out straight, which is more than can be said for the language.',
  smithy:
    'The old forge-stones are still here, black with three hundred years of fire. They take heat faster than they should.',
  barracks:
    'A long low hall with bunks for the ones who go out. Axes hang by the door, each worn to the shape of one hand.',
  'trophy-hall':
    'Fangs, horns and a river-pearl or two, nailed up where the whole hold can see them. Children stand under them and count.',
  'hunters-lodge':
    "A long table, a lamp that is never put out, and a wall of pinned notices with the monsters' names scratched off. The old hunting-hall had a room like this, and somebody remembered where the lamp hung.",
  'alchemists-hut':
    'Kettles, a drying rack and a smell like a wet hedgerow set on fire. Everything in it is labelled in three different hands, and none of them agree.',
  'herb-garden':
    'Raised beds inside the south wall, where the old kitchen garden was. Yarrow, mugwort and juniper come up in tidy rows, as if they had been waiting to be asked.',
  'bell-tower':
    'The bell was found face-down in the rubble, uncracked. When it rings at dusk, the farms across the river light their lamps.',
};
