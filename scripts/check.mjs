// `npm run check` (Q23 option a, owner-approved): typecheck, lint and the format check are
// independent, so they run at the same time; then the tests, then the fast simulator set.
// The same checks as before, in the same order of importance; nothing is skipped or loosened.
import { spawn } from 'node:child_process';

const run = (name, args) =>
  new Promise((resolve) => {
    const out = [];
    const child = spawn('npm', ['run', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (b) => out.push(b));
    child.stderr.on('data', (b) => out.push(b));
    child.on('close', (code) => resolve({ name, code, output: Buffer.concat(out).toString() }));
  });

const parallel = await Promise.all([
  run('typecheck', ['typecheck']),
  run('lint', ['lint']),
  run('format:check', ['format:check']),
]);
let failed = false;
for (const r of parallel) {
  if (r.code !== 0) {
    failed = true;
    console.error(`\n✗ ${r.name} failed:\n${r.output}`);
  } else console.log(`✓ ${r.name}`);
}
if (failed) process.exit(1);

for (const [name, args] of [
  ['test', ['test']],
  ['sim:check --fast', ['sim:check', '--', '--fast']],
]) {
  const r = await new Promise((resolve) => {
    const child = spawn('npm', ['run', ...args], { stdio: 'inherit' });
    child.on('close', resolve);
  });
  if (r !== 0) {
    console.error(`\n✗ ${name} failed`);
    process.exit(1);
  }
}
