import type { ChannelStorage } from './storage';

// Small JSON lists kept beside the save under their own namespaced keys, so a
// bad save can't erase them (technical design §15.1) and they need no save
// migration: Reports (GDD §9.10) and Diagnostics.
export interface SideList<T> {
  read(): T[];
  push(item: T): void;
  clear(): void;
}

export const sideList = <T>(storage: ChannelStorage, key: string, keep: number): SideList<T> => {
  const read = (): T[] => {
    try {
      const parsed: unknown = JSON.parse(storage.get(key) ?? '[]');
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  };
  return {
    read,
    push: (item) => {
      try {
        storage.set(key, JSON.stringify([item, ...read()].slice(0, keep)));
      } catch {
        // Storage full or blocked: these lists are a convenience, never fatal.
      }
    },
    clear: () => storage.remove(key),
  };
};
