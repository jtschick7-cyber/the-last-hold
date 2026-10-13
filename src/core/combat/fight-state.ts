import type { ConsumableId } from '../../content/consumables';
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
  /** knowledge% bucket: what the hunters' damage gains against this species (GDD §5.0). */
  readonly knowledgePct: number;
  /** The monster's knowledge level, for the log. */
  readonly knowledge: number;
  readonly log: LogEntry[];
  /** False for odds previews: nothing is written, and no log text is built. */
  readonly logging: boolean;
  over: 'monster-down' | 'party-down' | null;
  /** Bombs not yet used: Saltburst waits for the monster's first ability. */
  saltburstArmed: boolean;
  saltburstCancelled: boolean;
  /** True while the monster is taking its action (a Saltburst then does not count that action). */
  monsterActing: boolean;
  readonly bombs: readonly ConsumableId[];
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
