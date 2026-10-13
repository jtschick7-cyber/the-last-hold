import { RESOURCE_IDS, type ResourceId } from '../src/content/resources';
import { play, type PolicyId } from '../src/core/policies';
import { OPENING_LENGTH } from '../src/core/policies/schedules';
import { createNewGame } from '../src/core/state/new-game';
import { provisions } from '../src/core/contracts/rewards';
import { settleCost } from '../src/core/systems/settle';

// Technical design §13.1: one simulated game, played by a policy on a virtual
// clock through the real core. Records what the checks and the report need.

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** 2024-01-01 was a Monday. GDD §6.1: runs start Monday 07:00, and again Saturday 09:00. */
const MONDAY = Date.UTC(2024, 0, 1);
export const STARTS = {
  mon: MONDAY + 7 * HOUR,
  sat: MONDAY + 5 * DAY + 9 * HOUR,
} as const;
export type StartId = keyof typeof STARTS;

export interface RunSpec {
  readonly policy: PolicyId;
  readonly seed: string;
  readonly start: StartId;
  readonly days: number;
  /** Stop once every one of these moments is reached (the fast set needs nothing after its last target). */
  readonly stopAt?: readonly Moment[];
}

export interface CheckInStat {
  /** Hours since the start. */
  readonly hours: number;
  readonly purchases: number;
  readonly hadOption: boolean;
  readonly saving: boolean;
  readonly agedUp: boolean;
  /** One of the Opening's 10-second steps, not a scheduled check-in. */
  readonly opening: boolean;
}

export const MOMENTS = [
  'first-cottage',
  'first-mine',
  'mill-3',
  'peasants-10',
  'keep',
  // v0.2 (GDD §6.2):
  'first-contract',
  'roster-4',
  'first-tier-3',
  // v0.3 (GDD §6.2):
  'hunters-lodge',
  'first-identified',
  'first-studied',
] as const;
export type Moment = (typeof MOMENTS)[number];

/** One finished contract, for the odds-honesty check (GDD §6.3). */
export interface ContractRecord {
  readonly hours: number;
  readonly tier: number;
  /** The win chance the launch panel showed. */
  readonly winChance: number;
  readonly success: boolean;
}

/** What the Keep phase (from the Rank-up on) earned and spent, for the v0.2 economy checks. */
export interface KeepPhase {
  readonly bountySilver: number;
  readonly jobSilver: number;
  readonly provisionsFood: number;
  readonly jobFood: number;
}

export interface RunResult {
  readonly spec: RunSpec;
  /** Hours from the start to each GDD §6.2 moment, or null if never reached. */
  readonly moments: Record<Moment, number | null>;
  readonly checkIns: readonly CheckInStat[];
  /** Everything produced over the run, by resource (v0.1's only sources are jobs). */
  readonly income: Record<ResourceId, number>;
  readonly peaks: Record<ResourceId | 'peasants', number>;
  /** The largest number anywhere in the state over the run (GDD §6.3 #7). */
  readonly largestNumber: number;
  readonly final: { readonly age: string; readonly peasants: number };
  readonly contracts: readonly ContractRecord[];
  readonly keepPhase: KeepPhase;
}

const largest = (value: unknown): number => {
  if (typeof value === 'number') return Math.abs(value);
  if (value && typeof value === 'object') {
    return Object.values(value).reduce<number>((m, v) => Math.max(m, largest(v)), 0);
  }
  return 0;
};

export const runOne = (spec: RunSpec): RunResult => {
  const start = STARTS[spec.start];
  const state = createNewGame(spec.seed, start);
  const moments = Object.fromEntries(MOMENTS.map((m) => [m, null])) as Record<
    Moment,
    number | null
  >;
  const mark = (m: Moment, at: number): void => {
    if (moments[m] === null) moments[m] = (at - start) / HOUR;
  };
  const checkIns: CheckInStat[] = [];
  const income = Object.fromEntries(RESOURCE_IDS.map((r) => [r, 0])) as Record<ResourceId, number>;
  const peaks = { ...income, peasants: state.peasants.total };
  let largestNumber = largest(state);
  const contracts: ContractRecord[] = [];
  const keepPhase = { bountySilver: 0, jobSilver: 0, provisionsFood: 0, jobFood: 0 };
  let inKeep = false;

  play(state, {
    // D62 (Q4a): a fresh start under Standard begins with the Opening's 15
    // active minutes, which then switches to Standard (GDD §6.1).
    policy: spec.policy === 'standard' ? 'opening' : spec.policy,
    startedAt: start,
    until: start + spec.days * DAY,
    stop: () => spec.stopAt !== undefined && spec.stopAt.every((m) => moments[m] !== null),
    onCheckIn: (rec, s) => {
      // Income: the net change while away, plus the food that settling spent.
      const settles = rec.away.events.filter((e) => e.type === 'settle');
      settles.forEach((e, i) => {
        income.food += settleCost(rec.peasantsBefore + i).value;
        if (rec.peasantsBefore + i + 1 >= 10) mark('peasants-10', e.at);
      });
      for (const r of RESOURCE_IDS) income[r] += rec.away.resources[r];
      for (const c of rec.commands) {
        if (c.type === 'build.buy' && c.building === 'cottage') mark('first-cottage', rec.at);
        if (c.type === 'build.buy' && c.building === 'mine') mark('first-mine', rec.at);
      }
      if (s.buildings.mill >= 3) mark('mill-3', rec.at);
      if (s.peasants.total >= 10) mark('peasants-10', rec.at);
      if (rec.agedUp) mark('keep', rec.at);
      for (const c of rec.commands) {
        if (c.type === 'contract.launch') mark('first-contract', rec.at);
      }
      if (Object.keys(s.hunters).length >= 4) mark('roster-4', rec.at);
      if (s.buildings['hunters-lodge'] >= 1) mark('hunters-lodge', rec.at);
      for (const e of rec.away.events) {
        if (e.type === 'clue' && e.identified) mark('first-identified', e.at);
      }
      for (const r of rec.away.contracts) {
        contracts.push({
          hours: (r.at - start) / HOUR,
          tier: r.tier,
          winChance: r.winChance,
          success: r.success,
        });
        if (r.success && r.tier >= 3) mark('first-tier-3', r.at);
        if (r.success && (s.bestiary[r.monster]?.level ?? 0) >= 3) mark('first-studied', r.at);
      }
      // The Keep phase runs from the Rank-up check-in on (GDD §6.3 #5 and #8).
      if (rec.agedUp) inKeep = true;
      if (inKeep) {
        keepPhase.jobSilver += rec.away.produced.silver;
        keepPhase.jobFood += rec.away.produced.food;
        for (const r of rec.away.contracts) keepPhase.bountySilver += r.bounty;
        for (const c of rec.commands) {
          if (c.type !== 'contract.launch') continue;
          const run = s.running.find((x) => x.contract.id === c.contract);
          if (run)
            keepPhase.provisionsFood += provisions(s, run.party.length, run.contract.tier).value;
        }
      }
      checkIns.push({
        hours: (rec.at - start) / HOUR,
        purchases: rec.purchases,
        hadOption: rec.hadOption,
        saving: rec.saving,
        agedUp: rec.agedUp,
        opening:
          (spec.policy === 'opening' || spec.policy === 'standard') &&
          rec.at <= start + OPENING_LENGTH,
      });
      for (const r of RESOURCE_IDS) peaks[r] = Math.max(peaks[r], s.resources[r]);
      peaks.peasants = Math.max(peaks.peasants, s.peasants.total);
      largestNumber = Math.max(largestNumber, largest(s));
    },
  });
  return {
    spec,
    moments,
    checkIns,
    income,
    peaks,
    largestNumber,
    final: { age: state.cycle.age, peasants: state.peasants.total },
    contracts,
    keepPhase,
  };
};
