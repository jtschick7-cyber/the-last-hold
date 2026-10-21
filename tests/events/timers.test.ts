// Plan T9.3 (GDD §5.12.2–§5.12.3, technical design §5.2, §6.2, D359): the token bank, rest and
// eligibility are worked out from stored timestamps and the event clock.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apply } from '../../src/core/commands/apply';
import { loadEnvelope } from '../../src/core/save';
import { catchUpNow } from '../../src/core/sim/offline';
import type { EventsState } from '../../src/core/state/events-state';
import type { GameState } from '../../src/core/state/game-state';
import {
  bankFullBadge,
  eligibleHunters,
  eventBlock,
  eventNow,
  eventsUnlocked,
  foldEventClock,
  openEvents,
  restRemaining,
  setBank,
  spendToken,
  startRests,
  tokenBank,
} from '../../src/core/systems/events';
import { MS_PER_HOUR } from '../../src/core/time';

const H = MS_PER_HOUR;
const owner = (): GameState => {
  const env = JSON.parse(
    readFileSync(new URL('../saves/fixtures/v8-owner.json', import.meta.url), 'utf8'),
  );
  const r = loadEnvelope(env);
  if (!r.ok) throw new Error(r.error);
  catchUpNow(r.value.state, r.value.state.time); // the load path: events open, empty bank
  return r.value.state;
};
const bankAt = (s: GameState, t: number) => tokenBank(s, t).value;

describe('the token bank', () => {
  it('starts empty and earns one token every 8 h, with progress and next-in', () => {
    const s = owner();
    const t0 = s.time;
    expect(bankAt(s, t0)).toMatchObject({ count: 0, max: 6, full: false, nextInMs: 8 * H });
    expect(bankAt(s, t0 + 7 * H)).toMatchObject({ count: 0, progressMs: 7 * H, nextInMs: H });
    expect(bankAt(s, t0 + 8 * H).count).toBe(1);
    expect(bankAt(s, t0 + 30 * H)).toMatchObject({ count: 3, progressMs: 6 * H, nextInMs: 2 * H });
  });

  it('is a hard cap: at 6 time is lost, and nothing is owed', () => {
    const s = owner();
    const b = bankAt(s, s.time + 100 * H);
    expect(b).toMatchObject({ count: 6, full: true, progressMs: 0, nextInMs: null });
    expect(tokenBank(s, s.time + 100 * H).breakdown.value).toBe(6);
  });

  it('a 30 h jump equals a 12 h + 12 h + 6 h sequence of loads (exactly)', () => {
    const jump = owner();
    const seq = owner();
    const t0 = jump.time;
    catchUpNow(jump, t0 + 30 * H);
    catchUpNow(seq, t0 + 12 * H);
    catchUpNow(seq, t0 + 24 * H);
    catchUpNow(seq, t0 + 30 * H);
    expect(bankAt(seq, t0 + 30 * H)).toEqual(bankAt(jump, t0 + 30 * H));
    expect(bankAt(jump, t0 + 30 * H)).toMatchObject({ count: 3, progressMs: 6 * H });
    expect(seq.events.clock).toEqual(jump.events.clock);
  });

  it('is right after a long absence: the offline cap does not touch it', () => {
    const s = owner();
    const t0 = s.time;
    const summary = catchUpNow(s, t0 + 100 * H);
    expect(summary.capped).toBe(true); // production stopped at the cap...
    expect(bankAt(s, s.time).full).toBe(true); // ...the bank did not
  });

  it('a spend equals ticking to it second by second and then spending', () => {
    const direct = owner();
    const ticked = owner();
    const t0 = direct.time;
    const at = t0 + 20 * H + 1234;
    expect(spendToken(direct, at)).toBe(true);
    for (let t = t0; t < at; t += 600_000) foldEventClock(ticked, t);
    expect(spendToken(ticked, at)).toBe(true);
    expect(bankAt(ticked, at)).toEqual(bankAt(direct, at));
    expect(bankAt(direct, at)).toMatchObject({ count: 1 });
  });

  it('a part-full bank keeps its progress on a spend; a full bank restarts its clock', () => {
    const part = owner();
    const t0 = part.time;
    const t = t0 + 20 * H; // 2 tokens, 4 h toward the next
    expect(bankAt(part, t)).toMatchObject({ count: 2, progressMs: 4 * H });
    spendToken(part, t);
    expect(bankAt(part, t)).toMatchObject({ count: 1, progressMs: 4 * H, nextInMs: 4 * H });
    const full = owner();
    const tf = full.time + 100 * H;
    spendToken(full, tf);
    expect(bankAt(full, tf)).toMatchObject({ count: 5, progressMs: 0, nextInMs: 8 * H });
    expect(bankAt(full, tf + 8 * H).count).toBe(6);
  });

  it('refuses to spend from an empty bank and changes nothing', () => {
    const s = owner();
    const before = structuredClone(s.events);
    expect(spendToken(s, s.time)).toBe(false);
    expect(s.events).toEqual(before);
  });

  it('a clock set back changes no remaining time; back then forward gives no free time', () => {
    const s = owner();
    const t0 = s.time;
    const T = t0 + 10 * H;
    catchUpNow(s, T);
    startRests(s, ['halvar'], T);
    const bank = bankAt(s, T);
    const rest = restRemaining(s, 'halvar', T).value.remainingMs;
    expect(bankAt(s, T - 3 * H)).toEqual(bank);
    expect(restRemaining(s, 'halvar', T - 3 * H).value.remainingMs).toBe(rest);
    foldEventClock(s, T - 3 * H); // the rewind is seen
    foldEventClock(s, T); // and the clock comes forward again
    expect(bankAt(s, T)).toEqual(bank);
    expect(restRemaining(s, 'halvar', T).value.remainingMs).toBe(rest);
    const atT = eventNow(s, T);
    foldEventClock(s, T + 3 * H); // beyond the old mark: exactly 3 h
    expect(bankAt(s, T + 3 * H).progressMs).toBe(bank.progressMs + 3 * H);
    expect(eventNow(s, T + 3 * H) - atT).toBe(3 * H);
  });

  it('keeps banking while events are locked (after a Long Night), but shows no badge', () => {
    const s = owner();
    setBank(s, 6, s.time);
    expect(bankFullBadge(s, s.time)).toBe(true);
    s.cycle.age = 'hamlet'; // the Long Night: Hamlet again, events locked until the Citadel
    expect(eventsUnlocked(s)).toBe(false);
    expect(bankAt(s, s.time).full).toBe(true);
    expect(bankFullBadge(s, s.time)).toBe(false);
    expect(openEvents(s, s.time + 1)).toBe(false);
    expect(s.events.opened).toBe(true);
  });
});

describe('rest and eligibility', () => {
  it('rests a hunter 24 h from event attempts, per hunter', () => {
    const s = owner();
    const t = s.time;
    startRests(s, ['halvar', 'zora'], t);
    expect(restRemaining(s, 'halvar', t).value.remainingMs).toBe(24 * H);
    expect(restRemaining(s, 'halvar', t + 9 * H + 20 * 60_000).value.remainingMs).toBe(
      14 * H + 40 * 60_000,
    );
    expect(restRemaining(s, 'ostap', t).value.remainingMs).toBe(0);
    expect(restRemaining(s, 'halvar', t + 24 * H).value.remainingMs).toBe(0);
    expect(eventBlock(s, 'halvar', t + 9 * H + 20 * 60_000)).toMatchObject({
      kind: 'resting',
      reason: 'Rests for 14h 40m',
    });
  });

  it('a hunter on a contract is not eligible; a resting one can still take a contract', () => {
    const s = owner();
    const t = s.time;
    startRests(s, ['halvar', 'zora', 'ostap'], t);
    expect(eligibleHunters(s, t)).not.toContain('halvar');
    const r = apply(
      s,
      { type: 'contract.launch', contract: 'c416', party: ['halvar', 'zora', 'ostap'] },
      t,
    );
    expect(r.ok, r.ok ? '' : r.reason).toBe(true);
    expect(eventBlock(s, 'halvar', t)).toMatchObject({
      kind: 'on-contract',
      reason: 'On a contract',
    });
    expect(eventBlock(s, 'vesna', t)).toBeNull();
    expect(eligibleHunters(s, t)).toContain('vesna');
  });

  it('reserve hunters can attend; injured hunters cannot (D369 (2))', () => {
    const s = owner();
    s.roster.active = s.roster.active.filter((h) => h !== 'arvid'); // arvid to the reserve
    expect(eventBlock(s, 'arvid', s.time)).toBeNull();
    const h = s.hunters.bjarna;
    if (!h) throw new Error('no bjarna');
    h.recovery = { kind: 'wounded' as never, until: s.time + H };
    expect(eventBlock(s, 'bjarna', s.time)).toMatchObject({
      kind: 'recovering',
      reason: 'Recovering',
    });
    expect(eligibleHunters(s, s.time)).not.toContain('bjarna');
  });

  it('nobody is eligible while events are locked; an unowned hunter is not in the hold', () => {
    const s = owner();
    s.cycle.age = 'hamlet';
    expect(eligibleHunters(s, s.time)).toEqual([]);
    const t = owner();
    delete t.hunters.sigrun;
    expect(eventBlock(t, 'sigrun', t.time)).toMatchObject({ kind: 'not-owned' });
  });
});

describe('debug commands (each sets debugUsed)', () => {
  it('add a token, fill the bank, end all rests', () => {
    const s = owner();
    s.meta.debugUsed = false;
    const t = s.time;
    expect(apply(s, { type: 'debug.addToken' }, t).ok).toBe(true);
    expect(bankAt(s, t).count).toBe(1);
    expect(s.meta.debugUsed).toBe(true);
    s.meta.debugUsed = false;
    expect(apply(s, { type: 'debug.fillBank' }, t).ok).toBe(true);
    expect(bankAt(s, t)).toMatchObject({ count: 6, full: true });
    expect(s.meta.debugUsed).toBe(true);
    expect(apply(s, { type: 'debug.addToken' }, t).ok).toBe(true);
    expect(bankAt(s, t).count).toBe(6); // never above the maximum
    startRests(s, ['halvar'], t);
    s.meta.debugUsed = false;
    expect(apply(s, { type: 'debug.endRests' }, t).ok).toBe(true);
    expect(s.events.rest).toEqual({});
    expect(s.meta.debugUsed).toBe(true);
  });

  it('refuse a token before events have opened, changing nothing', () => {
    const s = owner();
    s.events.opened = false;
    s.meta.debugUsed = false;
    const r = apply(s, { type: 'debug.fillBank' }, s.time);
    expect(r.ok).toBe(false);
    expect(s.meta.debugUsed).toBe(false);
  });
});

describe('the load-path clamps (technical design §9.4)', () => {
  it('clamp tokens, points, tier and paid, and drop a rest already over', async () => {
    const { encodeSaveFile, makeEnvelope } = await import('../../src/core/save');
    const s = owner();
    const env = JSON.parse(encodeSaveFile(makeEnvelope(s, 0))) as {
      state: { events: EventsState };
    };
    const e = env.state.events;
    e.tokens.count = 99;
    e.hunts.mara.points = 500;
    e.boss.tier = 99;
    e.boss.paid = 9;
    e.rest = { halvar: -0, zora: e.clock.value + 5 };
    const r = loadEnvelope(env);
    if (!r.ok) throw new Error(r.error);
    const ev = r.value.state.events;
    expect(ev.tokens.count).toBe(6);
    expect(ev.hunts.mara.points).toBe(100);
    expect(ev.boss.tier).toBe(12);
    expect(ev.boss.paid).toBe(4);
    expect(ev.rest).toEqual({ zora: e.clock.value + 5 });
    expect(r.value.warnings).toHaveLength(4);
  });
});
