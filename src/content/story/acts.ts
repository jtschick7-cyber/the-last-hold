import { act1Documents } from './act1';
import { act2Documents } from './act2';
import type { DocumentDef } from './documents';

// GDD §5.14.1 and lore-secrets §5: one act per cycle. Acts I and II are written
// (D163, D164); Act III is written at the v0.6 flesh-out. An act that isn't
// written yet has no documents, and its Long Night shows UNWRITTEN_ACT_LINE.

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
];

/** The last act whose text is in the game. */
export const LAST_WRITTEN_ACT = 2;

export const UNWRITTEN_ACT_LINE = 'The story continues in a later version.';

export const allDocuments: readonly DocumentDef[] = acts.flatMap((a) => a.documents);

/**
 * GDD §5.14.3, §9.14: the Accounts view. Each key event's accounts sit side by
 * side, each labeled with its witness; none is marked true. Excerpts are quoted
 * word for word from their documents (lore-secrets §21.3, §22.3).
 */
export interface AccountEvent {
  readonly id: 'fall' | 'apprentices' | 'bell';
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
];
