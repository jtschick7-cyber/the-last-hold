import { spawn } from 'node:child_process';
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { runOne, type RunResult, type RunSpec } from './run';

// Plan T5.15 (D169): the full suite plays its runs in parallel, one worker process per
// core. Every run is deterministic and independent, so the results are the same as a
// sequential run. Both ways hand back results written as JSON and read back, so what the
// checks see never depends on how the runs were played.

const normalize = (r: RunResult): RunResult => JSON.parse(JSON.stringify(r)) as RunResult;

export const runSequential = (specs: readonly RunSpec[]): RunResult[] =>
  specs.map((s) => normalize(runOne(s)));

/** Worker count: `SIM_WORKERS` if set, else one per core. */
export const defaultWorkers = (): number => {
  const fromEnv = Number(process.env.SIM_WORKERS);
  return Number.isInteger(fromEnv) && fromEnv > 0 ? fromEnv : availableParallelism();
};

const WORKER = fileURLToPath(new URL('./worker.ts', import.meta.url));
// The vite-node launcher (the package's `exports` don't expose it, so it is found by path).
const VITE_NODE = fileURLToPath(new URL('../node_modules/vite-node/dist/cli.mjs', import.meta.url));

const runChunk = (chunk: readonly RunSpec[]): Promise<RunResult[]> =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [VITE_NODE, WORKER], {
      stdio: ['pipe', 'pipe', 'inherit'],
    });
    const out: Buffer[] = [];
    child.stdout.on('data', (b: Buffer) => out.push(b));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`A simulator worker exited with code ${code}.`));
      try {
        resolve(JSON.parse(Buffer.concat(out).toString('utf8')) as RunResult[]);
      } catch (e) {
        reject(e);
      }
    });
    child.stdin.end(JSON.stringify(chunk));
  });

/**
 * Plays the specs on `workers` processes and returns the results in the order of `specs`.
 * Specs are dealt round-robin, so a slow kind of run doesn't pile onto one worker.
 */
export const runSpecs = async (
  specs: readonly RunSpec[],
  workers: number,
): Promise<RunResult[]> => {
  const n = Math.min(Math.max(1, workers), specs.length);
  if (n <= 1) return runSequential(specs);
  const chunks: { index: number; spec: RunSpec }[][] = Array.from({ length: n }, () => []);
  specs.forEach((spec, index) => chunks[index % n]?.push({ index, spec }));
  const done = await Promise.all(chunks.map((c) => runChunk(c.map((x) => x.spec))));
  const out: RunResult[] = new Array<RunResult>(specs.length);
  chunks.forEach((c, k) =>
    c.forEach((x, j) => {
      const r = done[k]?.[j];
      if (!r) throw new Error('A simulator worker returned fewer results than it was given.');
      out[x.index] = r;
    }),
  );
  return out;
};
