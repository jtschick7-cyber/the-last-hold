import { describe, expect, it } from 'vitest';
import { num } from '../../core/balance-access';
import { bestiaryLegend } from './knowledge-text';

describe('bestiary legend (GDD §9.8)', () => {
  it('reads the Studied and Mastered thresholds from balance, never typed by hand', () => {
    const text = bestiaryLegend();
    expect(text).toContain(`Win ${num('knowledge.studiedKills')} times to study a species`);
    expect(text).toContain(`${num('knowledge.masteredKills')} to master it`);
  });
});
