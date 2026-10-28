// Plan TD.3 (M2, D560): The Unlit is descentOnly. Adding it changes none of the places that draw or
// count species: Delve guardian draws, floor groups, contract candidates, the stand's pools and the
// Forgotten's count. The hash was taken on the code BEFORE The Unlit was added (TD.3).
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { LOCATION_IDS } from '../../src/content/damage';
import { GUARDIAN_IDS } from '../../src/content/delves/guardians';
import { MONSTER_IDS } from '../../src/content/monsters';
import { candidatesFor } from '../../src/core/contracts/candidates';
import { floorSpecies, guardianOf } from '../../src/core/delves/generate';
import { unstudiedSpecies } from '../../src/core/delves/nameless';
import { speciesForTier, waveAt } from '../../src/core/stand/waves';
import { createNewGame } from '../../src/core/state/new-game';

const snapshot = (): string => {
  const out: unknown[] = [[...MONSTER_IDS], [...GUARDIAN_IDS]];
  for (let i = 0; i < 200; i++) out.push(guardianOf(`seed-${i}`));
  for (let i = 0; i < 40; i++)
    for (let floor = 1; floor <= 6; floor++)
      for (const base of [1, 3, 5]) out.push(floorSpecies(`f-${i}`, floor, base));
  for (let t = 1; t <= 8; t++) out.push(speciesForTier(t));
  for (const l of LOCATION_IDS) for (let t = 1; t <= 5; t++) out.push(candidatesFor(l, t));
  for (let i = 0; i < 30; i++)
    for (let n = 1; n <= 30; n++)
      for (const pool of ['base', 'dross'] as const) out.push(waveAt(`w-${i}`, n, pool));
  out.push(unstudiedSpecies(createNewGame('leak', 0)));
  return JSON.stringify(out);
};

describe('The Unlit leaks into no draw or count (M2)', () => {
  it('every draw and pool is byte-identical to the code before The Unlit existed', () => {
    const hash = createHash('sha256').update(snapshot()).digest('hex');
    expect(hash).toBe('e7754d6919068dec06339370a51f1b87f32837ebfa5f298856f802a85da1c67a');
  });

  it('is in none of the id lists', () => {
    const s = snapshot();
    expect(s).not.toContain('"unlit"');
    expect((MONSTER_IDS as readonly string[]).includes('unlit')).toBe(false);
    expect((GUARDIAN_IDS as readonly string[]).includes('unlit')).toBe(false);
  });
});
