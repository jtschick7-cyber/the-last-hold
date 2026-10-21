// Plan T10.16: makes tests/saves/fixtures/v10-played.json, the owner's v9 save after the v9 -> v10
// migration, the load path (which opens the Orders, T10.6) and 72 h of play by the Standard policy
// under the save's own seed. The policy never seats an Order, so none is seated. Run with
//   npx vite-node scripts/make-v10-played-fixture.ts && npx prettier --write tests/saves/fixtures/v10-played.json
import { readFileSync, writeFileSync } from 'node:fs';
import { play } from '../src/core/policies';
import { loadEnvelope, makeEnvelope, encodeSaveFile } from '../src/core/save';
import { catchUpNow } from '../src/core/sim/offline';

const fixtures = new URL('../tests/saves/fixtures/', import.meta.url);
const loaded = loadEnvelope(JSON.parse(readFileSync(new URL('v10.json', fixtures), 'utf8')));
if (!loaded.ok) throw new Error(loaded.error);
const state = loaded.value.state;
catchUpNow(state, state.time);
const HOURS_72 = 72 * 60 * 60 * 1000;
play(state, { policy: 'standard', startedAt: state.time, until: state.time + HOURS_72 });
writeFileSync(
  new URL('v10-played.json', fixtures),
  encodeSaveFile(makeEnvelope(state, state.time)),
);
console.log(
  `v10-played.json written: cycle ${state.cycle.number}, opened ${Object.keys(state.orders.opened)}, seats ${state.orders.seats.length}`,
);
