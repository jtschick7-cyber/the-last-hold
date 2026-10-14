// GDD §6.2 and §6.3, row for row (technical design §13.3). LOCKED (plan §0.6,
// CLAUDE.md owner gates): change only through a decisions row the owner
// approves. Hours are elapsed real time from a fresh start. A milestone
// enforces every row whose `enforcedFrom` it has reached.

import type { PolicyId } from '../src/core/policies';

export const MILESTONES = ['v0.1', 'v0.2', 'v0.3', 'v0.4', 'v0.5', 'v0.7'] as const;
export type Milestone = (typeof MILESTONES)[number];

export interface Bound {
  readonly policy: PolicyId;
  readonly minHours?: number;
  readonly maxHours?: number;
}

/** GDD §6.2: one row per moment. */
export interface TimeTarget {
  readonly id: string;
  readonly text: string;
  readonly bounds: readonly Bound[];
  /** Measured from another moment instead of the fresh start. */
  readonly relativeTo?: string;
  readonly enforcedFrom: Milestone;
}

const MIN = 1 / 60;

export const TIME_TARGETS: readonly TimeTarget[] = [
  {
    id: 'first-cottage',
    text: 'First Cottage bought: ≤ 1 min (Opening policy)',
    bounds: [{ policy: 'opening', maxHours: 1 * MIN }],
    enforcedFrom: 'v0.1',
  },
  {
    id: 'first-mine',
    text: 'First Mine bought: ≤ 5 min (Opening policy)',
    bounds: [{ policy: 'opening', maxHours: 5 * MIN }],
    enforcedFrom: 'v0.1',
  },
  {
    id: 'mill-3',
    text: 'Mill reaches level 3: 2–5 h',
    bounds: [{ policy: 'standard', minHours: 2, maxHours: 5 }],
    enforcedFrom: 'v0.1',
  },
  {
    id: 'peasants-10',
    text: '10 peasants: 3–6 h',
    bounds: [{ policy: 'standard', minHours: 3, maxHours: 6 }],
    enforcedFrom: 'v0.1',
  },
  {
    id: 'keep',
    text: 'Keep reached: 8–14 h (Standard); ≤ 24 h (Light); ≥ 6 h (Heavy)',
    bounds: [
      { policy: 'standard', minHours: 8, maxHours: 14 },
      { policy: 'light', maxHours: 24 },
      { policy: 'heavy', minHours: 6 },
    ],
    enforcedFrom: 'v0.1',
  },
  {
    id: 'first-contract',
    text: 'First contract launched: within 15 min of the first Mine (Hamlet)',
    bounds: [{ policy: 'standard', maxHours: 15 * MIN }],
    relativeTo: 'first-mine',
    enforcedFrom: 'v0.2',
  },
  {
    id: 'roster-4',
    text: 'Roster of 4 hunters: by the end of day 2',
    bounds: [{ policy: 'standard', maxHours: 48 }],
    enforcedFrom: 'v0.2',
  },
  {
    id: 'first-tier-3',
    text: 'First tier-3 success: day 2',
    bounds: [{ policy: 'standard', minHours: 24, maxHours: 48 }],
    enforcedFrom: 'v0.2',
  },
  {
    id: 'first-identified',
    text: 'First species Identified through investigation: ≤ 2 h after the Hunter’s Lodge is built',
    bounds: [{ policy: 'standard', maxHours: 2 }],
    relativeTo: 'hunters-lodge',
    enforcedFrom: 'v0.3',
  },
  {
    id: 'first-studied',
    text: 'First species Studied (4 kills): days 2–3',
    bounds: [{ policy: 'standard', minHours: 24, maxHours: 72 }],
    enforcedFrom: 'v0.3',
  },
  {
    id: 'citadel',
    text: 'Citadel reached: day 2',
    bounds: [{ policy: 'standard', minHours: 24, maxHours: 48 }],
    enforcedFrom: 'v0.4',
  },
  {
    id: 'bastion',
    // Owner-approved change (D137): was day 3 (48–72 h).
    text: 'Bastion reached; Last Stand available: days 3–4',
    bounds: [{ policy: 'standard', minHours: 48, maxHours: 96 }],
    enforcedFrom: 'v0.4',
  },
  {
    id: 'best-last-stand',
    text: 'Best Last Stand timing (peak Embers per day of cycle): days 4–5',
    bounds: [{ policy: 'standard', minHours: 72, maxHours: 120 }],
    enforcedFrom: 'v0.4',
  },
  {
    id: 'first-long-night',
    text: 'First Long Night: days 3–5 (Standard); ≤ 7 days (Light); ≥ 2.5 days (Heavy)',
    bounds: [
      { policy: 'standard', minHours: 48, maxHours: 120 },
      { policy: 'light', maxHours: 168 },
      { policy: 'heavy', minHours: 60 },
    ],
    enforcedFrom: 'v0.4',
  },
  {
    id: 'later-cycles',
    // Owner-approved change (D134): against cycle 1, not the one before; cycles settle at
    // about 3 days after cycle 2 (the schedule and the locked board pace).
    text: 'Later cycles: each ≥ 15% faster than the first, with a floor of 2 days',
    // Compares cycles with each other: judged by its own check from v0.4.
    bounds: [],
    enforcedFrom: 'v0.4',
  },
  // v0.5 (owner-approved, D168; GDD §6.2). The story rows below are judged by their own
  // checks, from the documents, names and trust the run found (STORY below).
  {
    id: 'first-ruin',
    text: 'First ruin contract won: ≤ 24 h after the Keep',
    bounds: [{ policy: 'standard', maxHours: 24 }],
    relativeTo: 'keep',
    enforcedFrom: 'v0.5',
  },
  {
    id: 'act-1',
    text: 'Act I lands in its cycle: its contract, Rank and stand documents found by the end of cycle 1, and the next warden’s by the start of cycle 2',
    bounds: [],
    enforcedFrom: 'v0.5',
  },
  {
    id: 'act-2',
    text: 'Act II lands in its cycle: its Rank and stand documents and its first two found in cycle 2, the 2nd to 5th ruin documents by the end of cycle 3, and the next warden’s by the start of cycle 3',
    bounds: [],
    enforcedFrom: 'v0.5',
  },
  {
    id: 'ribbonshades',
    text: 'All six Ribbonshade names found by the end of cycle 3',
    bounds: [],
    enforcedFrom: 'v0.5',
  },
  {
    id: 'trust-moves',
    text: 'At least one village rises a step in cycle 1',
    bounds: [],
    enforcedFrom: 'v0.5',
  },
  {
    id: 'idle-only',
    text: 'Idle-only vs Standard: first-time completion of all content ≤ 1.3× slower',
    bounds: [],
    enforcedFrom: 'v0.7',
  },
];

/**
 * GDD §6.2 (v0.5, D168): which documents and names the story rows look at. Ids are
 * from lore-secrets §21–§22, names from §20. Each document is judged on the median
 * over the Monday Standard seeds of the cycle it was found in; a document never
 * found counts as infinitely late. D1-02, D1-05 and D2-08 depend on a village's trust,
 * a species' mastery and a recruit, so they are reported, not judged.
 */
export const STORY = {
  act1: {
    /** Found by the end of cycle 1: contract, Rank and stand conditions. */
    byCycle: 1,
    docs: ['D1-01', 'D1-03', 'D1-04', 'D1-06', 'D1-09', 'D1-10'],
    /** The next warden's arrival closes the act: found by the start of cycle 2. */
    nextWarden: { doc: 'D1-07', byCycle: 2 },
    reportedOnly: ['D1-02', 'D1-05'],
  },
  act2: {
    byCycle: 2,
    docs: ['D2-01', 'D2-02', 'D2-07', 'D2-09'],
    // Owner-approved change (Q17, D190): the 2nd to 5th ruin win count ruin wins across the
    // act, and a cycle brings only a few ruins, so they are due by the end of cycle 3.
    later: { docs: ['D2-03', 'D2-04', 'D2-05', 'D2-06'], byCycle: 3 },
    nextWarden: { doc: 'D2-10', byCycle: 3 },
    reportedOnly: ['D2-08'],
  },
  /** The six Ribbonshade names (roll numbers, in their fixed order) by the end of cycle 3. */
  ribbonNames: [39, 15, 16, 17, 19, 20],
  ribbonsByCycle: 3,
} as const;

/** GDD §6.3: engagement checks, judged on every seed (technical design §13.3). */
export const ENGAGEMENT = {
  somethingToDo: {
    text: 'At least 90% of Standard check-ins include a meaningful action',
    minShare: 0.9,
    enforcedFrom: 'v0.1',
  },
  noDrySpells: {
    text: 'Never 2 consecutive check-ins with nothing to do',
    maxConsecutiveEmpty: 1,
    enforcedFrom: 'v0.1',
  },
  noWalls: {
    text: 'No purchase takes more than 3 check-ins of saving; Age-ups up to 5',
    maxSaving: 3,
    maxSavingAgeUp: 5,
    enforcedFrom: 'v0.1',
  },
  preparationMatters: {
    text: 'Matched preparation raises identified odds by ≥ 15 points at equal tier',
    minPoints: 15,
    enforcedFrom: 'v0.3',
  },
  oddsHonest: {
    text: 'Across 2,000 contracts, each 10-point odds bucket lands within ±5 points',
    contracts: 2000,
    tolerancePoints: 5,
    enforcedFrom: 'v0.2',
  },
  contractsOwnSilver: {
    text: '≥ 70% of silver earned over the Keep phase comes from bounties',
    minShare: 0.7,
    minDays: 14,
    enforcedFrom: 'v0.2',
  },
  // D114 (owner-approved): through v0.3 this was 14 simulated days; from v0.4, 3 cycles.
  noOverflow: {
    text: 'Every number stays below 1e300 through 3 simulated cycles',
    limit: 1e300,
    cycles: 3,
    enforcedFrom: 'v0.1',
  },
  provisionsMatter: {
    text: 'From Keep onward, contract provisions take 20–40% of food income',
    minShare: 0.2,
    maxShare: 0.4,
    enforcedFrom: 'v0.2',
  },
} as const;

export const enforced = (from: Milestone, now: Milestone): boolean =>
  MILESTONES.indexOf(from) <= MILESTONES.indexOf(now);
