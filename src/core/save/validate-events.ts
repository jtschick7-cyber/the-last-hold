import { HUNTER_IDS, type HunterId } from '../../content/hunters';
import { balance } from '../../content/balance';
import { num } from '../balance-access';
import { HUNT_IDS, type HuntId } from '../../content/hunts';
import type { BossReport, EventResult, EventsState } from '../state/events-state';
import type { FightRef } from '../state/game-state';
import { BOSS_IDS } from '../../content/great-beasts';
import { INGREDIENT_IDS } from '../../content/ingredients';
import {
  arr,
  bool,
  count,
  finite,
  hunterId,
  nonNegative,
  obj,
  oneOf,
  orNull,
  str,
  type Obj,
} from './guards';

// Technical design §9.4 (v9): the events part of the save guard. Unknown hunter, hunt and boss ids
// drop with a warning, never a crash; counts outside their range are clamped with a warning, and a
// rest already over is dropped (plan T9.3).
const TIER_MIN = 3;
const TIER_MAX = 12;

const clamp = (x: number, lo: number, hi: number, where: string, warnings: string[]): number => {
  const c = Math.max(lo, Math.min(hi, x));
  if (c !== x) warnings.push(`${where} was out of range; set to ${c}.`);
  return c;
};

const report = (v: unknown, where: string): BossReport => {
  const o = obj(v, where);
  return {
    boss: oneOf(o.boss, BOSS_IDS, `${where}.boss`),
    tier: count(o.tier, `${where}.tier`),
    poolStart: nonNegative(o.poolStart, `${where}.poolStart`),
    poolBefore: nonNegative(o.poolBefore, `${where}.poolBefore`),
    poolAfter: nonNegative(o.poolAfter, `${where}.poolAfter`),
    damage: nonNegative(o.damage, `${where}.damage`),
    killed: bool(o.killed, `${where}.killed`),
    milestones: arr(o.milestones, `${where}.milestones`).map((x, i) =>
      count(x, `${where}.milestones[${i}]`),
    ),
    silver: nonNegative(o.silver, `${where}.silver`),
    reagents: Object.fromEntries(
      Object.entries(obj(o.reagents, `${where}.reagents`)).map(([k, x]) => [
        oneOf(k, INGREDIENT_IDS, `${where}.reagents key`),
        count(x, `${where}.reagents.${k}`),
      ]),
    ),
    xp: nonNegative(o.xp, `${where}.xp`),
    levelUps: arr(o.levelUps, `${where}.levelUps`).map((x, i) => {
      const l = obj(x, `${where}.levelUps[${i}]`);
      return {
        hunter: hunterId(l.hunter, `${where}.levelUps[${i}].hunter`),
        level: count(l.level, `${where}.levelUps[${i}].level`),
      };
    }),
    found: arr(o.found, `${where}.found`).map((x, i) => str(x, `${where}.found[${i}]`)),
    party: arr(o.party, `${where}.party`).map((x, i) => hunterId(x, `${where}.party[${i}]`)),
    restUntil: finite(o.restUntil, `${where}.restUntil`),
  };
};

const result = (v: unknown, where: string): EventResult => {
  const o = obj(v, where);
  return {
    kind: oneOf(o.kind, ['boss', 'hunt'] as const, `${where}.kind`),
    attempt: count(o.attempt, `${where}.attempt`),
    at: finite(o.at, `${where}.at`),
    ...(o.boss === undefined ? {} : { boss: report(o.boss, `${where}.boss`) }),
  };
};

const restRecord = (
  v: unknown,
  now: number,
  warnings: string[],
): Partial<Record<HunterId, number>> => {
  const out: Partial<Record<HunterId, number>> = {};
  for (const [k, x] of Object.entries(obj(v, 'events.rest'))) {
    if (!(HUNTER_IDS as readonly string[]).includes(k)) {
      warnings.push(`Dropped unknown events.rest entry "${k}".`);
      continue;
    }
    const until = nonNegative(x, `events.rest.${k}`);
    if (until > now) out[k as HunterId] = until; // a rest already over is dropped
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
          points: clamp(
            count(h.points, `events.hunts.${id}.points`),
            0,
            num('hunt.unlockPoints'),
            `events.hunts.${id}.points`,
            warnings,
          ),
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
      count: clamp(
        count(tokens.count, 'events.tokens.count'),
        0,
        num('boss.tokenMax'),
        'events.tokens.count',
        warnings,
      ),
      at: orNull(tokens.at, (x) => finite(x, 'events.tokens.at')),
    },
    attempts: count(o.attempts, 'events.attempts'),
    rest: restRecord(o.rest, nonNegative(clock.value, 'events.clock.value'), warnings),
    boss: {
      visit: count(boss.visit, 'events.boss.visit'),
      tier: orNull(boss.tier, (x) =>
        clamp(count(x, 'events.boss.tier'), TIER_MIN, TIER_MAX, 'events.boss.tier', warnings),
      ),
      pool: orNull(boss.pool, (x) => nonNegative(x, 'events.boss.pool')),
      paid: clamp(
        count(boss.paid, 'events.boss.paid'),
        0,
        (balance.boss.milestones.value as readonly number[]).length,
        'events.boss.paid',
        warnings,
      ),
      attempts: count(boss.attempts, 'events.boss.attempts'),
    },
    hunts: huntRecord(o.hunts, warnings),
    last: orNull(o.last, (x) => result(x, 'events.last')),
    recent: arr(o.recent, 'events.recent').map((r, i) => fight(r, `events.recent[${i}]`)),
  };
};
