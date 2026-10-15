import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { POLICY_IDS, type PolicyId } from '../src/core/policies';
import { CHECKS, type CheckResult } from './checks';
import { hoursText } from './checks/helpers';
import { CURRENT_MILESTONE, FAST_UNTIL_TARGETS } from './milestone';
import { defaultWorkers, runSequential, runSpecs } from './parallel';
import { markdown, summarize, type Baseline, type Report } from './report';
import { STARTS, type RunResult, type RunSpec, type StartId } from './run';
import { buildSpecs } from './specs';
import {
  combineShards,
  readShards,
  specsOfShard,
  SHARD_IDS,
  writeShard,
  type ShardId,
} from './shards';
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
  /** Plan T8.15: play only this shard's runs and write them to `shardDir` (no judging). */
  shard: ShardId | null;
  /** Judge the runs the shards in this folder hold. */
  combine: string | null;
  shardDir: string;
}

const usage = (problem: string): never => {
  console.error(
    `${problem}\nUsage: npm run sim -- [--policy ${POLICY_IDS.join('|')}|all] [--days N] ` +
      `[--seeds N] [--start mon|sat|both] [--check] [--fast] [--accept] [--name label] [--shard ${SHARD_IDS.join('|')}] [--shard-dir folder] [--combine folder]`,
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
    shard: null,
    combine: null,
    shardDir: join(here, 'shards'),
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
    else if (flag === '--shard') {
      const k = value();
      if ((SHARD_IDS as readonly string[]).includes(k)) o.shard = k as ShardId;
      else usage(`Unknown shard "${k}" (${SHARD_IDS.join(', ')}).`);
    } else if (flag === '--combine') o.combine = value();
    else if (flag === '--shard-dir') o.shardDir = value();
    else usage(`Unknown flag "${flag}".`);
  }
  if (o.fast) {
    // Technical design §11.2: Opening plus Standard, 1 seed, through the
    // milestone's last time target.
    Object.assign(o, { policies: ['opening', 'standard'], seeds: 1, starts: ['mon'], days: 5 }); // Bastion: days 3–4
  }
  if (o.accept && o.fast) usage('--accept needs the full suite, not --fast.');
  if ((o.shard || o.combine) && o.fast) usage('--shard and --combine are for the full suite.');
  if (o.shard && (o.combine || o.accept))
    usage('--shard only plays its runs; judge with --combine.');
  return o;
};

const specs = (o: Options): RunSpec[] => buildSpecs(o);

const readBaseline = (): Baseline | null =>
  existsSync(BASELINE) ? (JSON.parse(readFileSync(BASELINE, 'utf8')) as Baseline) : null;

const main = async (): Promise<void> => {
  const o = parse(process.argv.slice(2));
  const began = performance.now();
  // D169: the full suite plays its runs in parallel, one worker per core; the fast set is two
  // short runs and stays in this process. Results are identical either way (sim/parallel.test.ts).
  if (o.shard) {
    // Plan T8.15 (D320): one parallel CI job plays its share of the suite and keeps the raw runs.
    const mine = specsOfShard(specs(o), o.shard);
    const runs = await runSpecs(mine, defaultWorkers());
    mkdirSync(o.shardDir, { recursive: true });
    const path = writeShard(o.shardDir, { shard: o.shard, runs });
    const secs = ((performance.now() - began) / 1000).toFixed(1);
    console.log(`Shard ${o.shard}: ${runs.length} runs, ${secs} s, written to ${path}`);
    return;
  }
  // The combining job reads every shard's runs and judges the whole suite as one machine would.
  const runs: RunResult[] = o.combine
    ? combineShards(specs(o), readShards(o.combine))
    : o.fast
      ? runSequential(specs(o))
      : await runSpecs(specs(o), defaultWorkers());
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

  const failed = checks.filter((c) => c.pass === false && !c.pending);
  const pending = checks.filter((c) => c.pass === false && c.pending);
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
      console.log(
        `sim ${c.pass === null ? '–' : c.pass ? '✓' : '✗'} ${c.id}${c.pending ? ` (pending ${c.pending})` : ''}`,
      );
      if (c.pass !== true) for (const line of c.lines) console.log(`    ${line}`);
    }
  } else {
    console.log(md);
  }
  const scope = o.fast ? `fast set, until ${FAST_UNTIL_TARGETS.join(', ')}` : `${runs.length} runs`;
  console.log(`Report: sim/reports/${name}.md (${scope}, ${seconds.toFixed(1)} s)`);

  if (o.accept) {
    if (failed.length > 0) {
      console.error('Not accepted: every check must pass first.');
      process.exit(1);
    }
    writeFileSync(BASELINE, `${JSON.stringify(report.baseline, null, 2)}\n`);
    console.log('Baseline recorded in sim/baseline.json.');
  }
  if (pending.length > 0) {
    console.log(
      `Pending, not failing the run: ${pending.map((c) => `${c.id} (${c.pending})`).join(', ')}. See docs/questions.md.`,
    );
  }
  if (failed.length > 0) {
    console.error(
      `${failed.length} simulator check(s) failed: ${failed.map((c) => c.id).join(', ')}`,
    );
    process.exit(1);
  }
};

void main();
