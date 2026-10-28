import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { calibrationMarkdown } from './descent-calibration';
import type { Tiers } from './descent-probe';
import { defaultWorkers, runSpecs } from './parallel';
import { buildSpecs } from './specs';

// Plan TD.8b (S8, D564): plays the Vigilant on the 5 Monday seeds and tries a grid of values for
// `descent.stageTiers` and `descent.unlitBaseHealth`, writing the calibration table the owner reads
// before TD.9. `npm run sim:descent`; `-- --tiers "5,6,7;7,8,9" --health 4500,9000 --out file.md`.
// Reported only: it judges nothing and changes no constant.
const DEFAULT_OUT = fileURLToPath(
  new URL('../docs/flesh-out/v1.4/descent-calibration.md', import.meta.url),
);
// A first wide try (tiers 5 to 13, Health 4500 to 36000) put the cliff between tiers 5–7 and 9–11, so the
// default grid looks closely there.
const DEFAULT_TIERS: Tiers[] = [
  [5, 6, 7],
  [6, 7, 8],
  [7, 8, 9],
  [8, 9, 10],
];
const DEFAULT_HEALTH = [3000, 4500, 6000, 7500, 9000];

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const tiersArg = get('--tiers');
  const tiers = tiersArg
    ? tiersArg.split(';').map((t) => {
        const xs = t.split(',').map(Number);
        if (xs.length !== 3 || xs.some((x) => !Number.isFinite(x)))
          throw new Error('--tiers: three numbers per group, groups split by ";"');
        return xs as unknown as Tiers;
      })
    : DEFAULT_TIERS;
  const healthArg = get('--health');
  const unlitHealth = healthArg ? healthArg.split(',').map(Number) : DEFAULT_HEALTH;
  const out = get('--out') ?? DEFAULT_OUT;
  const began = performance.now();
  const specs = buildSpecs({
    policies: ['vigilant'],
    days: 14,
    seeds: 5,
    starts: ['mon'],
    fast: false,
  }).map((s) => ({ ...s, descentProbe: { tiers, unlitHealth } }));
  const runs = await runSpecs(specs, defaultWorkers());
  writeFileSync(out, calibrationMarkdown(runs));
  console.log(
    `Wrote ${out} (${runs.length} runs, ${((performance.now() - began) / 1000).toFixed(1)} s)`,
  );
};

void main();
