import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defaultWorkers, runSpecs } from './parallel';
import { buildSpecs } from './specs';
import { curveMarkdown } from './vigil-curve';

// Plan KV.8: plays the Vigilant on the 5 Monday seeds and writes the curve the owner reads before
// answering Q57. `npm run sim:vigil`. Reported only: it judges nothing and changes no constant.
const OUT = fileURLToPath(new URL('../docs/flesh-out/v1.3/vigil-curve.md', import.meta.url));

const main = async (): Promise<void> => {
  const began = performance.now();
  const specs = buildSpecs({
    policies: ['vigilant'],
    days: 14,
    seeds: 5,
    starts: ['mon'],
    fast: false,
  });
  const runs = await runSpecs(specs, defaultWorkers());
  writeFileSync(OUT, curveMarkdown(runs));
  console.log(
    `Wrote ${OUT} (${runs.length} runs, ${((performance.now() - began) / 1000).toFixed(1)} s)`,
  );
};

void main();
