import { TIME_TARGETS, V06 } from '../targets';
import type { RunResult } from '../run';
import { groups, hoursText, median, stoppedBefore } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §6.2 (v0.6, D216): alchemy discovery, warden skills and the trust arc. Judged on the
// median over the Monday Standard seeds, like the story rows; Saturday is reported only (D62).
// They read the existing runs, so the suite stays as long as it was (D196).

const target = (id: string) => {
  const t = TIME_TARGETS.find((x) => x.id === id);
  if (!t) throw new Error(`targets.ts has no "${id}" row`);
  return t;
};

/** What the run recorded as cycle `n` ended (the last entry is the end of the run), or null. */
const atCycle = (run: RunResult, n: number) => run.discovery.cycles.find((c) => c.cycle === n);

/** A median row: judges Monday, reports Saturday, and says "not in the fast set" without a full run. */
const medianCheck = (
  id: string,
  measure: (rs: readonly RunResult[]) => { ok: boolean; text: string },
): Check => {
  const t = target(id);
  return {
    id,
    enforcedFrom: t.enforcedFrom,
    judge: (runs): CheckResult => {
      if (stoppedBefore(runs))
        return { id, text: t.text, pass: null, lines: ['not in the fast set'] };
      const lines: string[] = [];
      let pass: boolean | null = null;
      for (const [start, rs] of groups(runs, 'standard')) {
        const { ok, text } = measure(rs);
        if (start !== 'mon') {
          lines.push(`standard (${start}, reported only): ${text}`);
          continue;
        }
        pass = (pass ?? true) && ok;
        lines.push(`standard (mon, median of ${rs.length}): ${text} ${ok ? '✓' : '✗'}`);
      }
      return { id, text: t.text, pass, lines };
    },
  };
};

const SKILLS = ['alchemy', 'smithing', 'lore', 'command'] as const;
const skillMedians = (rs: readonly RunResult[], cycle: number): Record<string, number> =>
  Object.fromEntries(
    SKILLS.map((k) => [
      k,
      median(rs.map((r) => atCycle(r, cycle)?.skills[k] ?? Number.NEGATIVE_INFINITY)),
    ]),
  );
const skillsText = (m: Record<string, number>): string =>
  SKILLS.map((k) => `${k} ${Number.isFinite(m[k]) ? m[k] : 'not reached'}`).join(', ');

export const firstNewBrewCheck = medianCheck('first-new-brew', (rs) => {
  const h = median(
    rs.map((r) =>
      r.discovery.firstNewBrewHours === null || r.discovery.hutHours === null
        ? Number.POSITIVE_INFINITY
        : r.discovery.firstNewBrewHours - r.discovery.hutHours,
    ),
  );
  return { ok: h <= V06.newBrewHours, text: `${hoursText(h)} after the Hut` };
});

export const recipeBookCheck = medianCheck('recipe-book', (rs) => {
  const n = median(rs.map((r) => atCycle(r, V06.bookByCycle)?.properties ?? 0));
  return { ok: n >= 36, text: `${n} of 36 properties by the end of cycle ${V06.bookByCycle}` };
});

export const skillsStartCheck = medianCheck('skills-start', (rs) => {
  const m = skillMedians(rs, V06.skillsStartByCycle);
  return {
    ok: SKILLS.every((k) => (m[k] ?? 0) >= 1),
    text: `end of cycle ${V06.skillsStartByCycle}: ${skillsText(m)}`,
  };
});

export const skillsPaceCheck = medianCheck('skills-pace', (rs) => {
  const { cycle, min, max } = V06.skillsPace;
  const m = skillMedians(rs, cycle);
  return {
    ok: SKILLS.every((k) => (m[k] ?? 0) >= min && (m[k] ?? 0) <= max),
    text: `end of cycle ${cycle}: ${skillsText(m)} (want ${min}–${max})`,
  };
});

export const arvidLetterCheck = medianCheck('arvid-letter', (rs) => {
  const cycle = median(
    rs.map(
      (r) =>
        r.story.letters.find((l) => l.hunter === 'arvid' && l.slot === 0)?.cycle ??
        Number.POSITIVE_INFINITY,
    ),
  );
  const shown = Number.isFinite(cycle) ? `cycle ${cycle}` : 'never';
  return { ok: cycle <= V06.arvidLetterByCycle, text: `found in ${shown}` };
});

export const trustArcCheck = medianCheck('trust-arc', (rs) => {
  const cycle = V06.noSwornBeforeCycle - 1;
  const sworn = median(
    rs.map(
      (r) =>
        Object.values(r.story.trust.find((t) => t.cycle === cycle)?.levels ?? {}).filter(
          (l) => l === 'sworn',
        ).length,
    ),
  );
  return { ok: sworn === 0, text: `${sworn} villages Sworn at the end of cycle ${cycle}` };
});
