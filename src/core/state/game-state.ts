import type { AgeId } from '../../content/ages';
import type { BuildingId } from '../../content/buildings';
import type { ConsumableId, Recipe } from '../../content/consumables';
import type { LocationId } from '../../content/damage';
import type { LegendaryId } from '../../content/legendaries';
import type { HunterRank } from '../../content/ranks';
import type { HunterId } from '../../content/hunters';
import type { IngredientId } from '../../content/ingredients';
import type { JobId } from '../../content/jobs';
import type { MonsterId } from '../../content/monsters';
import type { RelicId } from '../../content/relics';
import type { ResourceId } from '../../content/resources';
import type { SceneId } from '../../content/text/scenes';
import type { VillageId } from '../../content/villages';
import type { UpgradeId } from '../../content/warden-upgrades';
import type { EventInstance, HunterSnapshot } from '../combat';
import type { Band } from '../../content/story/scenes';
import type { RecipeBook, SkillXp } from './book-state';
import type { DelveState } from './delve-state';
import type { EventsState } from './events-state';
import type { OrdersState } from './orders-state';
import type { ItemState } from './item-state';
import type { StoryState } from './story-state';
import type { InjuryKind } from '../contracts/injury';

// Technical design §5.2. v1 was the hold only (plan T1.9); v2 adds hunters,
// contracts and fights (plan T2.4); v3 adds the bestiary, stores, brewing, investigation
// and preparation (plan T3.4); v4 adds Citadel and Bastion, Walls and Watchtower, Threat,
// Embers, warden upgrades, relics, the v0.4 arrival and the cycle history (plan T4.3, D113);
// v5 adds the story: acts, documents, names, letters, trust, Ilse, warden names and the
// v0.5 arrival (plan T5.3); v6 adds the recipe book, warden skills, experiments in the
// kettles, the Alchemy level frozen on fights and stands, and each stand's band (plan
// T6.3, D218); v7 adds Delves and per-act family counts (plan T7.1, T7.5); v8 adds items,
// Legendaries, hunter ranks, stars, talents and keepsakes (plan T8.5, D317); v9 adds events (tokens,
// rests, the boss visit, hunt points) and each cycle's stand pool (plan T9.1, D382). Times are epoch
// milliseconds.
export const SCHEMA_VERSION = 10;

/** One owned hunter (GDD §5.3). Derived values (stats, status) come from selectors. */
export interface HunterState {
  level: number;
  /** XP toward the next level. */
  xp: number;
  /** The item worn in the weapon slot (an `ItemState` id), or null. */
  weapon: string | null;
  /** The item worn in the armor slot, or null. */
  armor: string | null;
  /** v8 (D309): kept through the Long Night. */
  rank: HunterRank;
  /** v8 (D310): 0–5, kept through the Long Night. */
  stars: number;
  /** v8 (D313): the talents picked (content/talents.ts ids), kept through the Long Night. */
  talents: string[];
  /** v8 (D306): the Legendary worn in the keepsake slot, or null. */
  keepsake: LegendaryId | null;
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
  /**
   * Clues revealed so far, 0–3 (GDD §5.6.3). At 3 the species is identified; contracts
   * for a Mastered species and every contract before v0.3 arrive at 3. Which tags and
   * texts the clues are come from the clue seed, so only the count is saved.
   */
  revealed: number;
}

/**
 * What a party carries into a fight (GDD §5.7): one oil and one potion per hunter, up to
 * two bombs per party. Frozen at launch, like the hunter snapshots.
 */
export interface Preparation {
  oils: Partial<Record<HunterId, ConsumableId>>;
  potions: Partial<Record<HunterId, ConsumableId>>;
  bombs: ConsumableId[];
}

export const noPreparation = (): Preparation => ({ oils: {}, potions: {}, bombs: [] });

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
  prep: Preparation;
  /** The species' knowledge level when the party set out, frozen so a replay never changes (GDD §5.6.2). */
  knowledge: number;
  /** v6: the warden's Alchemy level when the party set out, frozen like knowledge (GDD §5.8.6, D206); 0 before v0.6. */
  alchemy: number;
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
  /** Reagents the success brought: the drops and the village gift (GDD §8.6). */
  reagents: Partial<Record<IngredientId, number>>;
  /** A matching oil plus a weak-type bomb or a cancelling Saltburst (GDD §5.7). */
  wellPrepared: boolean;
  /** v5: the story items this success brought (`doc:D1-04`, `name:39`; GDD §5.14.2). */
  found?: string[];
}

/** What it takes to replay a fight: seed and inputs, not the log (technical design §5.3). */
export interface FightRef {
  contractId: string;
  seed: string;
  party: HunterSnapshot[];
  /** A contract's species, or (v9, D358) a Great Beast or quarry with its tier and the pool at launch. */
  monster: { monster: MonsterId; tier: number; knowledge: number } | EventInstance;
  /** Null on an event fight: no location traits apply there (GDD §5.12.4). */
  location: LocationId | null;
  result: 'win' | 'loss';
  rulesVersion: number;
  at: number;
  prep: Preparation;
  /** v6: the Alchemy level the fight was made at (D206); 0 for fights before v0.6. */
  alchemy: number;
  /** v9 (D358): set on boss and hunt fights; absent on every older reference, so old replays are unchanged. */
  event?: { kind: 'boss' | 'hunt'; attempt: number; id: string };
}

export interface FallenRecord {
  hunter: HunterId;
  diedAt: number;
  cycle: number;
  contractId: string;
  /** The level at death (v0.4); deaths recorded before v0.4 have none and return at level 1. */
  level?: number;
  /** Set at the Long Night: the level they come back at, halved like everyone's (GDD §5.9.7, D110). */
  returnLevel?: number;
}

/** What the player has learned about a species (GDD §5.6.2). Never reset by the Long Night. */
export interface SpeciesKnowledge {
  /** 1 Sighted, 2 Identified, 3 Studied, 4 Mastered. Absent from the bestiary = 0 Unknown. */
  level: 1 | 2 | 3 | 4;
  /** Successful contracts against it (the kill count of GDD §5.6.2). */
  kills: number;
}

/**
 * A brew in the Alchemist's Hut. `doneAt` is null while it waits for a free kettle.
 * `paid` is what the queued recipe cost, so a cancel refunds exactly that even when the
 * book later knows other recipes for the same brew (GDD §5.8.2).
 */
export interface BrewJob {
  kind: 'brew';
  item: ConsumableId;
  doneAt: number | null;
  paid: Recipe;
}

/** An experiment in a kettle (GDD §5.8.3): `units` of each ingredient were paid. */
export interface ExperimentJob {
  kind: 'experiment';
  a: IngredientId;
  b: IngredientId;
  units: number;
  doneAt: number | null;
}

/** Brews and experiments share the kettles, in one queue. */
export type KettleJob = BrewJob | ExperimentJob;

/** A Lodge slot at work on a contract; the next clue is revealed at `nextClueAt`. */
export interface InvestigationSlot {
  contractId: string;
  nextClueAt: number;
}

/**
 * A Last Stand, as made (GDD §5.9.3). Its inputs are frozen like a contract's, so
 * every wave log can be rebuilt by re-running the stand (technical design §5.3); the
 * wave list comes from the stand seed and is not stored.
 */
export interface StandRecord {
  at: number;
  /** `${gameSeed}:stand:${cycle}` (D115). */
  seed: string;
  /** The Rank it was made at: Bastion, or the save's own Rank at the v0.4 arrival. */
  rank: AgeId;
  threat: number;
  party: HunterSnapshot[];
  /** One oil and one potion per hunter; `bombs` stays empty (they come from `bombs` below). */
  prep: Preparation;
  /** The bombs in the stores when the stand began; they are thrown automatically. */
  bombs: Partial<Record<ConsumableId, number>>;
  defenses: { walls: number; watchtower: number };
  /** Relics owned when it began (the Iron Shutter fights in the stand). */
  relics: RelicId[];
  /** Each species' knowledge level when it began (Studied and Mastered bonuses). */
  knowledge: Partial<Record<MonsterId, number>>;
  rulesVersion: number;
  wavesHeld: number;
  /** The payout (GDD §5.9.4): the waves part (after Rank and Threat), the trophies part (capped at the arrival). */
  embers: { waves: number; trophies: number; total: number };
  /** Relics found at its wave milestones (GDD §5.9.6). */
  relicsFound: RelicId[];
  /** The v0.4 arrival's stand (GDD §5.9.8). */
  arrival: boolean;
  /** Trust steps a Triumphant stand brought (`trust:village:level`, GDD §5.14.6); [] before v0.5's stands (D183). */
  trustSteps: string[];
  /** v6: the band it earned, with the thresholds in force when it was made (D194). */
  band: Band;
  /** v6: the Alchemy level it was made at (D206); 0 for stands before v0.6. */
  alchemy: number;
  /** v9 (D363): set only when the stand drew from the `dross` pool; absent means the species of §8.3.1 only. */
  pool?: 'dross';
  /** The result sheet has been seen. */
  seen: boolean;
}

/**
 * One cycle's history entry (technical design §5.2, D113): the current cycle is the
 * last one. v0.5's Roll of Wardens reads these.
 */
export interface CycleRecord {
  number: number;
  startedAt: number;
  /** When each Rank was reached; a Rank reached before v0.4 has no time. */
  ranks: Partial<Record<AgeId, number>>;
  /** Threat that contracts added (failures) and took off (successes), before the floor at 0 (GDD §5.9.1). */
  contractThreat: { added: number; removed: number };
  stand: StandRecord | null;
  /** The act this cycle tells (v5, GDD §5.14.1); null for cycles before v0.5 or before the v0.4 arrival. */
  act: number | null;
  /** The warden's name (D152), up to 24 characters; null until named. */
  warden: string | null;
  /**
   * v9 (D363): the species pool of this cycle's Last Stand, fixed when the wave list is first fixed
   * (Bastion reached); null before that. `dross` adds the Dross-Tide (GDD §5.9.3).
   */
  standPool: 'base' | 'dross' | null;
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
  bestiary: Partial<Record<MonsterId, SpeciesKnowledge>>;
  /** Consumables and reagents in the hold's stores (GDD §5.7, §8.6). */
  stores: Record<ConsumableId | IngredientId, number>;
  queues: { brewing: KettleJob[]; investigation: InvestigationSlot[] };
  /** The Herb Garden's next harvest; null until a garden stands (GDD §5.7). */
  garden: { nextAt: number | null };
  running: RunningContract[];
  /** Unread results; rewards were applied at completion (B9). */
  results: ContractResult[];
  fallen: FallenRecord[];
  /** Scenes already shown (setting-primer §6.6), so each plays once. */
  scenes: SceneId[];
  log: { recentFights: FightRef[] };
  /** GDD §5.9.1: never below 0; counts only once `arrivalDue` is false. Resets at the Long Night. */
  threat: number;
  /** Unspent Embers (GDD §5.9.4). Kept forever. */
  embers: number;
  /** Warden upgrade levels (GDD §5.9.5); 0 = not bought. */
  upgrades: Record<UpgradeId, number>;
  /** Relics owned, with the cycle each was found in (GDD §5.9.6). */
  relics: { id: RelicId; cycle: number }[];
  /** A save from before v0.4 still faces its first Long Night (GDD §5.9.8). */
  arrivalDue: boolean;
  /** One entry per cycle; the last is the current one (D113). */
  cycles: CycleRecord[];
  /** The story (v5, GDD §5.14). */
  story: StoryState;
  /** The recipe book (v6, GDD §5.8.4). Kept forever. */
  book: RecipeBook;
  /** Warden skill XP (v6, GDD §5.8.6). Kept forever. */
  skills: SkillXp;
  /** Delves, Riftglass, relics and echoes (v7, GDD §5.10). Kept forever. */
  delve: DelveState;
  /** Every item the hold owns, worn or in Stores (v8, GDD §5.11). Reset at the Long Night. */
  items: ItemState[];
  /** Items ever made: the next id's number, so ids never repeat (v8). */
  itemSeq: number;
  /** Legendaries found, with the cycle (v8, GDD §5.11.6). Kept forever. */
  legendaries: { id: LegendaryId; cycle: number }[];
  /** Events: tokens, rests, the boss visit, hunt points (v9, GDD §5.12). Kept forever. */
  events: EventsState;
  /** Orders: standing, seats and chapters (v10, GDD §5.13). Kept whole through the Long Night. */
  orders: OrdersState;
  stats: {
    /** Lifetime buildings bought and levels added; drives "first building" lines. */
    buildingsBought: number;
    peasantsSettled: number;
    contractsWon: number;
    contractsLost: number;
    /** Trophies earned this cycle; spending never reduces it (A7). */
    trophies: number;
    /** Trophies spent this cycle on ranks and stars (v8, D328 (3)): on hand = earned − spent. */
    trophiesSpent: number;
    /** Silver earned from bounties (Toma's unlock; the silver-share check). */
    bountySilver: number;
    kills: Partial<Record<MonsterId, number>>;
    winsByLocation: Partial<Record<LocationId, number>>;
  };
  settings: Settings;
}
