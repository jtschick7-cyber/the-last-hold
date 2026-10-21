// Plan T10.9: reads the Orders' texts out of docs/lore-secrets.md §33 so the content test can compare
// every string to the lore file (Part F, check 1). Written separately from the generator that made the
// content file, so the comparison is a real one.
import { readFileSync } from 'node:fs';

const lines = readFileSync(new URL('../../docs/lore-secrets.md', import.meta.url), 'utf8').split(
  '\n',
);

const after = (startsWith: string): string[] => {
  const i = lines.findIndex((l) => l.startsWith(startsWith));
  if (i < 0) throw new Error(`lore §33 has no "${startsWith}"`);
  const out: string[] = [];
  for (const l of lines.slice(i + 1)) {
    if (/^#{3,5} /.test(l) || l.trim() === '---') break;
    out.push(l);
  }
  return out;
};

/** The blockquoted paragraphs of a run of lines (a blank `>` line ends a paragraph). */
export const paragraphs = (run: string[]): string[] => {
  const out: string[] = [];
  let cur: string[] = [];
  const flush = (): void => {
    if (cur.length > 0) out.push(cur.join(' '));
    cur = [];
  };
  for (const l of run) {
    if (!l.startsWith('>')) flush();
    else if (l.slice(1).trim() === '') flush();
    else cur.push(l.slice(1).trim());
  }
  flush();
  return out;
};

export interface LoreScene {
  title: string;
  body: string[];
  variantA?: string[];
  variantB?: string[];
  ending?: string[];
  libraryNote?: string;
}

/** A scene by its heading prefix, for example "##### OR-M4 ·". */
export const loreScene = (heading: string): LoreScene => {
  const full = lines.find((l) => l.startsWith(heading));
  if (!full) throw new Error(`lore §33 has no "${heading}"`);
  const run = after(heading);
  const parts: Record<string, string[]> = { body: [] };
  let key = 'body';
  for (const l of run) {
    const m = /^\*\*(Variant A|Variant B|Ending, both variants)/.exec(l);
    if (m) {
      key = { 'Variant A': 'variantA', 'Variant B': 'variantB', 'Ending, both variants': 'ending' }[
        m[1] as string
      ] as string;
      parts[key] = [];
    } else (parts[key] ??= []).push(l);
  }
  const note = run
    .map((l) => /^\*Ilse's note, in the Library under this chapter:\* \*"(.*)"\*$/.exec(l)?.[1])
    .find((x) => x !== undefined);
  return {
    title: (full.split('· ')[1] ?? '').replace(/ \*\(.*$/, '').trim(),
    body: paragraphs(parts.body ?? []),
    ...(parts.variantA ? { variantA: paragraphs(parts.variantA) } : {}),
    ...(parts.variantB ? { variantB: paragraphs(parts.variantB) } : {}),
    ...(parts.ending ? { ending: paragraphs(parts.ending) } : {}),
    ...(note !== undefined ? { libraryNote: note } : {}),
  };
};

/** The cells of the rows of the markdown table that follows a heading (header and rule rows dropped). */
export const tableRows = (heading: string): string[][] =>
  after(heading)
    .filter((l) => l.startsWith('|'))
    .slice(2)
    .map((l) =>
      l
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim()),
    );

/** Strips the markdown italics that wrap a table cell. */
export const plain = (cell: string): string => cell.replace(/^\*(.*)\*$/, '$1');
