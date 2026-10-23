// Plan TL.1 (D506, M5): the whole layout block with all 40 pieces placed stays within 1.5 KB.
import { describe, expect, it } from 'vitest';
import { canonicalLayout } from '../../src/core/systems/layout-catalog';

describe('the layout save growth (D506)', () => {
  it('is at most 1.5 KB with every piece placed', () => {
    const bytes = new TextEncoder().encode(JSON.stringify(canonicalLayout())).length;
    expect(Object.keys(canonicalLayout().placed)).toHaveLength(40);
    expect(bytes).toBeLessThanOrEqual(1536);
  });
});
