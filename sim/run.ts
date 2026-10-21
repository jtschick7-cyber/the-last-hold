import { HUNTER_IDS } from '../src/content/hunters';
import { LEGENDARY_HUNTER_IDS } from '../src/content/hunters-v09';
import { RESOURCE_IDS, type ResourceId } from '../src/content/resources';
import { play, type CheckInRecord, type PolicyId } from '../src/core/policies';
import { allChaptersRead } from '../src/core/policies/orderer';
import { ORDER_IDS, type OrderId } from '../src/content/orders';
import { orderLevel, orderStanding } from '../src/core/systems/orders';
import type { EventAttemptRecord } from '../src/core/policies/eventer';
import { OPENING_LENGTH } from '../src/core/policies/schedules';
import { createNewGame } from '../src/core/state/new-game';
import type { GameState } from '../src/core/state/game-state';
import { provisions } from '../src/core/contracts/rewards';
import { settleCost } from '../src/core/systems/settle';
import { apply } from '../src/core/commands';
import { standProblem } from '../src/core/commands/stand';
import { standKit } from '../src/core/policies/long-night';
import { suggestSix } from '../src/core/stand/suggest';
import { ageIndex } from '../src/core/systems/ages';
import { propertiesFound } from '../src/core/alchemy/book';
import { skillLevels } from '../src/core/skills/skills';
import { startingTrust, TRUST_LEVELS } from '../src/content/story/trust';
import { VILLAGE_IDS } from '../src/content/villages';
import { ALL_CONTENT, STORY } from './targets';

/** GDD §5.9.4: the best-stand samples run from Bastion up to day 7 of cycle 1. */
const BEST_STAND_UNTIL = 7 * 24;

/** GDD §6.2 v0.7 (D271): "every warden skill at level 4" is part of "all content". */
const SKILL_LEVEL_FOR_ALL_CONTENT = 4;

// Technical design §13.1: one simulated game, played by a policy on a virtual
// clock through the real core. Records what the checks and the report need.

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** 2024-01-01 was a Monday. GDD §6.1: runs start Monday 07:00, and again Saturday 09:00. */
const MONDAY = Date.UTC(2024, 0, 1);
export const STARTS = {
  mon: MONDAY + 7 * HOUR,
  sat: MONDAY + 5 * DAY + 9 * HOUR,
} as const;
export type StartId = keyof typeof STARTS;

export interface RunSpec {
  readonly policy: PolicyId;
  readonly seed: string;
  readonly start: StartId;
  readonly days: number;
  /** Stop once every one of these moments is reached (the fast set needs nothing after its last target). */
  readonly stopAt?: readonly Moment[];
  /**
   * Keep playing past `days` until this many Long Nights have happened, up to `maxDays`
   * (GDD §6.3 #7, D114: every number below 1e300 through 3 cycles).
   */
  readonly minCycles?: number;
  readonly maxDays?: number;
  /**
   * v0.7 (D271): also keep playing until all of "all content" is found (up to `maxDays`), so the
   * Idle-only row can compare when each player finished. Only the Monday Standard and Delver runs.
   */
  readonly untilContent?: boolean;
}

export interface CheckInStat {
  /** Hours since the start. */
  readonly hours: number;
  readonly purchases: number;
  readonly hadOption: boolean;
  readonly saving: boolean;
  readonly agedUp: boolean;
  /** One of the Opening's 10-second steps, not a scheduled check-in. */
  readonly opening: boolean;
  /** The cycle the check-in began in (the stand's check-in still counts as the cycle it ends). */
  readonly cycle: number;
}

export const MOMENTS = [
  'first-cottage',
  'first-mine',
  'mill-3',
  'peasants-10',
  'keep',
  // v0.2 (GDD §6.2):
  'first-contract',
  'roster-4',
  'first-tier-3',
  // v0.3 (GDD §6.2):
  'hunters-lodge',
  'first-identified',
  'first-studied',
  // v0.4 (GDD §6.2), all in cycle 1:
  'citadel',
  'bastion',
  'best-last-stand',
  'first-long-night',
  // v0.5 (GDD §6.2, D168):
  'first-ruin',
] as const;
export type Moment = (typeof MOMENTS)[number];

/** One finished contract, for the odds-honesty check (GDD §6.3). */
export interface ContractRecord {
  readonly hours: number;
  readonly tier: number;
  /** The win chance the launch panel showed. */
  readonly winChance: number;
  readonly success: boolean;
}

/**
 * What the Keep phase earned and spent, for the economy checks (GDD §6.3 #6 and #8). From
 * v0.4 (D114) it is every stretch from the Keep onward in every cycle; the Hamlet
 * stretches are left out. `byCycle` holds each cycle's stretch.
 */
export interface KeepPhase {
  readonly bountySilver: number;
  readonly jobSilver: number;
  readonly provisionsFood: number;
  readonly jobFood: number;
  readonly byCycle: readonly (Omit<KeepPhase, 'byCycle'> & { readonly cycle: number })[];
}

/** A stand made with the Dross-Tide in its pool: the waves it held and the preview's 10th–90th range (D383). */
export interface DrossStand {
  readonly cycle: number;
  readonly waves: number;
  readonly median: number;
  readonly p10: number;
  readonly p90: number;
}

/** GDD §5.9.4 (D109): a practice stand on a throwaway copy, from Bastion to day 7 of cycle 1. */
export interface StandSample {
  readonly hours: number;
  readonly embers: number;
  readonly perDay: number;
}

/**
 * What the story brought over a run (GDD §6.2 v0.5, D168; plan T5.14). The checks judge
 * documents, Ribbonshade names and trust; bands, letters and trust per cycle are reported only.
 */
export interface StoryRecord {
  readonly documents: readonly {
    readonly id: string;
    readonly cycle: number;
    readonly hours: number;
  }[];
  readonly names: readonly { readonly n: number; readonly cycle: number; readonly hours: number }[];
  readonly letters: readonly {
    readonly hunter: string;
    readonly slot: number;
    readonly cycle: number;
    readonly hours: number;
  }[];
  /** Each finished cycle's stand: its band and the waves it held. */
  readonly bands: readonly {
    readonly cycle: number;
    readonly band: string;
    readonly waves: number;
  }[];
  /** Each village's trust level when the cycle ended (the last entry is the end of the run). */
  readonly trust: readonly {
    readonly cycle: number;
    readonly levels: Readonly<Record<string, string>>;
  }[];
  /** Villages whose trust had risen above its starting level when cycle 1 ended. */
  readonly trustRoseInCycle1: number;
}

/**
 * What alchemy discovery and the warden skills did over a run (GDD §6.2 v0.6, D216; plan T6.12).
 * Properties found and skill levels are read as each cycle ends; the last entry is the end of the run.
 */
export interface DiscoveryRecord {
  /** Hours to the Alchemist's Hut, or null if it was never built. */
  readonly hutHours: number | null;
  /** Hours to the first new brew becoming makeable (an experiment's "Discovered"), or null. */
  readonly firstNewBrewHours: number | null;
  readonly cycles: readonly {
    readonly cycle: number;
    readonly properties: number;
    readonly skills: Readonly<Record<string, number>>;
  }[];
}

/** One Delve run the Delver finished (GDD §6.1, plan T7.14). */
export interface DelveRunRecord {
  /** Hours since the start, and the cycle the session was in. */
  readonly hours: number;
  readonly cycle: number;
  /** Floors cleared (the guardian counts as a seventh once beaten). */
  readonly floors: number;
  readonly outcome: 'guardian' | 'defeated' | 'left';
  readonly guardianBeaten: boolean;
  /** Riftglass the run paid out of the allowance. */
  readonly riftglass: number;
  /** Delve relics the run itself found (the idle sources are counted in `relics`). */
  readonly relics: readonly string[];
}

/** What Delves did over a run; empty for a policy that never Delves (GDD §6.1, D269). */
export interface DelveRecord {
  readonly runs: readonly DelveRunRecord[];
  /** Riftglass on hand and the shop's levels at the end of the run. */
  readonly riftglassHeld: number;
  readonly lateHours: number;
  readonly chosenStart: boolean;
  readonly reroll: boolean;
  /** Every Delve relic owned at the end, with the cycle it was found in. */
  readonly relics: readonly { readonly id: string; readonly cycle: number }[];
  /** Hours of the run (start to its last check-in), to turn Riftglass into a weekly rate. */
  readonly totalHours: number;
}

/**
 * Hours to the milestones of "all content" that the existing records do not already hold
 * (GDD §6.2 v0.7, D271; v0.8, D322): the recipe book at 36 of 36, every warden skill at level 4, and
 * every hunter at Wright. Null if never reached.
 */
export interface ContentRecord {
  readonly book36Hours: number | null;
  readonly skills4Hours: number | null;
  /** v0.8 (D322): hours to every hunter owned and at Wright or above, or null. */
  readonly wrightsHours: number | null;
}

/**
 * What the v0.8 systems did over a run (GDD §6.2 v0.8, plan T8.16): reported, not judged. Stars and
 * Wrights are read as each cycle ends (the last entry is the end of the run); items are those a
 * cycle's won contracts and Delve guardians gave, by rarity, kept or salvaged on the spot.
 */
export interface DepthRecord {
  readonly cycles: readonly {
    readonly cycle: number;
    readonly stars: number;
    readonly wrights: number;
    readonly items: Readonly<Record<'fine' | 'rare' | 'heroic', number>>;
  }[];
  readonly legendaries: readonly { readonly id: string; readonly cycle: number }[];
  /** Hunter XP each of the three earned across the Delver's Delve runs. */
  readonly delveXp: number;
}

/** One event attempt the Eventer made (GDD §6.1, plan T9.12), with where in the run it fell. */
export interface EventAttemptStat extends EventAttemptRecord {
  readonly hours: number;
  readonly cycle: number;
}

/**
 * What the Eventer did over a run (GDD §6.1–§6.2 v0.9, D367). Check-ins made while events were locked
 * count toward nothing here (D386). Empty for every other policy, which never touches events.
 */
export interface EventsRecord {
  /** Hours to the first check-in that found events open, and the cycle that was; null if never. */
  readonly openedHours: number | null;
  readonly openedCycle: number | null;
  /** Check-ins with events open; with a full bank on arrival; and with a token left that no party of four could use. */
  readonly checkIns: number;
  readonly fullBank: number;
  readonly blocked: number;
  readonly attempts: readonly EventAttemptStat[];
  /** Tokens spent (one per attempt). */
  readonly tokensSpent: number;
  /** Hours (and cycle) of the first boss attempt, the first boss defeated and each hunter unlocked. */
  readonly firstBossAttemptHours: number | null;
  readonly firstBossKill: { readonly hours: number; readonly cycle: number } | null;
  readonly unlocks: readonly {
    readonly hunt: string;
    readonly hours: number;
    readonly cycle: number;
  }[];
}

/**
 * One stand the Orderer made (GDD §6.2 stand rows, D417). The Quenchers' perk slows the hourly Threat
 * rate over a whole cycle, so a seat flipped at the stand changes nothing: the on-and-off comparison is
 * between cycles where they sat and cycles where they did not, with the Threat each stand met.
 */
export interface OrdersStand {
  readonly cycle: number;
  readonly waves: number;
  readonly embers: number;
  readonly threat: number;
  /** The Quenchers sat in a seat when the stand was made. */
  readonly quenchersSeated: boolean;
}

/**
 * What the Orderer did over a run (GDD §6.1–§6.2 v0.10, D417; plan T10.17): when each Order opened,
 * when each level and each chapter came, who sat when, each stand with and without the Quenchers'
 * perk, and the standing at the end. Empty for every other policy, which never seats an Order.
 */
export interface OrdersRecord {
  readonly opened: readonly {
    readonly order: OrderId;
    readonly hours: number;
    readonly cycle: number;
  }[];
  /** The first check-in at which an Order was at each level (1 to 4). */
  readonly levels: readonly {
    readonly order: OrderId;
    readonly level: number;
    readonly hours: number;
    readonly cycle: number;
  }[];
  readonly chapters: readonly {
    readonly order: OrderId;
    readonly n: number;
    readonly variant: 'A' | 'B' | null;
    readonly hours: number;
    readonly cycle: number;
  }[];
  /** Opening scenes the Orderer finished and whether each took a seat. */
  readonly openings: readonly {
    readonly order: OrderId;
    readonly seated: boolean;
    readonly hours: number;
  }[];
  /** The seats the Orderer chose at each new warden's step, and when the third seat opened. */
  readonly seatsByCycle: readonly { readonly cycle: number; readonly seats: readonly OrderId[] }[];
  readonly thirdSeat: { readonly hours: number; readonly cycle: number } | null;
  readonly stands: readonly OrdersStand[];
  /** Standing, level, counts and the Delve window at the end of the run. */
  readonly final: {
    readonly standing: Readonly<Record<OrderId, number>>;
    readonly level: Readonly<Record<OrderId, number>>;
    readonly counts: Readonly<Record<OrderId, Readonly<Record<string, number>>>>;
    readonly triumphant: number;
    readonly chaptersRead: Readonly<Record<OrderId, number>>;
  };
}

export interface RunResult {
  readonly spec: RunSpec;
  /** Hours from the start to each GDD §6.2 moment, or null if never reached. */
  readonly moments: Record<Moment, number | null>;
  readonly checkIns: readonly CheckInStat[];
  /** Everything produced over the run, by resource (v0.1's only sources are jobs). */
  readonly income: Record<ResourceId, number>;
  readonly peaks: Record<ResourceId | 'peasants', number>;
  /** The largest number anywhere in the state over the run (GDD §6.3 #7). */
  readonly largestNumber: number;
  readonly final: { readonly age: string; readonly peasants: number };
  /** Long Nights that happened in the run. */
  readonly cyclesDone: number;
  /** Each finished cycle's length in hours (start to its stand), in order. */
  readonly cycleHours: readonly number[];
  readonly standSamples: readonly StandSample[];
  readonly contracts: readonly ContractRecord[];
  readonly keepPhase: KeepPhase;
  readonly story: StoryRecord;
  readonly discovery: DiscoveryRecord;
  readonly delve: DelveRecord;
  readonly content: ContentRecord;
  readonly depth: DepthRecord;
  /** v0.9: only the Eventer's runs hold attempts; absent in older shard files. */
  readonly events?: EventsRecord;
  /** v0.10: only the Orderer's runs hold this; absent in older shard files. */
  readonly orders?: OrdersRecord;
  /** v0.9 (D383): the stands made once Act VI had begun, with the preview they were made on; absent in older shard files. */
  readonly drossStands?: readonly DrossStand[];
}

const largest = (value: unknown): number => {
  if (typeof value === 'number') return Math.abs(value);
  if (value && typeof value === 'object') {
    return Object.values(value).reduce<number>((m, v) => Math.max(m, largest(v)), 0);
  }
  return 0;
};

export const runOne = (spec: RunSpec): RunResult => {
  const start = STARTS[spec.start];
  const state = createNewGame(spec.seed, start);
  const moments = Object.fromEntries(MOMENTS.map((m) => [m, null])) as Record<
    Moment,
    number | null
  >;
  const mark = (m: Moment, at: number): void => {
    if (moments[m] === null) moments[m] = (at - start) / HOUR;
  };
  const checkIns: CheckInStat[] = [];
  const income = Object.fromEntries(RESOURCE_IDS.map((r) => [r, 0])) as Record<ResourceId, number>;
  const peaks = { ...income, peasants: state.peasants.total };
  let largestNumber = largest(state);
  const contracts: ContractRecord[] = [];
  type Stretch = {
    cycle: number;
    bountySilver: number;
    jobSilver: number;
    provisionsFood: number;
    jobFood: number;
  };
  const stretches = new Map<number, Stretch>();
  const stretch = (cycle: number): Stretch => {
    let x = stretches.get(cycle);
    if (!x) {
      x = { cycle, bountySilver: 0, jobSilver: 0, provisionsFood: 0, jobFood: 0 };
      stretches.set(cycle, x);
    }
    return x;
  };
  // The Rank and cycle the hold was in when the last check-in ended: time away is theirs.
  let prevAge = state.cycle.age;
  let prevCycle = state.cycle.number;
  const standSamples: StandSample[] = [];
  const trust: { cycle: number; levels: Record<string, string> }[] = [];
  const delveRuns: DelveRunRecord[] = [];
  const itemsBy = new Map<number, Record<'fine' | 'rare' | 'heroic', number>>();
  const noteItem = (cycle: number, key: string | undefined): void => {
    const rarity = key?.split(':')[1];
    if (rarity !== 'fine' && rarity !== 'rare' && rarity !== 'heroic') return;
    const row = itemsBy.get(cycle) ?? { fine: 0, rare: 0, heroic: 0 };
    row[rarity] += 1;
    itemsBy.set(cycle, row);
  };
  let delveXp = 0;
  const eventAttempts: EventAttemptStat[] = [];
  const ordersSeen = {
    opened: [] as { order: OrderId; hours: number; cycle: number }[],
    levels: [] as { order: OrderId; level: number; hours: number; cycle: number }[],
    chapters: [] as {
      order: OrderId;
      n: number;
      variant: 'A' | 'B' | null;
      hours: number;
      cycle: number;
    }[],
    openings: [] as { order: OrderId; seated: boolean; hours: number }[],
    seatsByCycle: [] as { cycle: number; seats: readonly OrderId[] }[],
    thirdSeat: null as { hours: number; cycle: number } | null,
    stands: [] as OrdersStand[],
  };
  const drossStands: DrossStand[] = [];
  const eventsSeen = {
    openedHours: null as number | null,
    openedCycle: null as number | null,
    checkIns: 0,
    fullBank: 0,
    blocked: 0,
  };
  const depthCycles: {
    cycle: number;
    stars: number;
    wrights: number;
    items: Record<'fine' | 'rare' | 'heroic', number>;
  }[] = [];
  const depthNow = (cycle: number, s: GameState) => ({
    cycle,
    stars: Object.values(s.hunters).reduce((n, h) => n + (h?.stars ?? 0), 0),
    wrights: Object.values(s.hunters).filter((h) => h && h.rank !== 'apprentice').length,
    items: { ...(itemsBy.get(cycle) ?? { fine: 0, rare: 0, heroic: 0 }) },
  });
  /** All of "all content" is found (GDD §6.2 v0.7, D271). */
  const contentDone = (s: GameState): boolean =>
    book36Hours !== null &&
    skills4Hours !== null &&
    wrightsHours !== null &&
    ALL_CONTENT.letters.every((l) =>
      s.story.letters.some((x) => x.hunter === l.hunter && x.slot === l.slot),
    ) &&
    ALL_CONTENT.documents.every((id) => s.story.documents.some((d) => d.id === id)) &&
    STORY.ribbonNames.every((n) => s.story.names.some((x) => x.n === n));
  /**
   * v0.9 (D383): the Monday Standard run also plays on until Act VI's judged documents are found and
   * three Dross-Tide stands have been made, so the Act VI rows have something to judge. "All content"
   * itself (the Idle-only row) is unchanged and is timed where each part is found, not where the run stops.
   */
  const actSixSeen = (s: GameState): boolean =>
    spec.policy === 'eventer'
      ? // The Eventer plays on until its event rows have something to judge: a boss defeated and a
        // legendary hunter unlocked (D404), up to the 42-day cap.
        eventAttempts.some((a) => a.kind === 'boss' && a.killed) &&
        eventAttempts.some((a) => a.unlockedHunt)
      : (spec.policy !== 'standard' && spec.policy !== 'orderer') ||
        ([...STORY.act6.docs, STORY.act6.nextWarden.doc].every((id) =>
          s.story.documents.some((d) => d.id === id),
        ) &&
          drossStands.length >= 3);
  let book36Hours: number | null = null;
  let skills4Hours: number | null = null;
  let wrightsHours: number | null = null;
  let hutHours: number | null = null;
  let firstNewBrewHours: number | null = null;
  const discoveryCycles: { cycle: number; properties: number; skills: Record<string, number> }[] =
    [];
  const discoveryNow = (cycle: number, s: GameState) => ({
    cycle,
    properties: propertiesFound(s),
    skills: { ...skillLevels(s) },
  });
  const levelsNow = (s: GameState): Record<string, string> =>
    Object.fromEntries(VILLAGE_IDS.map((v) => [v, s.story.trust[v].level]));

  /** What the Orderer's check-in did and where the Orders stand now (GDD §6.1, D417). */
  const noteOrders = (rec: CheckInRecord, s: GameState): void => {
    const hours = (rec.at - start) / HOUR;
    const o = rec.orders as NonNullable<CheckInRecord['orders']>;
    for (const id of ORDER_IDS) {
      const opened = s.orders.opened[id];
      if (opened && !ordersSeen.opened.some((x) => x.order === id))
        ordersSeen.opened.push({ order: id, hours: (opened.at - start) / HOUR, cycle: prevCycle });
      const level = orderLevel(s, id);
      for (let l = 1; l <= level; l++)
        if (!ordersSeen.levels.some((x) => x.order === id && x.level === l))
          ordersSeen.levels.push({ order: id, level: l, hours, cycle: s.cycle.number });
    }
    for (const c of o.chapters)
      ordersSeen.chapters.push({ ...c, order: c.order, hours, cycle: prevCycle });
    for (const x of o.openings) ordersSeen.openings.push({ ...x, hours });
    if (o.newWarden) ordersSeen.seatsByCycle.push({ cycle: s.cycle.number, seats: o.seats });
    if (s.orders.thirdSeat && ordersSeen.thirdSeat === null)
      ordersSeen.thirdSeat = { hours, cycle: s.cycle.number };
    if (o.standSeats) {
      const made = s.cycles.find((c) => c.stand?.at === rec.at);
      if (made?.stand)
        ordersSeen.stands.push({
          cycle: made.number,
          waves: made.stand.wavesHeld,
          embers: made.stand.embers.total,
          quenchersSeated: o.standSeats.includes('quenchers'),
          threat: made.stand.threat,
        });
    }
  };

  play(state, {
    // D62 (Q4a): a fresh start under Standard begins with the Opening's 15
    // active minutes, which then switches to Standard (GDD §6.1).
    policy: spec.policy === 'standard' ? 'opening' : spec.policy, // the Delver opens the same way (nextCheckIn)
    startedAt: start,
    until: start + Math.max(spec.days, spec.minCycles ? (spec.maxDays ?? spec.days) : 0) * DAY,
    stop: (st) =>
      (spec.stopAt !== undefined && spec.stopAt.every((m) => moments[m] !== null)) ||
      (spec.minCycles !== undefined &&
        st.time >= start + spec.days * DAY &&
        st.cycle.number > spec.minCycles &&
        (!spec.untilContent ||
          // The Orderer plays on until every chapter has played (GDD §6.1, D417), up to the cap.
          (spec.policy === 'orderer'
            ? allChaptersRead(st) && actSixSeen(st)
            : contentDone(st) && actSixSeen(st)))),
    onCheckIn: (rec, s) => {
      // Income: the net change while away, plus the food that settling spent.
      const settles = rec.away.events.filter((e) => e.type === 'settle');
      settles.forEach((e, i) => {
        income.food += settleCost(rec.peasantsBefore + i).value;
        if (rec.peasantsBefore + i + 1 >= 10) mark('peasants-10', e.at);
      });
      for (const r of RESOURCE_IDS) income[r] += rec.away.resources[r];
      for (const c of rec.commands) {
        if (c.type === 'build.buy' && c.building === 'cottage') mark('first-cottage', rec.at);
        if (c.type === 'build.buy' && c.building === 'mine') mark('first-mine', rec.at);
      }
      if (rec.standPreview) {
        const made = s.cycles.find((c) => c.stand?.at === rec.at);
        if (made?.stand && made.standPool === 'dross')
          drossStands.push({
            cycle: made.number,
            waves: made.stand.wavesHeld,
            ...rec.standPreview,
          });
      }
      if (rec.orders) noteOrders(rec, s);
      if (rec.events?.unlocked) {
        eventsSeen.checkIns += 1;
        if (rec.events.bankFull) eventsSeen.fullBank += 1;
        if (rec.events.blocked) eventsSeen.blocked += 1;
        if (eventsSeen.openedHours === null) {
          eventsSeen.openedHours = (rec.at - start) / HOUR;
          eventsSeen.openedCycle = s.cycle.number;
        }
        for (const a of rec.events.attempts)
          eventAttempts.push({ ...a, hours: (rec.at - start) / HOUR, cycle: prevCycle });
      }
      for (const r of rec.delveResults ?? []) {
        delveXp += r.xp ?? 0;
        noteItem(s.cycle.number, r.item);
        delveRuns.push({
          hours: (rec.at - start) / HOUR,
          cycle: s.cycle.number,
          floors: r.floors,
          outcome: r.outcome,
          guardianBeaten: r.guardianBeaten,
          riftglass: r.riftglass,
          relics: [...r.relics],
        });
      }
      if (book36Hours === null && propertiesFound(s) >= 36) book36Hours = (rec.at - start) / HOUR;
      if (
        skills4Hours === null &&
        Object.values(skillLevels(s)).every((level) => level >= SKILL_LEVEL_FOR_ALL_CONTENT)
      )
        skills4Hours = (rec.at - start) / HOUR;
      // v0.8 (D322): "every hunter at Wright" is part of all content: all of them owned, none an Apprentice.
      if (
        wrightsHours === null &&
        // D386 (6): the legendary hunters are left out of "every hunter at Wright".
        HUNTER_IDS.filter((id) => !(LEGENDARY_HUNTER_IDS as readonly string[]).includes(id)).every(
          (id) => {
            const h = s.hunters[id];
            return h !== undefined && h.rank !== 'apprentice';
          },
        )
      )
        wrightsHours = (rec.at - start) / HOUR;
      if (s.buildings.mill >= 3) mark('mill-3', rec.at);
      if (s.peasants.total >= 10) mark('peasants-10', rec.at);
      if (rec.agedUp) mark('keep', rec.at);
      const first = s.cycles[0];
      if (first?.ranks.citadel !== undefined) mark('citadel', first.ranks.citadel);
      if (first?.ranks.bastion !== undefined) mark('bastion', first.ranks.bastion);
      if (first?.stand) mark('first-long-night', first.stand.at);
      for (const c of rec.commands) {
        if (c.type === 'contract.launch') mark('first-contract', rec.at);
      }
      if (Object.keys(s.hunters).length >= 4) mark('roster-4', rec.at);
      if (s.buildings['hunters-lodge'] >= 1) mark('hunters-lodge', rec.at);
      if (hutHours === null && s.buildings['alchemists-hut'] >= 1)
        hutHours = (rec.at - start) / HOUR;
      for (const e of rec.away.events) {
        if (e.type === 'experiment' && e.discovered.length > 0 && firstNewBrewHours === null)
          firstNewBrewHours = (e.at - start) / HOUR;
      }
      for (const e of rec.away.events) {
        if (e.type === 'clue' && e.identified) mark('first-identified', e.at);
      }
      for (const r of rec.away.contracts) {
        for (const key of r.found ?? [])
          if (key.startsWith('loot:') || key.startsWith('salvaged:')) noteItem(prevCycle, key);
        if (r.success && r.location === 'ruin') mark('first-ruin', r.at);
        contracts.push({
          hours: (r.at - start) / HOUR,
          tier: r.tier,
          winChance: r.winChance,
          success: r.success,
        });
        if (r.success && r.tier >= 3) mark('first-tier-3', r.at);
        if (r.success && (s.bestiary[r.monster]?.level ?? 0) >= 3) mark('first-studied', r.at);
      }
      // The Keep phase (GDD §6.3 #6 and #8, D114): time away belongs to the Rank the hold
      // was in; launches to the Rank it is in now. Hamlet stretches are left out.
      if (ageIndex(prevAge) >= ageIndex('keep')) {
        const x = stretch(prevCycle);
        x.jobSilver += rec.away.produced.silver;
        x.jobFood += rec.away.produced.food;
        for (const r of rec.away.contracts) x.bountySilver += r.bounty;
      }
      if (ageIndex(s.cycle.age) >= ageIndex('keep')) {
        for (const c of rec.commands) {
          if (c.type !== 'contract.launch') continue;
          const run = s.running.find((x) => x.contract.id === c.contract);
          if (run)
            stretch(s.cycle.number).provisionsFood += provisions(
              s,
              run.party.length,
              run.contract.tier,
            ).value;
        }
      }
      // GDD §5.9.4: from Bastion to day 7 of cycle 1, a practice stand on a throwaway copy.
      const hours = (rec.at - start) / HOUR;
      if (s.cycle.number === 1 && hours <= BEST_STAND_UNTIL && !standProblem(s)) {
        const copy = structuredClone(s);
        const party = suggestSix(copy);
        if (
          party.length > 0 &&
          apply(copy, { type: 'stand.make', party, prep: standKit(copy, party) }, copy.time).ok
        ) {
          const embers = copy.cycles[0]?.stand?.embers.total ?? 0;
          const days = (s.time - (s.cycles[0]?.startedAt ?? start)) / DAY;
          standSamples.push({ hours, embers, perDay: embers / Math.max(days, 1 / 24) });
        }
      }
      checkIns.push({
        hours: (rec.at - start) / HOUR,
        purchases: rec.purchases,
        hadOption: rec.hadOption,
        saving: rec.saving,
        agedUp: rec.agedUp,
        opening:
          (spec.policy === 'opening' ||
            spec.policy === 'standard' ||
            spec.policy === 'delver' ||
            spec.policy === 'eventer' ||
            spec.policy === 'orderer') &&
          rec.at <= start + OPENING_LENGTH,
        cycle: prevCycle,
      });
      // Trust as each cycle ended: the stand's own step is already in the state here.
      if (s.cycle.number !== prevCycle) {
        trust.push({ cycle: prevCycle, levels: levelsNow(s) });
        discoveryCycles.push(discoveryNow(prevCycle, s));
        depthCycles.push(depthNow(prevCycle, s));
      }
      prevAge = s.cycle.age;
      prevCycle = s.cycle.number;
      for (const r of RESOURCE_IDS) peaks[r] = Math.max(peaks[r], s.resources[r]);
      peaks.peasants = Math.max(peaks.peasants, s.peasants.total);
      largestNumber = Math.max(largestNumber, largest(s));
    },
  });
  // GDD §5.9.4: the best Last Stand timing is the sample with the most Embers per day.
  const best = standSamples.reduce<StandSample | null>(
    (b, x) => (b === null || x.perDay > b.perDay ? x : b),
    null,
  );
  if (best) moments['best-last-stand'] = best.hours;
  trust.push({ cycle: state.cycle.number, levels: levelsNow(state) });
  discoveryCycles.push(discoveryNow(state.cycle.number, state));
  depthCycles.push(depthNow(state.cycle.number, state));
  const risen = (levels: Readonly<Record<string, string>>): number =>
    VILLAGE_IDS.filter(
      (v) =>
        TRUST_LEVELS.indexOf((levels[v] ?? 'cold') as (typeof TRUST_LEVELS)[number]) >
        TRUST_LEVELS.indexOf(startingTrust[v]),
    ).length;
  const hoursOf = (at: number): number => (at - start) / HOUR;
  const story: StoryRecord = {
    documents: state.story.documents.map((d) => ({
      id: d.id,
      cycle: d.cycle,
      hours: hoursOf(d.at),
    })),
    names: state.story.names.map((x) => ({ n: x.n, cycle: x.cycle, hours: hoursOf(x.at) })),
    letters: state.story.letters.map((l) => ({
      hunter: l.hunter,
      slot: l.slot,
      cycle: l.cycle,
      hours: hoursOf(l.at),
    })),
    bands: state.cycles.flatMap((c) =>
      c.stand
        ? [{ cycle: c.number, band: c.stand.band, waves: c.stand.wavesHeld }] // the recorded band (D194)
        : [],
    ),
    trust,
    trustRoseInCycle1: risen(trust.find((x) => x.cycle === 1)?.levels ?? {}),
  };
  return {
    spec,
    moments,
    checkIns,
    income,
    peaks,
    largestNumber,
    final: { age: state.cycle.age, peasants: state.peasants.total },
    cyclesDone: state.cycle.number - 1,
    cycleHours: state.cycles.flatMap((c) => (c.stand ? [(c.stand.at - c.startedAt) / HOUR] : [])),
    standSamples,
    drossStands,
    contracts,
    story,
    discovery: { hutHours, firstNewBrewHours, cycles: discoveryCycles },
    content: { book36Hours, skills4Hours, wrightsHours },
    depth: {
      cycles: depthCycles,
      legendaries: state.legendaries.map((l) => ({ id: l.id, cycle: l.cycle })),
      delveXp,
    },
    events: {
      ...eventsSeen,
      attempts: eventAttempts,
      tokensSpent: eventAttempts.length,
      firstBossAttemptHours: eventAttempts.find((a) => a.kind === 'boss')?.hours ?? null,
      firstBossKill: (() => {
        const k = eventAttempts.find((a) => a.kind === 'boss' && a.killed);
        return k ? { hours: k.hours, cycle: k.cycle } : null;
      })(),
      unlocks: eventAttempts
        .filter((a) => a.unlockedHunt)
        .map((a) => ({ hunt: a.id.replace(/-\d$/, ''), hours: a.hours, cycle: a.cycle })),
    },
    orders: {
      ...ordersSeen,
      final: {
        standing: Object.fromEntries(
          ORDER_IDS.map((id) => [id, orderStanding(state, id)]),
        ) as Record<OrderId, number>,
        level: Object.fromEntries(ORDER_IDS.map((id) => [id, orderLevel(state, id)])) as Record<
          OrderId,
          number
        >,
        counts: structuredClone(state.orders.counts),
        triumphant: state.orders.triumphant,
        chaptersRead: { ...state.orders.chaptersRead },
      },
    },
    delve: {
      runs: delveRuns,
      riftglassHeld: state.delve.riftglass,
      lateHours: state.delve.shop.lateHours,
      chosenStart: state.delve.shop.chosenStart,
      reroll: state.delve.shop.reroll,
      relics: state.delve.relics.map((r) => ({ id: r.id, cycle: r.cycle })),
      totalHours: (state.time - start) / HOUR,
    },
    keepPhase: {
      bountySilver: [...stretches.values()].reduce((n, x) => n + x.bountySilver, 0),
      jobSilver: [...stretches.values()].reduce((n, x) => n + x.jobSilver, 0),
      provisionsFood: [...stretches.values()].reduce((n, x) => n + x.provisionsFood, 0),
      jobFood: [...stretches.values()].reduce((n, x) => n + x.jobFood, 0),
      byCycle: [...stretches.values()],
    },
  };
};
