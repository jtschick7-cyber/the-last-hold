import { BOSS_IDS, bosses, type BossId } from '../../content/great-beasts';
import { gear, type GearId } from '../../content/gear';
import { guardianLootBases } from '../../content/items';
import type { HunterId } from '../../content/hunters';
import type { IngredientId } from '../../content/ingredients';
import { constantAt, num } from '../balance-access';
import { runFight } from '../combat';
import { roundHalfUp } from '../combat/build';
import { EVENT_BASE_TIER } from '../combat/species';
import { bounty } from '../contracts/rewards';
import { eventSeed } from '../contracts/seeds';
import { prepIds, prepProblem, spendPrep } from '../contracts/prep';
import { intPow } from '../math';
import { seeded, stream } from '../rng';
import { RULES_VERSION } from '../rules-version';
import { skillLevel } from '../skills/skills';
import { notePeak } from '../story/letters';
import type { BossReport } from '../state/events-state';
import type { FightRef, GameState, Preparation } from '../state/game-state';
import {
  eligibleHunters,
  eventBlock,
  eventsUnlocked,
  spendToken,
  startRests,
  tokenBank,
} from './events';
import { gainXp, snapshotOf } from './hunters';
import { lootKey, pickRarity, rollLines, takeLoot, type RarityWeights } from './loot';

// GDD §5.12.4–§5.12.5 (plan T9.6, D358–D361, D387): a boss attempt is worked out at once from its
// seed. The Great Beast's Health is the pool still standing, so what the party dealt is what the
// pool lost; milestones are paid once per visit by the attempt that crosses them. Nothing here
// touches a contract counter, Embers, trophies, the bestiary or the yard (D387).

/** The boss of a visit: the fixed order, round again after the third. */
export const bossOfVisit = (visit: number): BossId => {
  const order = constantAt('boss.order').value as readonly string[];
  // `boss.order` is locked with short keys (D379); the ids are matched by position.
  return BOSS_IDS[visit % order.length] ?? BOSS_IDS[0];
};

/** The completed passes through the three bosses at a visit. */
export const passOfVisit = (visit: number): number =>
  Math.floor(visit / (constantAt('boss.order').value as readonly string[]).length);

/**
 * The tier a visit would have if its first attempt were made now: the Rank's base tier plus one
 * for each completed pass (GDD §5.12.4). Once the visit has begun, its stored tier stands.
 */
export const visitTier = (state: GameState): number => {
  if (state.events.boss.tier !== null) return state.events.boss.tier;
  const base = (constantAt('boss.baseTier').value as Readonly<Record<string, number>>)[
    state.cycle.age
  ];
  if (base === undefined) throw new Error(`No boss tier for the ${state.cycle.age} rank.`);
  return base + num('boss.passTierStep') * passOfVisit(state.events.boss.visit);
};

/** The pool a visit starts with: `poolBase` at tier 3, ×1.35 for each tier above (GDD §7.11). */
export const poolAtTier = (tier: number): number =>
  roundHalfUp(num('boss.poolBase') * intPow(num('monster.statGrowth'), tier - EVENT_BASE_TIER));

/** The pool left now: the starting pool if the visit has not begun. */
export const poolNow = (state: GameState): number =>
  state.events.boss.pool ?? poolAtTier(visitTier(state));

export type BossAttemptProblem = string;

/** Why this party and preparation cannot make an attempt now, or null. */
export const attemptProblem = (
  state: GameState,
  party: readonly HunterId[],
  prep: Preparation,
  now: number,
): BossAttemptProblem | null => {
  if (!eventsUnlocked(state)) return 'Events open at the first Citadel.';
  if (!Array.isArray(party) || party.length < 1) return 'Choose at least one hunter.';
  if (party.length > num('boss.partySize'))
    return `A party takes at most ${num('boss.partySize')} hunters.`;
  if (new Set(party).size !== party.length) return 'A hunter can only be sent once.';
  for (const id of party) {
    if (!(eligibleHunters(state, now) as readonly string[]).includes(id))
      return eventBlock(state, id, now)?.reason ?? 'That hunter cannot attend.';
  }
  const prepBad = prepProblem(state, party, prep);
  if (prepBad) return prepBad;
  if (tokenBank(state, now).value.count < 1) return 'No attempt token in the bank.';
  return null;
};

/**
 * Runs one attempt and applies everything. The caller has checked `attemptProblem`.
 * Order: the fight, the pool, the milestones (silver, reagents, the kill's item), XP, then the rests.
 */
export const makeAttempt = (
  state: GameState,
  party: readonly HunterId[],
  prep: Preparation,
  now: number,
): BossReport => {
  const ev = state.events;
  const bossId = bossOfVisit(ev.boss.visit);
  const def = bosses[bossId];
  // The tier is fixed at the visit's first attempt (GDD §5.12.4); a later Rank-up changes nothing.
  const tier = visitTier(state);
  const poolStart = poolAtTier(tier);
  const poolBefore = ev.boss.pool ?? poolStart;
  const attempt = ev.attempts + 1;
  const snapshots = party.map((id) => snapshotOf(state, id));
  const alchemy = skillLevel(state, 'alchemy'); // frozen at launch (D206)
  const seed = eventSeed(state.meta.gameSeed, 'boss', attempt, party, prepIds(prep));
  const monster = { event: bossId, tier, healthOverride: poolBefore } as const;
  const fight = runFight({
    party: snapshots,
    monster,
    location: null, // no location traits, as in the Last Stand (GDD §5.12.4)
    rolls: seeded(seed),
    prep,
    alchemy,
  });
  // The pool afterwards is the boss's Health at the end; it can never rise above where it began.
  const poolAfter = Math.max(0, Math.min(poolBefore, fight.monsterHealth));
  const killed = poolAfter === 0;

  // Milestones: 25%, 50%, 75% and the kill, each paid once per visit by the attempt that crosses it.
  const marks = constantAt('boss.milestones').value as readonly number[];
  const crossed = marks.filter((m, i) =>
    i === marks.length - 1 ? killed : poolStart - poolAfter >= m * poolStart,
  ).length;
  const milestones: number[] = [];
  for (let i = ev.boss.paid; i < crossed; i++) milestones.push(i);

  // Silver: multiples of one bounty at the visit's tier and the hold's age. Not bounty silver (D361).
  const silverBounties = constantAt('boss.silverBounties').value as {
    milestone: number;
    kill: number;
  };
  const reagentUnits = constantAt('boss.reagents').value as { milestone: number; kill: number };
  const oneBounty = bounty(tier, state.cycle.age, []).value;
  let silver = 0;
  let units = 0;
  for (const i of milestones) {
    const kill = i === marks.length - 1;
    silver += oneBounty * (kill ? silverBounties.kill : silverBounties.milestone);
    units += kill ? reagentUnits.kill : reagentUnits.milestone;
  }
  const reagents: Partial<Record<IngredientId, number>> = units > 0 ? { [def.reagent]: units } : {};
  state.resources.silver += silver;
  if (units > 0) state.stores[def.reagent] += units;

  const found: string[] = [];
  if (killed && milestones.includes(marks.length - 1)) {
    const item = killItem(state, bossId, ev.boss.visit);
    if (item !== null) found.push(item);
  }

  // Hunter XP: every attendee, win or lose, inside the level cap (yard XP stays contracts-only).
  const xp = num('boss.xpPerTier') * tier;
  const levelUps: BossReport['levelUps'] = [];
  for (const id of party) {
    const h = state.hunters[id];
    if (!h) continue;
    for (const level of gainXp(state, h, xp)) {
      levelUps.push({ hunter: id, level });
      found.push(...notePeak(state, id, level));
    }
  }

  spendPrep(state, prep);
  spendToken(state, now);
  startRests(state, party, now);

  const ref: FightRef = {
    contractId: `event:${attempt}`,
    seed,
    party: snapshots,
    monster,
    location: null,
    result: fight.result,
    rulesVersion: RULES_VERSION,
    at: state.time,
    prep: structuredClone(prep),
    alchemy,
    event: { kind: 'boss', attempt, id: bossId },
  };
  ev.recent.push(ref);
  while (ev.recent.length > num('events.recentKeep')) ev.recent.shift();

  const restUntil = party.length > 0 ? (ev.rest[party[0] as HunterId] ?? 0) : 0;
  const report: BossReport = {
    boss: bossId,
    tier,
    poolStart,
    poolBefore,
    poolAfter,
    damage: poolBefore - poolAfter,
    killed,
    milestones,
    silver,
    reagents,
    xp,
    levelUps,
    found,
    party: [...party],
    restUntil,
  };
  ev.attempts = attempt;
  ev.last = { kind: 'boss', attempt, at: state.time, boss: report };
  if (killed) {
    // The next boss arrives at once (GDD §5.12.4); the tier is fixed again at its first attempt.
    ev.boss = { visit: ev.boss.visit + 1, tier: null, pool: null, paid: 0, attempts: 0 };
  } else {
    ev.boss = {
      visit: ev.boss.visit,
      tier,
      pool: poolAfter,
      paid: crossed,
      attempts: ev.boss.attempts + 1,
    };
  }
  return report;
};

/**
 * The kill's item (GDD §5.12.5): always (`boss.itemChance`), a Silvered Blade or an Emberwright
 * Plate half each, rarity by `boss.itemRarityWeights`, from the visit's own stream, into Stores or
 * salvaged when Stores is full.
 */
const killItem = (state: GameState, boss: BossId, visit: number): string | null => {
  const rng = stream(state.meta.gameSeed, 'loot', `boss:${boss}:${visit}`);
  if (rng.next() >= num('boss.itemChance')) return null;
  const base: GearId =
    guardianLootBases[Math.floor(rng.next() * guardianLootBases.length)] ?? 'silvered-blade';
  const rarity = pickRarity(rng, constantAt('boss.itemRarityWeights').value as RarityWeights);
  return lootKey(takeLoot(state, { base: gear[base], rarity, lines: rollLines(rng, rarity) }));
};
