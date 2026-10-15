import type { FamilyId } from '../../content/damage';
import type { HunterId } from '../../content/hunters';
import type { LetterHunter, LetterSlot } from '../../content/story/letters';
import { startingTrust, type TrustLevel } from '../../content/story/trust';
import { VILLAGE_IDS, type VillageId } from '../../content/villages';

// Technical design §5.2 (v5, plan T5.3): the story's part of the save (GDD §5.14).
// What's found is kept forever; the Long Night resets none of it.

/** One act's counters (GDD §5.14.1): they start when the act begins and run on in later cycles. */
export interface ActProgress {
  act: number;
  /** The cycle it began in. */
  cycle: number;
  startedAt: number;
  /** Contracts won since the act began. */
  wins: number;
  winsByVillage: Partial<Record<VillageId, number>>;
  /** Ruin contracts won since the act began. */
  ruinWins: number;
  /** Contracts won against each monster family since the act began (schema v7, D245). */
  winsByFamily: Partial<Record<FamilyId, number>>;
}

/** How a document was found (GDD §5.14.2); `arrival` = handed over in Ilse's v0.5 arrival scene. */
export const FOUND_VIA = [
  'contract',
  'rank',
  'knowledge',
  'roster',
  'stand',
  'warden',
  'arrival',
] as const;
export type FoundVia = (typeof FOUND_VIA)[number];

export interface FoundDocument {
  id: string;
  cycle: number;
  at: number;
  via: FoundVia;
}

/** A name from the roll (lore-secrets §20), by its number. */
export interface FoundName {
  n: number;
  cycle: number;
  at: number;
}

/** A hunter letter reached (GDD §5.14.7). */
export interface ReachedLetter {
  hunter: LetterHunter;
  slot: LetterSlot;
  cycle: number;
  at: number;
}

/** GDD §5.14.6: a village's trust. It never drops; `won` and `triumphs` feed the breakdown. */
export interface VillageTrust {
  level: TrustLevel;
  /** Contracts counted toward the next step. */
  progress: number;
  /** Contracts won for the village since v0.5. */
  won: number;
  /** Triumphant stands that raised it. */
  triumphs: number;
}

export interface StoryState {
  /** A save from before v0.5 still meets Ilse on load and names its earlier wardens (D149). */
  arrivalDue: boolean;
  /** When Ilse arrived (D151); null until then. */
  ilseAt: number | null;
  /** One entry per act begun, in order. */
  acts: ActProgress[];
  documents: FoundDocument[];
  names: FoundName[];
  /** Ribbonshades defeated, which picks the next name (GDD §5.14.4). */
  ribbonshades: number;
  /** The highest level each hunter has ever reached (D155). */
  peakLevels: Partial<Record<HunterId | 'arvid', number>>;
  letters: ReachedLetter[];
  trust: Record<VillageId, VillageTrust>;
  /** Archive items not yet opened, for the tab's badge: `doc:D1-01`, `letter:ostap:0`, `name:39`. */
  unread: string[];
}

export const startingVillageTrust = (): Record<VillageId, VillageTrust> =>
  Object.fromEntries(
    VILLAGE_IDS.map((v) => [v, { level: startingTrust[v], progress: 0, won: 0, triumphs: 0 }]),
  ) as Record<VillageId, VillageTrust>;

export const freshAct = (act: number, cycle: number, now: number): ActProgress => ({
  act,
  cycle,
  startedAt: now,
  wins: 0,
  winsByVillage: {},
  ruinWins: 0,
  winsByFamily: {},
});
