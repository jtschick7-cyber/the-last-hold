// GDD §9.23: the nine approved strings are in the code exactly as in the GDD, and nothing else is.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  VIGIL_BUTTONS,
  VIGIL_CONFIRM,
  VIGIL_HELP,
  VIGIL_LABEL,
  VIGIL_RESULT,
  VIGIL_ROLL,
  VIGIL_STATUS_OFF,
  VIGIL_STATUS_ON,
  vigilLine,
} from '../../src/content/vigil-text';
import { embersMultiplier } from '../../src/core/systems/vigil';

const gdd = readFileSync(new URL('../../docs/gdd.md', import.meta.url), 'utf8');
const start = gdd.indexOf('### 9.23 Rising Vigil');
const section = gdd.slice(start, gdd.indexOf('\n### ', start + 1)); // up to the next section (9.24 follows it from v1.4)
const table = section.slice(section.indexOf('| String | Where it shows |'));

describe('Rising Vigil strings', () => {
  it('match the GDD §9.23 table word for word', () => {
    for (const s of [
      VIGIL_LABEL,
      VIGIL_HELP,
      VIGIL_STATUS_ON,
      VIGIL_STATUS_OFF,
      VIGIL_CONFIRM,
      VIGIL_RESULT,
      VIGIL_ROLL,
    ])
      expect(table).toContain(`| \`${s}\` |`);
    expect(table).toContain(`| \`${VIGIL_BUTTONS.on}\` / \`${VIGIL_BUTTONS.off}\` |`);
  });

  it('the table holds exactly nine rows', () => {
    const rows = table.split('\n').filter((l) => /^\s*\| `/.test(l));
    expect(rows).toHaveLength(9); // On / Off counts as one
  });

  it('the Embers breakdown line built in core matches the table', () => {
    expect(table).toContain('| `Rising Vigil: +{y}% on the waves part` |');
    const line = embersMultiplier(10, 2).breakdown.children?.[1]?.label ?? '';
    expect(line).toMatch(/^Rising Vigil: \+\d+% on the waves part$/);
  });

  it('fills the count', () => {
    expect(vigilLine(VIGIL_STATUS_ON, 3)).toBe('This stand: vigil level 3');
  });
});
