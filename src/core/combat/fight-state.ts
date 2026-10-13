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
  over: 'monster-down' | 'party-down' | null;
}

export const emit = (f: Fight, entry: Omit<LogEntry, 'tick'>): void => {
  f.log.push({ tick: f.tick, ...entry });
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
