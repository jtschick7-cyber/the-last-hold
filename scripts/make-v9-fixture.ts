// Plan T9.1: makes tests/saves/fixtures/v9.json, the owner's real v8 save (v8-owner.json) after the
// v8 -> v9 migration and 72 h of play by the Standard policy, under the save's own seed. Run with
//   npx vite-node scripts/make-v9-fixture.ts && npx prettier --write tests/saves/fixtures/v9.json
import { readFileSync, writeFileSync } from 'node:fs';
import { loadEnvelope, makeEnvelope, encodeSaveFile } from '../src/core/save';
import { play } from '../src/core/policies';

const fixtures = new URL('../tests/saves/fixtures/', import.meta.url);
const loaded = loadEnvelope(JSON.parse(readFileSync(new URL('v8-owner.json', fixtures), 'utf8')));
if (!loaded.ok) throw new Error(loaded.error);
const state = loaded.value.state;
const HOURS_72 = 72 * 60 * 60 * 1000;
play(state, { policy: 'standard', startedAt: state.time, until: state.time + HOURS_72 });
writeFileSync(new URL('v9.json', fixtures), encodeSaveFile(makeEnvelope(state, state.time)));
console.log(
  `v9.json written: cycle ${state.cycle.number}, ${state.cycle.age}, events opened ${state.events.opened}`,
);
