// Plan T7.14 (GDD §6.1, D269, D270): the simulated Delver. Standard plus Delve sessions; the door and
// blessing rules; what it spends Riftglass on; and that Standard never Delves.
import { describe, expect, it } from 'vitest';
import { blessingsOf } from '../../src/content/delves/blessings';
import type { Command } from '../../src/core/commands';
import { bestBlessing, delveSession, favouredPatron } from '../../src/core/policies/delver';
import { play, type CheckInRecord } from '../../src/core/policies/play';
import { DAY, isDelveSession, nextCheckIn } from '../../src/core/policies/schedules';
import type { DelveRun } from '../../src/core/state/delve-state';
import { HOUR, T0 } from '../contracts/helpers';
import { strongKeep } from '../delves/helpers';

const at = (day: number, h: number, m = 0): number =>
  T0 - 7 * HOUR + day * DAY + h * HOUR + m * 60_000;

const sequence = (from: number, n: number, policy: 'standard' | 'delver' = 'delver'): number[] => {
  const out: number[] = [];
  for (let t = from; out.length < n;) out.push((t = nextCheckIn(policy, t, from - DAY)));
  return out;
};

const delveCommands = (cs: readonly Command[]) => cs.filter((c) => c.type.startsWith('delve.'));

describe('the Delver’s schedule (D269)', () => {
  it('is Standard plus 15:00 on weekends and 19:00 on Wednesdays', () => {
    // Monday 0 … Sunday 6. Wednesday is day 2, Saturday 5, Sunday 6.
    const week = sequence(at(0, 21), 40);
    const sessions = week.filter((t) => isDelveSession('delver', t));
    expect(sessions).toEqual([at(2, 19), at(5, 15), at(6, 15)]);
    // Everything else is exactly Standard's schedule.
    const standard = sequence(at(0, 21), 40, 'standard');
    const rest = week.filter((t) => !isDelveSession('delver', t));
    expect(rest).toEqual(standard.slice(0, rest.length));
    expect(week).toContain(at(5, 13));
    expect(week).toContain(at(5, 17));
  });

  it('Standard has no sessions at all', () => {
    for (const t of sequence(at(0, 21), 40, 'standard'))
      expect(isDelveSession('standard', t)).toBe(false);
  });
});

describe('what a session does (D270)', () => {
  it('runs up to 3 runs while the allowance lasts, never leaves a run, and buys no traits or cosmetics', () => {
    const s = strongKeep('delver-session');
    const rec = delveSession(s, s.time);
    expect(rec.results.length).toBe(3);
    expect(delveCommands(rec.commands).filter((c) => c.type === 'delve.start')).toHaveLength(3);
    expect(rec.commands.some((c) => c.type === 'delve.leave')).toBe(false);
    expect(rec.results.every((r) => r.outcome !== 'left')).toBe(true);
    expect(s.delve.run).toBeNull();
    expect(s.delve.result).toBeNull(); // each result was read
    expect(s.delve.shop.traitsBought).toEqual([]);
    expect(s.delve.shop.cosmetics).toEqual([]);
  });

  it('stops when the allowance is empty, and starts a run when at least 1 is left', () => {
    const empty = strongKeep('delver-empty');
    empty.delve.allowance = 0.9;
    expect(delveSession(empty, empty.time).results).toHaveLength(0);
    const little = strongKeep('delver-little');
    little.delve.allowance = 5;
    const rec = delveSession(little, little.time);
    // One run pays what the allowance has (5) and leaves it empty, so no second run.
    expect(rec.results).toHaveLength(1);
    expect(rec.results[0]?.riftglass).toBe(5);
    expect(little.delve.allowance).toBe(0);
  });

  it('does not start without three hunters free', () => {
    const s = strongKeep('delver-two');
    s.roster.active = ['halvar', 'zora'];
    expect(delveSession(s, s.time).commands).toEqual([]);
  });

  it('spends Riftglass on Chosen start and Re-roll first, then Late hours', () => {
    const s = strongKeep('delver-spend');
    s.delve.allowance = 0;
    s.delve.riftglass = 200;
    const rec = delveSession(s, s.time);
    const buys = rec.commands
      .filter((c) => c.type === 'riftglass.buy')
      .map((c) => (c as { item: string }).item);
    expect(buys.slice(0, 2)).toEqual(['chosen-start', 'reroll']);
    expect(buys.slice(2).every((i) => i === 'late-hours')).toBe(true);
    expect(s.delve.shop.chosenStart).toBe(true);
    expect(s.delve.shop.reroll).toBe(true);
    // 200 − 60 − 60 = 80: Late hours level 1 (30) and level 2 (45), then 5 left.
    expect(s.delve.shop.lateHours).toBe(2);
    expect(s.delve.riftglass).toBe(5);
  });

  it('with Chosen start it begins in the first patron of the tie order, then follows the patron it has taken most', () => {
    const s = strongKeep('delver-chosen');
    s.delve.allowance = 0;
    s.delve.riftglass = 60;
    const rec = delveSession(s, s.time);
    expect(rec.commands.find((c) => c.type === 'delve.chooseStart')).toBeUndefined(); // allowance empty: no run
    s.delve.allowance = 140;
    const second = delveSession(s, s.time);
    const start = second.commands.find((c) => c.type === 'delve.chooseStart');
    expect(start).toEqual({ type: 'delve.chooseStart', patron: 'hearth-crone' });
  });
});

describe('the door and blessing rules (D270)', () => {
  const run = (blessings: string[]): DelveRun => ({ blessings }) as DelveRun;
  const faint = (p: 'wolf' | 'weaver') =>
    blessingsOf(p)
      .filter((b) => b.rarity === 'faint')
      .map((b) => b.id);

  it('the door is the patron taken most this run; ties go Hearth-Crone, Pale Smith, Wolf, Weaver, Drowned Bell', () => {
    expect(favouredPatron(run([]), ['weaver', 'wolf'])).toBe('wolf');
    expect(favouredPatron(run([]), ['drowned-bell', 'hearth-crone'])).toBe('hearth-crone');
    expect(favouredPatron(run([]), ['weaver', 'pale-smith'])).toBe('pale-smith');
    expect(
      favouredPatron(run([...faint('weaver').slice(0, 2), ...faint('wolf').slice(0, 1)]), [
        'weaver',
        'wolf',
      ]),
    ).toBe('weaver');
    expect(
      favouredPatron(run([...faint('wolf').slice(0, 2), ...faint('weaver').slice(0, 1)]), [
        'weaver',
        'wolf',
      ]),
    ).toBe('wolf');
  });

  it('the blessing is the highest rarity, then the content list’s order', () => {
    const wolf = blessingsOf('wolf');
    const f = wolf.filter((b) => b.rarity === 'faint').map((b) => b.id);
    const w = wolf.filter((b) => b.rarity === 'warm').map((b) => b.id);
    const b = wolf.filter((b) => b.rarity === 'bright').map((b) => b.id);
    expect(bestBlessing([f[1] as string, f[0] as string])).toBe(f[0]);
    expect(bestBlessing([f[0] as string, w[1] as string, w[0] as string])).toBe(w[0]);
    expect(bestBlessing([w[0] as string, b[0] as string, f[0] as string])).toBe(b[0]);
  });
});

describe('the Delver in play (D269)', () => {
  const MON_7 = at(0, 7);
  const delvePlay = (policy: 'standard' | 'delver') => {
    const s = strongKeep(`play-${policy}`);
    s.time = MON_7;
    const log: CheckInRecord[] = [];
    play(s, {
      policy,
      startedAt: MON_7 - DAY,
      until: MON_7 + 3 * DAY,
      onCheckIn: (r) => log.push(r),
    });
    return { s, log };
  };

  it('Delves in its session (Wednesday 19:00) and never at an ordinary check-in', () => {
    const { s, log } = delvePlay('delver');
    const delving = log.filter((r) => (r.delveResults?.length ?? 0) > 0);
    expect(delving.map((r) => r.at)).toEqual([at(2, 19)]);
    expect(s.delve.runs).toBeGreaterThanOrEqual(1);
    for (const r of log.filter((x) => x.at !== at(2, 19)))
      expect(delveCommands(r.commands)).toEqual([]);
    const session = log.find((r) => r.at === at(2, 19));
    expect(session?.purchases).toBe(0);
  });

  it('Standard never Delves', () => {
    const { s, log } = delvePlay('standard');
    expect(s.delve.runs).toBe(0);
    expect(log.every((r) => delveCommands(r.commands).length === 0)).toBe(true);
  });
}, 60_000);
