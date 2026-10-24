import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defaultWorkers, runSpecs } from './parallel';
import { buildSpecs } from './specs';
import { curveMarkdown } from './vigil-curve';
import { STEP_KINDS, WIDE_GRID, type StepKind } from './vigil-probe';

// Plan KV.8, KV.9: plays the Vigilant on the 5 Monday seeds with a grid of values for `s` and `e`
// and writes the curve the owner reads. `npm run sim:vigil` (KV.8's wide grid, additive and
// compounding); `-- --s 0.28,0.30 --e 0.1,0.2 --kinds additive --out file.md` for a finer try.
// Reported only: it judges nothing and changes no constant.
const DEFAULT_OUT = fileURLToPath(
  new URL('../docs/flesh-out/v1.3/vigil-curve.md', import.meta.url),
);

const list = (v: string): number[] => v.split(',').map(Number);

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const kinds = get('--kinds')?.split(',') as StepKind[] | undefined;
  if (kinds?.some((k) => !STEP_KINDS.includes(k)))
    throw new Error('--kinds: additive, compounding');
  const grid = {
    sGrid: get('--s') ? list(get('--s') as string) : WIDE_GRID.sGrid,
    eGrid: get('--e') ? list(get('--e') as string) : WIDE_GRID.eGrid,
    kinds: kinds ?? WIDE_GRID.kinds,
  };
  const out = get('--out') ?? DEFAULT_OUT;
  const began = performance.now();
  const specs = buildSpecs({
    policies: ['vigilant'],
    days: 14,
    seeds: 5,
    starts: ['mon'],
    fast: false,
  }).map((s) => ({ ...s, probe: grid }));
  const runs = await runSpecs(specs, defaultWorkers());
  writeFileSync(out, curveMarkdown(runs));
  console.log(
    `Wrote ${out} (${runs.length} runs, ${((performance.now() - began) / 1000).toFixed(1)} s)`,
  );
};

void main();
