// D526: move the real-date (wall-clock epoch millisecond) fields of two old test saves far into the
// future so they stop going stale. The game's own event-clock fields (events.clock.value,
// events.tokens.at, orders.lastChange) are small numbers and are never touched.
//
//   node scripts/shift-fixture-dates.mjs apply            shift the two files in place (once)
//   node scripts/shift-fixture-dates.mjs verify [git-rev] load old (from git) and new, subtract the
//                                                         offset from the listed fields, assert equal
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

const FILES = ['tests/saves/fixtures/v9.json', 'tests/saves/fixtures/v12-played.json'];
const OFFSET = 315_360_000_000; // 10 years of 365 days, in ms
// A real date is an epoch-millisecond number between 2020 and 2039; the event clock counts from zero.
const isEpoch = (v) => typeof v === 'number' && v >= 1_600_000_000_000 && v <= 2_200_000_000_000;

const walk = (o, path, fn) => {
  if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${path}[${i}]`, fn));
  else if (o !== null && typeof o === 'object')
    for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`, fn);
  else fn(path, o);
};
const shifted = (old, sign) => {
  const copy = structuredClone(old);
  const fields = [];
  const go = (o, path) => {
    if (o === null || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      const at = Array.isArray(o) ? `${path}[${k}]` : `${path}.${k}`;
      if (isEpoch(v)) {
        o[k] = v + sign * OFFSET;
        fields.push(at);
      } else go(v, at);
    }
  };
  go(copy, '');
  return { copy, fields };
};
const text = (o) => JSON.stringify(o, null, 2) + '\n';

const [mode, rev = 'v1.1.0'] = process.argv.slice(2);
for (const f of FILES) {
  if (mode === 'apply') {
    const old = JSON.parse(readFileSync(f, 'utf8'));
    const { copy, fields } = shifted(old, +1);
    writeFileSync(f, text(copy));
    execFileSync('npx', ['prettier', '--write', f], { stdio: 'ignore' }); // the repo's own layout for these files
    console.log(`${f}: ${fields.length} real-date fields moved by ${OFFSET} ms`);
  } else if (mode === 'verify') {
    const old = JSON.parse(
      execFileSync('git', ['show', `${rev}:${f}`], { encoding: 'utf8', maxBuffer: 1 << 26 }),
    );
    const now = JSON.parse(readFileSync(f, 'utf8'));
    const { copy: back, fields } = shifted(now, -1);
    // Every field that moved must be one the old file listed as a real date, and nothing else differs.
    const oldFields = [];
    walk(old, '', (p, v) => isEpoch(v) && oldFields.push(p));
    if (!isDeepStrictEqual(back, old))
      throw new Error(`${f}: differs from ${rev} beyond the real-date fields`);
    if (fields.length !== oldFields.length) throw new Error(`${f}: field count differs`);
    console.log(
      `${f}: OK, ${fields.length} real-date fields differ by exactly ${OFFSET} ms; all else identical`,
    );
  } else throw new Error('usage: apply | verify [git-rev]');
}
