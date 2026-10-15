// GDD §6.2 v0.8 (D322): how the Act V, late-letters and first-wright rows judge made-up runs, and the
// new "all content" of the Idle-only row (Act V's documents, the five name letters, every hunter at Wright).
import { describe, expect, it } from 'vitest';
import type { RunResult } from '../run';
import { ALL_CONTENT, STORY } from '../targets';
import { act5Check } from './story-acts';
import { allContent, idleOnlyCheck } from './v07';
import { firstWrightCheck, lateLettersCheck } from './v08';

const standard = (over: object, seed = 'a', start: 'mon' | 'sat' = 'mon'): RunResult =>
  ({ spec: { policy: 'standard', seed, start, days: 14 }, ...over }) as unknown as RunResult;
const docs = (ids: readonly string[], cycle: number) => ids.map((id) => ({ id, cycle, hours: 1 }));
const letters = (cycle: number, skip: number | null = null) =>
  STORY.lateLetters.letters.filter((_, i) => i !== skip).map((l) => ({ ...l, cycle, hours: 1 }));

describe('Act V (D322)', () => {
  const story = (acts: number, warden: number) => ({
    documents: [...docs(STORY.act5.docs, acts), ...docs([STORY.act5.nextWarden.doc], warden)],
    names: [],
    letters: [],
  });

  it('wants D5-01 to D5-06 and D5-08 by cycle 5 and D5-07 by cycle 6', () => {
    const ok = act5Check.judge([standard({ story: story(5, 6) })]);
    expect(ok.pass).toBe(true);
    expect(ok.lines.join('\n')).toContain('D5-07 cycle 6');
    expect(act5Check.judge([standard({ story: story(6, 6) })]).pass).toBe(false);
    expect(act5Check.judge([standard({ story: story(5, 7) })]).pass).toBe(false);
  });

  it('counts a document never found as infinitely late, and judges only the Monday seeds', () => {
    const missing = {
      documents: docs(STORY.act5.docs.slice(1), 5),
      names: [],
      letters: [],
    };
    expect(act5Check.judge([standard({ story: missing })]).pass).toBe(false);
    // A late Saturday run is only reported.
    const sat = standard({ story: story(9, 9) }, 'a', 'sat');
    expect(act5Check.judge([standard({ story: story(5, 6) }), sat]).pass).toBe(true);
  });
});

describe('late recruits catch up (D322)', () => {
  const run = (cycle: number, skip: number | null = null, seed = 'a') =>
    standard({ story: { documents: [], names: [], letters: letters(cycle, skip) } }, seed);

  it('wants all five name letters by the end of cycle 5, on the medians', () => {
    expect(lateLettersCheck.judge([run(5), run(4, null, 'b'), run(3, null, 'c')]).pass).toBe(true);
    expect(lateLettersCheck.judge([run(6), run(6, null, 'b'), run(3, null, 'c')]).pass).toBe(false);
    // One seed late does not matter; the median decides.
    expect(lateLettersCheck.judge([run(9), run(4, null, 'b'), run(3, null, 'c')]).pass).toBe(true);
  });

  it('fails when one letter never arrives, and names it', () => {
    const r = lateLettersCheck.judge([1, 2, 3].map((n) => run(n, 4, `s${n}`))); // Arvid's never found
    expect(r.pass).toBe(false);
    expect(r.lines.join('\n')).toContain('arvid level 5 never');
  });
});

describe('first Wright (D322)', () => {
  const wrights = (n: number, seed = 'a') =>
    standard(
      {
        depth: {
          cycles: [
            { cycle: 1, stars: 0, wrights: n, items: {} },
            { cycle: 2, stars: 0, wrights: 9, items: {} },
          ],
          legendaries: [],
          delveXp: 0,
        },
      },
      seed,
    );

  it('wants a Wright at the end of cycle 1, on the median of the Monday seeds', () => {
    expect(firstWrightCheck.judge([wrights(1), wrights(2, 'b'), wrights(0, 'c')]).pass).toBe(true);
    expect(firstWrightCheck.judge([wrights(0), wrights(0, 'b'), wrights(3, 'c')]).pass).toBe(false);
  });

  it('reads the end of cycle 1, not a later cycle', () => {
    expect(firstWrightCheck.judge([wrights(0)]).pass).toBe(false); // cycle 2 has 9, cycle 1 none
  });
});

describe('all content, v0.8 (D322)', () => {
  const made = (over: { wright?: number | null; skipLetter?: number | null; skipDoc?: string }) =>
    standard({
      story: {
        documents: ALL_CONTENT.documents
          .filter((d) => d !== over.skipDoc)
          .map((id) => ({ id, cycle: 1, hours: 100 })),
        names: STORY.ribbonNames.map((n) => ({ n, cycle: 1, hours: 100 })),
        letters: ALL_CONTENT.letters
          .filter((_, i) => i !== (over.skipLetter ?? -1))
          .map((l) => ({ ...l, cycle: 1, hours: 100 })),
      },
      content: {
        book36Hours: 100,
        skills4Hours: 100,
        wrightsHours: over.wright === undefined ? 100 : over.wright,
      },
    });

  it('includes Act V’s documents, the five letters and every hunter at Wright', () => {
    expect(ALL_CONTENT.documents).toEqual(
      expect.arrayContaining(['D5-01', 'D5-06', 'D5-07', 'D5-08']),
    );
    expect(ALL_CONTENT.letters).toHaveLength(5);
    expect(allContent(made({ wright: 300 }))).toEqual({
      hours: 300,
      last: 'every hunter at Wright',
    });
    expect(allContent(made({ skipLetter: 2 })).hours).toBe(Number.POSITIVE_INFINITY);
    expect(allContent(made({ skipLetter: 2 })).last).toBe("toma's letter 1");
    expect(allContent(made({ skipDoc: 'D5-08' })).last).toBe('D5-08');
    expect(allContent(made({ wright: null })).hours).toBe(Number.POSITIVE_INFINITY);
  });

  it('the Idle-only row never passes while a hunter never reaches Wright', () => {
    const delver = {
      ...made({}),
      spec: { policy: 'delver', seed: 'a', start: 'mon', days: 14 },
    } as unknown as RunResult;
    expect(idleOnlyCheck.judge([made({}), delver]).pass).toBe(true);
    expect(idleOnlyCheck.judge([made({ wright: null }), delver]).pass).toBe(false);
  });
});
