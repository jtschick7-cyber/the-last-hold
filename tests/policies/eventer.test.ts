// Plan T9.12 (GDD §6.1, D367, D386): the Eventer policy. Its schedule is Standard's; at a check-in it
// spends banked tokens on a boss attempt (or the hunt that is within reach), with the four highest-level
// fresh hunters, and never touches a replay or a token it cannot use.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hunters, type HunterId } from '../../src/content/hunters';
import { apply } from '../../src/core/commands/apply';
import { eventerMoves, pickParty } from '../../src/core/policies/eventer';
import { nextCheckIn } from '../../src/core/policies/schedules';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { GameState } from '../../src/core/state/game-state';
import { eligibleHunters, tokenBank } from '../../src/core/systems/events';

const owner = (): GameState => {
  const env = JSON.parse(
    readFileSync(new URL('../saves/fixtures/v8-owner.json', import.meta.url), 'utf8'),
  );
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  catchUpNow(r.value.state, r.value.state.time);
  return r.value.state;
};

const run = (s: GameState, now: number) => eventerMoves(s, now, (cmd) => apply(s, cmd, now).ok);

describe("the Eventer keeps Standard's check-ins", () => {
  it('has the same times over three weeks, from a Monday', () => {
    const start = Date.UTC(2024, 0, 1, 7);
    const times = (p: 'standard' | 'eventer') => {
      const out: number[] = [];
      for (let t = start; out.length < 100; t = nextCheckIn(p, t, start - 10 ** 9)) out.push(t);
      return out;
    };
    expect(times('eventer')).toEqual(times('standard'));
  });
  it('opens like Standard and the Delver (10-second steps for 15 minutes)', () => {
    const start = Date.UTC(2024, 0, 1, 7);
    expect(nextCheckIn('eventer', start, start)).toBe(nextCheckIn('delver', start, start));
  });
});

describe('party choice', () => {
  const lvl = (s: GameState, id: HunterId) => s.hunters[id]?.level ?? 0;
  it('takes the four highest levels, with a Vanguard and a Mender', () => {
    const s = owner();
    const pool = eligibleHunters(s, s.time);
    const party = pickParty(s, pool, 4);
    expect(party).toHaveLength(4);
    expect(party.some((h) => hunters[h].role === 'vanguard')).toBe(true);
    expect(party.some((h) => hunters[h].role === 'mender')).toBe(true);
    // Nobody outside the party is stronger than the weakest member who was not needed for a role.
    const out = pool.filter((h) => !party.includes(h));
    const needed = (h: HunterId) =>
      party.filter((p) => hunters[p].role === hunters[h].role).length === 1 &&
      ['vanguard', 'mender'].includes(hunters[h].role);
    const free = party.filter((h) => !needed(h));
    for (const o of out) for (const f of free) expect(lvl(s, o)).toBeLessThanOrEqual(lvl(s, f));
  });
  it('is the same on every call', () => {
    const s = owner();
    const pool = eligibleHunters(s, s.time);
    expect(pickParty(s, pool, 4)).toEqual(pickParty(s, [...pool].reverse().reverse(), 4));
  });
});

describe('the check-in', () => {
  it('does nothing while events are locked', () => {
    const s = owner();
    s.cycle.age = 'keep';
    const r = run(s, s.time);
    expect(r.unlocked).toBe(false);
    expect(r.attempts).toHaveLength(0);
  });

  it('does nothing with an empty bank, and says the bank was not full', () => {
    const s = owner();
    const r = run(s, s.time);
    expect(r.unlocked).toBe(true);
    expect(r.attempts).toHaveLength(0);
    expect(r.bankFull).toBe(false);
  });

  it('spends tokens on boss attempts with fresh hunters until no party of four is left', () => {
    const s = owner();
    apply(s, { type: 'debug.fillBank' }, s.time);
    const before = tokenBank(s, s.time).value.count;
    const r = run(s, s.time);
    expect(r.bankFull).toBe(true);
    expect(r.attempts.length).toBeGreaterThan(0);
    expect(tokenBank(s, s.time).value.count).toBe(before - r.attempts.length);
    // Every attempt had four hunters, and nobody went twice (they rest 24 h).
    const sent = r.attempts.flatMap((a) => a.party);
    expect(new Set(sent).size).toBe(sent.length);
    for (const a of r.attempts) expect(a.party).toHaveLength(4);
    // It stopped because the bank ran out or no party of four was left.
    expect(tokenBank(s, s.time).value.count === 0 || eligibleHunters(s, s.time).length < 4).toBe(
      true,
    );
  });

  it('is deterministic: the same state gives the same attempts', () => {
    const a = owner();
    const b = owner();
    apply(a, { type: 'debug.fillBank' }, a.time);
    apply(b, { type: 'debug.fillBank' }, b.time);
    expect(JSON.stringify(run(a, a.time))).toBe(JSON.stringify(run(b, b.time)));
    expect(JSON.stringify(a.events)).toBe(JSON.stringify(b.events));
  });

  it('alternates: a hunt after each boss attempt, the hunt with most points first, never a replay', () => {
    const s = owner();
    apply(s, { type: 'debug.fillBank' }, s.time);
    s.events.hunts.mara.points = 40;
    const r = run(s, s.time);
    const kinds = r.attempts.map((a) => a.kind);
    expect(kinds[0]).toBe('boss');
    if (kinds.length > 1) expect(kinds[1]).toBe('hunt');
    expect(r.attempts[1]?.id.startsWith('mara')).toBe(true);
    for (let i = 1; i < kinds.length; i++)
      if (kinds[i - 1] === 'hunt') expect(kinds[i]).toBe('boss');
    s.events.hunts.mara.unlocked = true;
    const s2 = owner();
    apply(s2, { type: 'debug.fillBank' }, s2.time);
    s2.events.hunts.mara.unlocked = true;
    s2.events.hunts.stoneback.unlocked = true;
    s2.events.hunts.likho.unlocked = true;
    expect(run(s2, s2.time).attempts.every((a) => a.kind === 'boss')).toBe(true);
  });

  it('keeps the bank when fewer than four hunters are free', () => {
    const s = owner();
    apply(s, { type: 'debug.fillBank' }, s.time);
    const free = eligibleHunters(s, s.time);
    for (const id of free.slice(3)) s.events.rest[id] = s.events.clock.value + 10 ** 9;
    const r = run(s, s.time);
    expect(r.attempts).toHaveLength(0);
    expect(r.blocked).toBe(true);
    expect(tokenBank(s, s.time).value.count).toBe(6);
  });
});
