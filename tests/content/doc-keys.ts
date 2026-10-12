// Reads key lists out of the design docs, so content tests compare against the
// docs themselves rather than a hand-copied list (technical design §5.1).
import { readFileSync } from 'node:fs';

const doc = (name: string): string =>
  readFileSync(new URL(`../../docs/${name}`, import.meta.url), 'utf8');

const section = (text: string, startHeading: RegExp, endHeading: RegExp): string => {
  const start = text.search(startHeading);
  if (start < 0) throw new Error(`Heading not found: ${startHeading}`);
  const rest = text.slice(start);
  const end = rest.slice(1).search(endHeading);
  return end < 0 ? rest : rest.slice(0, end + 1);
};

/** Every `a.b` key written as `key` = value in GDD §7. */
export const gddSection7Keys = (): string[] => {
  const s7 = section(doc('gdd.md'), /^## 7\. /m, /^## 8\. /m);
  return [...s7.matchAll(/`([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)` = /g)].map((m) => m[1] ?? '');
};

/** The locked keys from the plan §0.6 table; `area.*` entries are wildcards. */
export const planLockedKeys = (): string[] => {
  const s06 = section(doc('implementation-plan.md'), /^### 0\.6 /m, /^### 0\.7 /m);
  const rows = s06.split('\n').filter((l) => l.startsWith('|') && !l.includes('---'));
  return rows
    .slice(1)
    .flatMap((row) => [...(row.split('|')[2] ?? '').matchAll(/`([^`]+)`/g)].map((m) => m[1] ?? ''));
};
