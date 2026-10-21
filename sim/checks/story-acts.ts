import { STORY, TIME_TARGETS } from '../targets';
import type { RunResult } from '../run';
import { groups, median, stoppedBefore } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §6.2 "Act I / Act II land in their cycle" (v0.5, D168): each document is judged on the
// median over the Monday Standard seeds of the cycle it was found in (never found counts as
// infinitely late). The documents are listed in sim/targets.ts (STORY); the ones that wait for
// a village's trust, a species' mastery or a recruit are reported, not judged. Saturday is
// reported only, as for every time target (D62).

interface ActRows {
  readonly byCycle: number;
  readonly docs: readonly string[];
  /** Documents that count across the act and are due a cycle or two later (Q17). */
  readonly later?: { readonly docs: readonly string[]; readonly byCycle: number };
  readonly nextWarden: { readonly doc: string; readonly byCycle: number };
  readonly reportedOnly: readonly string[];
}

const foundIn = (run: RunResult, id: string): number =>
  run.story.documents.find((d) => d.id === id)?.cycle ?? Number.POSITIVE_INFINITY;

const cycleText = (c: number): string => (Number.isFinite(c) ? `cycle ${c}` : 'never');

const actCheck = (
  id: 'act-1' | 'act-2' | 'act-3' | 'act-4' | 'act-5' | 'act-6',
  act: ActRows,
): Check => {
  const target = TIME_TARGETS.find((t) => t.id === id);
  if (!target) throw new Error(`targets.ts has no "${id}" row`);
  return {
    id,
    enforcedFrom: target.enforcedFrom,
    judge: (runs): CheckResult => {
      if (stoppedBefore(runs))
        return { id, text: target.text, pass: null, lines: ['not in the fast set'] };
      const lines: string[] = [];
      let pass: boolean | null = null;
      for (const [start, rs] of groups(runs, 'standard')) {
        const medianCycle = (doc: string): number => median(rs.map((r) => foundIn(r, doc)));
        const judged = [
          ...act.docs.map((doc) => ({ doc, by: act.byCycle })),
          ...(act.later?.docs ?? []).map((doc) => ({ doc, by: act.later?.byCycle ?? act.byCycle })),
          { doc: act.nextWarden.doc, by: act.nextWarden.byCycle },
        ];
        const rows = judged.map(({ doc, by }) => ({ doc, by, at: medianCycle(doc) }));
        const ok = rows.every((r) => r.at <= r.by);
        const text = rows
          .map((r) => `${r.doc} ${cycleText(r.at)}${r.at <= r.by ? '' : ` (due by ${r.by}) ✗`}`)
          .join(', ');
        const extra = act.reportedOnly.map((d) => `${d} ${cycleText(medianCycle(d))}`).join(', ');
        if (start !== 'mon') {
          lines.push(`standard (${start}, reported only): ${text}${extra ? `; ${extra}` : ''}`);
          continue;
        }
        pass = (pass ?? true) && ok;
        lines.push(`standard (mon, median of ${rs.length}): ${text} ${ok ? '✓' : '✗'}`);
        if (extra) lines.push(`reported only: ${extra}`);
      }
      return { id, text: target.text, pass, lines };
    },
  };
};

export const act1Check = actCheck('act-1', STORY.act1);
export const act2Check = actCheck('act-2', STORY.act2);
// v0.6 (D216): Act III, D3-01 to D3-06 by the end of cycle 3, D3-07 with the next warden.
export const act3Check = actCheck('act-3', STORY.act3);
// v0.7 (D271): Act IV, D4-01 to D4-06 and D4-08 by the end of cycle 4, D4-07 with the next warden.
export const act4Check = actCheck('act-4', STORY.act4);
// v0.8 (D322): Act V, D5-01 to D5-06 and D5-08 by the end of cycle 5, D5-07 with the next warden.
export const act5Check = actCheck('act-5', STORY.act5);
// v0.9 (D383): Act VI, D6-01 to D6-06 by the end of cycle 6, D6-07 with the next warden.
export const act6Check = actCheck('act-6', STORY.act6);
