// GDD §5.10.5, §9.15 (D298 follow-up): the Unlit's "but…" line is red, in both themes, and the red is
// one of the palette's 32 colors (D58).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { palette } from '../../src/content/palette';

const tokens = readFileSync('src/ui/styles/tokens.css', 'utf8');
const delveCss = readFileSync('src/ui/delve/Delve.module.css', 'utf8');
const bad = [...tokens.matchAll(/--c-bad:\s*#([0-9a-f]{6})/gi)].map((m) =>
  (m[1] ?? '').toLowerCase(),
);

describe('the drawback red', () => {
  it('is defined for the dark and the light theme, both Zughy 32 colors, both red', () => {
    expect(bad).toHaveLength(2);
    for (const hex of bad) {
      expect(palette?.colors).toContain(hex);
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [
        number,
        number,
        number,
      ];
      expect(r).toBeGreaterThan(g * 2);
      expect(r).toBeGreaterThan(b * 2);
    }
  });

  it('colors the Unlit’s "but…" line, not the yellow warning', () => {
    const rule = /\.but\s*\{([^}]*)\}/.exec(delveCss)?.[1] ?? '';
    expect(rule).toContain('var(--c-bad)');
    expect(rule).not.toContain('--c-warn');
  });
});
