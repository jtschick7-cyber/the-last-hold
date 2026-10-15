import { ALL_CONTENT, FIRST_GUARDIAN_BY_CYCLE, STORY, TIME_TARGETS } from '../targets';
import type { RunResult } from '../run';
import { groups, hoursText, median, stoppedBefore } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §6.2 (v0.7, D271, D272): the first guardian and the Idle-only row. Judged on the median over
// the Monday seeds, like the story rows; Saturday is reported only (D62), and the Delver runs the
// Monday seeds only (D272). They read the runs the suite already plays.

const target = (id: string) => {
  const t = TIME_TARGETS.find((x) => x.id === id);
  if (!t) throw new Error(`targets.ts has no "${id}" row`);
  return t;
};

const INFINITE = Number.POSITIVE_INFINITY;

/** The cycle the Delver beat its first guardian in, or never. */
export const firstGuardianCycle = (run: RunResult): number =>
  run.delve.runs.find((r) => r.guardianBeaten)?.cycle ?? INFINITE;

export const firstGuardianCheck: Check = {
  id: 'first-guardian',
  enforcedFrom: target('first-guardian').enforcedFrom,
  judge: (runs): CheckResult => {
    const t = target('first-guardian');
    if (stoppedBefore(runs))
      return { id: t.id, text: t.text, pass: null, lines: ['not in the fast set'] };
    const rs = groups(runs, 'delver').get('mon') ?? [];
    if (rs.length === 0)
      return { id: t.id, text: t.text, pass: false, lines: ['the Delver was not run'] };
    const cycle = median(rs.map(firstGuardianCycle));
    const ok = cycle <= FIRST_GUARDIAN_BY_CYCLE;
    const shown = Number.isFinite(cycle) ? `cycle ${cycle}` : 'never';
    return {
      id: t.id,
      text: t.text,
      pass: ok,
      lines: [
        `delver (mon, median of ${rs.length}): first guardian beaten in ${shown} ${ok ? '✓' : '✗'}`,
      ],
    };
  },
};

/** The parts of "all content" and the hour each was reached (never reached counts as infinitely late). */
export const contentParts = (
  run: RunResult,
): { readonly label: string; readonly hours: number }[] => {
  const doc = (id: string): number =>
    run.story.documents.find((d) => d.id === id)?.hours ?? INFINITE;
  const name = (n: number): number => run.story.names.find((x) => x.n === n)?.hours ?? INFINITE;
  return [
    ...ALL_CONTENT.documents.map((id) => ({ label: id, hours: doc(id) })),
    { label: 'the recipe book', hours: run.content.book36Hours ?? INFINITE },
    { label: 'the six names', hours: Math.max(...STORY.ribbonNames.map(name)) },
    { label: 'skills at level 4', hours: run.content.skills4Hours ?? INFINITE },
    // v0.8 (D322): the five name letters and every hunter at Wright.
    ...ALL_CONTENT.letters.map((l) => ({
      label: `${l.hunter}'s letter ${l.slot + 1}`,
      hours:
        run.story.letters.find((x) => x.hunter === l.hunter && x.slot === l.slot)?.hours ??
        INFINITE,
    })),
    { label: 'every hunter at Wright', hours: run.content.wrightsHours ?? INFINITE },
  ];
};

/** When the last part of "all content" was reached, and which part it was. */
export const allContent = (run: RunResult): { readonly hours: number; readonly last: string } => {
  const parts = contentParts(run);
  const last = parts.reduce((a, b) => (b.hours > a.hours ? b : a));
  return { hours: last.hours, last: last.label };
};

export const idleOnlyCheck: Check = {
  id: 'idle-only',
  enforcedFrom: target('idle-only').enforcedFrom,
  judge: (runs): CheckResult => {
    const t = target('idle-only');
    if (stoppedBefore(runs))
      return { id: t.id, text: t.text, pass: null, lines: ['not in the fast set'] };
    const standard = groups(runs, 'standard').get('mon') ?? [];
    const delver = groups(runs, 'delver').get('mon') ?? [];
    if (standard.length === 0 || delver.length === 0)
      return {
        id: t.id,
        text: t.text,
        pass: false,
        lines: ['needs the Monday Standard and Delver runs'],
      };
    const s = median(standard.map((r) => allContent(r).hours));
    const d = median(delver.map((r) => allContent(r).hours));
    const lastOf = (rs: readonly RunResult[]): string =>
      [...new Set(rs.map((r) => allContent(r).last))].join(', ');
    const ratio = s / d;
    const ok = Number.isFinite(s) && Number.isFinite(d) && ratio <= ALL_CONTENT.maxRatio;
    return {
      id: t.id,
      text: t.text,
      pass: ok,
      lines: [
        `standard (mon, median of ${standard.length}): all content at ${hoursText(s)} (last: ${lastOf(standard)})`,
        `delver (mon, median of ${delver.length}): all content at ${hoursText(d)} (last: ${lastOf(delver)})`,
        `Standard takes ${Number.isFinite(ratio) ? ratio.toFixed(3) : 'unbounded'}× the Delver's time (limit ${ALL_CONTENT.maxRatio}×) ${ok ? '✓' : '✗'}`,
      ],
    };
  },
};
