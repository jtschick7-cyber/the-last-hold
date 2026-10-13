// Technical design §14 (plan review A13): names are every `name`, `title`,
// `epithet`, `place` and `shortName` field in src/content/, plus each content
// file's `properNouns` export (for names that appear only inside text).
const NAME_FIELDS = new Set(['name', 'title', 'epithet', 'place', 'shortName']);

const walk = (value: unknown, out: Set<string>): void => {
  if (Array.isArray(value)) {
    for (const v of value) walk(v, out);
  } else if (typeof value === 'object' && value !== null) {
    for (const [k, v] of Object.entries(value)) {
      if (NAME_FIELDS.has(k) && typeof v === 'string') out.add(v);
      else walk(v, out);
    }
  }
};

export const findContentNames = (modules: Record<string, Record<string, unknown>>): string[] => {
  const out = new Set<string>();
  for (const mod of Object.values(modules)) {
    for (const [exportName, value] of Object.entries(mod)) {
      if (exportName === 'properNouns' && Array.isArray(value)) {
        for (const n of value) if (typeof n === 'string') out.add(n);
      } else {
        walk(value, out);
      }
    }
  }
  return [...out].sort();
};
