import type { AgeId } from '../ages';
import type { FamilyId } from '../damage';
import type { HunterId } from '../hunters';
import type { KnowledgeLevel } from '../knowledge';
import type { MonsterId } from '../monsters';
import type { VillageId } from '../villages';
import type { TrustLevel } from './trust';

// GDD §5.14.2 (D148): documents arrive on fixed conditions, never by chance. The
// texts and conditions are lore-secrets §21 (Act I), §22 (Act II), §26 (Act III) and §28 (Act IV), word
// for word. Core (T5.6) reads the conditions; the Archive (T5.11a) shows the text.

/** lore-secrets §15.1. Ember-echoes (E-01 to E-18, lore §29) arrive with Delves and belong to no act. */
export const DOCUMENT_TYPES = [
  'letter',
  'journal',
  'ledger',
  'testament',
  'field-note',
  'scene',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const documentTypeNames: Readonly<Record<DocumentType, string>> = {
  letter: 'Letter',
  journal: 'Journal page',
  ledger: 'Ledger page',
  testament: 'Testament',
  'field-note': 'Field note',
  scene: 'Resident scene',
};

/**
 * One condition per document (GDD §5.14.2). Counts start when the document's act
 * begins and go on in every later cycle until met (§5.14.1); a Rank counts when
 * it's reached in the act's cycle or any later one.
 */
export type DocumentCondition =
  /** The nth contract won after the act begins, optionally for one village, at ruins, or at a trust level. */
  | {
      readonly kind: 'contractWon';
      readonly nth: number;
      readonly village?: VillageId;
      readonly location?: 'ruin';
      /** Only wins while the village is at least this trusting count (D147). */
      readonly minTrust?: TrustLevel;
    }
  | { readonly kind: 'rankReached'; readonly age: AgeId }
  | { readonly kind: 'knowledge'; readonly monster: MonsterId; readonly level: KnowledgeLevel }
  /** The Rank is reached with the hunter on the roster, or later, when the hunter is recruited. */
  | { readonly kind: 'hunterAtRank'; readonly hunter: HunterId; readonly age: AgeId }
  /** The act's Last Stand: shown on the stand's result sheet. */
  | { readonly kind: 'actStand' }
  /** The next warden's arrival: the new-warden sheet, after naming. */
  | { readonly kind: 'nextWarden' }
  /** Arvid arrives with Ilse when Act III begins (lore §26, D211, D214). */
  | { readonly kind: 'arvidArrives' }
  /** The act begins: its opening scene plays (D4-01, lore §28, D245). Judged when the act starts, never by a sweep. */
  | { readonly kind: 'actBegins' }
  /** The nth contract won against a monster family since the act began (D4-02, D4-03, D245). */
  | { readonly kind: 'familyWon'; readonly nth: number; readonly family: FamilyId }
  /** Two hunters are both on the roster, in the act's cycle or later, once `after` is found (D213). */
  | {
      readonly kind: 'huntersTogether';
      readonly hunters: readonly [HunterId, HunterId];
      readonly after: string;
    };

/** A ledger page's table (D1-03). */
export interface DocumentTable {
  readonly header: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

export interface DocumentDef {
  /** The lore-secrets id, e.g. 'D1-04'. */
  readonly id: string;
  readonly act: number;
  /** Not `title`: document headings aren't proper nouns (tests/content/find-names.ts). */
  readonly heading: string;
  readonly type: DocumentType;
  readonly witness: string;
  readonly condition: DocumentCondition;
  /** A line above the text (a ledger's caption, Ilse's pinned note). */
  readonly preface?: string;
  /** The text, one entry per paragraph; '\n' breaks a line within one. */
  readonly body: readonly string[];
  readonly table?: DocumentTable;
  readonly signature?: string;
  /** Ilse's note under it in the Library. */
  readonly ilseNote?: string;
  /** Roll numbers of the names it carries (lore-secrets §20). */
  readonly names: readonly number[];
  /** A second item handed over with it, filed beside it in the Library (D3-05's ledger strip). */
  readonly attachment?: {
    readonly heading: string;
    readonly type: DocumentType;
    readonly preface?: string;
    readonly body: readonly string[];
    readonly ilseNote?: string;
  };
}
