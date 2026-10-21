import type { RunResult } from '../run';
import { EVENTS, STORY, TIME_TARGETS } from '../targets';
import { groups, median, stoppedBefore } from './helpers';
import type { Check, CheckResult } from './types';

// GDD §6.2 (v0.9, D383): the Dross-Tide stand probe. In the stands made once Act VI has begun, judged
// on the median over the Monday Standard seeds (Saturday is reported only, D62): the waves held reach
// the Held band, and the real result falls inside the preview's 10th–90th range often enough.
const target = TIME_TARGETS.find((x) => x.id === 'dross-tide-stand');
if (!target) throw new Error('targets.ts has no "dross-tide-stand" row');

export const drossProbeCheck: Check = {
  id: target.id,
  enforcedFrom: target.enforcedFrom,
  judge: (runs): CheckResult => {
    if (stoppedBefore(runs))
      return { id: target.id, text: target.text, pass: null, lines: ['not in the fast set'] };
    const lines: string[] = [];
    let pass: boolean | null = null;
    for (const [start, rs] of groups(runs, 'standard')) {
      const stands = rs.map((r) => r.drossStands ?? []);
      const waves = median(stands.map((s) => (s.length ? median(s.map((x) => x.waves)) : 0)));
      const share = median(
        stands.map((s) =>
          s.length ? s.filter((x) => x.waves >= x.p10 && x.waves <= x.p90).length / s.length : 0,
        ),
      );
      const count = stands.reduce((n, s) => n + s.length, 0);
      const ok =
        count > 0 &&
        waves >= STORY.drossProbe.heldWaves &&
        share >= STORY.drossProbe.previewAgreeShare;
      const text = `${count} Dross-Tide stands; median waves ${waves} (Held is ${STORY.drossProbe.heldWaves}+), real result inside the preview range in ${(share * 100).toFixed(0)}% (needs ${(STORY.drossProbe.previewAgreeShare * 100).toFixed(0)}%)`;
      if (start !== 'mon') {
        lines.push(`standard (${start}, reported only): ${text}`);
        continue;
      }
      pass = (pass ?? true) && ok;
      lines.push(`standard (mon, median of ${rs.length}): ${text} ${ok ? '✓' : '✗'}`);
    }
    return { id: target.id, text: target.text, pass, lines };
  },
};

// GDD §6.2 (v0.9, D367, D404): the Eventer's event rows, judged on the median over the Monday seeds
// (the Eventer plays Monday seeds only). Cycles count from the one events opened in, which is cycle 1.
const rowOf = (id: string) => {
  const x = TIME_TARGETS.find((r) => r.id === id);
  if (!x) throw new Error(`targets.ts has no "${id}" row`);
  return x;
};

/** The judged Eventer runs, or null when the shard was not played (the fast set). */
const eventerRuns = (runs: readonly RunResult[]): readonly RunResult[] | null => {
  if (stoppedBefore(runs)) return null;
  return runs.filter((r) => r.spec.policy === 'eventer' && r.spec.start === 'mon');
};

const eventerCheck = (
  id: string,
  measure: (r: RunResult) => number,
  ok: (m: number) => boolean,
  say: (m: number) => string,
): Check => {
  const row = rowOf(id);
  return {
    id,
    enforcedFrom: row.enforcedFrom,
    judge: (runs): CheckResult => {
      const rs = eventerRuns(runs);
      if (rs === null) return { id, text: row.text, pass: null, lines: ['not in the fast set'] };
      if (rs.length === 0)
        return { id, text: row.text, pass: false, lines: ['needs the Eventer runs'] };
      const m = median(rs.map(measure));
      const pass = Number.isFinite(m) && ok(m);
      return {
        id,
        text: row.text,
        pass,
        lines: [`eventer (mon, median of ${rs.length}): ${say(m)} ${pass ? '✓' : '✗'}`],
      };
    },
  };
};

const cycleText = (m: number): string => (Number.isFinite(m) ? `cycle ${m}` : 'never');
/** Cycles from the one events opened in (cycle 1), or infinity if it never happened. */
const sinceOpen = (r: RunResult, cycle: number | undefined): number =>
  cycle === undefined || r.events?.openedCycle == null
    ? Number.POSITIVE_INFINITY
    : cycle - r.events.openedCycle + 1;

export const firstBossAttemptCheck = eventerCheck(
  'first-boss-attempt',
  (r) =>
    r.events?.firstBossAttemptHours == null || r.events.openedHours === null
      ? Number.POSITIVE_INFINITY
      : r.events.firstBossAttemptHours - r.events.openedHours,
  (h) => h <= EVENTS.attemptWithinHours,
  (h) =>
    `${Number.isFinite(h) ? `${h.toFixed(1)} h` : 'never'} after events opened (needs ${EVENTS.attemptWithinHours} h)`,
);

export const firstBossKillCheck = eventerCheck(
  'first-boss-kill',
  (r) => sinceOpen(r, r.events?.firstBossKill?.cycle),
  (c) => c <= EVENTS.killByCycle,
  (c) => `first boss defeated ${cycleText(c)} (needs ${EVENTS.killByCycle} or earlier)`,
);

export const firstHunterUnlockCheck = eventerCheck(
  'first-hunter-unlock',
  (r) => sinceOpen(r, r.events?.unlocks.map((u) => u.cycle).sort((a, b) => a - b)[0]),
  (c) => c <= EVENTS.unlockByCycle,
  (c) => `first legendary hunter ${cycleText(c)} (needs ${EVENTS.unlockByCycle} or earlier)`,
);

export const tokensNotWastedCheck = eventerCheck(
  'tokens-not-wasted',
  (r) => (r.events && r.events.checkIns > 0 ? r.events.fullBank / r.events.checkIns : 1),
  (s) => s <= EVENTS.maxFullBankShare,
  (s) =>
    `full bank at ${(s * 100).toFixed(1)}% of unlocked check-ins (needs ${EVENTS.maxFullBankShare * 100}% or less)`,
);

/** Cycle 1's stretch from the Keep on, with boss silver counted in the total only (GDD §6.3 #6). */
export const silverWithBossCheck = eventerCheck(
  'silver-with-boss',
  (r) => {
    const c1 = r.keepPhase.byCycle.find((c) => c.cycle === 1) ?? r.keepPhase;
    const boss = (r.events?.attempts ?? [])
      .filter((a) => a.cycle === 1)
      .reduce((n, a) => n + a.silver, 0);
    return c1.bountySilver / Math.max(1e-9, c1.bountySilver + c1.jobSilver + boss);
  },
  (s) => s >= EVENTS.minBountyShare,
  (s) =>
    `${(s * 100).toFixed(1)}% of cycle-1 silver from bounties, boss silver in the total (needs ${EVENTS.minBountyShare * 100}%)`,
);
