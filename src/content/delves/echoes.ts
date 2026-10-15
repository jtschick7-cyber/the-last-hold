import type { RarityId } from './blessing-types';
import type { PatronId } from './patrons';

// lore-secrets §29 (D263): 18 Ember-echoes, E-01 to E-18, three per patron (the Unlit's three
// locked with its door). One is found the first time ever you take a Faint, a Warm and a
// Bright blessing from its patron. They sit on the Library's Echoes shelf; never plot, never
// names, never required. Texts word for word. E-01 replaces the old D1-08 (lore §15.2).

export interface EchoDef {
  readonly id: string;
  readonly patron: PatronId;
  /** Found the first time ever a blessing of this rarity is taken from the patron. */
  readonly rarity: RarityId;
  readonly text: string;
}

export const echoes: readonly EchoDef[] = [
  {
    id: 'E-01',
    patron: 'pale-smith',
    rarity: 'faint',
    text: 'I lit the first fire. I thought it would be enough.',
  },
  {
    id: 'E-02',
    patron: 'pale-smith',
    rarity: 'warm',
    text: 'Good iron remembers the hammer. I wanted the hold to remember us the same way.',
  },
  {
    id: 'E-03',
    patron: 'pale-smith',
    rarity: 'bright',
    text: 'Every smith knows the fire takes something from what it makes. I thought it would only take from me.',
  },
  {
    id: 'E-04',
    patron: 'weaver',
    rarity: 'faint',
    text: 'I wove the first ribbon blue so they could find each other in a crowd.',
  },
  {
    id: 'E-05',
    patron: 'weaver',
    rarity: 'warm',
    text: 'One thread snaps. Twenty together will hold a boat. That was all my teaching.',
  },
  {
    id: 'E-06',
    patron: 'weaver',
    rarity: 'bright',
    text: 'I stitched every hem myself, as long as my eyes held. After me, someone else held the needle.',
  },
  {
    id: 'E-07',
    patron: 'wolf',
    rarity: 'faint',
    text: "Down here the cold doesn't bite. It waits. I liked it better when things bit.",
  },
  {
    id: 'E-08',
    patron: 'wolf',
    rarity: 'warm',
    text: 'Hunger is honest. It tells you what it wants.',
  },
  {
    id: 'E-09',
    patron: 'wolf',
    rarity: 'bright',
    text: 'Somebody has to walk toward it. It may as well be someone fast.',
  },
  {
    id: 'E-10',
    patron: 'hearth-crone',
    rarity: 'faint',
    text: 'Sit. Eat. The dark will keep till morning; it always has.',
  },
  {
    id: 'E-11',
    patron: 'hearth-crone',
    rarity: 'warm',
    text: "A good keeper counts the logs and doesn't count the nights.",
  },
  {
    id: 'E-12',
    patron: 'hearth-crone',
    rarity: 'bright',
    text: 'Everything warm costs something. I only ever argued about the price.',
  },
  {
    id: 'E-13',
    patron: 'drowned-bell',
    rarity: 'faint',
    text: "We were proud. Don't take that from us too.",
  },
  {
    id: 'E-14',
    patron: 'drowned-bell',
    rarity: 'warm',
    text: "It's quiet where we are. Quiet isn't the same as gone.",
  },
  {
    id: 'E-15',
    patron: 'drowned-bell',
    rarity: 'bright',
    text: 'Say a name once more. Any name. We hear all of them.',
  },
  { id: 'E-16', patron: 'unlit', rarity: 'faint', text: 'Cold is only warmth that nobody kept.' },
  { id: 'E-17', patron: 'unlit', rarity: 'warm', text: 'I was small, once.' },
  { id: 'E-18', patron: 'unlit', rarity: 'bright', text: 'Say it. Not to me. About me.' },
];
