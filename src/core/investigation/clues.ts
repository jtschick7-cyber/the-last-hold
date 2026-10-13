import { clueTexts, type ClueTag } from '../../content/clues';
import { monsters, type MonsterId } from '../../content/monsters';
import { stream } from '../rng';
import type { ContractInstance } from '../state/game-state';
import { candidatesFor } from '../contracts/candidates';

// GDD §5.6.3 and §8.4: what a contract's clues are and what they rule out. Which tags
// come in which order, and which text each shows, are fixed by the clue stream
// (technical design §7.2), so only the count revealed is saved.

type Subject = Pick<ContractInstance, 'id' | 'monster'>;

export interface ClueDraw {
  /** The true species' three tags, in the order they are revealed. */
  readonly tags: readonly [ClueTag, ClueTag, ClueTag];
  readonly texts: readonly [string, string, string];
}

/** The three clues of a contract, from `${gameSeed}:clues:${contractId}`. */
export const clueDraw = (gameSeed: string, contract: Subject): ClueDraw => {
  const rolls = stream(gameSeed, 'clues', contract.id);
  const tags: ClueTag[] = [...monsters[contract.monster].clueTags];
  // Fisher–Yates over three tags: two rolls.
  for (let i = tags.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rolls.next() * (i + 1)));
    const a = tags[i] as ClueTag;
    tags[i] = tags[j] as ClueTag;
    tags[j] = a;
  }
  const texts = tags.map((tag) => {
    const list = clueTexts[tag];
    return list[Math.min(list.length - 1, Math.floor(rolls.next() * list.length))] ?? '';
  });
  return {
    tags: tags as unknown as ClueDraw['tags'],
    texts: texts as unknown as ClueDraw['texts'],
  };
};

/** The clues shown so far, oldest first. */
export const revealedClues = (
  gameSeed: string,
  contract: Pick<ContractInstance, 'id' | 'monster' | 'revealed'>,
): { tag: ClueTag; text: string }[] => {
  const d = clueDraw(gameSeed, contract);
  return d.tags.slice(0, contract.revealed).map((tag, i) => ({ tag, text: d.texts[i] ?? '' }));
};

/**
 * Every species still possible: the pool for its place and tier, minus any that lack a
 * revealed tag. All three clues always leave exactly the true one (GDD §8.3.1 rule 3).
 */
export const possibleSpecies = (
  gameSeed: string,
  contract: Pick<ContractInstance, 'id' | 'monster' | 'revealed' | 'location' | 'tier'>,
): MonsterId[] => {
  const seen = revealedClues(gameSeed, contract).map((c) => c.tag);
  return candidatesFor(contract.location, contract.tier).filter((m) =>
    seen.every((t) => (monsters[m].clueTags as readonly ClueTag[]).includes(t)),
  );
};

/** Identified: all three clues are in, or the clues so far leave a single species. */
export const isIdentified = (
  gameSeed: string,
  contract: Pick<ContractInstance, 'id' | 'monster' | 'revealed' | 'location' | 'tier'>,
): boolean => contract.revealed >= 3 || possibleSpecies(gameSeed, contract).length === 1;
