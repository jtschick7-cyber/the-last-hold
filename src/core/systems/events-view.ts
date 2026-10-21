import { bosses } from '../../content/great-beasts';
import { families, DAMAGE_TYPES } from '../../content/damage';
import { hunters, roleNames, type HunterId } from '../../content/hunters';
import { HUNT_IDS, type TrackDef } from '../../content/hunts';
import { ingredients } from '../../content/ingredients';
import { hunterRanks } from '../../content/ranks';
import { eventsLines } from '../../content/events-text';
import { constantAt, num } from '../balance-access';
import type { Explained } from '../breakdown/breakdown';
import { EVENT_BASE_TIER } from '../combat/species';
import { bounty } from '../contracts/rewards';
import { formatDuration, formatNumber } from '../format';
import type { GameState } from '../state/game-state';
import { MS_PER_SECOND } from '../time';
import { bossOfVisit, passOfVisit, poolAtTier, poolNow, visitTier } from './boss';
import type { BossPreview } from './boss-odds';
import {
  bankFullBadge,
  eligibleHunters,
  eventBlock,
  eventsUnlocked,
  restRemaining,
  tokenBank,
  type TokenBank,
} from './events';
import { trackBlock } from './hunt';

// GDD §9.17 (plan T9.14): everything the Events card and the boss sheet say, worked out here so the
// screen only shows it. Every number with a formula carries the breakdown of the function that made it.

const seconds = (ms: number): string => formatDuration(ms / MS_PER_SECOND);
const percent = (x: number): string => `${Math.round(x * 100)}%`;
const title = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export interface EventsCardView {
  /** Events have opened for good but the Citadel is not reached this cycle. */
  readonly locked: boolean;
  readonly tokensLine: string;
  readonly tokens: Explained<TokenBank>;
  readonly lockedLine: string | null;
  readonly bossLine: string | null;
  readonly huntLine: string | null;
  /** The full-bank badge: only while events are open (GDD §5.12.2). */
  readonly badge: boolean;
  /** The one-time scene is waiting (GDD §5.12.1). */
  readonly sceneDue: boolean;
  /** The newest result, one line, or null. */
  readonly lastLine: string | null;
}

/** The Events card; null until events have opened for good (the first Citadel). */
export const eventsCardView = (state: GameState, now: number): EventsCardView | null => {
  if (!state.events.opened) return null;
  const tokens = tokenBank(state, now);
  const bank = tokens.value;
  const unlocked = eventsUnlocked(state);
  const tokensLine = bank.full
    ? `Tokens: ${bank.count} of ${bank.max}, full`
    : `Tokens ${bank.count} of ${bank.max}${
        bank.nextInMs === null ? '' : ` · next in ${seconds(bank.nextInMs)}`
      }`;
  const toUnlock = HUNT_IDS.filter((h) => !state.events.hunts[h].unlocked).length;
  return {
    locked: !unlocked,
    tokensLine,
    tokens,
    lockedLine: unlocked ? null : eventsLines.locked,
    bossLine: unlocked ? bossLine(state) : null,
    huntLine: unlocked ? `Legendary Hunts: ${toUnlock} of ${HUNT_IDS.length} to unlock` : null,
    badge: bankFullBadge(state, now),
    sceneDue: unlocked && !state.events.sceneSeen,
    lastLine: unlocked ? lastResultLine(state) : null,
  };
};

const bossLine = (state: GameState): string => {
  const id = bossOfVisit(state.events.boss.visit);
  const start = poolAtTier(visitTier(state));
  const left = start > 0 ? poolNow(state) / start : 1;
  return `${bosses[id].name} · tier ${visitTier(state)} · ${percent(left)} left`;
};

/** One line for the newest result of either kind (GDD §9.17 "the last result"). */
export const lastResultLine = (state: GameState): string | null => {
  const last = state.events.last;
  if (!last) return null;
  if (last.kind === 'boss' && last.boss) {
    const b = last.boss;
    const share = b.poolBefore > 0 ? b.damage / b.poolBefore : 0;
    return b.killed
      ? `Last attempt: ${bosses[b.boss].name} fell.`
      : `Last attempt: ${formatNumber(b.damage)} damage, ${percent(share)} of what was left.`;
  }
  if (last.hunt) {
    const h = last.hunt;
    return `Last hunt: ${h.result === 'win' ? 'a win' : 'a loss'}, ${h.points} points.`;
  }
  return null;
};

export interface MarkView {
  /** The share of the pool this mark sits at (0.25 … 1). */
  readonly at: number;
  readonly label: string;
  readonly pays: string;
  readonly paid: boolean;
}

export interface CreatureLines {
  readonly weak: string;
  readonly resists: string;
  readonly abilities: readonly string[];
}

/** Resistances and abilities as the contract launch sheet words them (GDD §9.5). */
export const creatureLines = (c: {
  resist: Readonly<Record<(typeof DAMAGE_TYPES)[number], number>>;
  abilities: readonly { name: string }[];
}): CreatureLines => {
  const cell = (t: (typeof DAMAGE_TYPES)[number]): string => `${title(t)} ×${c.resist[t]}`;
  const weak = DAMAGE_TYPES.filter((t) => c.resist[t] >= num('prep.weakAt')).map(cell);
  const resists = DAMAGE_TYPES.filter((t) => c.resist[t] < 1).map(cell);
  return {
    weak: weak.length ? weak.join(', ') : 'nothing in particular',
    resists: resists.length ? resists.join(', ') : 'nothing',
    abilities: c.abilities.map((a) => a.name),
  };
};

export interface BossSheetView {
  readonly boss: string;
  readonly name: string;
  readonly family: string;
  readonly notebook: string;
  readonly lines: CreatureLines;
  readonly tier: Explained;
  readonly pool: Explained;
  readonly poolLeft: number;
  readonly poolStart: number;
  readonly fractionLeft: number;
  readonly marks: readonly MarkView[];
  readonly tokens: Explained<TokenBank>;
  /** Null when a party can be sent; else why not (an empty bank, nobody free). */
  readonly sendProblem: string | null;
  /** "Everyone is resting. The next is ready in …" and similar, or null. */
  readonly emptyLine: string | null;
  readonly lastLine: string | null;
}

/** The tier a visit has (or would have), with its parts (GDD §5.12.4). */
export const tierExplained = (state: GameState): Explained => {
  const tier = visitTier(state);
  const fixed = state.events.boss.tier !== null;
  const base = (constantAt('boss.baseTier').value as Readonly<Record<string, number>>)[
    state.cycle.age
  ];
  const passes = passOfVisit(state.events.boss.visit);
  return {
    value: tier,
    breakdown: {
      label: 'Tier',
      value: tier,
      formula: fixed
        ? 'fixed when the visit began'
        : 'base tier for the Rank + one for each completed pass',
      children: fixed
        ? [{ label: 'Fixed at the first attempt of this visit', value: tier }]
        : [
            { label: `Base tier (${state.cycle.age})`, value: base ?? tier, key: 'boss.baseTier' },
            {
              label: 'Completed passes through the three',
              value: passes,
              formula: `× ${num('boss.passTierStep')} tier each`,
              key: 'boss.passTierStep',
            },
          ],
    },
  };
};

/** The pool a visit starts with: `poolBase` at tier 3, ×1.35 per tier above (GDD §7.11). */
export const poolExplained = (state: GameState): Explained => {
  const tier = visitTier(state);
  const start = poolAtTier(tier);
  return {
    value: start,
    breakdown: {
      label: 'Pool at the start of the visit',
      value: start,
      formula: 'pool at tier 3 × growth per tier above 3',
      children: [
        { label: 'Pool at tier 3', value: num('boss.poolBase'), key: 'boss.poolBase' },
        { label: 'Growth per tier', value: num('monster.statGrowth'), key: 'monster.statGrowth' },
        { label: `Tiers above ${EVENT_BASE_TIER}`, value: tier - EVENT_BASE_TIER },
        { label: 'Still standing now', value: poolNow(state) },
      ],
    },
  };
};

/** What one milestone pays at the visit's tier: silver (bounty multiples), reagents, and the kill's item. */
const marksOf = (state: GameState): MarkView[] => {
  const marks = constantAt('boss.milestones').value as readonly number[];
  const silverB = constantAt('boss.silverBounties').value as { milestone: number; kill: number };
  const reagents = constantAt('boss.reagents').value as { milestone: number; kill: number };
  const def = bosses[bossOfVisit(state.events.boss.visit)];
  const one = bounty(visitTier(state), state.cycle.age, []).value;
  return marks.map((at, i) => {
    const kill = i === marks.length - 1;
    const silver = Math.round(one * (kill ? silverB.kill : silverB.milestone));
    const units = kill ? reagents.kill : reagents.milestone;
    return {
      at,
      label: kill ? 'The kill' : percent(at),
      pays: `${formatNumber(silver)} silver, ${units} ${ingredients[def.reagent].name.toLowerCase()}${
        kill ? ', and an item' : ''
      }`,
      paid: i < state.events.boss.paid,
    };
  });
};

export const bossSheetView = (state: GameState, now: number): BossSheetView => {
  const id = bossOfVisit(state.events.boss.visit);
  const def = bosses[id];
  const start = poolAtTier(visitTier(state));
  const left = poolNow(state);
  const tokens = tokenBank(state, now);
  const eligible = eligibleHunters(state, now);
  const owned = Object.keys(state.hunters) as HunterId[];
  let emptyLine: string | null = null;
  if (eventsUnlocked(state) && eligible.length === 0) {
    const resting = owned
      .map((h) => restRemaining(state, h, now).value.remainingMs)
      .filter((ms) => ms > 0);
    emptyLine =
      resting.length > 0 && owned.every((h) => eventBlock(state, h, now)?.kind === 'resting')
        ? eventsLines.everyoneResting(seconds(Math.min(...resting)))
        : eventsLines.nobodyFree;
  }
  return {
    boss: id,
    name: def.name,
    family: families[def.family].name,
    notebook: def.notebook,
    lines: creatureLines(def),
    tier: tierExplained(state),
    pool: poolExplained(state),
    poolLeft: left,
    poolStart: start,
    fractionLeft: start > 0 ? left / start : 1,
    marks: marksOf(state),
    tokens,
    sendProblem: !eventsUnlocked(state)
      ? eventsLines.locked
      : tokens.value.count < 1
        ? eventsLines.noToken
        : emptyLine,
    emptyLine,
    lastLine: lastResultLine(state),
  };
};

export interface PartyRow {
  readonly id: HunterId;
  readonly name: string;
  readonly rank: string;
  readonly level: number;
  readonly role: string;
  readonly damage: string;
  /** Why this hunter cannot go, or null (GDD §9.17). */
  readonly reason: string | null;
}

/**
 * Every owned hunter, active or reserve, with the reason beside the name if they cannot attend. For a
 * hunt track the track's restriction is the reason too (*"Track needs …"*).
 */
export const partyRows = (state: GameState, now: number, track?: TrackDef): PartyRow[] =>
  (Object.keys(state.hunters) as HunterId[]).flatMap((id) => {
    const h = state.hunters[id];
    if (!h) return [];
    const def = hunters[id];
    return [
      {
        id,
        name: def.name,
        rank: hunterRanks[h.rank].name,
        level: h.level,
        role: roleNames[def.role],
        damage: title(def.damage),
        reason: eventBlock(state, id, now)?.reason ?? (track ? trackBlock(state, id, track) : null),
      },
    ];
  });

/** The preview's words (GDD §9.17): *"Expected damage: 4.8K, 15% of what is left. Likely 3.9K to 5.7K."* */
export const bossPreviewLines = (p: BossPreview): { expected: string; next: string | null } => ({
  expected:
    `Expected damage: ${formatNumber(p.median)}, ${percent(p.share.median)} of what is left. ` +
    `Likely ${formatNumber(p.p10)} to ${formatNumber(p.p90)}.`,
  next:
    p.wouldPay.length > 0
      ? `Would bring the next milestone: ${percent(p.wouldPay[p.wouldPay.length - 1] ?? 0)}`
      : null,
});
