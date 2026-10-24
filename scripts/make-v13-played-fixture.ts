// Plan KV.4 (D543, technical design §21.6): makes tests/saves/fixtures/v13-played.json from
// v13.json (the owner's real v12 save, migrated), with the real commands: Act VI's stand and the
// gate by the Remembering debug path (D462), then three stands with Rising Vigil On (levels 1, 2,
// 3), one with it Off (no level), and the switch turned On again, so the next On stand is level 4.
// Run with
//   npx vite-node scripts/make-v13-played-fixture.ts && npx prettier --write tests/saves/fixtures/v13-played.json
import { readFileSync, writeFileSync } from 'node:fs';
import { apply, type Command } from '../src/core/commands';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../src/core/save';
import { catchUpNow } from '../src/core/sim/offline';

const fixtures = new URL('../tests/saves/fixtures/', import.meta.url);
const loaded = loadEnvelope(JSON.parse(readFileSync(new URL('v13.json', fixtures), 'utf8')));
if (!loaded.ok) throw new Error(loaded.error);
const state = loaded.value.state;
catchUpNow(state, state.time);
const must = (cmd: Command): void => {
  const r = apply(state, cmd, state.time);
  if (!r.ok) throw new Error(`${cmd.type}: ${r.reason}`);
};
const stand = (): void => {
  state.cycle.age = 'bastion';
  const record = state.cycles[state.cycles.length - 1];
  if (record) record.ranks.bastion ??= state.time;
  must({ type: 'stand.make', party: state.roster.active.slice(0, 6) as never });
};
must({ type: 'debug.rememberingFinishActVI' });
must({ type: 'remembering.seeNear' });
must({ type: 'debug.rememberingOpenGate' });
for (const on of [true, true, true, false]) {
  must({ type: 'vigil.set', on });
  stand();
}
must({ type: 'vigil.set', on: true });
writeFileSync(
  new URL('v13-played.json', fixtures),
  encodeSaveFile(makeEnvelope(state, state.time)),
);
console.log(
  `v13-played written: vigil ${JSON.stringify(state.vigil)}, cycle ${state.cycle.number}`,
);
