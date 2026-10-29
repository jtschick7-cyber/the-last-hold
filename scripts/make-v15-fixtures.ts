// Plan TB.2 (D585): makes tests/saves/fixtures/v15.json, the owner's real v1.4 save
// (v14-owner.json, exported at TB.2) after the v14 -> v15 migration, not played. Run with
//   npx vite-node scripts/make-v15-fixtures.ts && npx prettier --write tests/saves/fixtures/v15.json
// v15-played.json (TB.10) is made with the real commands.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadEnvelope, makeEnvelope, encodeSaveFile } from '../src/core/save';

const fixtures = new URL('../tests/saves/fixtures/', import.meta.url);
const loaded = loadEnvelope(JSON.parse(readFileSync(new URL('v14-owner.json', fixtures), 'utf8')));
if (!loaded.ok) throw new Error(loaded.error);
const state = loaded.value.state;
writeFileSync(new URL('v15.json', fixtures), encodeSaveFile(makeEnvelope(state, state.time)));
console.log(
  `v15 fixture written: cycle ${state.cycle.number}, ${Object.keys(state.layout.placed).length} placed pieces`,
);
