// Technical design §6.2 (plan review A9): how the equivalence test compares two
// states. Integer fields (counts, levels, IDs, booleans) must match exactly;
// resource amounts within 1e-9 relative or 1e-6 absolute, whichever is looser;
// timestamps within 1 ms.
const TIMESTAMP_KEYS = new Set([
  'time',
  'lastSeen',
  'clockHighWater',
  'lastSettleAt',
  'createdAt',
  'at',
  'from',
  'to',
  // v0.2 (schedule times, computed rather than stepped):
  'until',
  'endsAt',
  'launchedAt',
  'arrivedAt',
  'nextArrivalAt',
  'diedAt',
]);
const FLOAT_PARENTS = new Set(['resources']);

const floatClose = (a: number, b: number): boolean =>
  Math.abs(a - b) <= Math.max(1e-9 * Math.max(Math.abs(a), Math.abs(b)), 1e-6);

export const compareStates = (a: unknown, b: unknown, path: string[] = []): string[] => {
  const where = path.join('.') || '(root)';
  if (typeof a === 'number' && typeof b === 'number') {
    const key = path[path.length - 1] ?? '';
    const parent = path[path.length - 2] ?? '';
    if (TIMESTAMP_KEYS.has(key))
      return Math.abs(a - b) <= 1 ? [] : [`${where}: ${a} vs ${b} (> 1 ms)`];
    if (FLOAT_PARENTS.has(parent)) return floatClose(a, b) ? [] : [`${where}: ${a} vs ${b}`];
    return a === b ? [] : [`${where}: ${a} vs ${b} (must match exactly)`];
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return [`${where}: length ${a.length} vs ${b.length}`];
    return a.flatMap((v, i) => compareStates(v, b[i], [...path, String(i)]));
  }
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].flatMap((k) =>
      compareStates((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], [
        ...path,
        k,
      ]),
    );
  }
  return Object.is(a, b) ? [] : [`${where}: ${String(a)} vs ${String(b)}`];
};
