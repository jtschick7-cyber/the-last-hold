import { HUNTER_IDS, hunters, type HunterId } from '../hunters';
import { unnamedLetters } from './letters-unnamed';

// GDD §5.14.7 (D155, D156) and lore-secrets §23 (D165): every hunter has two
// letters to the warden, written at Ilse's asking: slot 0 at the first of
// `letters.levels`, slot 1 at the second, counting the highest level the hunter
// has ever reached. Five carry names and are written here word for word; the other 17
// carry none (`letters-unnamed.ts`, approved by the owner in T5.12).

export type LetterHunter = HunterId;
export type LetterSlot = 0 | 1;

export interface LetterDef {
  readonly hunter: LetterHunter;
  readonly slot: LetterSlot;
  /** Paragraphs; null until written (T5.12). */
  readonly body: readonly string[] | null;
  readonly signature: string;
  /** Roll number of the name it carries, if any (lore §20). */
  readonly name?: number;
}

const written: readonly LetterDef[] = [
  {
    hunter: 'ostap',
    slot: 0,
    name: 28,
    body: [
      "Warden — Ilse says you're keeping a list. Put this on it.",
      "When I was twelve, the ferryman's son at the ford taught me to set a finger by putting my own back in. Lubomír Přívozník. Lubo. Four years older than me, and the only one who'd let me tag along. The order took him the spring of 254, ribbon and feast and all, and the whole ford walked him to the edge of town.",
      'I became a bonesetter because of him. He never knew. I meant to tell him when he came home a Wright.',
      "I'm old enough now to be tired of meaning to.",
    ],
    signature: '— Ostap',
  },
  {
    hunter: 'ostap',
    slot: 1,
    name: 31,
    body: [
      "Warden — Another for Ilse's list, and then I'll stop.",
      "My first winter apprenticed to old Master Bielik, we were called up to Kozly Hollow for a boy who'd come off a goat-shed roof. Broken forearm, clean. I set it myself with Bielik watching. Tadeáš Kopecký, sixteen, and furious, because the feast for his ribbon was in six weeks and he meant to carry the banner.",
      'I told him it would hold by spring. It did. He carried the banner. I watched him go.',
      "Bielik said it was the best first set he'd ever seen. I've been proud of that arm for forty years. Lately I wonder who had the use of it.",
    ],
    signature: '— Ostap',
  },
  {
    hunter: 'toma',
    slot: 0,
    name: 29,
    body: [
      "Warden — Ilse wants this one for her list, so I'll tell it short, which you'll admit is a first.",
      "As a boy I walked the roads with my mother's cart: thread, needles, pots mended. At Kozly Hollow, the spring of 256, a goatherd girl bought our last skein of blue. Ivka Rohová. She wanted to stitch the hem of her ribbon herself, she said, so it would be hers and not the order's. She paid in cheese and haggled me down. I was ten. I've never got over it.",
      "She said she'd buy blue from us every year once she was a Wright. We came through every spring for six years. Never sold blue at the Hollow again.",
      "I tell everyone I'm the best haggler in the Gloamreach. She was better. Put her name down.",
    ],
    signature: '— Toma',
  },
  {
    hunter: 'sigrun',
    slot: 0,
    name: 38,
    body: [
      'Warden — Ilse asked me for something for her book. Here.',
      "Ylva Ketilsdóttir. My cousin, four years older. She taught me every net knot I know and cheated at every game we played. When the order's turn came round to Ravenfell in 274, the thane chose her, and I cried for a week because it wasn't me.",
      "I wanted that ribbon so badly. I got my own four springs later. That's another story.",
      "She'd be forty-something now, with children and opinions. She'd have hated this hand. She'd have tied the bandage in a better knot than I can.",
    ],
    signature: '— Sigrun',
  },
  {
    hunter: 'arvid',
    slot: 0,
    name: 34,
    body: [
      "Warden — The archivist keeps asking me questions. Here's an answer, and then she can leave an old man to his nets.",
      'Leif Sveinsson and I were going to be Wrights together. He was six years older and let me follow him everywhere. We swore it on the beach at Velkvik, a cut thumb each, the way boys do. His turn came first: the spring of 266, with the beach fires lit. He made me promise to follow.',
      'I followed. Seven springs later I was a Wright at Stanholm. I asked after Leif in every hall, and they said onward, to the southern forges, and I believed it for a long time.',
      "His thumb healed crooked. I'd know his hand anywhere.",
    ],
    signature: '— Arvid',
  },
];

const signatureOf = (hunter: LetterHunter): string => `— ${hunters[hunter].shortName}`;

const all: readonly LetterDef[] = [...written, ...unnamedLetters];

/** All 22 letters (D156): every hunter, both slots, in roster order then Arvid. */
export const letters: readonly LetterDef[] = HUNTER_IDS.flatMap((hunter: LetterHunter) =>
  ([0, 1] as const).map(
    (slot): LetterDef =>
      all.find((l) => l.hunter === hunter && l.slot === slot) ?? {
        hunter,
        slot,
        body: null,
        signature: signatureOf(hunter),
      },
  ),
);
