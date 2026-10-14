// Every numeric game constant from GDD §7, under its §7 key (technical design
// §5.1, D44). Each is `tunable` or `locked` (plan §0.6). The tuning pass may
// change only tunable values; locked values change only through an
// owner-approved decisions row. Keys for later milestones sit unused until then.
//
// Units: durations are stored in seconds (the engine's unit, GDD §5.0), with the
// GDD's own wording alongside; production rates are per minute, as the GDD
// writes them. Everything else is a plain number, ratio, or count.

export type Unit = 'seconds' | 'perMinute';

export interface Constant<T> {
  readonly value: T;
  readonly locked: boolean;
  readonly unit?: Unit;
}

const tunable = <const T>(value: T, unit?: Unit): Constant<T> => ({ value, locked: false, unit });
const locked = <const T>(value: T, unit?: Unit): Constant<T> => ({ value, locked: true, unit });

const MIN = 60;
const HOUR = 3600;

export const balance = {
  // ---- GDD §7.1 Hold ----
  costGrowth: {
    count: tunable(1.15),
    level: tunable(1.75),
  },
  peasant: {
    settleBase: tunable(20),
    settleGrowth: tunable(1.15),
    settleMinInterval: tunable(30, 'seconds'), // 30 s
  },
  rate: {
    food: tunable(6, 'perMinute'),
    wood: tunable(4, 'perMinute'),
    iron: tunable(2, 'perMinute'),
    silver: tunable(0.22, 'perMinute'),
  },
  silverSeam: { max: locked(2) },
  mill: { perLevel: tunable(0.25) },
  sawpit: { perLevel: tunable(0.25) },
  smithy: { ironPerLevel: tunable(0.2) },
  // GDD §5.1.3 (D106): each Rank from the Keep adds to the age bucket (not silver, G1).
  age: {
    keep: { allProduction: tunable(0.5) },
    citadel: { allProduction: tunable(0.5) },
    bastion: { allProduction: tunable(0.5) },
  },
  // The simulated player's valuation: locked so tuning can't game the checks (plan §0.6).
  value: { weights: locked({ food: 1, wood: 1.5, iron: 3, silver: 12 }) },
  trophyHall: { perTrophy: tunable(0.005) },
  herbGarden: { interval: tunable(10 * MIN, 'seconds') }, // 10 min per herb type

  // ---- GDD §7.2 Offline ----
  offline: {
    baseCap: locked(12 * HOUR, 'seconds'), // 12 h
    ceiling: locked(24 * HOUR, 'seconds'), // 24 h
    chunk: tunable(60, 'seconds'), // 60 s
  },
  bellTower: { perLevel: tunable(1 * HOUR, 'seconds') }, // 1 h

  // ---- GDD §7.3 Hunters ----
  hunter: {
    levelStatGrowth: tunable(0.1),
    // Hamlet uses the Keep's cap (D72); Citadel and Bastion raise it (D106).
    levelCap: tunable({ keep: 10, citadel: 15, bastion: 20 }),
  },
  xp: {
    base: tunable(50),
    growth: tunable(1.5),
    perTier: tunable(20),
  },
  barracks: { maxLevel: locked(5) },
  roster: {
    hamletCap: locked(3),
    ageBonus: locked({ citadel: 2, bastion: 2 }),
  },
  injury: {
    bruised: tunable(30 * MIN, 'seconds'), // 30 min
    woundedPerTier: tunable(2 * HOUR, 'seconds'), // 2 h
    grievousMult: tunable(3),
    bruisedBelow: tunable(0.3),
    deathChance: locked(0.3),
  },
  death: { returnDaysBeforeLongNight: locked(3) },

  // ---- GDD §7.4 Contracts & combat ----
  board: {
    interval: locked(2 * HOUR, 'seconds'), // 2 h
    cap: locked(6),
  },
  contract: {
    recklessBelow: locked(0.35),
    unlockSuccesses: locked(3),
    ageTierCap: locked({ hamlet: 1, keep: 5, citadel: 5, bastion: 5 }), // citadel, bastion: D106 (owner-approved)
    duration: tunable([30 * MIN, 1 * HOUR, 2 * HOUR, 4 * HOUR, 8 * HOUR], 'seconds'), // 30 min … 8 h
    partySize: locked([3, 3, 3, 4, 4]),
    hamletPartyMax: locked(2),
  },
  provisions: {
    base: tunable(30),
    growth: tunable(2.2),
    // Q9 (D81): from the Keep, each hunter's provisions are at least this many minutes
    // of the hold's food capacity (Q11). Hamlet 0: the first contracts stay at the flat base.
    incomeMinutes: tunable({ hamlet: 0, keep: 1, citadel: 4.4, bastion: 2.5 }), // D106, D189
  },
  monster: {
    statGrowth: tunable(1.35),
    armorGrowth: tunable(1.15),
  },
  bounty: {
    base: tunable(91),
    growth: tunable(1.6),
    ageMult: tunable({ hamlet: 1.0, keep: 1.1, citadel: 3.5, bastion: 3.0 }), // D106
  },
  combat: {
    hitChance: tunable(0.9),
    varianceLo: tunable(0.85),
    varianceHi: tunable(1.15),
    minDamage: tunable(1),
    takenCap: locked(0.75),
    critChance: tunable(0.1),
    critMult: tunable(1.5),
    meterThreshold: locked(100),
    maxTicks: locked(400),
  },
  // runedFraction: GDD §7.7 (v0.5, D159): the Wright's Blade's Rune sub-hit.
  gear: { silveredFraction: tunable(0.25), runedFraction: tunable(0.25) },
  striker: { critChance: tunable(0.2) },
  mender: {
    healMult: tunable(1.5),
    healBelow: tunable(0.7),
    attackMult: tunable(0.5),
  },
  target: {
    vanguardWeight: tunable(3),
    otherWeight: tunable(1),
  },
  odds: { samples: locked(500) },
  prep: {
    wellPreparedBounty: locked(1.5),
    // GDD §5.7: bombs a party can throw, and the resistance multiplier from which a species counts as weak (§8.3: bold = ≥ 1.25).
    bombSlots: tunable(2),
    weakAt: tunable(1.25),
  },
  suggest: {
    stage1Samples: locked(50),
    stage1PerCandidate: locked(20),
    // D73 (owner-approved): 5 finalists at 500 fights was too slow for a phone.
    finalists: locked(3),
    stage2Samples: locked(200),
  },
  boss: {
    tokenInterval: locked(8 * HOUR, 'seconds'), // 8 h
    tokenMax: locked(6),
    hunterRest: locked(24 * HOUR, 'seconds'), // 24 h
  },
  riftglass: { bankWeeks: locked(2) },

  // ---- GDD §7.5 Bestiary & preparation ----
  knowledge: {
    studiedKills: locked(4),
    masteredKills: locked(10),
    studiedDamage: tunable(0.05),
    masteredDamage: tunable(0.1),
  },
  clue: {
    time: tunable(30 * MIN, 'seconds'), // 30 min
    studiedMult: tunable(0.5),
  },
  lodge: { maxLevel: tunable(3) },
  oil: { familyBonus: tunable(0.35) },
  brew: { time: tunable(10 * MIN, 'seconds') }, // 10 min
  hut: { maxLevel: tunable(5) },

  // ---- GDD §7.6 The Long Night (v0.4, D106–D114) ----
  threat: {
    // Per hour by Rank (D108); time away counts as for production.
    ratePerHour: tunable({ hamlet: 0, keep: 0.5, citadel: 1, bastion: 1 }),
    // Each level of Walls or Watchtower slows the hourly rate by this share.
    defenseSlowPerLevel: tunable(0.02),
    failedPerTier: tunable(3),
    completedPerTier: tunable(0.76),
    // Each point: every Last Stand wave +1% Health and Might.
    waveStrengthPerPoint: tunable(0.0061),
  },
  walls: { takenPerLevel: tunable(0.02) }, // party taken% in the stand; combat.takenCap applies
  watchtower: { volleyPerLevel: tunable(20) }, // Steel damage at tick 1 of each wave, ignores Armor
  laststand: {
    firstTier: tunable(2),
    wavesPerTier: tunable(2),
    partyMax: locked(6), // D107
    recoverBetween: tunable(0.2),
    previewSamples: tunable(100), // the stand screen's preview (GDD §6.5)
    policySamples: tunable(20), // the simulated player's quick preview (GDD §6.1)
  },
  embers: {
    perWave: tunable(4),
    waveGrowth: tunable(1.15),
    threatBonus: tunable(0.007),
    perTrophy: tunable(1),
    rankMult: tunable({ hamlet: 0.25, keep: 0.5, citadel: 0.75, bastion: 1 }),
  },
  relics: { waveMilestones: tunable([6, 9, 12, 15, 18, 21]) },
  longNight: { levelsKept: tunable(0.5) },
  // D112: the trophies part of the arrival's Embers is capped at this share of the
  // cycle-1 median, set from the tuned simulator in T4.15 (D138).
  longNightArrival: {
    emberCapShare: locked(1.2),
    // The median Embers of cycle 1's stand (Standard, Monday, 5 seeds) after T4.15 (D138).
    cycle1MedianEmbers: tunable(193),
  },

  // ---- GDD §7.7 The story (v0.5, D144–D166) ----
  // Waves held from which a stand is Held, and Triumphant (D145; 12 and 15 from v0.6, D194).
  band: { heldFrom: tunable(12), triumphantFrom: tunable(15) },
  // Contracts won for a village to rise from Cold, Wary, Hopeful and Trusting (D146).
  // A Triumphant stand counts as `triumphantContracts` of them for every village (D195).
  trust: { stepContracts: tunable([10, 15, 20, 25]), triumphantContracts: tunable(10) },
  // Hunter letters at these levels, counting the highest level ever reached (D155).
  letters: { levels: tunable([5, 8]) },
  // Until all six Ribbonshade names are found, this share of ruin contracts is a Ribbonshade (Q17, D190).
  ruin: { ribbonshadeShare: tunable(0.5) },

  // ---- GDD §7.8 Alchemy discovery & skills (v0.6, D193–D220) ----
  experiment: { time: tunable(10 * MIN, 'seconds'), units: tunable(1) }, // 10 min, 1 unit each
  skill: {
    maxLevel: locked(10), // D217
    // Level L → L+1 costs xpBase × xpGrowth^L XP (D205).
    xpBase: tunable(20),
    xpGrowth: tunable(1.6),
    xp: {
      alchemy: tunable({ brew: 1, experiment: 3, property: 10 }),
      smithing: tunable({ gearPerTier: 2, smithyLevel: 2 }),
      lore: tunable({ clue: 1, knowledgeLevel: 5, document: 5 }),
      command: tunable({ contractPerTier: 1, wave: 1 }),
    },
    // Per level (D205): brews stronger, gear cheaper, clues quicker, contract XP higher.
    alchemyPotency: tunable(0.03),
    smithingCost: tunable(0.04),
    loreClueTime: tunable(0.04),
    commandXp: tunable(0.04),
  },
} as const;

export type Balance = typeof balance;

type KeysOf<T, P extends string> = {
  [K in keyof T & string]: T[K] extends Constant<unknown> ? `${P}${K}` : KeysOf<T[K], `${P}${K}.`>;
}[keyof T & string];

/** A dotted GDD §7 key such as 'rate.food'. Content refers to constants by key. */
export type BalanceKey = KeysOf<Balance, ''>;
