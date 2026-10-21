import { ORDER_IDS, type OrderId } from '../../src/content/orders';
import type { RunResult } from '../run';
import { ENGAGEMENT, ORDERS, TIME_TARGETS } from '../targets';
import { act6Check } from './story-acts';
import { bestLastStandCheck } from './best-last-stand';
import { firstLongNightCheck } from './first-long-night';
import { median, stoppedBefore } from './helpers';
import type { Check, CheckResult } from './types';
import { drossProbeCheck } from './v09';

// GDD §6.2 (v0.10, D417, D440): the Orderer's Orders rows, judged on the median over the Monday seeds
// (the Orderer plays Monday seeds only). Cycles count from the start of the run.
const rowOf = (id: string) => {
  const x = TIME_TARGETS.find((r) => r.id === id);
  if (!x) throw new Error(`targets.ts has no "${id}" row`);
  return x;
};

/** The judged Orderer runs, or null when the shard was not played (the fast set). */
const ordererRuns = (runs: readonly RunResult[]): readonly RunResult[] | null => {
  if (stoppedBefore(runs)) return null;
  return runs.filter((r) => r.spec.policy === 'orderer' && r.spec.start === 'mon' && r.orders);
};

const check = (
  id: string,
  judge: (rs: readonly RunResult[]) => { pass: boolean; lines: string[] },
): Check => {
  const row = rowOf(id);
  return {
    id,
    enforcedFrom: row.enforcedFrom,
    judge: (runs): CheckResult => {
      const rs = ordererRuns(runs);
      if (rs === null) return { id, text: row.text, pass: null, lines: ['not in the fast set'] };
      if (rs.length === 0)
        return { id, text: row.text, pass: false, lines: ['needs the Orderer runs'] };
      const r = judge(rs);
      return { id, text: row.text, pass: r.pass, lines: r.lines };
    },
  };
};

const mark = (ok: boolean): string => (ok ? '✓' : '✗');
const INF = Number.POSITIVE_INFINITY;
const cycleText = (c: number): string => (Number.isFinite(c) ? `cycle ${c}` : 'never');

/**
 * Row (a), D440: only an Order the Orderer seated at its opening is judged (the seatless one waits
 * for a new warden by design and is reported). The wait is the median over the runs that seated it.
 */
export const ordersFirstChapterCheck = check('orders-first-chapter', (rs) => {
  const lines: string[] = [];
  let pass = true;
  for (const id of ORDER_IDS) {
    const waits = (r: RunResult): { seated: boolean; wait: number } => {
      const o = r.orders;
      const opened = o?.opened.find((x) => x.order === id);
      const first = o?.chapters.find((x) => x.order === id && x.n === 1);
      return {
        seated: o?.openings.some((x) => x.order === id && x.seated) ?? false,
        wait: opened && first ? first.hours - opened.hours : INF,
      };
    };
    const all = rs.map(waits);
    const seated = all.filter((x) => x.seated);
    const m = median(all.map((x) => x.wait));
    if (seated.length === 0) {
      lines.push(
        `${name(id)}: not seated at its opening in any run, reported only: median ${hours(m)} to chapter 1`,
      );
      continue;
    }
    const ms = median(seated.map((x) => x.wait));
    const ok = ms <= ORDERS.firstChapterWithinHours;
    pass = pass && ok;
    lines.push(
      `${name(id)} (seated at its opening in ${seated.length} of ${rs.length}): median ${hours(ms)} to chapter 1 (needs ${ORDERS.firstChapterWithinHours} h) ${mark(ok)}`,
    );
  }
  return { pass, lines };
});

const hours = (h: number): string => (Number.isFinite(h) ? `${h.toFixed(1)} h` : 'never');
const name = (id: OrderId): string => id;

export const ordersLevelFourCheck = check('orders-level-4', (rs) => {
  const lines: string[] = [];
  let pass = true;
  for (const id of ORDER_IDS) {
    const m = median(
      rs.map((r) => r.orders?.levels.find((x) => x.order === id && x.level === 4)?.cycle ?? INF),
    );
    const ok = m <= ORDERS.levelFourByCycle;
    pass = pass && ok;
    lines.push(
      `${name(id)}: level 4 in ${cycleText(m)} (needs ${ORDERS.levelFourByCycle} or earlier) ${mark(ok)}`,
    );
  }
  return { pass, lines };
});

export const ordersAllChaptersCheck = check('orders-all-chapters', (rs) => {
  const m = median(
    rs.map((r) => {
      const c = r.orders?.chapters ?? [];
      return c.length === 16 ? Math.max(...c.map((x) => x.cycle)) : INF;
    }),
  );
  const ok = m <= ORDERS.allChaptersByCycle;
  return {
    pass: ok,
    lines: [
      `orderer (mon, median of ${rs.length}): all 16 chapters by ${cycleText(m)} (needs ${ORDERS.allChaptersByCycle} or earlier) ${mark(ok)}`,
    ],
  };
});

/** Cycle 1's stretch from the Keep on, as silver check #6 and provisions check #8 judge it. */
const cycleOne = (r: RunResult) => r.keepPhase.byCycle.find((c) => c.cycle === 1) ?? r.keepPhase;

export const ordersSilverCheck = check('orders-silver', (rs) => {
  const m = median(
    rs.map((r) => {
      const c = cycleOne(r);
      return c.bountySilver / Math.max(1e-9, c.bountySilver + c.jobSilver);
    }),
  );
  const ok = m >= ORDERS.minBountyShare;
  return {
    pass: ok,
    lines: [
      `orderer (mon, median of ${rs.length}): ${(m * 100).toFixed(1)}% of cycle-1 silver from bounties (needs ${ORDERS.minBountyShare * 100}%) ${mark(ok)}`,
    ],
  };
});

export const ordersProvisionsCheck = check('orders-provisions', (rs) => {
  const { minShare, maxShare } = ENGAGEMENT.provisionsMatter;
  const m = median(
    rs.map((r) => {
      const c = cycleOne(r);
      return c.provisionsFood / Math.max(1e-9, c.jobFood);
    }),
  );
  const ok = m >= minShare && m <= maxShare;
  return {
    pass: ok,
    lines: [
      `orderer (mon, median of ${rs.length}): provisions ${(m * 100).toFixed(1)}% of food income in cycle 1, Moot perk counted (needs ${minShare * 100}–${maxShare * 100}%) ${mark(ok)}`,
    ],
  };
});

/**
 * The four stand rows, judged on the Orderer's own runs (relabelled Standard so the existing checks
 * read them), plus the Embers per stand with the Quenchers seated and without (D439).
 */
export const ordersStandRowsCheck = check('orders-stand-rows', (rs) => {
  const asStandard = rs.map((r) => ({ ...r, spec: { ...r.spec, policy: 'standard' as const } }));
  const lines: string[] = [];
  let pass = true;
  for (const c of [bestLastStandCheck, firstLongNightCheck, act6Check, drossProbeCheck]) {
    const r = c.judge(asStandard);
    // The Orderer has no Light or Heavy runs: only its own (Standard-labelled) lines count.
    const own = r.lines.filter((l) => l.startsWith('standard (mon'));
    pass = pass && (r.pass ?? false);
    lines.push(`${c.id}: ${r.pass ? '✓' : '✗'}`, ...own.map((l) => `  ${l}`));
  }
  const stands = rs.flatMap((r) => r.orders?.stands ?? []);
  const mean = (xs: readonly number[]): string =>
    xs.length === 0 ? '–' : String(Math.round(xs.reduce((a, b) => a + b, 0) / xs.length));
  const on = stands.filter((s) => s.quenchersSeated);
  const off = stands.filter((s) => !s.quenchersSeated);
  lines.push(
    `Embers per stand (reported): with the Quenchers seated ${mean(on.map((s) => s.embers))} (${on.length} stands, mean Threat ${mean(on.map((s) => s.threat))}); without ${mean(off.map((s) => s.embers))} (${off.length} stands, mean Threat ${mean(off.map((s) => s.threat))})`,
  );
  return { pass, lines };
});
