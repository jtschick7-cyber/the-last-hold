// Plan T11.1 (OUT-8): makes tests/saves/fixtures/v11.json, v10.json (the owner's save, not played)
// after the v10 -> v11 migration. The scripted past-Act-VI fixture, v11-played.json, comes at T11.5.
// Run with
//   npx vite-node scripts/make-v11-fixture.ts && npx prettier --write tests/saves/fixtures/v11.json
import { readFileSync, writeFileSync } from 'node:fs';
import { loadEnvelope, makeEnvelope, encodeSaveFile } from '../src/core/save';

const fixtures = new URL('../tests/saves/fixtures/', import.meta.url);
const loaded = loadEnvelope(JSON.parse(readFileSync(new URL('v10.json', fixtures), 'utf8')));
if (!loaded.ok) throw new Error(loaded.error);
const state = loaded.value.state;
writeFileSync(new URL('v11.json', fixtures), encodeSaveFile(makeEnvelope(state, state.time)));
console.log(
  `v11.json written: cycle ${state.cycle.number}, remembering ${JSON.stringify(state.remembering)}`,
);
