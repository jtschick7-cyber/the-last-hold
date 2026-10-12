// Plan T1.6 / technical design §14: every proper noun in the content has passed
// the GDD §2.3 collision search. Never skip this test; an unchecked name goes to
// docs/questions.md and the test stays red until it's checked.
import { describe, expect, it } from 'vitest';
import { findContentNames } from './find-names';
import { checkedNames } from './names';

const modules = import.meta.glob<Record<string, unknown>>('../../src/content/**/*.ts', {
  eager: true,
});
const found = findContentNames(modules);
const checked = new Set(checkedNames.map((n) => n.name));

describe('name collision list', () => {
  it('finds the content names', () => {
    expect(found).toContain('Hearth Hall');
    expect(found).toContain('Roll of Honor'); // from a properNouns export
    expect(found).toContain('Brana'); // from a shortName
  });

  it('every content name has passed the collision search', () => {
    expect(found.filter((n) => !checked.has(n))).toEqual([]);
  });

  it('every entry is dated and listed once', () => {
    for (const n of checkedNames) expect(n.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(checked.size).toBe(checkedNames.length);
  });
});
