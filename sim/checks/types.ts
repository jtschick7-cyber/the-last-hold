import type { RunResult } from '../run';
import type { Milestone } from '../targets';

export interface CheckResult {
  readonly id: string;
  readonly text: string;
  /** null: not judged in this run (for example, a policy left out of the fast set). */
  readonly pass: boolean | null;
  readonly lines: readonly string[];
}

export interface Check {
  readonly id: string;
  readonly enforcedFrom: Milestone;
  readonly judge: (runs: readonly RunResult[]) => CheckResult;
}
