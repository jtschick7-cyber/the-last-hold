import type { AgeId } from '../../content/ages';
import type { BuildingId } from '../../content/buildings';
import type { LocationId } from '../../content/damage';
import type { GearId } from '../../content/gear';
import type { HunterId } from '../../content/hunters';
import type { JobId } from '../../content/jobs';
import type { MonsterId } from '../../content/monsters';
import type { ResourceId } from '../../content/resources';
import type { SceneId } from '../../content/text/scenes';
import type { VillageId } from '../../content/villages';
import type { HunterSnapshot } from '../combat';
import type { InjuryKind } from '../contracts/injury';

// Technical design §5.2. v1 was the hold only (plan T1.9); v2 adds hunters,
// contracts and fights (plan T2.4). Times are epoch milliseconds.
export const SCHEMA_VERSION = 2;

/** One owned hunter (GDD §5.3). Derived values (stats, status) come from selectors. */
export interface HunterState {
  level: number;
  /** XP toward the next level. */
  xp: number;
  weapon: GearId | null;
  armor: GearId | null;
  /** Injury recovery on real time; null when fit. Ends at `until` (an event). */
  recovery: { kind: Exclude<InjuryKind, 'none' | 'dead'>; until: number } | null;
  record: { won: number; lost: number };
}

/** A contract on the board. Fixed when it arrives, from its seed (GDD §5.4.1). */
export interface ContractInstance {
  id: string;
  village: VillageId;
  monster: MonsterId;
  tier: number;
  location: LocationId;
  arrivedAt: number;
}

export interface RunningContract {
  contract: ContractInstance;
  party: HunterId[];
  /** Frozen at launch so later level-ups never change the fight (technical design §5.3). */
  snapshots: HunterSnapshot[];
  launchedAt: number;
  endsAt: number;
  /** The Reckless confirmation was given (GDD §5.3.7). */
  reckless: boolean;
  /** The odds shown at launch (500 fights), kept so results can say how likely they were. */
  winChance: number;
}

export interface ContractResult {
  contractId: string;
  village: VillageId;
  monster: MonsterId;
  tier: number;
  location: LocationId;
  success: boolean;
  /** When the timer ended: rewards and injuries applied then (B9). */
  at: number;
  bounty: number;
  trophies: number;
  xp: number;
  /** The win chance shown when it was sent. */
  winChance: number;
  injuries: { hunter: HunterId; kind: InjuryKind; until: number }[];
  levelUps: { hunter: HunterId; level: number }[];
  /** Unread until the player collects. */
}

/** What it takes to replay a fight: seed and inputs, not the log (technical design §5.3). */
export interface FightRef {
  contractId: string;
  seed: string;
  party: HunterSnapshot[];
  monster: { monster: MonsterId; tier: number };
  location: LocationId;
  result: 'win' | 'loss';
  rulesVersion: number;
  at: number;
}

export interface FallenRecord {
  hunter: HunterId;
  diedAt: number;
  cycle: number;
  contractId: string;
}

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
  /** Owned hunters only (GDD §5.3.1); anyone not here is a candidate, locked, or fallen. */
  hunters: Partial<Record<HunterId, HunterState>>;
  /** Anything owned and not active is in the reserve. Order is party slot order. */
  roster: { active: HunterId[] };
  board: {
    /** Opens when the first Mine is built (GDD §5.4.1, G6). */
    opened: boolean;
    open: ContractInstance[];
    /** When the next contract arrives; null while the board is full (the timer waits). */
    nextArrivalAt: number | null;
    /** How many contracts have ever arrived: the seed index, so ids never repeat. */
    arrivals: number;
    /** Successes at tier 1..5; tier t+1 unlocks after 3 at tier t (B8). */
    tierWins: number[];
  };
  running: RunningContract[];
  /** Unread results; rewards were applied at completion (B9). */
  results: ContractResult[];
  fallen: FallenRecord[];
  /** Scenes already shown (setting-primer §6.6), so each plays once. */
  scenes: SceneId[];
  log: { recentFights: FightRef[] };
  stats: {
    /** Lifetime buildings bought and levels added; drives "first building" lines. */
    buildingsBought: number;
    peasantsSettled: number;
    contractsWon: number;
    contractsLost: number;
    /** Trophies earned this cycle; spending never reduces it (A7). */
    trophies: number;
    /** Silver earned from bounties (Toma's unlock; the silver-share check). */
    bountySilver: number;
    kills: Partial<Record<MonsterId, number>>;
    winsByLocation: Partial<Record<LocationId, number>>;
  };
  settings: Settings;
}
