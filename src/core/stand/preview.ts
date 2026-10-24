import type { AgeId } from '../../content/ages';
import { embersPayout, type EmbersPayout } from './embers';
import { runStand, type StandInput } from './engine';

// GDD §5.9.3 (D107, D109): the stand screen's preview. Practice stands run the same
// stand code with their own dice (the wave list stays the stand seed's), so the
// preview never reveals the real stand. It shows the waves expected (median, with
// the 10th–90th percentile range), the Embers the stand would pay now and per day
// of the cycle, Threat by tomorrow, and tomorrow's Embers, labeled an estimate: it
// assumes today's Threat rate, today's average trophies per day, and today's
// expected waves.

export interface StandPreviewInput {
  readonly stand: StandInput;
  /** `laststand.previewSamples` on the stand screen, `laststand.policySamples` for the simulated player. */
  readonly samples: number;
  readonly rank: AgeId;
  readonly trophies: number;
  /** Days since the cycle began. */
  readonly cycleDays: number;
  readonly threatPerDay: number;
  readonly trophiesPerDay: number;
  readonly trophyCap?: number | null;
}

export interface StandPreview {
  readonly samples: number;
  readonly median: number;
  readonly p10: number;
  readonly p90: number;
  readonly embersNow: EmbersPayout;
  readonly embersPerDay: number;
  readonly threatTomorrow: number;
  readonly embersTomorrow: EmbersPayout;
  readonly embersPerDayTomorrow: number;
}

/** The value at quantile q of a sorted list (nearest rank, lower). */
export const at = (sorted: readonly number[], q: number): number =>
  sorted[Math.floor(q * (sorted.length - 1))] ?? 0;

/** The waves a set of practice stands held, sorted. */
export const practiceWaves = (stand: StandInput, samples: number): number[] => {
  const held: number[] = [];
  for (let i = 0; i < samples; i++)
    held.push(runStand({ ...stand, log: false, rolls: `${stand.seed}:practice:${i}` }).wavesHeld);
  return held.sort((a, b) => a - b);
};

/** The 10th–90th percentile range the preview shows. */
export const LOW = 0.1;
export const HIGH = 0.9;
export const MID = 0.5;

export const previewStand = (input: StandPreviewInput): StandPreview => {
  const held = practiceWaves(input.stand, input.samples);
  const median = at(held, MID);
  const days = Math.max(input.cycleDays, 1 / 24);
  const embersNow = embersPayout({
    rank: input.rank,
    waves: median,
    threat: input.stand.threat,
    trophies: input.trophies,
    trophyCap: input.trophyCap,
    vigilLevel: input.stand.vigilLevel,
  });
  const threatTomorrow = input.stand.threat + input.threatPerDay;
  const embersTomorrow = embersPayout({
    rank: input.rank,
    waves: median,
    threat: threatTomorrow,
    trophies: input.trophies + input.trophiesPerDay,
    trophyCap: input.trophyCap,
    vigilLevel: input.stand.vigilLevel,
  });
  return {
    samples: input.samples,
    median,
    p10: at(held, LOW),
    p90: at(held, HIGH),
    embersNow,
    embersPerDay: embersNow.value / days,
    threatTomorrow,
    embersTomorrow,
    embersPerDayTomorrow: embersTomorrow.value / (days + 1),
  };
};
