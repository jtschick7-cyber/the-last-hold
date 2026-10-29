// Plan TB.10 (technical design §23.6): makes tests/saves/fixtures/v15-played.json from v15.json (the
// owner's real v14 save, migrated), with the real commands: four Last Stands from Bastion, each with a
// different hold: the canonical arrangement; a few defenses put on the front rows by `layout.place`
// with the rest of the hold in the Tray; a wall taken to the Tray (`layout.unplace`) so a stand starts
// with the Tray non-empty; and the suggestion applied by `layout.setDefenses`. Then
// `debug.breach.freeze` is read once. Run with
//   npx vite-node scripts/make-v15-played-fixture.ts && npx prettier --write tests/saves/fixtures/v15-played.json
import { readFileSync, writeFileSync } from 'node:fs';
import { apply, type Command } from '../src/core/commands';
import { encodeSaveFile, loadEnvelope, makeEnvelope } from '../src/core/save';
import { catchUpNow } from '../src/core/sim/offline';
import { suggestLayout } from '../src/core/systems/breach';

const fixtures = new URL('../tests/saves/fixtures/', import.meta.url);
const loaded = loadEnvelope(JSON.parse(readFileSync(new URL('v15.json', fixtures), 'utf8')));
if (!loaded.ok) throw new Error(loaded.error);
const state = loaded.value.state;
catchUpNow(state, state.time);
const must = (cmd: Command): void => {
  const r = apply(state, cmd, state.time);
  if (!r.ok) throw new Error(`${cmd.type}: ${r.reason}`);
};
const stand = (): void => {
  const record = state.cycles[state.cycles.length - 1];
  if (record) record.ranks.bastion ??= state.time;
  must({ type: 'stand.make', party: state.roster.active.slice(0, 6) as never });
};
/** A fresh cycle is at Hamlet: take the hold to Bastion with every defense owned. */
const bastion = (): void => must({ type: 'debug.layoutFillBastion' });

bastion();
stand(); // 1: the canonical arrangement

bastion();
must({ type: 'layout.clear' });
for (const [piece, x] of [
  ['wall-1', 1],
  ['wall-2', 2],
  ['watchtower-1', 4],
  ['wall-3', 6],
] as const)
  must({ type: 'layout.place', pieceId: piece, x, y: 0 });
stand(); // 2: a few defenses on the front row, everything else in the Tray

bastion();
must({ type: 'layout.unplace', pieceId: 'wall-1' });
must({ type: 'layout.unplace', pieceId: 'watchtower-1' });
stand(); // 3: canonical, but a wall and a tower wait in the Tray

bastion();
must({ type: 'layout.clear' });
must({ type: 'layout.setDefenses', moves: [...suggestLayout(state).moves] });
stand(); // 4: the suggestion applied

must({ type: 'debug.breach.freeze' });
writeFileSync(
  new URL('v15-played.json', fixtures),
  encodeSaveFile(makeEnvelope(state, state.time)),
);
console.log(
  `v15-played written: cycle ${state.cycle.number}, stands ${state.cycles.filter((c) => c.stand).length}, with lanes ${state.cycles.filter((c) => c.stand?.lanes).length}`,
);
