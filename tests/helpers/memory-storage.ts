import type { KeyValueBackend } from '../../src/platform/storage';

/** An in-memory stand-in for localStorage. `failWrites` simulates a full disk. */
export const memoryBackend = (): KeyValueBackend & {
  failWrites: boolean;
  dump(): Record<string, string>;
} => {
  const map = new Map<string, string>();
  const backend = {
    failWrites: false,
    get length() {
      return map.size;
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (backend.failWrites) throw new Error('QuotaExceededError');
      map.set(k, v);
    },
    removeItem: (k: string) => void map.delete(k),
    dump: () => Object.fromEntries(map),
  };
  return backend;
};
