// Plan T11.7 (GDD §9.19, lore §34.3, §34.5): the reading. 40 names in year order at the set pace; a
// tap shows the next at once; Skip jumps to the last frame; the table equals lore §34.5 and the
// Names view's data; R-03 and the Unlit's line equal the lore.
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rememberScene, unlitLine } from '../../src/content/text/remembering';
import { apply } from '../../src/core/commands';
import { loadEnvelope } from '../../src/core/save';
import { namesView } from '../../src/core/story/archive';
import { readingFrames } from '../../src/core/story/remembering-view';
import { createReadingPlayer, READING_INTERVAL_MS } from '../../src/ui/remembering/timing';

const lore = readFileSync(new URL('../../docs/lore-secrets.md', import.meta.url), 'utf8');
const section = lore.slice(lore.indexOf('### 34.5 The reading'), lore.indexOf('### 34.6'));

describe('the reading’s table', () => {
  const table = [...section.matchAll(/^\| (\d+) \| (.+?) \| (.+?) \| (\d+) \|$/gm)].map((m) => ({
    n: Number(m[1]),
    name: m[2],
    line: `${m[3]} · onward, year ${m[4]} of the order.`,
  }));

  it('equals lore §34.5, 40 names in order of year', () => {
    expect(table).toHaveLength(40);
    expect(readingFrames()).toEqual(table);
    const years = readingFrames().map((f) => Number(/year (\d+)/.exec(f.line)?.[1]));
    expect(years).toEqual([...years].sort((a, b) => a - b));
  });

  it('comes from the same data as the Names view', () => {
    const env = JSON.parse(
      readFileSync(new URL('../saves/fixtures/v11.json', import.meta.url), 'utf8'),
    );
    const r = loadEnvelope(env);
    if (!r.ok) throw new Error(r.error);
    const s = r.value.state;
    expect(apply(s, { type: 'debug.rememberingOpenGate' }, s.time).ok).toBe(true);
    const rows = namesView(s).rows;
    expect(rows.every((row) => row.found)).toBe(true);
    const byN = new Map(rows.map((row) => [row.n, row.text]));
    for (const f of readingFrames()) {
      expect(byN.get(f.n)).toBe(`${f.name} — ${f.line.replace(' · ', ' — ')}`);
    }
  });
});

describe('the texts', () => {
  it('R-03 equals lore §34.3', () => {
    const from = lore.indexOf('### 34.3');
    const block = lore.slice(from, lore.indexOf('*Wrongness:* the frost', from));
    const paras = block
      .split('\n')
      .filter((l) => l.startsWith('> '))
      .map((l) => l.slice(2).trim())
      .filter(Boolean);
    expect(rememberScene.paragraphs).toEqual(paras);
  });

  it('the Unlit’s line equals lore §34.5', () => {
    expect(section).toContain(`> ${unlitLine.heading}`);
    expect(section).toContain(`> ${unlitLine.text}`);
  });
});

describe('the reading’s pace (fake timers)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const make = () => {
    const seen: number[] = [];
    const p = createReadingPlayer(40, (i) => seen.push(i));
    p.start();
    return { p, seen };
  };

  it('shows a name every interval until the end, then the final frame', () => {
    const { p, seen } = make();
    vi.advanceTimersByTime(READING_INTERVAL_MS * 39);
    expect(p.index()).toBe(39);
    expect(p.finished()).toBe(false);
    vi.advanceTimersByTime(READING_INTERVAL_MS);
    expect(p.index()).toBe(40);
    expect(p.finished()).toBe(true);
    vi.advanceTimersByTime(READING_INTERVAL_MS * 5);
    expect(seen).toHaveLength(40);
  });

  it('the pace is about 2 seconds', () => {
    expect(READING_INTERVAL_MS).toBe(2000);
  });

  it('a tap shows the next at once and restarts the interval', () => {
    const { p } = make();
    vi.advanceTimersByTime(READING_INTERVAL_MS - 1);
    p.tap();
    expect(p.index()).toBe(1);
    vi.advanceTimersByTime(READING_INTERVAL_MS - 1);
    expect(p.index()).toBe(1);
    vi.advanceTimersByTime(1);
    expect(p.index()).toBe(2);
  });

  it('Skip jumps to the last frame and stops the clock', () => {
    const { p, seen } = make();
    p.skip();
    expect(p.index()).toBe(40);
    expect(p.finished()).toBe(true);
    vi.advanceTimersByTime(READING_INTERVAL_MS * 3);
    expect(seen.at(-1)).toBe(40);
    p.tap();
    expect(p.index()).toBe(40);
  });
});
