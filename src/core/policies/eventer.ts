import { consumables, type ConsumableId } from '../../content/consumables';
import { bosses } from '../../content/great-beasts';
import { HUNTER_IDS, hunters, type HunterId } from '../../content/hunters';
import { HUNT_IDS, hunts, quarries, type TrackDef, type TrackId } from '../../content/hunts';
import { num } from '../balance-access';
import type { Command } from '../commands';
import type { EventCreature } from '../../content/great-beasts';
import type { GameState, Preparation } from '../state/game-state';
import { bossOfVisit } from '../systems/boss';
import { eligibleHunters, eventsUnlocked, tokenBank } from '../systems/events';
import { legalHunters } from '../systems/hunt';

// GDD §6.1 (v0.9, D367, D386): what the Eventer does with its tokens at a check-in. Its contract and
// building decisions are Standard's (decideCheckIn); this adds only the event moves. Every choice is
// a Command through apply(), and nothing here rolls a die or reads the clock.

type Act = (cmd: Command) => boolean;

/** Hunters in a party (`boss.partySize`, locked). */
const PARTY = (): number => num('boss.partySize');

export interface EventAttemptRecord {
  readonly kind: 'boss' | 'hunt';
  /** The boss id, or the track id of a hunt. */
  readonly id: string;
  readonly tier: number;
  readonly party: readonly HunterId[];
  /** Boss: damage dealt, the kill, milestones newly paid and silver. Zero for a hunt. */
  readonly damage: number;
  readonly killed: boolean;
  readonly milestones: number;
  readonly silver: number;
  /** Hunt: the result and the points paid; the hunt's hunter arriving. */
  readonly result: 'win' | 'loss' | null;
  readonly points: number;
  readonly unlockedHunt: boolean;
}

export interface EventerCheckIn {
  /** Events were open at this check-in; locked check-ins count toward no Eventer row (D386). */
  readonly unlocked: boolean;
  /** The bank was full when the check-in began (GDD §6.2 "tokens not wasted"). */
  readonly bankFull: boolean;
  /** A token was left banked but no party of four could go. */
  readonly blocked: boolean;
  readonly attempts: readonly EventAttemptRecord[];
}

const roleOf = (id: HunterId) => hunters[id].role;

/**
 * The `size` fresh hunters with the highest levels (ties in the roster's list order), with at least
 * one Vanguard and one Mender when the pool has them: a missing role takes the place of the weakest
 * member who is not the only holder of a required role.
 */
export const pickParty = (s: GameState, pool: readonly HunterId[], size: number): HunterId[] => {
  const level = (id: HunterId): number => s.hunters[id]?.level ?? 0;
  const sorted = [...pool].sort(
    (a, b) => level(b) - level(a) || HUNTER_IDS.indexOf(a) - HUNTER_IDS.indexOf(b),
  );
  const party = sorted.slice(0, size);
  for (const role of ['vanguard', 'mender'] as const) {
    if (party.some((h) => roleOf(h) === role)) continue;
    const add = sorted.find((h) => !party.includes(h) && roleOf(h) === role);
    if (!add) continue;
    const holds = (h: HunterId): boolean =>
      (roleOf(h) === 'vanguard' || roleOf(h) === 'mender') &&
      party.filter((p) => roleOf(p) === roleOf(h)).length === 1;
    const victims = party.filter((h) => !holds(h));
    const out = victims[victims.length - 1];
    if (out === undefined) continue;
    party.splice(party.indexOf(out), 1, add);
    party.sort((a, b) => sorted.indexOf(a) - sorted.indexOf(b));
  }
  return party;
};

/**
 * The usual kit against a creature's family (GDD §6.1): the matching oil on as many as the stores
 * cover, the bombs it is weak to, else a Saltburst, and a Mending Draught on a Mender.
 */
export const eventPrep = (
  s: GameState,
  party: readonly HunterId[],
  c: EventCreature,
): Preparation => {
  const prep: Preparation = { oils: {}, potions: {}, bombs: [] };
  const left = (id: ConsumableId, used = 0): boolean => s.stores[id] - used > 0;
  const ids = Object.keys(consumables) as ConsumableId[];
  const oil = ids.find((id) => {
    const e = consumables[id].effect;
    return e.kind === 'oil' && e.family === c.family;
  });
  if (oil) {
    let used = 0;
    for (const h of party) {
      if (!left(oil, used)) break;
      prep.oils[h] = oil;
      used += 1;
    }
  }
  const slots = num('prep.bombSlots');
  for (const bomb of ['fire-pot', 'frost-pot'] as const) {
    const e = consumables[bomb].effect;
    if (
      prep.bombs.length < slots &&
      left(bomb) &&
      (e.kind === 'burn' || e.kind === 'chill') &&
      c.resist[e.damageType] >= num('prep.weakAt')
    )
      prep.bombs.push(bomb);
  }
  if (prep.bombs.length === 0 && left('saltburst')) prep.bombs.push('saltburst');
  const mender = party.find((h) => roleOf(h) === 'mender') ?? party[0];
  if (mender && left('mending-draught')) prep.potions[mender] = 'mending-draught';
  return prep;
};

/** Every track of a hunt, best-paying (highest number) first. */
const tracksBestFirst = (hunt: (typeof hunts)[keyof typeof hunts]): TrackDef[] =>
  [...hunt.tracks].sort((a, b) => b.number - a.number);

/**
 * The hunt the next token goes to (Q31 (a), D396): after a boss attempt, the unlocked-not hunt with
 * the most points (ties in list order), on its best-paying track with a full legal party. Null when
 * the last attempt was not a boss attempt, or no hunt has a full legal party. Never a replay (D386).
 */
const nextHunt = (
  s: GameState,
  now: number,
): { track: TrackDef; party: HunterId[]; hunt: (typeof HUNT_IDS)[number] } | null => {
  if (s.events.last?.kind !== 'boss') return null;
  const open = HUNT_IDS.filter((id) => !s.events.hunts[id].unlocked)
    .map((id, i) => ({ id, i }))
    .sort((x, y) => s.events.hunts[y.id].points - s.events.hunts[x.id].points || x.i - y.i);
  for (const { id } of open) {
    const best = tracksBestFirst(hunts[id])
      .map((track) => ({ track, pool: legalHunters(s, track, now) }))
      .find((x) => x.pool.length >= PARTY());
    if (best) return { track: best.track, party: pickParty(s, best.pool, PARTY()), hunt: id };
  }
  return null;
};

/**
 * One check-in's event moves at `now` (GDD §6.1): while a token is banked and four fresh hunters
 * can go, make an attempt. Bosses and hunts alternate: a hunt follows each boss attempt (Q31 (a)).
 */
export const eventerMoves = (s: GameState, now: number, act: Act): EventerCheckIn => {
  if (!eventsUnlocked(s)) return { unlocked: false, bankFull: false, blocked: false, attempts: [] };
  const bankFull = tokenBank(s, now).value.full;
  const attempts: EventAttemptRecord[] = [];
  let blocked = false;
  while (tokenBank(s, now).value.count >= 1) {
    const reach = nextHunt(s, now);
    const pool = eligibleHunters(s, now);
    if (!reach && pool.length < PARTY()) {
      blocked = true;
      break;
    }
    if (reach) {
      const quarry = quarries[hunts[reach.hunt].quarry];
      const prep = eventPrep(s, reach.party, quarry);
      const track = reach.track.id as TrackId;
      if (!act({ type: 'hunt.attempt', track, party: reach.party, prep })) break;
      const h = s.events.last?.hunt;
      if (!h) break;
      attempts.push({
        kind: 'hunt',
        id: track,
        tier: h.tier,
        party: h.party,
        damage: 0,
        killed: false,
        milestones: 0,
        silver: 0,
        result: h.result,
        points: h.points,
        unlockedHunt: h.unlocked,
      });
      continue;
    }
    const party = pickParty(s, pool, PARTY());
    const boss = bosses[bossOfVisit(s.events.boss.visit)];
    if (!act({ type: 'boss.attempt', party, prep: eventPrep(s, party, boss) })) break;
    const b = s.events.last?.boss;
    if (!b) break;
    attempts.push({
      kind: 'boss',
      id: b.boss,
      tier: b.tier,
      party: b.party,
      damage: b.damage,
      killed: b.killed,
      milestones: b.milestones.length,
      silver: b.silver,
      result: null,
      points: 0,
      unlockedHunt: false,
    });
  }
  return { unlocked: true, bankFull, blocked, attempts };
};
