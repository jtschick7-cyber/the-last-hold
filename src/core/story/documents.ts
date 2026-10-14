import { knowledgeLevels } from '../../content/knowledge';
import { allDocuments, LAST_WRITTEN_ACT, UNWRITTEN_ACT_LINE } from '../../content/story/acts';
import type { DocumentCondition, DocumentDef } from '../../content/story/documents';
import { TRUST_LEVELS, type TrustLevel } from '../../content/story/trust';
import type { VillageId } from '../../content/villages';
import type { ContractInstance, GameState } from '../state/game-state';
import type { ActProgress, FoundVia } from '../state/story-state';

// GDD §5.14.1–§5.14.2 (D148, D149): one act per cycle; each document arrives on one
// fixed condition, never by chance, and stays obtainable in every later cycle. An
// act's counters start when it begins. Readings where the docs are silent: D178.

export const docKey = (id: string): string => `doc:${id}`;
export const nameKey = (n: number): string => `name:${n}`;

/** The act the current cycle tells, or null (before v0.5, or before the v0.4 arrival). */
export const currentAct = (state: GameState): number | null =>
  state.cycles[state.cycles.length - 1]?.act ?? null;

const progressOf = (state: GameState, act: number): ActProgress | undefined =>
  state.story.acts.find((a) => a.act === act);

export const isFound = (state: GameState, id: string): boolean =>
  state.story.documents.some((d) => d.id === id);

export const trustAtLeast = (state: GameState, village: VillageId, level: TrustLevel): boolean =>
  TRUST_LEVELS.indexOf(state.story.trust[village].level) >= TRUST_LEVELS.indexOf(level);

/** A name enters the Names view, once (GDD §5.14.4). Returns its unread key, or null. */
export const findName = (state: GameState, n: number): string | null => {
  if (state.story.names.some((x) => x.n === n)) return null;
  state.story.names.push({ n, cycle: state.cycle.number, at: state.time });
  state.story.unread.push(nameKey(n));
  return nameKey(n);
};

/**
 * Records a document as found, with the names it carries. The first document brings
 * Ilse (D151). Returns the keys of everything new, for the result that delivered it.
 */
export const findDocument = (state: GameState, doc: DocumentDef, via: FoundVia): string[] => {
  if (isFound(state, doc.id)) return [];
  state.story.documents.push({ id: doc.id, cycle: state.cycle.number, at: state.time, via });
  state.story.unread.push(docKey(doc.id));
  if (state.story.ilseAt === null) state.story.ilseAt = state.time;
  const keys = [docKey(doc.id)];
  for (const n of doc.names) {
    const k = findName(state, n);
    if (k) keys.push(k);
  }
  return keys;
};

/** A Rank reached in the act's cycle or any later one. */
const rankSince = (state: GameState, p: ActProgress, age: string): boolean =>
  state.cycles.some(
    (c) => c.number >= p.cycle && c.ranks[age as keyof typeof c.ranks] !== undefined,
  );

const winCount = (
  p: ActProgress,
  c: Extract<DocumentCondition, { kind: 'contractWon' }>,
): number =>
  c.village ? (p.winsByVillage[c.village] ?? 0) : c.location === 'ruin' ? p.ruinWins : p.wins;

/** Whether a condition that the state itself shows is met (everything but the event ones). */
const standingMet = (state: GameState, doc: DocumentDef, p: ActProgress): boolean => {
  const c = doc.condition;
  switch (c.kind) {
    case 'contractWon':
      // A trust-gated win is judged the moment it's won (recordWin), never later.
      return c.minTrust === undefined && winCount(p, c) >= c.nth;
    case 'rankReached':
      return rankSince(state, p, c.age);
    case 'knowledge':
      return (state.bestiary[c.monster]?.level ?? 0) >= knowledgeLevels[c.level].number;
    case 'hunterAtRank':
      return state.hunters[c.hunter] !== undefined && rankSince(state, p, c.age);
    case 'actStand':
    case 'nextWarden':
      return false;
    case 'arvidArrives':
    case 'huntersTogether':
      // Act III's two new conditions (D211, D213): judged when they happen, from T6.7.
      return false;
  }
};

const VIA: Readonly<Record<DocumentCondition['kind'], FoundVia>> = {
  contractWon: 'contract',
  rankReached: 'rank',
  knowledge: 'knowledge',
  hunterAtRank: 'roster',
  actStand: 'stand',
  nextWarden: 'warden',
  arvidArrives: 'warden',
  huntersTogether: 'roster',
};

/**
 * Finds every document whose condition the state already meets: after a Rank-up, a
 * recruit, a knowledge level, or on the v0.5 arrival (`via` 'arrival'). Returns the keys found.
 */
export const sweepDocuments = (state: GameState, via?: FoundVia): string[] => {
  const keys: string[] = [];
  for (const doc of allDocuments) {
    const p = progressOf(state, doc.act);
    if (!p || isFound(state, doc.id) || !standingMet(state, doc, p)) continue;
    keys.push(...findDocument(state, doc, via ?? VIA[doc.condition.kind]));
  }
  return keys;
};

/**
 * A contract won (GDD §5.14.1): it counts for every act begun, then brings any
 * document whose count it completes, and any trust-gated one it meets now (D147).
 */
export const recordWin = (state: GameState, contract: ContractInstance): string[] => {
  for (const p of state.story.acts) {
    p.wins += 1;
    p.winsByVillage[contract.village] = (p.winsByVillage[contract.village] ?? 0) + 1;
    if (contract.location === 'ruin') p.ruinWins += 1;
  }
  const keys: string[] = [];
  for (const doc of allDocuments) {
    const c = doc.condition;
    const p = progressOf(state, doc.act);
    if (c.kind !== 'contractWon' || !p || isFound(state, doc.id)) continue;
    const met =
      c.minTrust === undefined
        ? winCount(p, c) >= c.nth
        : contract.village === c.village && trustAtLeast(state, contract.village, c.minTrust);
    if (met) keys.push(...findDocument(state, doc, 'contract'));
  }
  return keys;
};

/** The stand closes the current act: its testament, and any earlier one not yet found. */
export const standDocuments = (state: GameState): string[] => {
  const act = currentAct(state);
  const keys: string[] = [];
  for (const doc of allDocuments) {
    if (doc.condition.kind !== 'actStand' || act === null || doc.act > act) continue;
    if (progressOf(state, doc.act)) keys.push(...findDocument(state, doc, 'stand'));
  }
  return keys;
};

/** The next warden arrives: the closing scene of every earlier act begun (D1-07, D2-10). */
export const wardenDocuments = (state: GameState): string[] => {
  const act = currentAct(state);
  const keys: string[] = [];
  for (const doc of allDocuments) {
    if (doc.condition.kind !== 'nextWarden' || act === null || doc.act >= act) continue;
    if (progressOf(state, doc.act)) keys.push(...findDocument(state, doc, 'warden'));
  }
  return keys;
};

/** What closes an act on the Long Night (GDD §5.14.9): its testament, or the unwritten line. */
export const actClosing = (act: number | null): DocumentDef | string | null => {
  if (act === null) return null;
  if (act > LAST_WRITTEN_ACT) return UNWRITTEN_ACT_LINE;
  return allDocuments.find((d) => d.act === act && d.condition.kind === 'actStand') ?? null;
};
