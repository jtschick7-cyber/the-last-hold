import { loadEnvelope, makeEnvelope, NEWER_VERSION, type Validated } from '../core/save';
import type { GameState } from '../core/state/game-state';
import type { ChannelStorage } from './storage';

// Technical design §9.1: three kinds of slot, all namespaced by channel.
//   main        written by autosave
//   backup      every 10 minutes, a copy of the last good main save
//   corrupt:<t> a main or backup save that failed to load, kept for recovery
export const SAVE_KEYS = { main: 'save', backup: 'backup', corruptPrefix: 'corrupt:' } as const;
const BACKUP_EVERY_MS = 10 * 60 * 1000;

export type LoadOutcome =
  | { kind: 'loaded'; source: 'main' | 'backup'; loaded: Validated; problems: string[] }
  /** Nothing usable was stored: start a new game. Problems say what was quarantined. */
  | { kind: 'empty'; problems: string[] }
  /** Saved by a newer build. Don't start over and never overwrite it. */
  | { kind: 'newer'; message: string };

export interface SaveStore {
  load(): LoadOutcome;
  /** Writes the main slot (and the backup when due). False if storage refused. */
  save(state: GameState): boolean;
}

export const createSaveStore = (storage: ChannelStorage, now: () => number): SaveStore => {
  // The first save of a session backs up the previous session's last save.
  let lastBackupAt = Number.NEGATIVE_INFINITY;

  const read = (
    key: string,
  ): { ok: true; value: Validated } | { ok: false; error: string } | null => {
    const text = storage.get(key);
    if (text === null) return null;
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return { ok: false, error: "it isn't readable JSON" };
    }
    return loadEnvelope(json);
  };

  const quarantine = (key: string, problems: string[], why: string): void => {
    const text = storage.get(key);
    if (text === null) return;
    const slot = `${SAVE_KEYS.corruptPrefix}${now()}-${key}`;
    storage.set(slot, text);
    storage.remove(key);
    problems.push(
      `The ${key === SAVE_KEYS.main ? 'main' : 'backup'} save couldn't load (${why}); kept as ${slot}.`,
    );
  };

  return {
    load: () => {
      const problems: string[] = [];
      for (const key of [SAVE_KEYS.main, SAVE_KEYS.backup]) {
        const result = read(key);
        if (result === null) continue;
        if (result.ok) {
          return {
            kind: 'loaded',
            source: key === SAVE_KEYS.main ? 'main' : 'backup',
            loaded: result.value,
            problems,
          };
        }
        if (result.error === NEWER_VERSION) return { kind: 'newer', message: NEWER_VERSION };
        quarantine(key, problems, result.error);
      }
      return { kind: 'empty', problems };
    },
    save: (state) => {
      const t = now();
      try {
        const previous = storage.get(SAVE_KEYS.main);
        if (previous !== null && t - lastBackupAt >= BACKUP_EVERY_MS) {
          // Only a save that loads cleanly is worth keeping as the backup.
          if (read(SAVE_KEYS.main)?.ok) storage.set(SAVE_KEYS.backup, previous);
          lastBackupAt = t;
        }
        storage.set(SAVE_KEYS.main, JSON.stringify(makeEnvelope(state, t)));
        return true;
      } catch {
        return false;
      }
    },
  };
};
