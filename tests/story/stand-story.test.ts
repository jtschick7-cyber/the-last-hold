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
  it('a Triumphant stand records the steps it completed, and counts toward every village (D195)', () => {
    const s = standAt(20, SIX);
    const stand = standOf(s);
    expect(bandFor(stand.wavesHeld)).toBe('triumphant');
    expect(stand.band).toBe('triumphant');
    // Ten contracts' progress: only the Cold villages complete a step (10 needed).
    expect(stand.trustSteps.sort()).toEqual(['trust:kozly-hollow:wary', 'trust:ravenfell:wary']);
    for (const v of VILLAGE_IDS) expect(s.story.trust[v].triumphs).toBe(1);
    expect(s.story.trust.mirograd.progress).toBe(10);
  });

  it('a Broken stand records none', () => {
    const s = standAt(1, ['halvar']);
    const stand = standOf(s);
    expect(bandFor(stand.wavesHeld)).toBe('broken');
    expect(stand.trustSteps).toEqual([]);
  });
});
