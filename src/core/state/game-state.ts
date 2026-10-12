import type { AgeId } from '../../content/ages';
import type { BuildingId } from '../../content/buildings';
import type { JobId } from '../../content/jobs';
import type { ResourceId } from '../../content/resources';

// Technical design §5.2, v0.1 fields only (plan T1.9). Later milestones add
// fields through save migrations. Times are epoch milliseconds.
export const SCHEMA_VERSION = 1;

export interface Settings {
  readonly theme: 'dark' | 'light';
  /** GDD §9.2: the ● best-payback hint can be turned off. */
  readonly bestBuyHint: boolean;
  /** GDD §5.0: rates show per minute by default, with a per-hour toggle. */
  readonly rateUnit: 'minute' | 'hour';
  /** GDD §9.1: follow the system setting unless overridden. */
  readonly reduceMotion: 'system' | 'on' | 'off';
}

export interface GameState {
  meta: {
    schemaVersion: number;
    /** Fixed for the save's lifetime (technical design §7.2). */
    gameSeed: string;
    createdAt: number;
    /** The last moment the game was running; offline catch-up starts here. */
    lastSeen: number;
    /** The latest time ever seen, so a clock moved backward is ignored (D21). */
    clockHighWater: number;
    /** Informational only (D21). */
    debugUsed: boolean;
  };
  /** Simulation time: advance() integrates up to here. */
  time: number;
  cycle: { number: number; age: AgeId };
  resources: Record<ResourceId, number>;
  peasants: {
    /** Everyone housed; idle = total − Σ jobs. */
    total: number;
    jobs: Record<JobId, number>;
    autoSettle: boolean;
    priority: JobId[];
    /** When the last peasant settled (GDD §5.1.1: at most one per 30 s). */
    lastSettleAt: number;
  };
  /** Copies owned (count buildings) or level (level buildings); 0 = none. */
  buildings: Record<BuildingId, number>;
  stats: {
    /** Lifetime buildings bought and levels added; drives "first building" lines. */
    buildingsBought: number;
    peasantsSettled: number;
  };
  settings: Settings;
}
