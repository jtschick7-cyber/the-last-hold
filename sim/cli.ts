import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { POLICY_IDS, type PolicyId } from '../src/core/policies';
import { CHECKS, type CheckResult } from './checks';
import { hoursText } from './checks/helpers';
import { CURRENT_MILESTONE, FAST_UNTIL_TARGET } from './milestone';
import { markdown, summarize, type Baseline, type Report } from './report';
import { runOne, STARTS, type RunResult, type RunSpec, type StartId } from './run';
import { enforced } from './targets';

// Balance simulator (technical design §13). Examples:
//   npm run sim -- --policy standard --days 14 --seeds 5
//   npm run sim:check              the full suite for the current milestone
//   npm run sim:check -- --fast    the fast set inside `npm run check` (§11.2)
//   npm run sim:accept             record sim/baseline.json (milestone end only)

const here = dirname(fileURLToPath(import.meta.url));
const BASELINE = join(here, 'baseline.json');
const REPORTS = join(here, 'reports');

interface Options {
  policies: PolicyId[];
  days: number;
  seeds: number;
  starts: StartId[];
  check: boolean;
  fast: boolean;
  accept: boolean;
  name: string | null;
}

const usage = (problem: string): never => {
  console.error(
    `${problem}\nUsage: npm run sim -- [--policy ${POLICY_IDS.join('|')}|all] [--days N] ` +
      `[--seeds N] [--start mon|sat|both] [--check] [--fast] [--accept] [--name label]`,
  );
  process.exit(2);
};

const parse = (args: readonly string[]): Options => {
  const o: Options = {
    policies: [...POLICY_IDS],
    days: 14,
    seeds: 5,
    starts: ['mon', 'sat'],
    check: false,
    fast: false,
    accept: false,
    name: null,
  };
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    const value = (): string => args[++i] ?? usage(`${flag} needs a value.`);
    const count = (): number => {
      const n = Number(value());
      return Number.isInteger(n) && n > 0 ? n : usage(`${flag} needs a whole number above 0.`);
    };
    if (flag === '--') continue;
    else if (flag === '--policy') {
      const p = value();
      if (p === 'all') o.policies = [...POLICY_IDS];
      else if ((POLICY_IDS as readonly string[]).includes(p)) o.policies = [p as PolicyId];
      else usage(`Unknown policy "${p}".`);
    } else if (flag === '--days') o.days = count();
    else if (flag === '--seeds') o.seeds = count();
    else if (flag === '--start') {
      const s = value();
      if (s === 'both') o.starts = ['mon', 'sat'];
      else if (s in STARTS) o.starts = [s as StartId];
      else usage(`Unknown start "${s}".`);
    } else if (flag === '--check') o.check = true;
    else if (flag === '--fast') o.fast = true;
    else if (flag === '--accept') o.accept = true;
    else if (flag === '--name') o.name = value();
    else usage(`Unknown flag "${flag}".`);
  }
  if (o.fast) {
    // Technical design §11.2: Opening plus Standard, 1 seed, through the
    // milestone's last time target.
    Object.assign(o, { policies: ['opening', 'standard'], seeds: 1, starts: ['mon'], days: 3 });
  }
  if (o.accept && o.fast) usage('--accept needs the full suite, not --fast.');
  return o;
};

const specs = (o: Options): RunSpec[] =>
  o.policies.flatMap((policy) =>
    o.starts.flatMap((start) =>
      Array.from({ length: o.seeds }, (_, i) => ({
        policy,
        seed: `sim-${i + 1}`,
        start,
        days: o.days,
        stopAtKeep: o.fast,
      })),
    ),
  );

const readBaseline = (): Baseline | null =>
  existsSync(BASELINE) ? (JSON.parse(readFileSync(BASELINE, 'utf8')) as Baseline) : null;

const main = (): void => {
  const o = parse(process.argv.slice(2));
  const began = performance.now();
  const runs: RunResult[] = specs(o).map(runOne);
  const checks: CheckResult[] = o.check
    ? CHECKS.filter((c) => enforced(c.enforcedFrom, CURRENT_MILESTONE)).map((c) => c.judge(runs))
    : [];
  const seconds = (performance.now() - began) / 1000;
  const label = o.name ?? (o.fast ? 'fast' : o.check ? 'check' : o.policies.join('-'));
  const name = `${new Date().toISOString().replace(/[:.]/g, '-')}-${label}`;
  const report: Report = {
    name,
    milestone: CURRENT_MILESTONE,
    rulesVersion: summarize(CURRENT_MILESTONE, runs, checks).rulesVersion,
    fast: o.fast,
    seconds,
    baseline: summarize(CURRENT_MILESTONE, runs, checks),
    checks,
    runs,
  };
  const md = markdown(report, readBaseline());
  mkdirSync(REPORTS, { recursive: true });
  writeFileSync(join(REPORTS, `${name}.json`), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(REPORTS, `${name}.md`), md);

  const failed = checks.filter((c) => c.pass === false);
  if (o.fast && !o.check) {
    for (const [k, ms] of Object.entries(report.baseline.groups)) {
      console.log(
        `sim ${k}: ${Object.entries(ms)
          .map(([m, h]) => `${m} ${hoursText(h ?? Infinity)}`)
          .join(', ')}`,
      );
    }
  } else if (o.fast) {
    // Keep `npm run check` quiet when green: one line per check.
    for (const c of checks) {
      console.log(`sim ${c.pass === null ? '–' : c.pass ? '✓' : '✗'} ${c.id}`);
      if (c.pass !== true) for (const line of c.lines) console.log(`    ${line}`);
    }
  } else {
    console.log(md);
  }
  const scope = o.fast ? `fast set, until ${FAST_UNTIL_TARGET}` : `${runs.length} runs`;
  console.log(`Report: sim/reports/${name}.md (${scope}, ${seconds.toFixed(1)} s)`);

  if (o.accept) {
    if (failed.length > 0) {
      console.error('Not accepted: every check must pass first.');
      process.exit(1);
    }
    writeFileSync(BASELINE, `${JSON.stringify(report.baseline, null, 2)}\n`);
    console.log('Baseline recorded in sim/baseline.json.');
  }
  if (failed.length > 0) {
    console.error(
      `${failed.length} simulator check(s) failed: ${failed.map((c) => c.id).join(', ')}`,
    );
    process.exit(1);
  }
};

main();
