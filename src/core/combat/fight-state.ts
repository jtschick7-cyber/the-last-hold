import type { RollSource } from '../rng';
import type { Combatant, LogEntry } from './types';
import type { FightContext } from './stats';

/** The running fight. Everything that changes during it lives here. */
export interface Fight {
  tick: number;
  readonly hunters: Combatant[];
  readonly monster: Combatant;
  readonly rolls: RollSource;
  readonly ctx: FightContext;
  readonly log: LogEntry[];
  /** False for odds previews: nothing is written, and no log text is built. */
  readonly logging: boolean;
  over: 'monster-down' | 'party-down' | null;
}

/** A log line whose text is built only if the fight is being logged. */
export type Entry = Omit<LogEntry, 'tick' | 'text'> & { readonly text: () => string };

export const emit = (f: Fight, entry: Entry): void => {
  if (!f.logging) return;
  f.log.push({ tick: f.tick, ...entry, text: entry.text() });
};

/** Draws one roll and records it, so every log line can show the rolls it used. */
export const roller = (f: Fight): { draw: () => number; used: number[] } => {
  const used: number[] = [];
  return {
    used,
    draw: () => {
      const r = f.rolls.next();
      used.push(r);
      return r;
    },
  };
};

export const fmt2 = (x: number): string => x.toFixed(2);
