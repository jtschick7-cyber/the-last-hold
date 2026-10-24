// Plan KV.7 (GDD §9.23): the Roll of Wardens carries each stand's Rising Vigil level; a warden whose
// stand has none reads exactly as before (level 0).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadEnvelope } from '../../src/core/save';
import { rollOfWardens } from '../../src/core/story/wardens';

const load = (f: string) => {
  const r = loadEnvelope(
    JSON.parse(readFileSync(new URL(`../saves/fixtures/${f}`, import.meta.url), 'utf8')),
  );
  if (!r.ok) throw new Error(r.error);
  return r.value.state;
};

describe('the Roll of Wardens and Rising Vigil', () => {
  it('shows each warden at the level of their stand, and 0 where there was none', () => {
    const s = load('v13-played.json');
    const levels = rollOfWardens(s).map((l) => l.vigilLevel);
    expect(levels).toEqual(s.cycles.map((c) => c.stand?.vigilLevel ?? 0));
    expect(levels).toContain(3);
    expect(levels[0]).toBe(0);
  });

  it('a save from before v1.3 has no level on any line', () => {
    expect(rollOfWardens(load('v12-played.json')).every((l) => l.vigilLevel === 0)).toBe(true);
  });
});
