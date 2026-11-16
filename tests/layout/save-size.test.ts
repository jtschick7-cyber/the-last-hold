// Plan TL.1 (D506, M5): the whole layout block with all 40 pieces placed stays within 1.5 KB.
import { describe, expect, it } from 'vitest';
import { PIECES } from '../../src/content/hold-layout';
import { canonicalLayout } from '../../src/core/systems/layout-catalog';

describe('the layout save growth (D506, D621)', () => {
  it('is at most 1.5 KB with every piece placed', () => {
    const bytes = new TextEncoder().encode(JSON.stringify(canonicalLayout())).length;
    expect(Object.keys(canonicalLayout().placed)).toHaveLength(40);
    expect(bytes).toBeLessThanOrEqual(1536);
  });

  it('is at most 2.0 KB (2048 B) with 40 placed pieces and 2 full presets (GDD §6.5)', () => {
    const layout = canonicalLayout();
    const fullSlot = PIECES.map((def) => {
      const c = layout.placed[def.id];
      return c ? ([c.x, c.y] as const) : null;
    });
    layout.presets = [fullSlot, fullSlot];
    const bytes = new TextEncoder().encode(JSON.stringify(layout)).length;
    expect(bytes).toBeLessThanOrEqual(2048);
  });
});
