// Plan T9.12 (GDD §6.1, D367): the Eventer plays the events; nobody else does.
import { describe, expect, it } from 'vitest';
import { play, type PolicyId } from '../src/core/policies';
import { createNewGame } from '../src/core/state/new-game';
import { eventLines } from './report';
import { runOne, STARTS } from './run';

const DAY = 24 * 3_600_000;

describe('the Eventer run', () => {
  it('plays a 3-cycle run in 60 s or less and fills its events record', () => {
    const began = performance.now();
    const r = runOne({
      policy: 'eventer',
      seed: 'sim-1',
      start: 'mon',
      days: 7,
      minCycles: 3,
      maxDays: 42,
    });
    expect((performance.now() - began) / 1000).toBeLessThanOrEqual(60);
    expect(r.cyclesDone).toBeGreaterThanOrEqual(3);
    const e = r.events;
    expect(e).toBeDefined();
    if (!e) return;
    expect(e.openedHours).not.toBeNull();
    expect(e.checkIns).toBeGreaterThan(0);
    expect(e.tokensSpent).toBe(e.attempts.length);
    expect(e.attempts.length).toBeGreaterThan(0);
    for (const a of e.attempts) {
      expect(a.party).toHaveLength(4);
      expect(a.hours).toBeGreaterThanOrEqual(e.openedHours ?? 0);
    }
    expect(e.firstBossAttemptHours).toBe(e.attempts.find((a) => a.kind === 'boss')?.hours ?? null);
  }, 90_000);

  it('is the same run twice', () => {
    const spec = { policy: 'eventer', seed: 'sim-2', start: 'mon', days: 3 } as const;
    expect(runOne(spec)).toEqual(runOne(spec));
  }, 90_000);
});

describe('everyone else issues no event commands', () => {
  for (const policy of ['standard', 'light', 'heavy', 'delver'] as PolicyId[]) {
    it(
      policy,
      () => {
        const start = STARTS.mon;
        const s = createNewGame('sim-1', start);
        const seen: string[] = [];
        play(s, {
          policy: policy === 'standard' ? 'opening' : policy,
          startedAt: start,
          until: start + 3 * DAY,
          onCheckIn: (rec) => {
            for (const c of rec.commands)
              if (c.type === 'boss.attempt' || c.type === 'hunt.attempt') seen.push(c.type);
            expect(rec.events).toBeUndefined();
          },
        });
        expect(seen).toEqual([]);
        expect(s.events.attempts).toBe(0);
      },
      30_000,
    );
  }
});

describe('the events report', () => {
  it('is written for the Eventer only', () => {
    const r = runOne({ policy: 'eventer', seed: 'sim-1', start: 'mon', days: 3 });
    const lines = eventLines([r]);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^- eventer mon sim-1: opened .*tokens spent.*full bank.*blocked/);
    expect(eventLines([{ ...r, spec: { ...r.spec, policy: 'standard' as const } }])).toEqual([]);
  }, 60_000);
});
