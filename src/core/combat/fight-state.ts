import type { ConsumableId } from '../../content/consumables';
import type { RollSource } from '../rng';
import type { Combatant, LogEntry } from './types';
import type { FightContext } from './stats';
import type { FightRules } from './delve';

/** The running fight. Everything that changes during it lives here. */
export interface Fight {
  tick: number;
  readonly hunters: Combatant[];
  /** The first monster of the group (the only one in a one-monster fight); bombs and the volley hit it. */
  readonly monster: Combatant;
  /** The whole group, in group order (D251). */
  readonly monsters: Combatant[];
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
  /** Watchtower volley at tick 1 (Last Stand only); 0 in contract fights. */
  readonly volley: number;
  /** The ★ rules and Unlit switches of a Delve floor (D255, D257); all off elsewhere. */
  readonly rules: FightRules;
  /** Monsters downed so far this fight (the Pack Grows counts them for the run). */
  kills: number;
  /** How much Might the Pack Grows has given so far, so its cap holds across floors. */
  packGiven: number;
  /** Actions the party has taken (the Drowned Bell's knock-back counts them). */
  partyActions: number;
  /** Mended Cloth: used this floor, and the downed hunter waiting for the Mender. */
  clothUsed: boolean;
  clothPending: Combatant | null;
  /** The Long Vigil has been used this run. */
  vigilUsed: boolean;
  /** Who has already been counted down (hunter and monster ids). */
  readonly noted: Set<string>;
  /** Toll: hunter→monster pairs whose first hit has landed. */
  readonly tolled: Set<string>;
  /** The last direct attack was a crit (the Wolf's Share, Struck Bronze). */
  lastCrit: boolean;
  /** Alchemy: how much stronger every brew number is this fight (1 at level 0, GDD §5.8.6). */
  readonly potency: number;
  /** Banked Smoke: the Vanguard whose smoke covers the party until their next action. */
  smokeHolder: Combatant | null;
}

/** A general fight rule (v0.8, D328 (8)): lowers a monster's turn meter. Toll, Boathook and Rattle the Pots use it. */
export const knockBack = (m: Combatant, amount: number): void => {
  m.meter -= amount;
};

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

/** A name at the start of a log line ("second Upyr" → "Second Upyr"). */
export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export const fmt2 = (x: number): string => x.toFixed(2);
