import type { PolicyId } from '../src/core/policies';
import { FAST_UNTIL_TARGETS } from './milestone';
import type { RunSpec, StartId } from './run';
import { ENGAGEMENT } from './targets';

// Technical design §13: which runs a simulator command plays. Moved out of cli.ts (plan T8.15,
// D320) so the shards and their tests build exactly the same list the single-machine run does.

const OVERFLOW_CYCLES = ENGAGEMENT.noOverflow.cycles;

export interface SpecOptions {
  readonly policies: readonly PolicyId[];
  readonly days: number;
  readonly seeds: number;
  readonly starts: readonly StartId[];
  readonly fast: boolean;
}

export const buildSpecs = (o: SpecOptions): RunSpec[] =>
  o.policies.flatMap((policy) =>
    // D272: the Delver runs the Monday seeds only; so do the Eventer (GDD §6.1, D367), the Orderer (D417), the Vigilant (D546) and the Tactician (D589).
    o.starts
      .filter(
        (start) =>
          (policy !== 'delver' &&
            policy !== 'eventer' &&
            policy !== 'orderer' &&
            policy !== 'vigilant' &&
            policy !== 'tactician') ||
          start === 'mon',
      )
      .flatMap((start) =>
        Array.from({ length: o.seeds }, (_, i) => ({
          policy,
          seed: `sim-${i + 1}`,
          start,
          days: o.days,
          ...(o.fast ? { stopAt: FAST_UNTIL_TARGETS } : {}),
          // GDD §6.3 #7 (D114): the Standard runs go on through 3 Long Nights, up to 6 weeks.
          ...(!o.fast &&
          (policy === 'standard' ||
            policy === 'delver' ||
            policy === 'eventer' ||
            policy === 'orderer' ||
            policy === 'vigilant' ||
            policy === 'tactician')
            ? {
                minCycles: OVERFLOW_CYCLES,
                maxDays: 42,
                // D271: the Idle-only row compares the Monday runs until each has all content. The Tactician (D589) plays its 3 cycles and stops.
                ...(start === 'mon' && policy !== 'tactician' ? { untilContent: true } : {}),
              }
            : {}),
        })),
      ),
  );
