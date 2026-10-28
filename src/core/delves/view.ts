import { ages } from '../../content/ages';
import { guardianSpriteId, hunterSpriteId, monsterSpriteId } from '../../content/assets';
import { balance } from '../../content/balance';
import { families, type FamilyId } from '../../content/damage';
import { guardians } from '../../content/delves/guardians';
import { HUNTER_IDS, hunters, type HunterId } from '../../content/hunters';
import { monsters, type MonsterId } from '../../content/monsters';
import { RIFT_QUIET_LINE } from '../../content/delves/rift-text';
import { sixthDoorLine } from '../../content/story/act5';
import { runFight } from '../combat';
import type { FightResult } from '../combat/types';
import type { Explained } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';
import { entryProblem, baseTierFor, delvesOpen, runRank, suggestedParty } from './access';
import { floorFamily, floorSpecies, floorTier, guardianOf } from './generate';
import { currentFloorRecord, floorFightInput } from './run';
import { allowanceCap, allowanceExplained } from './riftglass';
import { floorName } from './away';

export { awayDelveLines, floorName } from './away';

// GDD §9.15 (plan T7.13a): what the Delve screens show, built here so the screens only draw it.
// Nothing here changes the game; the floor playback is the same fight `delve.fight` works out
// (same seed, same inputs), replayed with its log.

const floors = (): number => balance.delve.floors.value;

export interface RiftCardView {
  /** "Riftglass: 40 waiting, banks up to 140", or the quiet line when nothing is waiting. */
  readonly line: string;
  readonly quiet: boolean;
  readonly waiting: Explained;
  readonly held: number;
  readonly action: 'delve' | 'continue' | 'result';
  readonly label: string;
  /** A run is paused, a result is unread or the allowance is full: the Hold tab's badge (§9.15). */
  readonly badge: boolean;
  /** After Act V's stand, until a blessing has been taken from the Unlit: the sixth-door line (D302). */
  readonly unlitLine: string | null;
}

/** The Rift card on the Hold screen; null until a warden has reached the Keep. */
export const riftCardView = (state: GameState): RiftCardView | null => {
  if (!delvesOpen(state)) return null;
  const waiting = allowanceExplained(state);
  const d = state.delve;
  const quiet = waiting.value <= 0;
  const run = d.run;
  const full = d.allowance >= allowanceCap();
  return {
    line: quiet
      ? RIFT_QUIET_LINE
      : `Riftglass: ${waiting.value} waiting, banks up to ${allowanceCap()}`,
    quiet,
    waiting,
    held: d.riftglass,
    action: run ? 'continue' : d.result ? 'result' : 'delve',
    label: run ? `Continue (${floorName(run.floor)})` : d.result ? 'Last Delve ▸' : 'Delve',
    badge: run !== null || d.result !== null || full,
    // GDD §5.14.1 (D302): said when the door first opens; it goes once the Unlit has been walked through.
    unlitLine: d.unlitOpen && (d.taken.unlit?.length ?? 0) === 0 ? sixthDoorLine : null,
  };
};

export interface EntryHunterRow {
  readonly id: HunterId;
  readonly name: string;
  readonly role: string;
  readonly level: number;
  /** Why they cannot go ("on a contract", "recovering"), or null. */
  readonly problem: string | null;
}

export interface EntryView {
  readonly rows: readonly EntryHunterRow[];
  readonly suggested: readonly HunterId[];
  readonly partySize: number;
  /** "Keep: floors tier 3–4, guardian tier 5". */
  readonly depth: string;
  readonly allowance: Explained;
  readonly quiet: boolean;
  readonly chosenStart: boolean;
}

/** The entry sheet (§9.15): who can go, the suggested three, the depth and the allowance. */
export const entryView = (state: GameState): EntryView => {
  const base = baseTierFor(state);
  const allowance = allowanceExplained(state);
  return {
    rows: HUNTER_IDS.filter((id) => state.hunters[id]).map((id) => ({
      id,
      name: hunters[id].name,
      role: hunters[id].role,
      level: state.hunters[id]?.level ?? 1,
      problem: entryProblem(state, id),
    })),
    suggested: suggestedParty(state),
    partySize: balance.delve.partySize.value,
    depth: `${ages[runRank(state)].name}: floors tier ${floorTier(base, 1)}–${floorTier(base, floors())}, guardian tier ${floorTier(base, floors() + 1)}`,
    allowance,
    quiet: allowance.value <= 0,
    chosenStart: state.delve.shop.chosenStart,
  };
};

/** One creature on the floor: who it is, how to draw it, how much Health it started with. */
export interface FloorCombatant {
  readonly id: string;
  readonly name: string;
  readonly side: 'hunter' | 'monster';
  /** The manifest row of its battle sprite and of the portrait that stands in for it. */
  readonly spriteId: string;
  readonly portraitId: string | null;
  /** Health as a share of max Health when the floor begins (carried Health for hunters). */
  readonly start: number;
}

/** One line of the playback: who acted, who was hit, and every bar's share of Health after it. */
export interface PlaybackStep {
  readonly tick: number;
  readonly text: string;
  readonly kind: string;
  readonly actor: string | null;
  readonly target: string | null;
  readonly bars: Readonly<Record<string, number>>;
  /** Who is on the field after this line, when the fight has step-ins (the Descent); absent means everyone. */
  readonly present?: readonly string[];
}

export interface FloorPlayback {
  readonly floor: number;
  readonly guardian: boolean;
  readonly title: string;
  /** The family ahead, for a floor; the guardian's "What it was" line for the seventh (§9.15). */
  readonly subtitle: string;
  readonly combatants: readonly FloorCombatant[];
  readonly steps: readonly PlaybackStep[];
  /** Every bar's share after the fight, and who is down. */
  readonly end: Readonly<Record<string, number>>;
  readonly result: 'win' | 'loss';
  /** The whole log as the fight log shows it (§9.6). */
  readonly log: readonly { readonly tick: number; readonly text: string }[];
}

/**
 * The steps and the end bars of a played fight: who acted, who was hit, and every bar's share of its
 * max Health after each line. Shared by a Delve floor and by event fights (GDD §9.15, §9.17).
 */
export const playbackSteps = (
  r: Pick<FightResult, 'log' | 'hunters' | 'monsters'>,
  combatants: readonly FloorCombatant[],
  /** A creature's bar is its Health over this, when it is not its own max (a boss's pool). */
  barMax: Readonly<Record<string, number>> = {},
): { steps: PlaybackStep[]; end: Record<string, number> } => {
  const maxOf = new Map<string, number>([
    ...r.hunters.map((h) => [h.id, h.maxHealth] as const),
    ...r.monsters.map((m) => [m.id, barMax[m.id] ?? m.maxHealth] as const),
  ]);
  const bars: Record<string, number> = Object.fromEntries(combatants.map((c) => [c.id, c.start]));
  const steps: PlaybackStep[] = [];
  for (const e of r.log) {
    if (e.target !== undefined && e.targetHealth !== undefined) {
      const max = maxOf.get(e.target);
      if (max) bars[e.target] = Math.max(0, Math.min(1, e.targetHealth / max));
    }
    steps.push({
      tick: e.tick,
      text: e.text,
      kind: e.kind,
      actor: maxOf.has(e.actor) ? e.actor : null,
      target: e.target !== undefined && maxOf.has(e.target) ? e.target : null,
      bars: { ...bars },
    });
  }
  const end: Record<string, number> = {};
  for (const h of r.hunters) end[h.id] = h.downed ? 0 : h.health / h.maxHealth;
  for (const m of r.monsters) {
    const max = barMax[m.id] ?? m.maxHealth;
    end[m.id] = max > 0 ? Math.max(0, m.health) / max : 0;
  }
  return { steps, end };
};

const speciesOfId = (id: string): MonsterId => id.replace(/-\d+$/, '') as MonsterId;

/**
 * The fight the run is about to fight, played out from its seed with its log. `delve.fight`
 * works out the very same fight (same seed and inputs), so what this shows is what happens.
 */
export const floorPlayback = (state: GameState): FloorPlayback | null => {
  const run = state.delve.run;
  if (!run || run.stage.kind !== 'fight') return null;
  const rec = currentFloorRecord(run);
  const guardian = rec.floor > floors();
  const r = runFight(floorFightInput(state, run, rec, true));
  const hunterShare = (id: HunterId): number => run.health[id] ?? 1;
  const combatants: FloorCombatant[] = [
    ...r.hunters.map((h) => ({
      id: h.id,
      name: hunters[h.id as HunterId].shortName,
      side: 'hunter' as const,
      spriteId: hunterSpriteId(h.id as HunterId),
      portraitId: `portrait.hunter.${h.id}`,
      start: hunterShare(h.id as HunterId),
    })),
    ...r.monsters.map((m) => {
      const species = speciesOfId(m.id);
      return guardian
        ? {
            id: m.id,
            name: m.name,
            side: 'monster' as const,
            spriteId: guardianSpriteId(guardianOf(run.seed)),
            portraitId: null,
            start: 1,
          }
        : {
            id: m.id,
            name: m.name,
            side: 'monster' as const,
            spriteId: monsterSpriteId(species),
            portraitId: `portrait.monster.${species}`,
            start: 1,
          };
    }),
  ];
  const { steps, end } = playbackSteps(r, combatants);
  const family: FamilyId = floorFamily(run.seed, rec.floor);
  return {
    floor: rec.floor,
    guardian,
    title: guardian ? guardians[guardianOf(run.seed)].name : `Floor ${rec.floor} of ${floors()}`,
    subtitle: guardian
      ? guardians[guardianOf(run.seed)].whatItWas
      : `Ahead: ${familyLine(family, run.seed, rec.floor, run.baseTier)}`,
    combatants,
    steps,
    end,
    result: r.result,
    log: r.log.map((l) => ({ tick: l.tick, text: l.text })),
  };
};

const familyLine = (family: FamilyId, seed: string, floor: number, base: number): string => {
  const names = floorSpecies(seed, floor, base).map((id) => monsters[id].name);
  return `${families[family].name}: ${names.join(', ')}`;
};
