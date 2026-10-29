// Plan TB.9 (GDD §9.25, D593): every Breach string in the code is one of the table's, word for word,
// and every string of the table is in the code (29 strings in 23 rows). Nothing else may be invented.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BREACH_TEXT as T } from '../../src/content/breach-text';

const gdd = readFileSync(new URL('../../docs/gdd.md', import.meta.url), 'utf8');
const start = gdd.indexOf('### 9.25 The Breach');
const section = gdd.slice(start, gdd.indexOf('\n## 10.', start));
const rows = section
  .slice(section.indexOf('| String | Where it shows |'))
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l.startsWith('|') && !l.startsWith('| String') && !l.startsWith('|---'));
const tableStrings = rows.flatMap((l) => {
  const first = l.split('|')[1] ?? '';
  return [...first.matchAll(/`([^`]+)`/g)].map((m) => m[1] as string);
});

/** Each code string with the placeholder names the table uses. */
const built: Record<keyof typeof T, string[]> = {
  lane: [T.lane('{n}')],
  ownColumn: [T.ownColumn('{p}')],
  westNeighbour: [T.westNeighbour('{p}')],
  eastNeighbour: [T.eastNeighbour('{p}')],
  ruinedEdge: [T.ruinedEdge('{p}')],
  cover: [T.cover('{p}')],
  stacked: [T.stacked('{p}')],
  walls: [T.walls('{t}')],
  tower: [T.tower('{x}', '{p}')],
  volley: [T.volley('{v}')],
  lanes: [T.lanes],
  coverBox: [T.coverBox('{p}')],
  strip: [T.strip],
  list: [T.list],
  hint: [T.hint],
  listLine: [T.listLine('{n}', '{p}', '{r}', '{w}')],
  help: [T.help],
  empty: [T.empty],
  suggest: [T.suggest],
  suggested: [T.suggested('{n}', '{m}')],
  useThis: [T.useThis],
  trayLine: [T.trayLine(2).replace('2', '{n}'), T.trayLine(1)],
  arrangeHold: [T.arrangeHold],
  logHeader: [T.logHeader('{n}', '{p}')],
};

describe('the Breach strings are exactly the GDD §9.25 table', () => {
  it('the table has 23 rows and 29 strings', () => {
    expect(rows).toHaveLength(23);
    expect(tableStrings).toHaveLength(29);
  });

  it('every string in the code is in the table', () => {
    expect(Object.keys(T).sort()).toEqual(Object.keys(built).sort());
    for (const s of Object.values(built).flat()) expect(tableStrings, s).toContain(s);
  });

  it('every string in the table is in the code (the forms of {w} come from wavesText)', () => {
    const code = new Set(Object.values(built).flat());
    const wavesForms = ['{a}', '{a} and {b}', '{a}, {b} and {c}', 'none in the first {k}'];
    for (const s of tableStrings) expect(code.has(s) || wavesForms.includes(s), s).toBe(true);
  });
});
