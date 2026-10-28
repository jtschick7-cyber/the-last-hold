// Plan TD.2 (D562): makes tests/saves/fixtures/v14.json, the owner's real v1.3 save
// (v13-owner.json, exported at TD.1) after the v13 -> v14 migration, not played. Run with
//   npx vite-node scripts/make-v14-fixtures.ts && npx prettier --write tests/saves/fixtures/v14.json
// v14-played.json is made in TD.4b with the real Descent commands.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadEnvelope, makeEnvelope, encodeSaveFile } from '../src/core/save';

const fixtures = new URL('../tests/saves/fixtures/', import.meta.url);
const loaded = loadEnvelope(JSON.parse(readFileSync(new URL('v13-owner.json', fixtures), 'utf8')));
if (!loaded.ok) throw new Error(loaded.error);
const state = loaded.value.state;
writeFileSync(new URL('v14.json', fixtures), encodeSaveFile(makeEnvelope(state, state.time)));
console.log(
  `v14 fixture written: cycle ${state.cycle.number}, descent ${JSON.stringify(state.descent)}`,
);
