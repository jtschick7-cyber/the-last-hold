import { gear, GEAR_IDS } from '../../content/gear';
import { hunters, type HunterId } from '../../content/hunters';
import { hunts, quarries, type HuntId, type TrackDef, type TrackId } from '../../content/hunts';
import type { IngredientId } from '../../content/ingredients';
import { constantAt, num } from '../balance-access';
import { runFight } from '../combat';
import { roundHalfUp } from '../combat/build';
import { huntSeed } from '../contracts/seeds';
import { prepIds, prepProblem, spendPrep } from '../contracts/prep';
import { seeded } from '../rng';
import { RULES_VERSION } from '../rules-version';
import { skillLevel } from '../skills/skills';
import { notePeak } from '../story/letters';
import type { HuntReport } from '../state/events-state';
import { freshHunter } from '../state/hunters-state';
import type { FightRef, GameState, Preparation } from '../state/game-state';
import {
  eligibleHunters,
  eventBlock,
  eventsUnlocked,
  spendToken,
  startRests,
  tokenBank,
} from './events';
import { effectiveTraits, gainXp, levelCap, rosterCap, snapshotOf } from './hunters';
import { equipItem, makeItem } from './items';

// GDD §5.12.6–§5.12.7 (plan T9.8, D362, D386, D387): a Legendary Hunt attempt. One fight against the
// quarry at the track's tier, one token, the 24 h rest. A win pays more points than a loss; points
// carry over and stop at the total; the hunt's legendary hunter arrives free at the total. Nothing
// here touches a contract counter, Embers, trophies, the bestiary or the yard (D387).

const ROMAN = ['I', 'II', 'III'] as const;

/** The track with this id, with its hunt. */
export const trackOf = (id: TrackId): { hunt: HuntId; track: TrackDef } => {
  for (const hunt of Object.values(hunts)) {
    const track = hunt.tracks.find((t) => t.id === id);
    if (track) return { hunt: hunt.id, track };
  }
  throw new Error(`No track ${id}.`);
};

/** The tier a track is fought at (`hunt.trackTiers`). */
export const trackTier = (track: TrackDef): number =>
  (constantAt('hunt.trackTiers').value as readonly number[])[track.number - 1] ?? 0;

/** Points a track pays for a win or a loss (`hunt.trackPoints`). */
export const trackPoints = (track: TrackDef, result: 'win' | 'loss'): number => {
  const row = (
    constantAt('hunt.trackPoints').value as Record<string, { win: number; loss: number }>
  )[ROMAN[track.number - 1] as string];
  return row?.[result] ?? 0;
};

/** Why this hunter is outside the track's restriction (GDD §8.14), or null if the track admits them. */
export const trackBlock = (state: GameState, id: HunterId, track: TrackDef): string | null => {
  const def = hunters[id];
  const r = track.restriction;
  const ok =
    r.kind === 'roles'
      ? r.roles.includes(def.role)
      : r.kind === 'damage'
        ? r.types.includes(def.damage)
        : effectiveTraits(state, id).some((t) => r.traits.includes(t));
  return ok ? null : `Track needs: ${track.restrictionText}`;
};

/** Every hunter who can go on this track now (owned, not blocked, inside the restriction). */
export const legalHunters = (state: GameState, track: TrackDef, now: number): HunterId[] =>
  eligibleHunters(state, now).filter((id) => trackBlock(state, id, track) === null);

export const huntProblem = (
  state: GameState,
  trackId: TrackId,
  party: readonly HunterId[],
  prep: Preparation,
  now: number,
): string | null => {
  if (!(trackId in trackIndex)) return 'That track does not exist.';
  const { track } = trackOf(trackId);
  if (!eventsUnlocked(state)) return 'Events open at the first Citadel.';
  if (!Array.isArray(party) || party.length < 1) return 'Choose at least one hunter.';
  if (party.length > num('boss.partySize'))
    return `A party takes at most ${num('boss.partySize')} hunters.`;
  if (new Set(party).size !== party.length) return 'A hunter can only be sent once.';
  for (const id of party) {
    const block = eventBlock(state, id, now);
    if (block) return block.reason;
    const outside = trackBlock(state, id, track);
    if (outside) return outside;
  }
  const prepBad = prepProblem(state, party, prep);
  if (prepBad) return prepBad;
  if (tokenBank(state, now).value.count < 1) return 'No attempt token in the bank.';
  return null;
};

const trackIndex: Readonly<Record<string, true>> = Object.fromEntries(
  Object.values(hunts).flatMap((h) => h.tracks.map((t) => [t.id, true as const])),
);

/**
 * The legendary hunter joins free (GDD §5.12.7, D386): active if there is room, else the reserve,
 * at the highest level among the hunters already here (within the Rank's cap), a Wright only from
 * `rank.wrightLevel`, no stars, no talents, wearing first-tier Common pieces made for them.
 */
export const arriveLegendary = (
  state: GameState,
  hunt: HuntId,
): NonNullable<HuntReport['arrival']> => {
  const id = hunts[hunt].hunter;
  if (state.hunters[id]) throw new Error(`${id} is already here.`);
  const highest = Math.max(1, ...Object.values(state.hunters).map((h) => h?.level ?? 0));
  const level = Math.min(highest, levelCap(state));
  const rank = level >= num('rank.wrightLevel') ? 'wright' : 'apprentice';
  state.hunters[id] = { ...freshHunter(), level, rank };
  outfit(state, id);
  if (state.roster.active.length < rosterCap(state).value) state.roster.active.push(id);
  return { hunter: id, level, rank };
};

/** Gear made for the newcomer: nothing is taken from Stores and nothing is paid for. */
const outfit = (state: GameState, id: HunterId): void => {
  for (const slot of ['weapon', 'armor'] as const) {
    const base = GEAR_IDS.map((g) => gear[g]).find((g) => g.slot === slot && g.tier === 1);
    if (!base) continue;
    equipItem(state, makeItem(state, base, 'common', [], { iron: 0, silver: 0 }), id, slot);
  }
};

export const makeHuntAttempt = (
  state: GameState,
  trackId: TrackId,
  party: readonly HunterId[],
  prep: Preparation,
  now: number,
): HuntReport => {
  const ev = state.events;
  const { hunt: huntId, track } = trackOf(trackId);
  const def = hunts[huntId];
  const quarry = quarries[def.quarry];
  const tier = trackTier(track);
  const attempt = ev.attempts + 1;
  const snapshots = party.map((id) => snapshotOf(state, id));
  const alchemy = skillLevel(state, 'alchemy'); // frozen at launch (D206)
  const seed = huntSeed(state.meta.gameSeed, attempt, huntId, track.number, party, prepIds(prep));
  const monster = { event: def.quarry, tier } as const;
  const fight = runFight({
    party: snapshots,
    monster,
    location: null, // no location traits (GDD §5.12.6)
    rolls: seeded(seed),
    prep,
    alchemy,
  });
  const result = fight.result;
  const record = ev.hunts[huntId];
  const replay = record.unlocked;

  // Points: none on a replay; otherwise the track's win or loss points, stopping at the total.
  const total = num('hunt.unlockPoints');
  const points = replay ? 0 : Math.min(trackPoints(track, result), total - record.points);
  record.points += points;
  const unlocked = !replay && record.points >= total;

  // XP: every attendee, inside the level cap; a loss pays a share (yard XP stays contracts-only).
  const full = num('hunt.xpPerTier') * tier;
  const xp = result === 'win' ? full : roundHalfUp(full * num('hunt.lossXpShare'));
  const levelUps: HuntReport['levelUps'] = [];
  const found: string[] = [];
  for (const id of party) {
    const h = state.hunters[id];
    if (!h) continue;
    for (const level of gainXp(state, h, xp)) {
      levelUps.push({ hunter: id, level });
      found.push(...notePeak(state, id, level));
    }
  }

  // A replay win pays a reagent of the quarry's kind.
  const reagents: Partial<Record<IngredientId, number>> = {};
  if (replay && result === 'win') {
    const n = num('hunt.replayReagents');
    reagents[quarry.reagent] = n;
    state.stores[quarry.reagent] += n;
  }

  let arrival: HuntReport['arrival'];
  if (unlocked) {
    record.unlocked = true;
    arrival = arriveLegendary(state, huntId);
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
    result,
    rulesVersion: RULES_VERSION,
    at: state.time,
    prep: structuredClone(prep),
    alchemy,
    event: { kind: 'hunt', attempt, id: trackId },
  };
  ev.recent.push(ref);
  while (ev.recent.length > num('events.recentKeep')) ev.recent.shift();

  const report: HuntReport = {
    hunt: huntId,
    track: track.number,
    tier,
    result,
    replay,
    points,
    pointsTotal: record.points,
    unlocked,
    xp,
    levelUps,
    reagents,
    found,
    party: [...party],
    restUntil: party.length > 0 ? (ev.rest[party[0] as HunterId] ?? 0) : 0,
    ...(arrival ? { arrival } : {}),
  };
  ev.attempts = attempt;
  ev.last = { kind: 'hunt', attempt, at: state.time, hunt: report };
  return report;
};
