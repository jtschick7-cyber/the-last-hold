// GDD §9.25: the Breach strings the core's breakdown lines use equal the table word for word.
// TB.9 adds the check that the whole table (29 strings in 23 rows) is in the code and nothing else.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BREACH_TEXT } from '../../src/content/breach-text';

const gdd = readFileSync(new URL('../../docs/gdd.md', import.meta.url), 'utf8');
const start = gdd.indexOf('### 9.25 The Breach');
const section = gdd.slice(start, gdd.indexOf('\n## 10.', start));
const table = section.slice(section.indexOf('| String | Where it shows |'));

describe('the Breach strings used in breakdowns', () => {
  it('match the GDD §9.25 table word for word', () => {
    const t = BREACH_TEXT;
    for (const s of [
      t.lane('{n}'),
      t.ownColumn('{p}'),
      t.ruinedEdge('{p}'),
      t.cover('{p}'),
      t.stacked('{p}'),
      t.walls('{t}'),
      t.tower('{x}', '{p}'),
      t.volley('{v}'),
    ])
      expect(table, s).toContain(`\`${s}\``);
    expect(table).toContain(`\`${t.westNeighbour('{p}')}\` / \`${t.eastNeighbour('{p}')}\``);
  });
});
