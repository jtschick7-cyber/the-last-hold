// Plan T4.11a: The Hearth's effect lines come from the content values (GDD §8.9–8.10).
import { describe, expect, it } from 'vitest';
import { RELIC_IDS, relics } from '../../src/content/relics';
import { UPGRADE_IDS, upgrades } from '../../src/content/warden-upgrades';
import { describeRelic, describeUpgrade } from '../../src/core/describe-long-night';

describe('upgrade and relic effect lines', () => {
  it('every upgrade and relic has one, naming its number', () => {
    for (const id of UPGRADE_IDS) {
      const e = upgrades[id].effect;
      const line = describeUpgrade(id);
      expect(line.length, id).toBeGreaterThan(10);
      if ('perLevel' in e && typeof e.perLevel === 'number' && e.kind !== 'offlineCap')
        expect(line, id).toContain(`${Math.round(e.perLevel * 100)}%`);
    }
    for (const id of RELIC_IDS)
      expect(describeRelic(id), id).toContain(`${Math.round(relics[id].effect.amount * 100)}%`);
    expect(describeUpgrade('late-lantern')).toContain('1h');
    expect(describeRelic('masons-plumb')).toBe('+10% wood and iron');
  });
});
