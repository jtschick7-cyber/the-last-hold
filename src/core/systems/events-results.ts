import { eventCreaturePortraitId, hunterPortraitId } from '../../content/assets';
import { eventsLines } from '../../content/events-text';
import { BOSS_IDS, bosses, type BossId } from '../../content/great-beasts';
import { hunters, type HunterId } from '../../content/hunters';
import {
  HUNT_IDS,
  hunts,
  quarries,
  type HuntId,
  type QuarryId,
  type TrackDef,
  type TrackId,
} from '../../content/hunts';
import type { BalanceKey } from '../../content/balance';
import { constantAt, num } from '../balance-access';
import type { Breakdown } from '../breakdown/breakdown';
import { formatDuration, formatNumber } from '../format';
import type { BossReport, HuntReport } from '../state/events-state';
import type { GameState } from '../state/game-state';
import { foundLines } from '../story/found-lines';
import { MS_PER_SECOND } from '../time';
import { eventBlock, eventsUnlocked, restRemaining, tokenBank } from './events';
import { creatureLines, partyRows, type PartyRow } from './events-view';
import { legalHunters, trackOf, trackPoints, trackTier } from './hunt';

// GDD §9.17 (plan T9.15): the result sheets, the unlock sheet, the hunt list and track sheets, the
// Great Beasts shelf and the small lines the hunter and away sheets carry, worked out here so the
// screens only show them. A number with a formula carries the breakdown of what made it.

const percent = (x: number): string => `${Math.round(x * 100)}%`;
const duration = (ms: number): string => formatDuration(Math.max(0, ms) / MS_PER_SECOND);

export interface ResultLine {
  readonly label: string;
  readonly text: string;
  readonly why?: Breakdown;
}

export interface UnlockView {
  readonly hunterId: HunterId;
  readonly hunterName: string;
  readonly portraitId: string;
  readonly line: string;
  /** "Joins the active roster" or "Joins the reserve (the barracks are full)". */
  readonly joins: string;
  readonly arrival: string;
}

export interface ResultView {
  readonly kind: 'boss' | 'hunt';
  readonly title: string;
  readonly headline: string;
  readonly lines: readonly ResultLine[];
  readonly unlock: UnlockView | null;
}

const xpWhy = (
  xp: number,
  perTier: 'boss.xpPerTier' | 'hunt.xpPerTier',
  tier: number,
  loss: boolean,
): Breakdown => ({
  label: 'XP each',
  value: xp,
  formula: loss ? 'XP per tier × tier × the loss share' : 'XP per tier × tier',
  key: perTier,
  children: [
    { label: 'XP per tier', value: num(perTier), key: perTier },
    { label: 'Tier', value: tier },
    ...(loss
      ? [
          {
            label: 'Share paid on a loss',
            value: num('hunt.lossXpShare'),
            key: 'hunt.lossXpShare' as BalanceKey,
          },
        ]
      : []),
  ],
});

const restLine = (state: GameState, party: readonly HunterId[], now: number): ResultLine | null => {
  const first = party[0];
  if (!first) return null;
  const rest = restRemaining(state, first, now);
  return { label: 'Rests for', text: duration(rest.value.remainingMs), why: rest.breakdown };
};

const levelUpLine = (ups: readonly { hunter: HunterId; level: number }[]): ResultLine | null =>
  ups.length === 0
    ? null
    : {
        label: 'Level up',
        text: ups.map((u) => `${hunters[u.hunter].shortName} to ${u.level}`).join(', '),
      };

const reagentLine = (
  reagents: Readonly<Record<string, number | undefined>>,
  key: BalanceKey,
): ResultLine | null => {
  const rows = Object.entries(reagents).filter(([, n]) => (n ?? 0) > 0);
  if (rows.length === 0) return null;
  return {
    label: 'Reagents',
    text: rows.map(([id, n]) => `${n} ${id.replace(/-/g, ' ')}`).join(', '),
    why: { label: 'Reagents', value: rows.reduce((a, [, n]) => a + (n ?? 0), 0), key },
  };
};

const bossResult = (state: GameState, r: BossReport, now: number): ResultView => {
  const share = r.poolBefore > 0 ? r.damage / r.poolBefore : 0;
  const marks = constantAt('boss.milestones').value as readonly number[];
  const lines: ResultLine[] = [
    {
      label: 'Damage',
      text: `${formatNumber(r.damage)} (${percent(share)} of what was left)`,
      why: {
        label: 'Damage',
        value: r.damage,
        formula: 'pool before − pool after',
        children: [
          { label: 'Pool before this attempt', value: r.poolBefore },
          { label: 'Pool after this attempt', value: r.poolAfter },
        ],
      },
    },
    {
      label: 'Pool left',
      text: `${formatNumber(r.poolAfter)} of ${formatNumber(r.poolStart)}`,
      why: {
        label: 'Pool left',
        value: r.poolAfter,
        formula: 'pool at the start of the visit − everything dealt so far',
        key: 'boss.poolBase',
        children: [
          { label: 'Pool at the start of the visit', value: r.poolStart, key: 'boss.poolBase' },
          { label: 'Dealt in this visit', value: r.poolStart - r.poolAfter },
        ],
      },
    },
    {
      label: 'Milestones',
      text:
        r.milestones.length === 0
          ? 'None this time'
          : r.milestones
              .map((i) => (i === marks.length - 1 ? 'The kill' : percent(marks[i] ?? 0)))
              .join(', '),
    },
  ];
  if (r.silver > 0)
    lines.push({
      label: 'Silver',
      text: formatNumber(r.silver),
      why: {
        label: 'Silver',
        value: r.silver,
        formula: 'one bounty at this tier × the multiple for each milestone',
        key: 'boss.silverBounties',
      },
    });
  const reagents = reagentLine(r.reagents, 'boss.reagents');
  if (reagents) lines.push(reagents);
  for (const text of foundLines(state, r.found)) lines.push({ label: 'Found', text });
  lines.push({
    label: 'XP each',
    text: String(r.xp),
    why: xpWhy(r.xp, 'boss.xpPerTier', r.tier, false),
  });
  const ups = levelUpLine(r.levelUps);
  if (ups) lines.push(ups);
  const rest = restLine(state, r.party, now);
  if (rest) lines.push(rest);
  return {
    kind: 'boss',
    title: bosses[r.boss].name,
    headline: r.killed ? `${bosses[r.boss].name} fell.` : `${formatNumber(r.damage)} damage.`,
    lines,
    unlock: null,
  };
};

const unlockOf = (state: GameState, r: HuntReport): UnlockView | null => {
  if (!r.arrival) return null;
  const id = r.arrival.hunter;
  return {
    hunterId: id,
    hunterName: hunters[id].name,
    portraitId: hunterPortraitId(id),
    line: hunts[r.hunt].unlockLine,
    joins: state.roster.active.includes(id)
      ? 'Joins the active roster'
      : 'Joins the reserve (the barracks are full)',
    arrival: `Arrives at level ${r.arrival.level}, ${r.arrival.rank === 'wright' ? 'a Wright' : 'an Apprentice'}.`,
  };
};

const huntResult = (state: GameState, r: HuntReport, now: number): ResultView => {
  const def = hunts[r.hunt];
  const track = def.tracks[r.track - 1] as TrackDef;
  const total = num('hunt.unlockPoints');
  const win = r.result === 'win';
  const lines: ResultLine[] = [
    {
      label: 'Points',
      text: r.replay ? 'None on a replay' : `+${r.points}, ${r.pointsTotal} of ${total}`,
      why: {
        label: 'Points',
        value: r.points,
        formula: r.replay ? 'a replay pays no points' : 'the track pays more for a win than a loss',
        key: 'hunt.trackPoints',
        children: [
          { label: 'Track win points', value: trackPoints(track, 'win'), key: 'hunt.trackPoints' },
          {
            label: 'Track loss points',
            value: trackPoints(track, 'loss'),
            key: 'hunt.trackPoints',
          },
          { label: 'Needed to unlock', value: total, key: 'hunt.unlockPoints' },
        ],
      },
    },
  ];
  const reagents = reagentLine(r.reagents, 'hunt.replayReagents');
  if (reagents) lines.push(reagents);
  for (const text of foundLines(state, r.found)) lines.push({ label: 'Found', text });
  lines.push({
    label: 'XP each',
    text: String(r.xp),
    why: xpWhy(r.xp, 'hunt.xpPerTier', r.tier, !win),
  });
  const ups = levelUpLine(r.levelUps);
  if (ups) lines.push(ups);
  const rest = restLine(state, r.party, now);
  if (rest) lines.push(rest);
  return {
    kind: 'hunt',
    title: `${quarries[def.quarry].name} · ${track.name}`,
    headline: win ? 'A win.' : 'A loss.',
    lines,
    unlock: r.unlocked ? unlockOf(state, r) : null,
  };
};

/** The newest attempt's result sheet, or null before any (GDD §9.17 "the last result"). */
export const resultView = (state: GameState, now: number = state.time): ResultView | null => {
  const last = state.events.last;
  if (!last) return null;
  if (last.kind === 'boss' && last.boss) return bossResult(state, last.boss, now);
  if (last.hunt) return huntResult(state, last.hunt, now);
  return null;
};

/** The unlock sheet for the newest attempt, or null when it unlocked nothing. */
export const unlockView = (state: GameState): UnlockView | null => {
  const hunt = state.events.last?.hunt;
  return hunt ? unlockOf(state, hunt) : null;
};

export interface TrackListRow {
  readonly id: TrackId;
  readonly name: string;
  readonly tier: number;
  readonly restriction: string;
  readonly winPoints: number;
  readonly lossPoints: number;
  /** Hunters who fit the track and are free now; 0 gives the reason below. */
  readonly fitting: number;
  readonly lockedReason: string | null;
}

export interface HuntListRow {
  readonly id: HuntId;
  readonly label: string;
  readonly quarryId: QuarryId;
  readonly quarryName: string;
  readonly hunterId: HunterId;
  readonly hunterName: string;
  readonly portraitId: string;
  /** Greyed until unlocked (GDD §9.17). */
  readonly hunterGreyed: boolean;
  readonly unlocked: boolean;
  readonly points: { readonly value: number; readonly breakdown: Breakdown };
  readonly pointsLine: string;
  readonly tracks: readonly TrackListRow[];
  /** "Unlocked. Replay for XP and a reagent." once unlocked. */
  readonly footer: string | null;
}

/** The three hunts for the hunt list (GDD §9.17). */
export const huntListView = (state: GameState, now: number): HuntListRow[] =>
  HUNT_IDS.map((id) => {
    const def = hunts[id];
    const rec = state.events.hunts[id];
    const total = num('hunt.unlockPoints');
    return {
      id,
      label: def.label,
      quarryId: def.quarry,
      quarryName: quarries[def.quarry].name,
      hunterId: def.hunter,
      hunterName: hunters[def.hunter].name,
      portraitId: hunterPortraitId(def.hunter),
      hunterGreyed: !rec.unlocked,
      unlocked: rec.unlocked,
      points: {
        value: rec.points,
        breakdown: {
          label: 'Hunt points',
          value: rec.points,
          formula: "every attempt pays its track's win or loss points; it stops at the total",
          key: 'hunt.unlockPoints',
          children: [
            { label: 'Needed to unlock', value: total, key: 'hunt.unlockPoints' },
            ...def.tracks.flatMap((t) => [
              {
                label: `${t.name}: a win`,
                value: trackPoints(t, 'win'),
                key: 'hunt.trackPoints' as BalanceKey,
              },
              {
                label: `${t.name}: a loss`,
                value: trackPoints(t, 'loss'),
                key: 'hunt.trackPoints' as BalanceKey,
              },
            ]),
          ],
        },
      },
      pointsLine: `${rec.points} of ${total}`,
      tracks: def.tracks.map((t) => {
        const fitting = legalHunters(state, t, now).length;
        return {
          id: t.id,
          name: t.name,
          tier: trackTier(t),
          restriction: t.restrictionText,
          winPoints: trackPoints(t, 'win'),
          lossPoints: trackPoints(t, 'loss'),
          fitting,
          lockedReason:
            fitting > 0
              ? null
              : eventsUnlocked(state)
                ? 'No free hunter fits this track.'
                : eventsLines.locked,
        };
      }),
      footer: rec.unlocked ? 'Unlocked. Replay for XP and a reagent.' : null,
    };
  });

export interface HuntTrackView {
  readonly id: TrackId;
  readonly hunt: HuntId;
  readonly quarryId: QuarryId;
  readonly quarryName: string;
  readonly name: string;
  readonly tier: number;
  readonly restriction: string;
  readonly weak: string;
  readonly resists: string;
  readonly abilities: readonly string[];
  readonly notebook: string;
  readonly rows: readonly PartyRow[];
  /** Null when a party can be sent; else why not. */
  readonly sendProblem: string | null;
  readonly replay: boolean;
}

/** One track's sheet: who fits, who is free, the quarry's weaknesses (GDD §9.17). */
export const huntTrackView = (state: GameState, trackId: TrackId, now: number): HuntTrackView => {
  const { hunt, track } = trackOf(trackId);
  const q = quarries[hunts[hunt].quarry];
  const lines = creatureLines(q);
  const tokens = tokenBank(state, now).value;
  const legal = legalHunters(state, track, now);
  return {
    id: trackId,
    hunt,
    quarryId: hunts[hunt].quarry,
    quarryName: q.name,
    name: track.name,
    tier: trackTier(track),
    restriction: track.restrictionText,
    weak: lines.weak,
    resists: lines.resists,
    abilities: lines.abilities,
    notebook: q.notebook,
    rows: partyRows(state, now, track),
    sendProblem: !eventsUnlocked(state)
      ? eventsLines.locked
      : tokens.count < 1
        ? eventsLines.noToken
        : legal.length === 0
          ? 'Nobody who fits this track is free to go.'
          : null,
    replay: state.events.hunts[hunt].unlocked,
  };
};

export interface ShelfEntry {
  readonly id: BossId | QuarryId;
  readonly kind: 'boss' | 'quarry';
  readonly identified: boolean;
  readonly name: string;
  readonly portraitId: string;
  readonly whatItWas?: string;
  readonly notebook?: string;
  readonly stats?: readonly string[];
  readonly weak?: string;
  readonly resists?: string;
  readonly abilities?: readonly string[];
}

export interface GreatBeastsShelf {
  readonly entries: readonly ShelfEntry[];
  readonly emptyLine: string | null;
}

/**
 * GDD §5.12.8: a Great Beast or quarry is Identified the first time it is fought. A boss is met once
 * its visit has begun (a later visit of the same boss counts); a quarry once its hunt has points,
 * since every attempt pays some. No levels, no kill count (D365).
 */
export const greatBeastsShelf = (state: GameState): GreatBeastsShelf => {
  const { visit, attempts } = state.events.boss;
  const bossMet = (i: number): boolean =>
    visit > i || (visit % BOSS_IDS.length === i && attempts > 0);
  const all = [
    ...BOSS_IDS.map((id, i) => ({
      id: id as BossId | QuarryId,
      kind: 'boss' as const,
      met: bossMet(i),
      def: bosses[id],
    })),
    ...HUNT_IDS.map((h) => {
      const rec = state.events.hunts[h];
      return {
        id: hunts[h].quarry as BossId | QuarryId,
        kind: 'quarry' as const,
        met: rec.points > 0 || rec.unlocked,
        def: quarries[hunts[h].quarry],
      };
    }),
  ];
  const entries: ShelfEntry[] = all.map((e) => {
    if (!e.met)
      return {
        id: e.id,
        kind: e.kind,
        identified: false,
        name: 'Not yet met',
        portraitId: eventCreaturePortraitId(e.id),
      };
    const lines = creatureLines(e.def);
    return {
      id: e.id,
      kind: e.kind,
      identified: true,
      name: e.def.name,
      portraitId: eventCreaturePortraitId(e.id),
      whatItWas: e.def.whatItWas,
      notebook: e.def.notebook,
      stats: [
        `Might ${e.def.might}`,
        `Armor ${e.def.armor}`,
        `Speed ${e.def.speed}`,
        `${e.def.attacks} ${e.def.attacks === 1 ? 'attack' : 'attacks'} an action`,
      ],
      weak: lines.weak,
      resists: lines.resists,
      abilities: lines.abilities,
    };
  });
  return {
    entries,
    emptyLine: entries.some((e) => e.identified)
      ? null
      : 'Nothing met yet. The Great Beasts are on the Events card.',
  };
};

/** The hunter sheet's extra lines (GDD §9.17): the rest while it lasts, and "No letters." for a legendary. */
export const hunterEventLines = (state: GameState, id: HunterId, now: number): string[] => {
  const out: string[] = [];
  const block = eventBlock(state, id, now);
  if (block?.kind === 'resting') out.push(block.reason);
  if (hunters[id].unlock.kind === 'huntPoints') out.push('No letters.');
  return out;
};

/** The away sheet's one events line (GDD §5.12.2): only the full bank, only while events are open. */
export const awayEventsLine = (state: GameState, now: number): string | null => {
  if (!eventsUnlocked(state)) return null;
  const bank = tokenBank(state, now).value;
  return bank.full ? `The attempt bank is full: ${bank.count} of ${bank.max}.` : null;
};
