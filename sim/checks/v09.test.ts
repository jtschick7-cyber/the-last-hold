// GDD §6.2 v0.9 (D383): how the Act VI and Dross-Tide stand rows judge made-up runs.
import { describe, expect, it } from 'vitest';
import type { RunResult } from '../run';
import { STORY } from '../targets';
import { act6Check } from './story-acts';
import {
  drossProbeCheck,
  firstBossAttemptCheck,
  firstBossKillCheck,
  firstHunterUnlockCheck,
  silverWithBossCheck,
  tokensNotWastedCheck,
} from './v09';

const standard = (over: object, seed = 'a', start: 'mon' | 'sat' = 'mon'): RunResult =>
  ({ spec: { policy: 'standard', seed, start, days: 14 }, ...over }) as unknown as RunResult;
const docs = (ids: readonly string[], cycle: number) => ids.map((id) => ({ id, cycle, hours: 1 }));

describe('Act VI (D383)', () => {
  const story = (acts: number, warden: number) => ({
    documents: [...docs(STORY.act6.docs, acts), ...docs([STORY.act6.nextWarden.doc], warden)],
    names: [],
    letters: [],
  });

  it('wants D6-01 to D6-06 by cycle 6 and D6-07 by cycle 7', () => {
    expect(act6Check.judge([standard({ story: story(6, 7) })]).pass).toBe(true);
    expect(act6Check.judge([standard({ story: story(7, 7) })]).pass).toBe(false);
    expect(act6Check.judge([standard({ story: story(6, 8) })]).pass).toBe(false);
  });

  it('reports D6-08 to D6-10 without judging them', () => {
    const r = act6Check.judge([standard({ story: story(6, 7) })]);
    expect(r.pass).toBe(true);
    expect(r.lines.join('\n')).toContain('D6-08 never');
  });
});

describe('the Dross-Tide stand probe (D383)', () => {
  const stand = (waves: number, p10 = 8, p90 = 16) => ({ cycle: 7, waves, median: 12, p10, p90 });
  const run = (stands: object[], seed = 'a', start: 'mon' | 'sat' = 'mon') =>
    standard({ drossStands: stands }, seed, start);

  it('passes when the median stand is Held and the preview agrees', () => {
    expect(drossProbeCheck.judge([run([stand(13), stand(12), stand(14)])]).pass).toBe(true);
  });

  it('fails below the Held band, or when the preview misses', () => {
    expect(drossProbeCheck.judge([run([stand(9), stand(10)])]).pass).toBe(false);
    expect(drossProbeCheck.judge([run([stand(14, 3, 5), stand(15, 3, 5)])]).pass).toBe(false);
  });

  it('fails when there is no Dross-Tide stand at all, and reports a Saturday run only', () => {
    expect(drossProbeCheck.judge([run([])]).pass).toBe(false);
    const sat = run([stand(2, 8, 16)], 'b', 'sat');
    expect(drossProbeCheck.judge([run([stand(13)]), sat]).pass).toBe(true);
  });
});

describe("the Eventer's event rows (D404)", () => {
  const eventer = (events: object, keep = { bountySilver: 80, jobSilver: 20 }, seed = 'a') =>
    ({
      spec: { policy: 'eventer', seed, start: 'mon', days: 42 },
      events: {
        openedHours: 48,
        openedCycle: 1,
        checkIns: 100,
        fullBank: 30,
        firstBossAttemptHours: 57,
        firstBossKill: { hours: 300, cycle: 5 },
        unlocks: [{ hunt: 'mara', hours: 280, cycle: 5 }],
        attempts: [],
        ...events,
      },
      keepPhase: { ...keep, byCycle: [{ cycle: 1, ...keep }] },
    }) as unknown as RunResult;

  it('judges the first attempt within 24 h of events opening', () => {
    expect(firstBossAttemptCheck.judge([eventer({})]).pass).toBe(true);
    expect(firstBossAttemptCheck.judge([eventer({ firstBossAttemptHours: 80 })]).pass).toBe(false);
    expect(firstBossAttemptCheck.judge([eventer({ firstBossAttemptHours: null })]).pass).toBe(
      false,
    );
  });

  it('judges the first kill by cycle 7 and the first unlock by cycle 6, counted from the opening cycle', () => {
    expect(
      firstBossKillCheck.judge([eventer({ firstBossKill: { hours: 1, cycle: 7 } })]).pass,
    ).toBe(true);
    expect(
      firstBossKillCheck.judge([eventer({ firstBossKill: { hours: 1, cycle: 8 } })]).pass,
    ).toBe(false);
    expect(firstBossKillCheck.judge([eventer({ firstBossKill: null })]).pass).toBe(false);
    // Events opened in cycle 2: cycle 8 is the 7th cycle.
    expect(
      firstBossKillCheck.judge([eventer({ openedCycle: 2, firstBossKill: { hours: 1, cycle: 8 } })])
        .pass,
    ).toBe(true);
    expect(
      firstHunterUnlockCheck.judge([eventer({ unlocks: [{ hunt: 'a', hours: 1, cycle: 6 }] })])
        .pass,
    ).toBe(true);
    expect(
      firstHunterUnlockCheck.judge([eventer({ unlocks: [{ hunt: 'a', hours: 1, cycle: 7 }] })])
        .pass,
    ).toBe(false);
    expect(firstHunterUnlockCheck.judge([eventer({ unlocks: [] })]).pass).toBe(false);
  });

  it('judges a full bank at no more than 35% of unlocked check-ins', () => {
    expect(tokensNotWastedCheck.judge([eventer({ fullBank: 35 })]).pass).toBe(true);
    expect(tokensNotWastedCheck.judge([eventer({ fullBank: 36 })]).pass).toBe(false);
  });

  it('counts boss silver in the total only', () => {
    expect(silverWithBossCheck.judge([eventer({})]).pass).toBe(true); // 80 of 100
    const boss = [{ cycle: 1, silver: 40, kind: 'boss' }];
    expect(silverWithBossCheck.judge([eventer({ attempts: boss })]).pass).toBe(false); // 80 of 140
  });

  it('uses the median over seeds', () => {
    const rs = [3, 9, 9].map((c, i) =>
      eventer({ firstBossKill: { hours: 1, cycle: c } }, undefined, `s${i}`),
    );
    expect(firstBossKillCheck.judge(rs).pass).toBe(false);
    const ok = [3, 4, 20].map((c, i) =>
      eventer({ firstBossKill: { hours: 1, cycle: c } }, undefined, `s${i}`),
    );
    expect(firstBossKillCheck.judge(ok).pass).toBe(true);
  });
});
