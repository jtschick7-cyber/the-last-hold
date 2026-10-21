import { RESOURCE_IDS } from '../src/content/resources';
import { RULES_VERSION } from '../src/core/rules-version';
import type { CheckResult } from './checks';
import { hoursText, medianMoment } from './checks/helpers';
import { allContent } from './checks/v07';
import { bandLabels, type Band } from '../src/content/story/scenes';
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

const verdict = (pass: boolean | null, pending?: string): string =>
  pass === null ? '– not judged' : pass ? '✓ pass' : pending ? `✗ pending ${pending}` : '✗ FAIL';

/** Reported, not judged (GDD §6.2 v0.5): each Standard run's bands, letters, names, documents and trust. */
export const storyLines = (runs: readonly RunResult[]): string[] =>
  runs
    .filter((r) => r.spec.policy === 'standard')
    .map((r) => {
      const s = r.story;
      const bands = s.bands
        .map((b) => `cycle ${b.cycle} ${bandLabels[b.band as Band]} (${b.waves} waves)`)
        .join(', ');
      const last = s.trust[s.trust.length - 1];
      const trust = last
        ? Object.entries(last.levels)
            .map(([v, l]) => `${v} ${l}`)
            .join(', ')
        : 'none';
      return (
        `- ${r.spec.policy} ${r.spec.start} ${r.spec.seed}: ${bands || 'no stand'}; ` +
        `${s.letters.length} letters, ${s.names.length} of 40 names, ${s.documents.length} documents; ` +
        `trust at the end: ${trust}`
      );
    });

/** Reported, not judged (GDD §6.2 v0.6): properties found and skill levels as each cycle ended. */
export const discoveryLines = (runs: readonly RunResult[]): string[] =>
  runs
    .filter((r) => r.spec.policy === 'standard')
    .map((r) => {
      const d = r.discovery;
      const cycles = d.cycles
        .map(
          (c) =>
            `cycle ${c.cycle}: ${c.properties}/36 properties, skills ` +
            Object.values(c.skills).join('/'),
        )
        .join('; ');
      const brew =
        d.hutHours === null || d.firstNewBrewHours === null
          ? 'no new brew discovered'
          : `first new brew ${hoursText(d.firstNewBrewHours - d.hutHours)} after the Hut`;
      return `- ${r.spec.policy} ${r.spec.start} ${r.spec.seed}: ${brew}; ${cycles}`;
    });

/**
 * Reported, not judged (GDD §6.2 v0.7, D271): when each Standard and Delver run reached the last of
 * "all content", and which part was last. The Idle-only row judges the medians of these.
 */
export const contentLines = (runs: readonly RunResult[]): string[] =>
  runs
    .filter((r) => r.spec.policy === 'standard' || r.spec.policy === 'delver')
    .map((r) => {
      const c = allContent(r);
      return `- ${r.spec.policy} ${r.spec.start} ${r.spec.seed}: all content at ${hoursText(c.hours)} (last: ${c.last})`;
    });

/**
 * Reported, not judged (GDD §6.2 v0.8, plan T8.16): stars and Wrights as each cycle ended, items by
 * rarity per cycle (Fine/Rare/Heroic), the Legendaries found (and in which cycle), and the Delver's
 * Delve XP (what each of the three earned across its runs).
 */
export const depthLines = (runs: readonly RunResult[]): string[] =>
  runs
    .filter((r) => r.spec.policy === 'standard' || r.spec.policy === 'delver')
    .map((r) => {
      const d = r.depth;
      const cycles = d.cycles
        .map(
          (c) =>
            `cycle ${c.cycle}: ${c.stars} stars, ${c.wrights} Wrights, items ${c.items.fine}/${c.items.rare}/${c.items.heroic}`,
        )
        .join('; ');
      const legends = d.legendaries.map((l) => `${l.id} (cycle ${l.cycle})`).join(', ') || 'none';
      return (
        `- ${r.spec.policy} ${r.spec.start} ${r.spec.seed}: ${cycles}; ` +
        `Legendaries: ${legends}${r.spec.policy === 'delver' ? `; Delve XP ${d.delveXp}` : ''}`
      );
    });

const WEEK_HOURS = 24 * 7;

/**
 * Reported, not judged (GDD §6.1 v0.7, T7.14): what each Delver's Delves did. Riftglass per week
 * is what its runs were paid (the allowance's 70 a week is the ceiling), floors are per run with
 * the guardian counting as a seventh, relics are every Delve relic owned at the end.
 */
export const delveLines = (runs: readonly RunResult[]): string[] =>
  runs
    .filter((r) => r.spec.policy === 'delver')
    .map((r) => {
      const d = r.delve;
      const floors = d.runs.map((x) => x.floors).sort((a, b) => a - b);
      const mid = Math.floor(floors.length / 2);
      const median =
        floors.length === 0
          ? 0
          : floors.length % 2
            ? (floors[mid] ?? 0)
            : ((floors[mid - 1] ?? 0) + (floors[mid] ?? 0)) / 2;
      const beaten = d.runs.filter((x) => x.guardianBeaten).length;
      const earned = d.runs.reduce((n, x) => n + x.riftglass, 0);
      const weekly = d.totalHours > 0 ? earned / (d.totalHours / WEEK_HOURS) : 0;
      const first = d.runs.find((x) => x.guardianBeaten);
      const shop = [
        d.chosenStart ? 'Chosen start' : null,
        d.reroll ? 'Re-roll' : null,
        d.lateHours > 0 ? `Late hours ${d.lateHours}` : null,
      ].filter((x) => x !== null);
      return (
        `- ${r.spec.policy} ${r.spec.start} ${r.spec.seed}: ${d.runs.length} runs, ` +
        `guardian beaten in ${beaten}, median ${median} floors a run; ` +
        `${weekly.toFixed(1)} Riftglass a week (${d.riftglassHeld} held, bought: ${shop.join(', ') || 'nothing'}); ` +
        `${d.relics.length} of 6 relics; first guardian ${
          first ? `in cycle ${first.cycle} (${hoursText(first.hours)})` : 'never'
        }`
      );
    });

/**
 * Reported, not judged (GDD §6.2 v0.9, plan T9.12): what each Eventer did with its events. Per cycle:
 * boss attempts, median damage, milestones paid, boss silver and hunt points; then tokens spent,
 * check-ins with a full bank and with a token no party of four could use (rest or contracts), and
 * when the first boss attempt, the first boss defeat and each hunter unlock came. Locked check-ins
 * count nowhere (D386).
 */
export const eventLines = (runs: readonly RunResult[]): string[] =>
  runs
    .filter((r) => r.spec.policy === 'eventer' && r.events !== undefined)
    .map((r) => {
      const e = r.events as NonNullable<RunResult['events']>;
      const cycles = [...new Set(e.attempts.map((a) => a.cycle))].map((c) => {
        const here = e.attempts.filter((a) => a.cycle === c);
        const boss = here.filter((a) => a.kind === 'boss');
        const dmg = boss.map((a) => a.damage).sort((a, b) => a - b);
        const median = dmg.length === 0 ? 0 : (dmg[Math.floor(dmg.length / 2)] ?? 0);
        const silver = boss.reduce((n, a) => n + a.silver, 0);
        const marks = boss.reduce((n, a) => n + a.milestones, 0);
        const points = here.reduce((n, a) => n + a.points, 0);
        return `cycle ${c}: ${boss.length} boss (median damage ${median}, ${marks} marks, ${silver} silver), hunt points ${points}`;
      });
      const opened = e.openedHours === null ? 'never opened' : `opened ${hoursText(e.openedHours)}`;
      return (
        `- ${r.spec.policy} ${r.spec.start} ${r.spec.seed}: ${opened}; ${e.tokensSpent} tokens spent; ` +
        `${e.checkIns} open check-ins, ${e.fullBank} full bank, ${e.blocked} blocked; ` +
        `first boss attempt ${e.firstBossAttemptHours === null ? 'never' : hoursText(e.firstBossAttemptHours)}, ` +
        `first boss defeated ${e.firstBossKill ? `cycle ${e.firstBossKill.cycle}` : 'never'}, ` +
        `unlocked ${e.unlocks.map((u) => `${u.hunt} (cycle ${u.cycle})`).join(', ') || 'none'}; ` +
        cycles.join('; ')
      );
    });

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
    out.push(`- **${verdict(c.pass, c.pending)}** ${c.id}: ${c.text}`);
    for (const line of c.lines) out.push(`  - ${line}`);
  }
  out.push('', '## Story (reported only)', '', ...storyLines(report.runs));
  out.push(
    '',
    '## Discovery and skills (reported only; skills are alchemy/smithing/lore/command)',
    '',
    ...discoveryLines(report.runs),
  );
  out.push('', '## Delves (reported only)', '', ...delveLines(report.runs));
  out.push(
    '',
    '## Hunter depth (reported only; items are Fine/Rare/Heroic per cycle)',
    '',
    ...depthLines(report.runs),
  );
  out.push('', '## Events (reported only; the Eventer)', '', ...eventLines(report.runs));
  out.push(
    '',
    '## All content (reported only; the Idle-only row judges the medians)',
    '',
    ...contentLines(report.runs),
  );
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
