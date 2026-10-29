// Plan TB.13 (technical design §23.4, D593): records the version 6 stand goldens, one per layout, from
// the owner's real v14 save migrated (v15.json), with real commands: Auto-arrange, the Suggest layout,
// the deliberately bad layout, no towers placed, and an edges-only layout (pieces only in columns 0
// and 7). Run once, after the final constants are in, with
//   npx vite-node scripts/make-stands-v6-goldens.ts && npx prettier --write tests/golden/stands-v6/*.json
import { readFileSync, writeFileSync } from 'node:fs';
import { PIECES } from '../src/content/hold-layout';
import { apply, type Command } from '../src/core/commands';
import { loadEnvelope } from '../src/core/save';
import { catchUpNow } from '../src/core/sim/offline';
import { replayStand } from '../src/core/stand/replay';
import { tacticianCommands } from '../src/core/systems/breach';
import { badLayoutCommands } from '../sim/breach-probe';
import { standLines } from '../tests/golden/stands-v6/lines';

const fixtures = new URL('../tests/saves/fixtures/', import.meta.url);
const outDir = new URL('../tests/golden/stands-v6/', import.meta.url);
const loaded = loadEnvelope(JSON.parse(readFileSync(new URL('v15.json', fixtures), 'utf8')));
if (!loaded.ok) throw new Error(loaded.error);
const state = loaded.value.state;
catchUpNow(state, state.time);
const must = (cmd: Command): void => {
  const r = apply(state, cmd, state.time);
  if (!r.ok) throw new Error(`${cmd.type}: ${r.reason}`);
};
const defenses = (): string[] =>
  PIECES.filter((p) => p.id.startsWith('wall-') || p.id.startsWith('watchtower-')).map((p) => p.id);

const layouts: Record<string, () => void> = {
  'auto-arrange': () => must({ type: 'layout.autoArrange' }),
  suggest: () => tacticianCommands(state).forEach(must),
  'bad-layout': () => badLayoutCommands(state).forEach(must),
  'no-towers': () => {
    must({ type: 'layout.autoArrange' });
    for (const id of defenses())
      if (id.startsWith('watchtower-') && state.layout.placed[id as never])
        must({ type: 'layout.unplace', pieceId: id as never });
  },
  'edges-only': () => {
    for (const id of defenses())
      if (state.layout.placed[id as never]) must({ type: 'layout.unplace', pieceId: id as never });
    const tiles = [0, 7].flatMap((x) => [0, 1, 2].map((y) => ({ x, y })));
    const free = tiles.filter(
      (t) => !Object.values(state.layout.placed).some((at) => at.x === t.x && at.y === t.y),
    );
    const order = [
      ...defenses().filter((id) => id.startsWith('watchtower-')),
      ...defenses().filter((id) => id.startsWith('wall-')),
    ];
    order.slice(0, free.length).forEach((id, i) => {
      const t = free[i];
      if (t) must({ type: 'layout.place', pieceId: id as never, x: t.x, y: t.y });
    });
  },
};

for (const [name, arrange] of Object.entries(layouts)) {
  must({ type: 'debug.layoutFillBastion' });
  arrange();
  const record = state.cycles[state.cycles.length - 1];
  if (record) record.ranks.bastion ??= state.time;
  must({ type: 'stand.make', party: state.roster.active.slice(0, 6) as never });
  const made = record?.stand;
  if (!made?.lanes) throw new Error(`${name}: the stand carries no lane table`);
  const lines = standLines(replayStand(made));
  writeFileSync(
    new URL(`${name}.json`, outDir),
    JSON.stringify({ name, record: made, wavesHeld: made.wavesHeld, lines }),
  );
  console.log(
    `${name}: ${made.wavesHeld} waves, ${lines.length} lines, pieces ${made.lanes.pieces.join('')}`,
  );
}
