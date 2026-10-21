import { ages } from '../../content/ages';
import { families } from '../../content/damage';
import { hunters, type HunterId } from '../../content/hunters';
import { knowledgeLevels } from '../../content/knowledge';
import { monsters } from '../../content/monsters';
import { accountEvents, acts, actNumeral, allDocuments } from '../../content/story/acts';
import { documentTypeNames, type DocumentDef } from '../../content/story/documents';
import { letters, type LetterDef } from '../../content/story/letters';
import { foundNameLine, MISSING_NAME, namesFoundLine, roll } from '../../content/story/roll';
import { halinaRibbonNote } from '../../content/story/scenes';
import { trustLevels } from '../../content/story/trust';
import { villages } from '../../content/villages';
import { constantAt } from '../balance-access';
import type { GameState } from '../state/game-state';
import type { FoundDocument } from '../state/story-state';
import { balance } from '../../content/balance';
import {
  QUENCHERS_ACCOUNT,
  QUENCHERS_WITNESS,
  quenchersAccounts,
  quenchersLabel,
} from '../../content/story/orders-perks';
import { orderLevel } from '../systems/orders';
import { bellExtra, bellSentenceFor } from './orders-bell';
import { docKey } from './documents';
import { letterKey } from './letters';

// GDD §5.14.3 and §9.14 (D150): the Archive's four sections. The UI shows these as
// built; nothing here is computed by the UI.

const ordinal = (n: number): string => {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 ? 0 : n % 10] ?? 'th'}`;
};

/** The document's condition in plain words, for the reader's "Found:" line. */
export const describeCondition = (doc: DocumentDef): string => {
  const c = doc.condition;
  const act = `Act ${actNumeral(doc.act)}`;
  switch (c.kind) {
    case 'contractWon': {
      const what = c.village
        ? `${villages[c.village].name} contract`
        : c.location === 'ruin'
          ? 'ruin contract'
          : 'contract';
      if (c.minTrust)
        return `a ${what} won while ${villages[c.village ?? 'dubno-ford'].name} was ${trustLevels[c.minTrust].label}`;
      return `the ${c.nth === 1 ? 'first' : ordinal(c.nth)} ${what} won in ${act}`;
    }
    case 'rankReached':
      return `the ${ages[c.age].name} reached in ${act}`;
    case 'knowledge':
      return `the ${monsters[c.monster].name} ${knowledgeLevels[c.level].name}`;
    case 'hunterAtRank':
      return `${hunters[c.hunter].shortName} at the ${ages[c.age].name}`;
    case 'actStand':
      return `${act}'s Last Stand`;
    case 'nextWarden':
      return `the warden after ${act}`;
    case 'arvidArrives':
      return `Arvid's arrival with Ilse when ${act} begins`;
    case 'actBegins':
      return `${act} begins`;
    case 'familyWon':
      return `the ${c.nth === 1 ? 'first' : ordinal(c.nth)} ${families[c.family].name} contract won in ${act}`;
    case 'huntersTogether':
      return `${c.hunters.map((h) => hunters[h].shortName).join(' and ')} both at the hold`;
  }
};

/** "Found: the 2nd Mirograd contract won in Act I, cycle 1." */
export const foundLine = (doc: DocumentDef, found: FoundDocument): string =>
  // Arvid's own scene reads its condition even when found on load (D214).
  found.via === 'arrival' && doc.condition.kind !== 'arvidArrives'
    ? `Found: brought by Ilse when she came, cycle ${found.cycle}.`
    : `Found: ${describeCondition(doc)}, cycle ${found.cycle}.`;

export interface LibraryRow {
  readonly id: string;
  readonly heading: string;
  readonly witness: string;
  readonly found: FoundDocument;
  readonly foundLine: string;
  readonly unread: boolean;
}

export interface LibraryGroup {
  readonly act: string;
  readonly types: readonly { readonly type: string; readonly rows: readonly LibraryRow[] }[];
}

/** Every document found, by act, then type, newest first (GDD §9.14). */
export const library = (state: GameState): LibraryGroup[] =>
  acts
    .map((a) => ({
      act: a.heading,
      // The Rime has its own shelf (GDD §5.14.3, D364), as the letters have.
      types: [...new Set(a.documents.filter((d) => d.type !== 'rime').map((d) => d.type))]
        .map((type) => ({
          type: documentTypeNames[type],
          rows: a.documents
            .filter((d) => d.type === type)
            .flatMap((d) => {
              const found = state.story.documents.find((x) => x.id === d.id);
              return found
                ? [
                    {
                      id: d.id,
                      heading: d.heading,
                      witness: d.witness,
                      found,
                      foundLine: foundLine(d, found),
                      unread: state.story.unread.includes(docKey(d.id)),
                    },
                  ]
                : [];
            })
            .sort((x, y) => y.found.at - x.found.at),
        }))
        .filter((t) => t.rows.length > 0),
    }))
    .filter((g) => g.types.length > 0);

/** Every Rime found (the Unlit's writing in frost), newest first, for the Library's Rime shelf. */
export const rimeShelf = (state: GameState): LibraryRow[] =>
  allDocuments
    .filter((d) => d.type === 'rime')
    .flatMap((d) => {
      const found = state.story.documents.find((x) => x.id === d.id);
      return found
        ? [
            {
              id: d.id,
              heading: d.heading,
              witness: d.witness,
              found,
              foundLine: foundLine(d, found),
              unread: state.story.unread.includes(docKey(d.id)),
            },
          ]
        : [];
    })
    .sort((x, y) => y.found.at - x.found.at);

/** The reader's extra note under a document: Halina's ribbon, once Jaro's name is found. */
export const laterNote = (state: GameState, id: string): string | null =>
  id === 'D1-04' && state.story.names.some((n) => n.n === 39) ? halinaRibbonNote : null;

export interface ShelfLetter {
  readonly hunter: HunterId;
  readonly slot: 0 | 1;
  readonly from: string;
  readonly level: number;
  readonly letter: LetterDef;
  readonly unread: boolean;
}

/** The Library's letters shelf: letters reached whose text is written (GDD §5.14.7). */
export const lettersShelf = (state: GameState): ShelfLetter[] => {
  const levels = constantAt('letters.levels').value as readonly number[];
  return state.story.letters.flatMap((l) => {
    const letter = letters.find((x) => x.hunter === l.hunter && x.slot === l.slot);
    if (!letter?.body) return [];
    return [
      {
        hunter: l.hunter,
        slot: l.slot,
        from: hunters[l.hunter].name,
        level: levels[l.slot] ?? 0,
        letter,
        unread: state.story.unread.includes(letterKey(l.hunter, l.slot)),
      },
    ];
  });
};

/** A hunter's Letters row (GDD §9.14): each slot reached, or "at level N". */
export const hunterLetters = (
  state: GameState,
  hunter: HunterId,
): { readonly slot: 0 | 1; readonly level: number; readonly letter: LetterDef | null }[] => {
  const levels = constantAt('letters.levels').value as readonly number[];
  return ([0, 1] as const).map((slot) => {
    const reached = state.story.letters.some((l) => l.hunter === hunter && l.slot === slot);
    const letter = letters.find((x) => x.hunter === hunter && x.slot === slot) ?? null;
    return { slot, level: levels[slot] ?? 0, letter: reached && letter?.body ? letter : null };
  });
};

export interface AccountCard {
  readonly heading: string;
  readonly accounts: readonly {
    /** The document it comes from; null for the Quenchers' voice, which has no document (E4). */
    readonly document: string | null;
    /** "(the Quenchers, level 2)" on the Quenchers' voice. */
    readonly label?: string;
    readonly witness: string;
    readonly excerpt: string;
  }[];
}

/** Each key event, with the accounts found so far side by side; none is marked true. */
export const accounts = (state: GameState): AccountCard[] =>
  accountEvents
    .map((e) => ({
      heading: e.heading,
      accounts: e.accounts
        .filter((a) => state.story.documents.some((d) => d.id === a.document))
        .map((a) => ({
          document: a.document,
          witness: allDocuments.find((d) => d.id === a.document)?.witness ?? '',
          excerpt: a.excerpt,
        })),
    }))
    .filter((e) => e.accounts.length > 0)
    .map((e) => withQuenchers(state, e));

/**
 * The Quenchers' voice (lore §33 E4): while they are seated at level n, account n is added to "What the
 * hearth leaves", but only once that Account exists in the save (it was filtered above if it had none).
 */
const withQuenchers = (state: GameState, card: AccountCard): AccountCard => {
  if (card.heading !== QUENCHERS_ACCOUNT || !state.orders.seats.includes('quenchers')) return card;
  const level = Math.min(orderLevel(state, 'quenchers'), balance.orders.levels.value);
  const voice = level >= 1 ? quenchersAccounts[level as 1 | 2 | 3 | 4] : undefined;
  if (!voice) return card;
  return {
    ...card,
    accounts: [
      ...card.accounts,
      {
        document: null,
        label: quenchersLabel(level),
        witness: QUENCHERS_WITNESS,
        excerpt: voice.excerpt,
      },
    ],
  };
};

export interface NameRow {
  readonly n: number;
  readonly found: boolean;
  /** "Eirik Varn — Velkvik — onward, year 272 of the order." or the missing line. */
  readonly text: string;
  readonly hint: string | null;
  /** The Bell-Watchers' generated sentence after the hint, only while they are seated (lore §33 E3). */
  readonly extra?: string;
}

/** The Bell-Watchers' sentence as an optional row field, so rows without one keep their old shape. */
const extraFor = (state: GameState, n: number): { extra?: string } => {
  const extra = bellSentenceFor(state, n);
  return extra === null ? {} : { extra };
};

/** The Names view (GDD §5.14.3): the count, then all 40 in order. */
export const namesView = (
  state: GameState,
): { readonly title: string; readonly rows: NameRow[]; readonly remark: string | null } => {
  const found = new Set(state.story.names.map((x) => x.n));
  return {
    title: namesFoundLine(found.size),
    remark: bellExtra(state)?.remark ?? null,
    rows: roll.map((r) =>
      found.has(r.n)
        ? {
            n: r.n,
            found: true,
            text: foundNameLine(r.name, villages[r.village].name, r.year),
            hint: null,
          }
        : {
            n: r.n,
            found: false,
            text: MISSING_NAME,
            hint: r.hint,
            ...extraFor(state, r.n),
          },
    ),
  };
};

/** The Archive tab: shown once Ilse has arrived (D150, D151), with its badge count. */
export const archiveTab = (
  state: GameState,
): { readonly open: boolean; readonly unread: number } => ({
  open: state.story.ilseAt !== null,
  unread: state.story.unread.length,
});
