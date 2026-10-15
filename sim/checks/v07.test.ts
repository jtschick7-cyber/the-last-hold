// GDD §6.2 v0.7 (D271): how the Act IV, first-guardian and Idle-only rows judge made-up runs.
import { describe, expect, it } from 'vitest';
import type { RunResult } from '../run';
import { ALL_CONTENT, STORY } from '../targets';
import { act4Check } from './story-acts';
import { allContent, firstGuardianCheck, idleOnlyCheck } from './v07';

const docs = (ids: readonly string[], cycle: number) => ids.map((id) => ({ id, cycle, hours: 1 }));
const guardianRun = (cycle: number | null, seed = 'a'): RunResult =>
  ({
    spec: { policy: 'delver', seed, start: 'mon', days: 14 },
    delve: {
      runs:
        cycle === null
          ? [{ cycle: 1, guardianBeaten: false }]
          : [
              { cycle: 1, guardianBeaten: false },
              { cycle, guardianBeaten: true },
            ],
    },
  }) as unknown as RunResult;

describe('Act IV (D271)', () => {
  it('wants D4-01 to D4-06 and D4-08 by cycle 4 and D4-07 by cycle 5', () => {
    const ok = {
      spec: { policy: 'standard', seed: 'a', start: 'mon', days: 14 },
      story: {
        documents: [...docs(STORY.act4.docs, 4), ...docs([STORY.act4.nextWarden.doc], 5)],
        names: [],
        letters: [],
      },
    } as unknown as RunResult;
    const r = act4Check.judge([ok]);
    expect(r.pass).toBe(true);
    expect(r.lines.join('\n')).toContain('D4-07 cycle 5');
    const late = {
      ...ok,
      story: {
        ...ok.story,
        documents: [
          ...docs(STORY.act4.docs.slice(1), 4),
          ...docs(['D4-01'], 5),
          ...docs(['D4-07'], 5),
        ],
      },
    } as unknown as RunResult;
    expect(act4Check.judge([late]).pass).toBe(false);
  });
});

describe('First guardian (D271)', () => {
  it('is beaten by the end of cycle 2, judged on the median of the Monday Delver runs', () => {
    expect(firstGuardianCheck.judge([1, 2, 2].map((c, i) => guardianRun(c, `s${i}`))).pass).toBe(
      true,
    );
    expect(firstGuardianCheck.judge([2, 3, 3].map((c, i) => guardianRun(c, `s${i}`))).pass).toBe(
      false,
    );
    expect(
      firstGuardianCheck.judge([null, null, 1].map((c, i) => guardianRun(c, `s${i}`))).pass,
    ).toBe(false);
  });

  it('fails when the Delver was not run', () => {
    expect(firstGuardianCheck.judge([]).pass).toBe(false);
  });
});

describe('Idle-only vs Delver (D271)', () => {
  /** A run that found every part of all content at `hours`, except one part found at `last`. */
  const made = (policy: 'standard' | 'delver', last: number | null, seed = 'a'): RunResult =>
    ({
      spec: { policy, seed, start: 'mon', days: 14 },
      story: {
        documents: ALL_CONTENT.documents.map((id) => ({ id, cycle: 1, hours: 100 })),
        names: STORY.ribbonNames.map((n) => ({ n, cycle: 1, hours: 100 })),
      },
      content: { book36Hours: last, skills4Hours: 100 },
    }) as unknown as RunResult;

  it('names the last part of all content, and counts a part never found as infinitely late', () => {
    expect(allContent(made('standard', 250))).toEqual({ hours: 250, last: 'the recipe book' });
    expect(allContent(made('standard', null)).hours).toBe(Number.POSITIVE_INFINITY);
  });

  it('passes when Standard is at most 1.3× the Delver’s time, on the medians', () => {
    const run = (s: number, d: number) => [
      ...[s, s, s].map((h, i) => made('standard', h, `s${i}`)),
      ...[d, d, d].map((h, i) => made('delver', h, `d${i}`)),
    ];
    expect(idleOnlyCheck.judge(run(130, 100)).pass).toBe(true);
    expect(idleOnlyCheck.judge(run(131, 100)).pass).toBe(false);
    expect(idleOnlyCheck.judge(run(80, 100)).pass).toBe(true);
  });

  it('fails when either player never finishes, or when a policy was not run', () => {
    expect(idleOnlyCheck.judge([made('standard', null), made('delver', 100)]).pass).toBe(false);
    expect(idleOnlyCheck.judge([made('standard', 100), made('delver', null)]).pass).toBe(false);
    expect(idleOnlyCheck.judge([made('standard', 100)]).pass).toBe(false);
  });
});
