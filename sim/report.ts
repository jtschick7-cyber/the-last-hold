import { RESOURCE_IDS } from '../src/content/resources';
import { RULES_VERSION } from '../src/core/rules-version';
import type { CheckResult } from './checks';
import { hoursText, medianMoment } from './checks/helpers';
import { MOMENTS, type Moment, type RunResult } from './run';

// Technical design §13.2: the JSON report (times to every moment, income by
// source, check-in activity, peaks), a readable Markdown summary, and the
// diff against the accepted baseline.

export interface Baseline {
  readonly milestone: string;
  readonly rulesVersion: number;
  /** Median hours per moment, keyed "policy/start" (null: never reached). */
  readonly groups: Record<string, Record<Moment, number | null>>;
  readonly checks: Record<string, boolean | null>;
}

export interface Report {
  readonly name: string;
  readonly milestone: string;
  readonly rulesVersion: number;
  readonly fast: boolean;
  readonly seconds: number;
  readonly baseline: Baseline;
  readonly checks: readonly CheckResult[];
  readonly runs: readonly RunResult[];
}

const groupKey = (r: RunResult): string => `${r.spec.policy}/${r.spec.start}`;

const finite = (h: number): number | null => (Number.isFinite(h) ? h : null);

export const summarize = (
  milestone: string,
  runs: readonly RunResult[],
  checks: readonly CheckResult[],
): Baseline => {
  const keys = [...new Set(runs.map(groupKey))];
  const groups = Object.fromEntries(
    keys.map((k) => {
      const rs = runs.filter((r) => groupKey(r) === k);
      return [k, Object.fromEntries(MOMENTS.map((m) => [m, finite(medianMoment(rs, m))]))];
    }),
  ) as Baseline['groups'];
  return {
    milestone,
    rulesVersion: RULES_VERSION,
    groups,
    checks: Object.fromEntries(checks.map((c) => [c.id, c.pass])),
  };
};

const cell = (h: number | null | undefined): string =>
  h === undefined ? '–' : hoursText(h ?? Number.POSITIVE_INFINITY);

const delta = (now: number | null, was: number | null | undefined): string => {
  if (was === undefined) return 'new';
  if (now === was) return 'same';
  if (now === null || was === null) return 'changed';
  const d = now - was;
  return `${d > 0 ? '+' : '−'}${hoursText(Math.abs(d))}`;
};

const verdict = (pass: boolean | null): string =>
  pass === null ? '– not judged' : pass ? '✓ pass' : '✗ FAIL';

export const markdown = (report: Report, previous: Baseline | null): string => {
  const out: string[] = [
    `# Simulator report: ${report.name}`,
    '',
    `Milestone ${report.milestone} · rulesVersion ${report.rulesVersion} · ` +
      `${report.fast ? 'fast set' : 'full suite'} · ${report.runs.length} runs in ` +
      `${report.seconds.toFixed(1)} s`,
    '',
    '## Checks',
    '',
  ];
  for (const c of report.checks) {
    out.push(`- **${verdict(c.pass)}** ${c.id}: ${c.text}`);
    for (const line of c.lines) out.push(`  - ${line}`);
  }
  out.push('', '## Times to each moment (median over seeds)', '');
  out.push(`| Run | ${MOMENTS.join(' | ')} |`, `|---|${MOMENTS.map(() => '---').join('|')}|`);
  for (const [k, ms] of Object.entries(report.baseline.groups)) {
    out.push(`| ${k} | ${MOMENTS.map((m) => cell(ms[m])).join(' | ')} |`);
  }
  out.push('', '## Income and peaks (first seed of each run)', '');
  out.push(
    `| Run | ${RESOURCE_IDS.map((r) => `${r} made`).join(' | ')} | peak peasants | largest number |`,
    `|---|${RESOURCE_IDS.map(() => '---').join('|')}|---|---|`,
  );
  const seen = new Set<string>();
  for (const r of report.runs) {
    if (seen.has(groupKey(r))) continue;
    seen.add(groupKey(r));
    out.push(
      `| ${groupKey(r)} | ${RESOURCE_IDS.map((x) => r.income[x].toExponential(2)).join(' | ')} | ` +
        `${r.peaks.peasants} | ${r.largestNumber.toExponential(2)} |`,
    );
  }
  out.push('', '## Against the baseline', '');
  if (!previous) {
    out.push('No baseline yet: `npm run sim:accept` records one at milestone end.');
  } else {
    out.push(
      `Baseline: milestone ${previous.milestone}, rulesVersion ${previous.rulesVersion}.`,
      '',
    );
    out.push('| Run | Moment | Baseline | Now | Change |', '|---|---|---|---|---|');
    for (const [k, ms] of Object.entries(report.baseline.groups)) {
      for (const m of MOMENTS) {
        const was = previous.groups[k]?.[m];
        out.push(`| ${k} | ${m} | ${cell(was)} | ${cell(ms[m])} | ${delta(ms[m], was)} |`);
      }
    }
    for (const c of report.checks) {
      const was = previous.checks[c.id];
      if (was !== undefined && was !== c.pass) {
        out.push('', `- ${c.id}: ${verdict(was)} → ${verdict(c.pass)}`);
      }
    }
  }
  return `${out.join('\n')}\n`;
};
