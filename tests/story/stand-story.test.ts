// Plan T5.11b1 (GDD §5.14.8–§5.14.9, D183): the stand remembers the trust steps it
// brought, so its result sheet can show them whenever it is opened.
import { describe, expect, it } from 'vitest';
import { VILLAGE_IDS } from '../../src/content/villages';
import type { GameState } from '../../src/core/state/game-state';
import { bandFor } from '../../src/core/story/band';
import { T0, keepRich, run } from '../contracts/helpers';

const SIX = ['halvar', 'zora', 'ostap', 'bjarna', 'vesna', 'radek'] as const;

const standAt = (level: number, party: readonly (typeof SIX)[number][]): GameState => {
  const s = keepRich('stand-story');
  s.cycle.age = 'bastion';
  s.time = T0;
  for (const h of Object.values(s.hunters)) if (h) h.level = level;
  // Bands are 12 / 15 from v0.6 (D194): defenses let a strong party reach Triumphant.
  s.buildings.walls = 10; // bands are 12 / 15 from v0.6 (D194): defenses carry a strong party to Triumphant
  s.buildings.watchtower = 10;
  expect(
    run(s, { type: 'stand.make', party: [...party], prep: { oils: {}, potions: {} } }).ok,
  ).toBe(true);
  return s;
};

const standOf = (s: GameState) => {
  const c = s.cycles.find((x) => x.stand);
  if (!c?.stand) throw new Error('no stand');
  return c.stand;
};

describe('the stand records its trust steps (D183)', () => {
  it('a Triumphant stand records one step for every village that could rise', () => {
    const s = standAt(20, SIX);
    const stand = standOf(s);
    console.log('WAVES', stand.wavesHeld);
    console.log('WAVES', stand.wavesHeld);
    expect(bandFor(stand.wavesHeld)).toBe('triumphant');
    expect(stand.trustSteps).toHaveLength(VILLAGE_IDS.length);
    for (const v of VILLAGE_IDS) {
      expect(stand.trustSteps.some((k) => k.startsWith(`trust:${v}:`))).toBe(true);
      expect(s.story.trust[v].triumphs).toBe(1);
    }
  });

  it('a Broken stand records none', () => {
    const s = standAt(1, ['halvar']);
    const stand = standOf(s);
    expect(bandFor(stand.wavesHeld)).toBe('broken');
    expect(stand.trustSteps).toEqual([]);
  });
});
