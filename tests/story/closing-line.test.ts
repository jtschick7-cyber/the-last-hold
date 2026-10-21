// Plan T11.3 (GDD §5.9.7, §5.14.9, D415, D455, D465): the Act VI closing line is gone, replaced by
// nothing. A cycle with no act skips that step of the Long Night; Act VI's testament still plays.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAST_WRITTEN_ACT } from '../../src/content/story/acts';
import { actClosing, longNightTestament } from '../../src/core/story/documents';
import { createNewGame } from '../../src/core/state/new-game';
import { isFound } from '../../src/core/story/documents';

const ROOT = new URL('../../', import.meta.url).pathname;
const LINE = /story continues in a later version/i;

const files = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files(path, out);
    else out.push(path);
  }
  return out;
};

describe('a cycle with no act (D455)', () => {
  it('has no testament step: nothing closes it', () => {
    const s = createNewGame('no-act', 0);
    expect(actClosing(null)).toBeNull();
    expect(actClosing(LAST_WRITTEN_ACT + 1)).toBeNull();
    expect(longNightTestament(s, null)).toBeNull();
    expect(longNightTestament(s, LAST_WRITTEN_ACT + 1)).toBeNull();
  });

  it('still closes Act VI with its testament, D6-06, once it is found', () => {
    const s = createNewGame('act-6', 0);
    expect(actClosing(6)).toMatchObject({ id: 'D6-06' });
    expect(longNightTestament(s, 6)).toBeNull(); // not found yet: no empty step either
    s.story.documents.push({ id: 'D6-06', cycle: 1, at: 0, via: 'stand' } as never);
    expect(isFound(s, 'D6-06')).toBe(true);
    expect(longNightTestament(s, 6)).toMatchObject({ id: 'D6-06' });
  });
});

describe('the closing line appears nowhere that ships', () => {
  it('is not in src/, in the shipped content, in the public folder or in the page', () => {
    const roots = ['src', 'public'].map((d) => join(ROOT, d));
    const found = [...roots.flatMap((r) => files(r)), join(ROOT, 'index.html')].filter((f) =>
      LINE.test(readFileSync(f, 'utf8')),
    );
    expect(found).toEqual([]);
  });

  it('is in docs/ only in the decisions log, docs/archive/ and docs/flesh-out/', () => {
    const docs = join(ROOT, 'docs');
    const allowed = ['docs/decisions.md', 'docs/archive/', 'docs/flesh-out/'];
    const found = files(docs)
      .map((f) => f.slice(ROOT.length))
      .filter((f) => LINE.test(readFileSync(join(ROOT, f), 'utf8')))
      .filter((f) => !allowed.some((a) => f === a || f.startsWith(a)));
    expect(found).toEqual([]);
  });
});
