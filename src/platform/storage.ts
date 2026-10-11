import type { Channel } from './build-info';

// Technical design §9.1: every key is prefixed by the build channel, so a preview
// build can never read, migrate, or overwrite the live save. Live and preview share
// one origin on GitHub Pages, so this prefix is the only thing keeping them apart.
const PREFIX: Record<Channel, string> = {
  live: 'lasthold:',
  preview: 'lasthold-preview:',
};

export type KeyValueBackend = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key'> & {
  readonly length: number;
};

export interface ChannelStorage {
  readonly prefix: string;
  get(name: string): string | null;
  set(name: string, value: string): void;
  remove(name: string): void;
  /** Names (without prefix) of every key this channel owns. */
  names(): string[];
}

export const storagePrefix = (channel: Channel): string => PREFIX[channel];

export const createChannelStorage = (
  channel: Channel,
  backend: KeyValueBackend,
): ChannelStorage => {
  const prefix = storagePrefix(channel);
  // Neither prefix is a prefix of the other (tested), so startsWith is exact.
  const owns = (key: string): boolean => key.startsWith(prefix);
  return {
    prefix,
    get: (name) => backend.getItem(prefix + name),
    set: (name, value) => backend.setItem(prefix + name, value),
    remove: (name) => backend.removeItem(prefix + name),
    names: () => {
      const out: string[] = [];
      for (let i = 0; i < backend.length; i++) {
        const key = backend.key(i);
        if (key !== null && owns(key)) out.push(key.slice(prefix.length));
      }
      return out;
    },
  };
};

/** Browser localStorage, or null when it's unavailable (private mode, blocked). */
export const browserBackend = (): KeyValueBackend | null => {
  try {
    const s = window.localStorage;
    const probe = '__lasthold_probe__';
    s.setItem(probe, probe);
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
};
