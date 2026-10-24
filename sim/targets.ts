// GDD §6.2 and §6.3, row for row (technical design §13.3). LOCKED (plan §0.6,
// CLAUDE.md owner gates): change only through a decisions row the owner
// approves. Hours are elapsed real time from a fresh start. A milestone
// enforces every row whose `enforcedFrom` it has reached.

import type { PolicyId } from '../src/core/policies';

export const MILESTONES = [
  'v0.1',
  'v0.2',
  'v0.3',
  'v0.4',
  'v0.5',
  'v0.6',
  'v0.7',
  'v0.8',
  'v0.9',
  'v0.10',
  'v0.11',
  'v1.3',
] as const;
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
    text: 'Act II lands in its cycle: its Rank and stand documents and its first two found in cycle 2, the 2nd to 5th ruin documents by the end of cycle 4, and the next warden’s by the start of cycle 3',
    bounds: [],
    enforcedFrom: 'v0.5',
  },
  {
    id: 'ribbonshades',
    text: 'All six Ribbonshade names found by the end of cycle 4',
    bounds: [],
    enforcedFrom: 'v0.5',
  },
  {
    id: 'trust-moves',
    text: 'At least one village rises a step in cycle 1',
    bounds: [],
    enforcedFrom: 'v0.5',
  },
  // v0.6 (GDD §6.2, D216: owner-approved rows).
  {
    id: 'first-new-brew',
    text: 'First new brew discovered: ≤ 24 h after the Alchemist’s Hut is built',
    bounds: [],
    enforcedFrom: 'v0.6',
  },
  {
    id: 'recipe-book',
    text: 'Recipe book complete (36 of 36 properties) by the end of cycle 3',
    bounds: [],
    enforcedFrom: 'v0.6',
  },
  {
    id: 'skills-start',
    text: 'Skills start moving: every warden skill at level ≥ 1 by the end of cycle 1',
    bounds: [],
    enforcedFrom: 'v0.6',
  },
  {
    id: 'skills-pace',
    text: 'Skills pace: at the end of cycle 3, every warden skill is between level 4 and 8',
    bounds: [],
    enforcedFrom: 'v0.6',
  },
  {
    id: 'act-3',
    text: 'Act III lands in its cycle: D3-01 to D3-06 by the end of cycle 3, D3-07 with the next warden (D3-08 reported only)',
    bounds: [],
    enforcedFrom: 'v0.6',
  },
  {
    id: 'arvid-letter',
    text: 'Arvid’s level-5 letter (Leif, #34) by the end of cycle 4',
    bounds: [],
    enforcedFrom: 'v0.6',
  },
  {
    id: 'trust-arc',
    text: 'Trust keeps an arc: no village reaches Sworn before cycle 4 (none Sworn at the end of cycle 3)',
    bounds: [],
    enforcedFrom: 'v0.6',
  },
  // v0.7 (GDD §6.2, D271, D272: owner-approved rows). Judged by their own checks.
  {
    id: 'act-4',
    text: 'Act IV lands in its cycle: D4-01 to D4-06 and D4-08 by the end of cycle 4, D4-07 with the next warden',
    bounds: [],
    enforcedFrom: 'v0.7',
  },
  {
    id: 'first-guardian',
    text: 'First guardian beaten: by the end of cycle 2 (Delver)',
    bounds: [],
    enforcedFrom: 'v0.7',
  },
  {
    id: 'idle-only',
    // D271 defines it: Standard reaches the last of "all content" no more than 1.3× later than the
    // Delver (median of the Monday seeds). D322 (v0.8) adds Act V's documents, the five name
    // letters and every hunter at Wright to "all content". See ALL_CONTENT below.
    text: 'Idle-only vs Delver: Standard reaches the last of "all content" ≤ 1.3× later than the Delver',
    bounds: [],
    enforcedFrom: 'v0.7',
  },
  // v0.8 (GDD §6.2, D322: owner-approved rows, their own commit). Judged by their own checks.
  {
    id: 'act-5',
    text: 'Act V lands in its cycle: D5-01 to D5-06 and D5-08 by the end of cycle 5, D5-07 with the next warden',
    bounds: [],
    enforcedFrom: 'v0.8',
  },
  {
    id: 'late-letters',
    text: 'Late recruits catch up: all five name letters (Ostap at levels 5 and 8; Toma, Sigrun and Arvid at 5) by the end of cycle 5',
    bounds: [],
    enforcedFrom: 'v0.8',
  },
  {
    id: 'first-wright',
    text: 'First Wright: by the end of cycle 1',
    bounds: [],
    enforcedFrom: 'v0.8',
  },
  // v0.9 (GDD §6.2, D383: owner-approved 2026-10-21, their own commit). Judged by their own checks, on
  // the median of the Monday Standard seeds. The Eventer's event rows are a separate commit (T9.17).
  {
    id: 'act-6',
    text: 'Act VI lands in its cycle: D6-01 to D6-06 by the end of cycle 6, D6-07 with the next warden; D6-08 to D6-10 reported only',
    bounds: [],
    enforcedFrom: 'v0.9',
  },
  {
    id: 'dross-tide-stand',
    text: "The Dross-Tide stand probe: in Act VI-era cycles Standard's stand reaches the Held band (12 or more waves) and the preview's range still agrees with the real result",
    bounds: [],
    enforcedFrom: 'v0.9',
  },
  // v0.9 (GDD §6.2, D367; thresholds moved by the owner, D404, 2026-10-21). The Eventer's event rows,
  // judged on the median of the 5 Monday seeds; their numbers are in EVENTS below.
  {
    id: 'first-boss-attempt',
    text: 'First boss attempt: within 24 h of events opening at the Citadel (Eventer)',
    bounds: [],
    enforcedFrom: 'v0.9',
  },
  {
    id: 'first-boss-kill',
    text: 'First boss defeated: by the end of the 7th cycle from the one events open in, which is cycle 1 (Eventer)',
    bounds: [],
    enforcedFrom: 'v0.9',
  },
  {
    id: 'first-hunter-unlock',
    text: 'First legendary hunter unlocked: by the end of the 6th cycle from the one events open in, which is cycle 1 (Eventer)',
    bounds: [],
    enforcedFrom: 'v0.9',
  },
  {
    id: 'tokens-not-wasted',
    text: "Tokens not wasted: a full bank at no more than 35% of the Eventer's unlocked check-ins",
    bounds: [],
    enforcedFrom: 'v0.9',
  },
  {
    id: 'silver-with-boss',
    text: "Silver check #6 with boss silver: at least 70% of the Eventer's silver, from the Keep on in cycle 1, comes from bounties (boss silver counts in the total only)",
    bounds: [],
    enforcedFrom: 'v0.9',
  },
  // v0.10 (GDD §6.2, D417; row (a) read as in D440). The Orderer's Orders rows, judged by their own
  // checks on the median of the 5 Monday seeds; their numbers are in ORDERS below.
  {
    id: 'orders-first-chapter',
    text: 'First chapter in time: chapter 1 of each Order the Orderer seats at its opening plays within 24 h of that Order opening (Orderer)',
    bounds: [],
    enforcedFrom: 'v0.10',
  },
  {
    id: 'orders-level-4',
    text: 'Every Order reaches level 4 by the end of cycle 6 (Orderer)',
    bounds: [],
    enforcedFrom: 'v0.10',
  },
  {
    id: 'orders-all-chapters',
    text: 'All 16 chapters have played by the end of cycle 8 (Orderer)',
    bounds: [],
    enforcedFrom: 'v0.10',
  },
  {
    id: 'orders-silver',
    text: 'Silver check #6 with Orders: at least 70% of silver from bounties (Orderer)',
    bounds: [],
    enforcedFrom: 'v0.10',
  },
  {
    id: 'orders-provisions',
    text: 'Provisions share with the Moot perk counted: 20–40% (Orderer)',
    bounds: [],
    enforcedFrom: 'v0.10',
  },
  {
    id: 'orders-stand-rows',
    text: "Stand rows with the Quenchers' perk: Best Last Stand timing (days 4–5), First Long Night (days 3–5), Act VI lands in its cycle and the Dross-Tide stand probe still pass; Embers per stand with and without the Quenchers are reported (Orderer)",
    bounds: [],
    enforcedFrom: 'v0.10',
  },
  // v0.11 (GDD §6.2, D458, D464, D469; N approved by the owner after the T11.15a measurement). Judged on
  // the median of the 5 Monday Standard seeds, in `sim.yml` only; its number is in REMEMBERING below.
  {
    id: 'remembering-reachable',
    text: "The Remembering is reachable: all 40 names are found and Act VI's stand is applied by the end of cycle 6 (Standard)",
    bounds: [],
    enforcedFrom: 'v0.11',
  },
  // v1.3 (GDD §6.2, D546 (5), D554; the three rows approved by the owner). Rising Vigil, judged on the
  // Vigilant's Monday runs and its probe, in `sim.yml` only; the tolerance is in VIGIL below.
  {
    id: 'vigil-level-rises',
    text: 'The vigil level rises by exactly 1 per On stand: the saved levels are 1, 2, 3 (Vigilant)',
    bounds: [],
    enforcedFrom: 'v1.3',
  },
  {
    id: 'vigil-never-more-waves',
    text: "More vigil never holds more waves: the probe's median waves at level L + 1 are never above level L, L = 0 to 10 (every Monday seed)",
    bounds: [],
    enforcedFrom: 'v1.3',
  },
  {
    id: 'vigil-embers-level',
    text: 'Embers at levels 1 to 3 stay level with level 0 within the tolerance (probe, median of the 5 Monday seeds)',
    bounds: [],
    enforcedFrom: 'v1.3',
  },
];

/**
 * The Orderer's Orders rows (v0.10, D417, D440). Cycles count from the start of the run.
 */
export const ORDERS = {
  /** Chapter 1 of an Order the Orderer seated at its opening, in hours after that opening. */
  firstChapterWithinHours: 24,
  /** Every Order at its top level by the end of this cycle. */
  levelFourByCycle: 6,
  /** All sixteen chapters read by the end of this cycle. */
  allChaptersByCycle: 8,
  /** Bounty share of the cycle-1 silver from the Keep on (GDD §6.3 #6). */
  minBountyShare: 0.7,
} as const;

/**
 * The Remembering's reachability row (v0.11, D469). The measured median of the 5 Monday Standard seeds
 * was cycle 6 (6, 6, 6, 6, 7). The species half of the gate is proved by the content test, not here.
 */
/**
 * Rising Vigil's Embers row (v1.3, D546 (5) C, D554): at levels 1 to 3 the median total Embers
 * (waves part plus trophies) of the 5 Monday seeds are within this share of level 0's, at the stand's
 * own Threat. Fixed before the final judging run; measured 0.015, 0.003 and 0.021 off at the chosen
 * values. The probe also reports twice that Threat (0.098 off at its worst), which is not judged.
 */
export const VIGIL = {
  embersTolerance: 0.05,
} as const;

export const REMEMBERING = {
  /** All 40 names found and Act VI's stand applied by the end of this cycle. */
  byCycle: 6,
} as const;

/**
 * The Eventer's event rows (v0.9, D367; the three cycle and share numbers were moved by the owner,
 * D404, after the T9.17 measurement and the Q33 hold-back test). "Cycles" count from the cycle events
 * opened in, which is cycle 1.
 */
export const EVENTS = {
  /** First boss attempt, in hours after the first check-in that found events open. */
  attemptWithinHours: 24,
  killByCycle: 7,
  unlockByCycle: 6,
  /** Full bank on arrival, as a share of the unlocked check-ins. */
  maxFullBankShare: 0.35,
  /** Bounty share of the cycle-1 silver from the Keep on, boss silver included in the total. */
  minBountyShare: 0.7,
} as const;

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
    // Owner-approved change (Q17, Q18, D190, D191): the 2nd to 5th ruin win count ruin wins
    // across the act, and a cycle brings only a few ruins, so they are due by the end of cycle 4.
    later: { docs: ['D2-03', 'D2-04', 'D2-05', 'D2-06'], byCycle: 4 },
    nextWarden: { doc: 'D2-10', byCycle: 3 },
    reportedOnly: ['D2-08'],
  },
  /** Act III (v0.6, D216): D3-01 to D3-06 by the end of cycle 3, D3-07 with the next warden. */
  act3: {
    byCycle: 3,
    docs: ['D3-01', 'D3-02', 'D3-03', 'D3-04', 'D3-05', 'D3-06'],
    nextWarden: { doc: 'D3-07', byCycle: 4 },
    reportedOnly: ['D3-08'],
  },
  /** Act IV (v0.7, D271): D4-01 to D4-06 and D4-08 by the end of cycle 4, D4-07 with the next warden. */
  act4: {
    byCycle: 4,
    docs: ['D4-01', 'D4-02', 'D4-03', 'D4-04', 'D4-05', 'D4-06', 'D4-08'],
    nextWarden: { doc: 'D4-07', byCycle: 5 },
    reportedOnly: [],
  },
  /** Act V (v0.8, D322): D5-01 to D5-06 and D5-08 by the end of cycle 5, D5-07 with the next warden. */
  act5: {
    byCycle: 5,
    docs: ['D5-01', 'D5-02', 'D5-03', 'D5-04', 'D5-05', 'D5-06', 'D5-08'],
    nextWarden: { doc: 'D5-07', byCycle: 6 },
    reportedOnly: [],
  },
  /**
   * Act VI (v0.9, D383): D6-01 to D6-06 by the end of cycle 6, D6-07 with the next warden. D6-08 to
   * D6-10 depend on recruits and are reported only.
   */
  act6: {
    byCycle: 6,
    docs: ['D6-01', 'D6-02', 'D6-03', 'D6-04', 'D6-05', 'D6-06'],
    nextWarden: { doc: 'D6-07', byCycle: 7 },
    reportedOnly: ['D6-08', 'D6-09', 'D6-10'],
  },
  /**
   * The Dross-Tide stand probe (v0.9, D383): in the stands made once Act VI has begun (the cycles that
   * carry the Dross-Tide pool), the median waves held is at least `heldWaves`, and the real result
   * falls inside the preview's 10th–90th percentile range in at least `previewAgreeShare` of them.
   */
  drossProbe: {
    heldWaves: 12,
    previewAgreeShare: 0.6,
  },
  /**
   * The five name-bearing letters (v0.8, D322; lore §23): Ostap's two (levels 5 and 8, slots 0 and 1)
   * and Toma's, Sigrun's and Arvid's first (level 5, slot 0), by the end of cycle 5.
   */
  lateLetters: {
    byCycle: 5,
    letters: [
      { hunter: 'ostap', slot: 0 },
      { hunter: 'ostap', slot: 1 },
      { hunter: 'toma', slot: 0 },
      { hunter: 'sigrun', slot: 0 },
      { hunter: 'arvid', slot: 0 },
    ],
  },
  /** The six Ribbonshade names (roll numbers, in their fixed order) by the end of cycle 3. */
  ribbonNames: [39, 15, 16, 17, 19, 20],
  // Owner-approved change (Q18, D191): was cycle 3; a cycle brings only a few ruins.
  ribbonsByCycle: 4,
} as const;

/**
 * GDD §6.2 (v0.7, D271; v0.8, D322): "all content" for the Idle-only row. Every judged document of
 * Acts I–V (the ones the act rows judge; D1-02, D1-05, D2-08 and D3-08 are reported only), the
 * recipe book at 36 of 36, all six Ribbonshade names, every warden skill at level 4, the five name
 * letters and every hunter at Wright.
 */
export const ALL_CONTENT = {
  documents: [
    ...STORY.act1.docs,
    STORY.act1.nextWarden.doc,
    ...STORY.act2.docs,
    ...STORY.act2.later.docs,
    STORY.act2.nextWarden.doc,
    ...STORY.act3.docs,
    STORY.act3.nextWarden.doc,
    ...STORY.act4.docs,
    STORY.act4.nextWarden.doc,
    // v0.8 (D322): Act V's judged documents.
    ...STORY.act5.docs,
    STORY.act5.nextWarden.doc,
  ],
  /** v0.8 (D322): the five name-bearing letters are part of "all content" too (STORY.lateLetters). */
  letters: STORY.lateLetters.letters,
  /** v0.8 (D322): so is every hunter at Wright: all eleven owned, none still an Apprentice. */
  everyHunterWright: true,
  /** The Idle-only row: Standard may take at most this many times the Delver's time. */
  maxRatio: 1.3,
} as const;

/** First Wright (v0.8, D322): some hunter has ranked up by the end of this cycle. */
export const FIRST_WRIGHT_BY_CYCLE = 1;

/** The first guardian is beaten by the end of this cycle (D271, the Delver). */
export const FIRST_GUARDIAN_BY_CYCLE = 2;

/**
 * GDD §6.2 (v0.6, D216): the discovery, skill and arc rows. Judged on the median over the
 * Monday Standard seeds; Saturday is reported only, as for every time target (D62).
 */
export const V06 = {
  /** First new brew discovered within this many hours of the Hut being built. */
  newBrewHours: 24,
  /** Every one of the 36 properties found by the end of this cycle. */
  bookByCycle: 3,
  /** Every skill at level ≥ 1 by the end of this cycle. */
  skillsStartByCycle: 1,
  /** Every skill between `min` and `max` at the end of this cycle. */
  skillsPace: { cycle: 3, min: 4, max: 8 },
  /** Arvid's level-5 letter (slot 0) by the end of this cycle. */
  arvidLetterByCycle: 4,
  /** No village Sworn at the end of the cycle before this one. */
  noSwornBeforeCycle: 4,
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
