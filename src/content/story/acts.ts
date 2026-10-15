import { act1Documents } from './act1';
import { act2Documents } from './act2';
import { act3Documents } from './act3';
import { act4Documents } from './act4';
import type { DocumentDef } from './documents';

// GDD §5.14.1 and lore-secrets §5: one act per cycle. Acts I to IV are written
// (D163, D164, D209, D245). An act that isn't written yet has no documents, and its Long Night shows UNWRITTEN_ACT_LINE.

export interface ActDef {
  readonly act: number;
  /** "I. The Fall": not `title`, so the name check doesn't read it as a proper noun. */
  readonly heading: string;
  readonly witness: string;
  readonly documents: readonly DocumentDef[];
}

export const acts: readonly ActDef[] = [
  { act: 1, heading: 'I. The Fall', witness: 'Marta Dubska', documents: act1Documents },
  { act: 2, heading: 'II. The Sent', witness: 'Tomek Lis', documents: act2Documents },
  { act: 3, heading: 'III. The Night', witness: 'Arvid Netmender', documents: act3Documents },
  { act: 4, heading: 'IV. The Keeper', witness: 'Dobrava Halsten', documents: act4Documents },
];

/** The last act whose text is in the game. */
export const LAST_WRITTEN_ACT = 4;

/** "III" for act 3 (lore-secrets §5 has six acts). */
export const actNumeral = (act: number): string =>
  ['I', 'II', 'III', 'IV', 'V', 'VI'][act - 1] ?? String(act);

export const UNWRITTEN_ACT_LINE = 'The story continues in a later version.';

export const allDocuments: readonly DocumentDef[] = acts.flatMap((a) => a.documents);

/**
 * GDD §5.14.3, §9.14: the Accounts view. Each key event's accounts sit side by
 * side, each labeled with its witness; none is marked true. Excerpts are quoted
 * word for word from their documents (lore-secrets §21.3, §22.3, §26.3, §28.3).
 */
export interface AccountEvent {
  readonly id: 'fall' | 'apprentices' | 'bell' | 'yrsa' | 'light';
  readonly heading: string;
  readonly accounts: readonly { readonly document: string; readonly excerpt: string }[];
}

export const accountEvents: readonly AccountEvent[] = [
  {
    id: 'fall',
    heading: 'The Night of the Fall',
    accounts: [
      {
        document: 'D1-06',
        excerpt:
          'The Wrights came through the ford at midnight, going up. I counted them, because I count things. Thirty-one. None came down.',
      },
      {
        document: 'D1-09',
        excerpt:
          "Whatever she broke, she broke for a reason, and the fells don't ask a Varn to explain herself.",
      },
      {
        document: 'D1-02',
        excerpt:
          'Then she broke whatever it was under the hold, and after that night nobody came down the road for a fourth.',
      },
      { document: 'D1-10', excerpt: 'A folded sheet with nothing written on it.' },
      { document: 'D3-06', excerpt: 'Then we took our hammers to the chains.' },
    ],
  },
  {
    id: 'apprentices',
    heading: 'The apprentices',
    accounts: [
      {
        document: 'D1-04',
        excerpt:
          "The Wrights said he would be sent onward to the forges in the south, that a smith's life is a busy one, and that I should not expect letters.",
      },
      { document: 'D1-03', excerpt: 'Libor Kovář, ribboned — Onward' },
      {
        document: 'D1-02',
        excerpt: 'Not one of them came home to show us what a Wright looks like.',
      },
      { document: 'D2-02', excerpt: 'We are chosen.' },
      { document: 'D2-05', excerpt: 'Three from the Hollow now, and all three onward.' },
      { document: 'D2-06', excerpt: "The cart's turned toward Stanholm, not the south road." },
      { document: 'D2-01', excerpt: "Tomek isn't on it. Nobody from the Hollow is." },
      { document: 'D2-08', excerpt: "They don't go south." },
      { document: 'D3-03', excerpt: 'The cart never came through.' },
      { document: 'D3-05', excerpt: '272 · Eirik Varn · Velkvik · ribboned · onward' },
      { document: 'D4-02', excerpt: 'Took my hand at the bottom. I let her.' },
      {
        document: 'D4-03',
        excerpt:
          'I have written them where the order kept the things it hunted, because nobody opens this book but me.',
      },
    ],
  },
  {
    id: 'bell',
    heading: 'The bell',
    accounts: [
      {
        document: 'D2-04',
        excerpt:
          'He says it rings once every second spring, the night one of us goes onward, so the whole fell knows.',
      },
      { document: 'D2-07', excerpt: '278 · made ready. Not rung.' },
      {
        document: 'D2-09',
        excerpt: "I've had twenty-odd years to wonder why a feast needs a cart in the dark.",
      },
    ],
  },
  {
    id: 'yrsa',
    heading: "Yrsa's choice",
    accounts: [
      {
        document: 'D1-09',
        excerpt:
          "Whatever she broke, she broke for a reason, and the fells don't ask a Varn to explain herself.",
      },
      {
        document: 'D1-02',
        excerpt:
          'Then she broke whatever it was under the hold, and after that night nobody came down the road for a fourth.',
      },
      {
        document: 'D3-04',
        excerpt:
          "Everyone who stood up had someone on it. The ones who stayed in their seats didn't.",
      },
      { document: 'D3-06', excerpt: 'Yrsa was right.' },
      { document: 'D4-06', excerpt: 'When the Hearthblade broke the chains, I did not mend them.' },
    ],
  },
  {
    id: 'light',
    heading: 'The light in the window',
    accounts: [
      {
        document: 'D1-06',
        excerpt:
          'In the morning there was a light at the hold again, a small one, in the Hearth Hall window. It burned for twenty years.',
      },
      {
        document: 'D4-08',
        excerpt:
          'Every spring, by morning, the loaf was gone, and the cloth was folded and left on the stone.',
      },
      { document: 'D4-05', excerpt: 'Then she went up and sat with me, and kept it.' },
      { document: 'D4-06', excerpt: 'The light in the window was mine.' },
    ],
  },
];
