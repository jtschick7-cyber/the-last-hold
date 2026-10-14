// Plan T5.15 (D169): one simulator worker. Reads a JSON list of run specs on stdin, plays
// each with runOne (the same function the sequential path uses), writes the JSON list of
// results on stdout. Started by sim/parallel.ts; not for running by hand.
import { runOne, type RunSpec } from './run';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk: string) => {
  input += chunk;
});
process.stdin.on('end', () => {
  const specs = JSON.parse(input) as RunSpec[];
  process.stdout.write(JSON.stringify(specs.map(runOne)));
});
