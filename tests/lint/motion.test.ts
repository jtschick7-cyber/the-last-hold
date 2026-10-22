// Plan TV.5: nothing may move outside the reduced-motion gate (CSS) or the registry (JS).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { motionOutsideRegistry, ungatedMotion } from './motion-check';

const ROOT = new URL('../../src/ui', import.meta.url).pathname;
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
const files = walk(ROOT);
const REGISTRY = ['src/ui/motion/registry.ts'];

describe('CSS motion sits behind the reduced-motion gate', () => {
  it('every animation and transition in src/ui is gated', () => {
    const bad = files
      .filter((f) => f.endsWith('.css'))
      .flatMap((f) => ungatedMotion(readFileSync(f, 'utf8')).map((l) => `${f}: ${l}`));
    expect(bad).toEqual([]);
  });

  it('there is motion in the CSS at all (the scan is not reading nothing)', () => {
    const gated = files
      .filter((f) => f.endsWith('.css'))
      .filter((f) => /(animation|transition)\s*:/.test(readFileSync(f, 'utf8')));
    expect(gated.length).toBeGreaterThanOrEqual(3);
  });

  it('fails on a planted ungated transition', () => {
    expect(ungatedMotion('.a { color: red; transition: opacity 1s; }')).toHaveLength(1);
    expect(ungatedMotion('.a { animation: spin 1s infinite; }')).toHaveLength(1);
    expect(
      ungatedMotion('@media (prefers-reduced-motion: no-preference) { .a { transition: x 1s; } }'),
    ).toHaveLength(1);
    expect(
      ungatedMotion(
        "@media (prefers-reduced-motion: no-preference) { :root:not([data-motion='on']) .a { transition: x 1s; } }",
      ),
    ).toEqual([]);
    expect(ungatedMotion('.a { animation: none !important; transition: none; }')).toEqual([]);
  });
});

describe('JS motion goes through the registry', () => {
  it('no timer, frame, animate() or inline motion in src/ui outside it', () => {
    const bad = files
      .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f))
      .filter((f) => !REGISTRY.some((r) => f.endsWith(r)))
      .flatMap((f) => motionOutsideRegistry(readFileSync(f, 'utf8')).map((l) => `${f}:${l}`));
    expect(bad).toEqual([]);
  });

  it('fails on a planted timer, frame, animate() and inline transition', () => {
    expect(motionOutsideRegistry('setInterval(() => step(), 100);')).toHaveLength(1);
    expect(motionOutsideRegistry('requestAnimationFrame(draw);')).toHaveLength(1);
    expect(motionOutsideRegistry('el.animate({ opacity: [0, 1] }, 200);')).toHaveLength(1);
    expect(motionOutsideRegistry("<div style={{ transition: 'all 1s' }} />")).toHaveLength(1);
    expect(motionOutsideRegistry('// not motion: the clock\nsetInterval(tick, 1000);')).toEqual([]);
  });

  it('the registry is where the playback timers come from', () => {
    const registry = readFileSync(join(ROOT, 'motion/registry.ts'), 'utf8');
    expect(registry).toMatch(/setInterval/);
    for (const f of ['delve/PlaybackView.tsx', 'remembering/timing.ts'])
      expect(readFileSync(join(ROOT, f), 'utf8')).toMatch(/motionInterval/);
  });
});
