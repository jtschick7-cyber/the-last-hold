import { HUNTER_IDS, type HunterId } from '../../content/hunters';
import { HUNT_IDS, type HuntId } from '../../content/hunts';
import type { EventResult, EventsState } from '../state/events-state';
import type { FightRef } from '../state/game-state';
import { arr, bool, count, finite, nonNegative, obj, oneOf, orNull, type Obj } from './guards';

// Technical design §9.4 (v9): the events part of the save guard. Unknown hunter, hunt and boss ids
// drop with a warning, never a crash. The clamps that need the `boss.*` and `hunt.*` constants
// (tokens to the bank maximum, points to the unlock total, a rest already over) wait for T9.3,
// which reads those constants.

const result = (v: unknown, where: string): EventResult => {
  const o = obj(v, where);
  return {
    kind: oneOf(o.kind, ['boss', 'hunt'] as const, `${where}.kind`),
    attempt: count(o.attempt, `${where}.attempt`),
    at: finite(o.at, `${where}.at`),
  };
};

const restRecord = (v: unknown, warnings: string[]): Partial<Record<HunterId, number>> => {
  const out: Partial<Record<HunterId, number>> = {};
  for (const [k, x] of Object.entries(obj(v, 'events.rest'))) {
    if (!(HUNTER_IDS as readonly string[]).includes(k)) {
      warnings.push(`Dropped unknown events.rest entry "${k}".`);
      continue;
    }
    out[k as HunterId] = nonNegative(x, `events.rest.${k}`);
  }
  return out;
};

const huntRecord = (v: unknown, warnings: string[]): EventsState['hunts'] => {
  const o = obj(v, 'events.hunts');
  for (const k of Object.keys(o))
    if (!(HUNT_IDS as readonly string[]).includes(k))
      warnings.push(`Dropped unknown events.hunts entry "${k}".`);
  return Object.fromEntries(
    HUNT_IDS.map((id: HuntId) => {
      if (!(id in o)) {
        warnings.push(`events.hunts had no "${id}"; set to 0 points.`);
        return [id, { points: 0, unlocked: false }];
      }
      const h = obj(o[id], `events.hunts.${id}`);
      return [
        id,
        {
          points: count(h.points, `events.hunts.${id}.points`),
          unlocked: bool(h.unlocked, `events.hunts.${id}.unlocked`),
        },
      ];
    }),
  ) as EventsState['hunts'];
};

/** `fight` reads one saved fight reference (the guard in validate.ts). */
export const eventsFrom = (
  v: unknown,
  fight: (v: unknown, where: string) => FightRef,
  warnings: string[],
): EventsState => {
  const o: Obj = obj(v, 'events');
  const clock = obj(o.clock, 'events.clock');
  const tokens = obj(o.tokens, 'events.tokens');
  const boss = obj(o.boss, 'events.boss');
  return {
    opened: bool(o.opened, 'events.opened'),
    sceneSeen: bool(o.sceneSeen, 'events.sceneSeen'),
    clock: {
      value: nonNegative(clock.value, 'events.clock.value'),
      high: finite(clock.high, 'events.clock.high'),
    },
    tokens: {
      count: count(tokens.count, 'events.tokens.count'),
      at: orNull(tokens.at, (x) => finite(x, 'events.tokens.at')),
    },
    attempts: count(o.attempts, 'events.attempts'),
    rest: restRecord(o.rest, warnings),
    boss: {
      visit: count(boss.visit, 'events.boss.visit'),
      tier: orNull(boss.tier, (x) => count(x, 'events.boss.tier')),
      pool: orNull(boss.pool, (x) => nonNegative(x, 'events.boss.pool')),
      paid: count(boss.paid, 'events.boss.paid'),
      attempts: count(boss.attempts, 'events.boss.attempts'),
    },
    hunts: huntRecord(o.hunts, warnings),
    last: orNull(o.last, (x) => result(x, 'events.last')),
    recent: arr(o.recent, 'events.recent').map((r, i) => fight(r, `events.recent[${i}]`)),
  };
};
