import type { LocationId } from '../damage';
import type { VillageId } from '../villages';

// setting-primer §6.3 and §6.7: contract notices. 2–4 sentences from the village
// head, describing symptoms and never the monster's name. The signature ("— Name,
// Village") is added by the UI from the village's head, so it never goes stale.
// Tone follows the village's starting trust, seeded silently (primer §3):
// Kozly Hollow and Ravenfell (Cold) are terse, Dubno Ford and Velkvik (Wary) are
// plain, Mirograd (Hopeful) says a little more. At most 1 in 10 carries an early
// seed, never more than one per notice, never explained (§6.7); Ravenfell never
// mentions the Hearthblade, in blessing or curse. Kozly Hollow's seed, "…and may the
// Hearthblade's name be kept warm", came back once the owner chose the name (Q10, D142).

export type NoticeTable = Readonly<
  Record<VillageId, Readonly<Partial<Record<LocationId, readonly string[]>>>>
>;

export const notices: NoticeTable = {
  'dubno-ford': {
    river: [
      "Two drowned at the ford this month, both strong swimmers. The ferry's tied up and the far bank is starving for it. We'll pay.",
      "Something is taking the boats. We find them moored at dawn, wet to the thwarts, and nobody has rowed them. The reeds go quiet at dusk. We'll pay what we can.",
      'The nets come up empty and the water by the weir has a taste. The children have been told to keep to the bank. If your people can see what is wrong, let them.',
    ],
    field: [
      "Three nights running the barley's been flattened in a ring, and the dog won't cross the ditch. We're not superstitious, but we're not stupid either. We'll pay.",
      'Our best hand was found sitting in the stubble at midday, grey as ash, saying he was fine. Two more since. It is always the hottest hour. Send someone before harvest.',
      "Chickens, then a goat, and now the milk's turning before it's cold. Nothing seen, nothing heard. We would like it found.",
    ],
  },
  'kozly-hollow': {
    forest: [
      "Goats lost in the wood. We found the bells and no goats. Pay is fair. …and may the Hearthblade's name be kept warm.",
      "The path to the high pasture moves. Two herders came back by dark, one didn't. Come, or don't.",
      'Trees marked in the night, and not by us. We sleep with the door barred. Pay is silver.',
    ],
    field: [
      'Cattle thin as rails and the gate still latched. Look at the fence posts.',
      "Something sits at the edge of the field at dusk. It doesn't move when we come. We stopped coming.",
      'A haystack burned from the inside out. We pay in silver, not in words.',
    ],
  },
  mirograd: {
    field: [
      'The market gate has been closed at dusk these past weeks, and folk are grumbling. Something walks the barley road after dark, and the carters will not take it. We would be grateful for your hunters.',
      'My boy, who went onward with the order, would have laughed at me for writing to a warden. But the mill-hands are frightened and the grain is not getting to town. Please.',
      'Two of the tanners’ children came home with white at the roots of their hair and no memory of the afternoon. Nobody in that house has slept since. We will pay properly.',
    ],
    river: [
      'The mill-pond has gone still and dark, and the wheel will not turn however the race runs. The miller is a practical man and says it is not a blockage. We would like it seen to.',
      "A girl went to the washing stones at dawn and didn't come back. Her basket was floating, full. We are asking for the others' sakes.",
      'Fish are rising dead and the water smells of cold iron. The market is nervous, and so am I. We will pay what is fair and more.',
    ],
  },
  velkvik: {
    river: [
      'Two boats lost at the fjord mouth in calm weather, and we found one hull-up. We are wary of the water now. Pay is silver.',
      'The tide goes out wrong at night and leaves tracks on the strand that end in the surf. Our dogs howl at it. Send someone who is not afraid of wet feet.',
      'Something is pulling our drying-lines down at night, and the ends come up wet. Pay is silver, and a place at the fire.',
    ],
    barrow: [
      'The mound on the east rise has settled in the night, as if something heavy got up. We have put salt on the threshold. We would sooner not look.',
      'Cold comes down from the hills before the weather does, and the sheep will not go near the stones. Two men went to look. Pay is fair.',
      'Grave-goods turned up on the path, wet with dew and laid out neatly. Whoever lays them out will want paying back. Come before the next one.',
    ],
  },
  ravenfell: {
    barrow: [
      "The stones hum. You'll think we're mad. Pay is silver.",
      'Our graves were dug from the inside this winter. Three, now. Come before the fourth.',
      'A light on the mound-top for three nights. On the fourth it walked down. We shut the doors. Pay is fair, and food.',
    ],
    forest: [
      'Woodcutters come back with their tools and no memory of the afternoon. Pay is silver.',
      "Something knocks on the shutters, always from the forest side. We don't open. We would like it to stop.",
      'The ravens left the fell. That is never good. Pay is silver.',
    ],
  },
};
