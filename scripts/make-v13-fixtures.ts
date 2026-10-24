// Plan KV.2 (D543): makes tests/saves/fixtures/v13.json, the owner's real v12 save
// (v12-owner.json, exported 2026-10-24) after the v12 -> v13 migration, not played. Run with
//   npx vite-node scripts/make-v13-fixtures.ts && npx prettier --write tests/saves/fixtures/v13.json
// v13-played.json is made in KV.4 with the real vigil commands.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadEnvelope, makeEnvelope, encodeSaveFile } from '../src/core/save';

const fixtures = new URL('../tests/saves/fixtures/', import.meta.url);
const loaded = loadEnvelope(JSON.parse(readFileSync(new URL('v12-owner.json', fixtures), 'utf8')));
if (!loaded.ok) throw new Error(loaded.error);
const state = loaded.value.state;
writeFileSync(new URL('v13.json', fixtures), encodeSaveFile(makeEnvelope(state, state.time)));
console.log(
  `v13 fixture written: cycle ${state.cycle.number}, vigil ${JSON.stringify(state.vigil)}`,
);
