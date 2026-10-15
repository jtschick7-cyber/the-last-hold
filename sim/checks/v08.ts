import { FIRST_WRIGHT_BY_CYCLE, STORY, TIME_TARGETS } from '../targets';
import type { RunResult } from '../run';
import { groups, median, stoppedBefore } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §6.2 (v0.8, D322): the late-letters and first-wright rows. Judged on the median over the
// Monday Standard seeds like the story rows; Saturday is reported only (D62). They read the runs the
// suite already plays. (The Act V row is `act5Check`, with the other acts.)

const target = (id: string) => {
  const t = TIME_TARGETS.find((x) => x.id === id);
  if (!t) throw new Error(`targets.ts has no "${id}" row`);
  return t;
};

const cycleText = (c: number): string => (Number.isFinite(c) ? `cycle ${c}` : 'never');

const letterCycle = (run: RunResult, hunter: string, slot: number): number =>
  run.story.letters.find((l) => l.hunter === hunter && l.slot === slot)?.cycle ??
  Number.POSITIVE_INFINITY;

/** All five name letters by the end of cycle 5, each on its own median. */
export const lateLettersCheck: Check = {
  id: 'late-letters',
  enforcedFrom: target('late-letters').enforcedFrom,
  judge: (runs): CheckResult => {
    const t = target('late-letters');
    if (stoppedBefore(runs))
      return { id: t.id, text: t.text, pass: null, lines: ['not in the fast set'] };
    const lines: string[] = [];
    let pass: boolean | null = null;
    for (const [start, rs] of groups(runs, 'standard')) {
      const rows = STORY.lateLetters.letters.map((l) => ({
        label: `${l.hunter} ${l.slot === 0 ? 'level 5' : 'level 8'}`,
        at: median(rs.map((r) => letterCycle(r, l.hunter, l.slot))),
      }));
      const ok = rows.every((r) => r.at <= STORY.lateLetters.byCycle);
      const text = rows
        .map(
          (r) =>
            `${r.label} ${cycleText(r.at)}${r.at <= STORY.lateLetters.byCycle ? '' : ` (due by ${STORY.lateLetters.byCycle}) ✗`}`,
        )
        .join(', ');
      if (start !== 'mon') {
        lines.push(`standard (${start}, reported only): ${text}`);
        continue;
      }
      pass = (pass ?? true) && ok;
      lines.push(`standard (mon, median of ${rs.length}): ${text} ${ok ? '✓' : '✗'}`);
    }
    return { id: t.id, text: t.text, pass, lines };
  },
};

/** The most Wrights any cycle-1 end shows: at least one by the end of cycle 1. */
const wrightsAtEndOfCycle1 = (run: RunResult): number =>
  run.depth.cycles.find((c) => c.cycle === 1)?.wrights ?? 0;

export const firstWrightCheck: Check = {
  id: 'first-wright',
  enforcedFrom: target('first-wright').enforcedFrom,
  judge: (runs): CheckResult => {
    const t = target('first-wright');
    if (stoppedBefore(runs))
      return { id: t.id, text: t.text, pass: null, lines: ['not in the fast set'] };
    const lines: string[] = [];
    let pass: boolean | null = null;
    for (const [start, rs] of groups(runs, 'standard')) {
      const n = median(rs.map(wrightsAtEndOfCycle1));
      const ok = n >= 1;
      const text = `${n} ${n === 1 ? 'Wright' : 'Wrights'} at the end of cycle ${FIRST_WRIGHT_BY_CYCLE}`;
      if (start !== 'mon') {
        lines.push(`standard (${start}, reported only): ${text}`);
        continue;
      }
      pass = (pass ?? true) && ok;
      lines.push(`standard (mon, median of ${rs.length}): ${text} ${ok ? '✓' : '✗'}`);
    }
    return { id: t.id, text: t.text, pass, lines };
  },
};
