// Plan T10.1 (OUT-8): makes tests/saves/fixtures/v10.json, the owner's v9 save (v9-owner.json) after
// the v9 -> v10 migration and NOT played (the played fixture, v10-played.json, comes at T10.16).
// Orders are not opened and nothing is seated: the load path opens them (T10.6). Run with
//   npx vite-node scripts/make-v10-fixture.ts && npx prettier --write tests/saves/fixtures/v10.json
import { readFileSync, writeFileSync } from 'node:fs';
import { loadEnvelope, makeEnvelope, encodeSaveFile } from '../src/core/save';

const fixtures = new URL('../tests/saves/fixtures/', import.meta.url);
const loaded = loadEnvelope(JSON.parse(readFileSync(new URL('v9-owner.json', fixtures), 'utf8')));
if (!loaded.ok) throw new Error(loaded.error);
const state = loaded.value.state;
writeFileSync(new URL('v10.json', fixtures), encodeSaveFile(makeEnvelope(state, state.time)));
console.log(
  `v10.json written: cycle ${state.cycle.number}, start ${JSON.stringify(state.orders.start)}`,
);
