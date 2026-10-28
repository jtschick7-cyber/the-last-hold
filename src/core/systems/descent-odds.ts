import type { Breakdown } from '../breakdown/breakdown';
import { num } from '../balance-access';
import { marginFor } from '../contracts/odds';
import { at, HIGH, LOW, MID } from '../stand/preview';
import { runDescent, type DescentInput } from './descent-fight';

// GDD §5.15.10, §6.5, technical design §22.4 (D561, S10): the Descent preview. Practice runs use the
// real engine on their own dice, so a preview never reveals the real attempt's dice. The seed does not
// depend on the party or the preparation, so two orders compared on one screen face the same dice.

export interface DescentPreviewInput {
  readonly gameSeed: string;
  /** The attempt the real run would be (`attempts + 1`). */
  readonly attempt: number;
  /** The real run's input; only the seed is replaced for each practice run. */
  readonly run: DescentInput;
  /** Overrides `descent.previewSamples` (the main-thread fallback uses fewer). */
  readonly samples?: number;
}

export interface DescentPreview {
  readonly samples: number;
  readonly winChance: number;
  readonly margin: number;
  /** The typical run: 'win' when the median run cleared all three stages. */
  readonly outcome: 'win' | 'loss';
  readonly stagesCleared: number;
  /** Hunters downed over the whole run: the median and the 10th–90th percentile range. */
  readonly downed: { readonly median: number; readonly p10: number; readonly p90: number };
  readonly why: Breakdown;
}

/** The practice seed of run `i` (the stages then draw from `…:stage:1|2|3`, as the real run does). */
export const descentPreviewSeed = (gameSeed: string, attempt: number, i: number): string =>
  `${gameSeed}:descentodds:${attempt}:${i}`;

export const previewDescent = (input: DescentPreviewInput): DescentPreview => {
  const n = input.samples ?? num('descent.previewSamples');
  const cleared: number[] = [];
  const downed: number[] = [];
  let wins = 0;
  for (let i = 0; i < n; i++) {
    const r = runDescent({
      ...input.run,
      seed: descentPreviewSeed(input.gameSeed, input.attempt, i),
      log: false,
    });
    if (r.outcome === 'win') wins++;
    cleared.push(r.stagesCleared);
    downed.push(r.downedCount);
  }
  cleared.sort((a, b) => a - b);
  downed.sort((a, b) => a - b);
  const winChance = wins / n;
  const stagesCleared = at(cleared, MID);
  const median = at(downed, MID);
  const stageCount = input.run.stageTiers.length;
  return {
    samples: n,
    winChance,
    margin: marginFor(winChance, n),
    outcome: stagesCleared === stageCount ? 'win' : 'loss',
    stagesCleared,
    downed: { median, p10: at(downed, LOW), p90: at(downed, HIGH) },
    why: {
      label: 'Why these odds',
      value: winChance,
      formula: `${wins} of ${n} practice runs on their own dice cleared all ${stageCount} stages`,
      children: [
        { label: 'Practice runs', value: n },
        { label: 'Runs that won', value: wins },
        { label: 'Stages cleared, median', value: stagesCleared },
        { label: 'Hunters downed, median', value: median },
        { label: 'Hunters downed, 10th percentile', value: at(downed, LOW) },
        { label: 'Hunters downed, 90th percentile', value: at(downed, HIGH) },
      ],
    },
  };
};
