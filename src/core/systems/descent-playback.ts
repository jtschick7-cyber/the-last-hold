import { DESCENT_STRINGS, descentLine, descentStageLine } from '../../content/descent-text';
import { DESCENT_CARDS, type DescentCard, type DescentCardId } from '../../content/story/descent';
import {
  descentSceneId,
  guardianSpriteId,
  hunterSpriteId,
  monsterSpriteId,
  UNLIT_PORTRAIT_ID,
  UNLIT_SPRITE_ID,
} from '../../content/assets';
import { unlit } from '../../content/unlit';
import { hunters } from '../../content/hunters';
import type { GuardianId } from '../../content/delves/guardians';
import type { MonsterId } from '../../content/monsters';
import {
  playbackSteps,
  type FloorCombatant,
  type FloorPlayback,
  type PlaybackStep,
} from '../delves/view';
import type { DescentRecord } from '../state/descent-state';
import type { GameState } from '../state/game-state';
import { creatureLines } from './events-view';
import { rebuildDescentLogs } from './descent-record';
import type { DescentStageRun } from './descent-fight';

// GDD §9.24, technical design §22.4 (S4, S9): what the Descent's playback and result sheet show. Built
// from a DescentRecord alone (the same rebuild the Library replay uses), so what is shown is what the
// engine fought, never what the hold looks like now. The UI only draws it.

export interface DescentStep extends PlaybackStep {
  /** Who is on the field after this line (a mid-stage step-in replaces the whole front line). */
  readonly present: readonly string[];
}

export interface DescentStagePlayback extends FloorPlayback {
  readonly stage: 1 | 2 | 3;
  readonly steps: readonly DescentStep[];
  /** `Stage 1: The Crack` */
  readonly title: string;
  /** `Stage 1: The Crack — Unlit's Breath & The Forgotten` */
  readonly heading: string;
  readonly banner: string;
  readonly won: boolean;
  /** The sheet's button for this stage's log: `Stage 1 log`. */
  readonly logLabel: string;
}

export type DescentBeat =
  | { readonly kind: 'card'; readonly card: DescentCard }
  | { readonly kind: 'stage'; readonly stage: 1 | 2 | 3 };

export interface DescentResultView {
  readonly won: boolean;
  /** `Victory — The Unlit is scattered.` or `Driven back at Stage {s}.` */
  readonly heading: string;
  /** `Hunters standing: {a} · Fallen on the stair: {d}` */
  readonly summary: string;
}

export interface DescentPlaybackView {
  readonly stages: readonly DescentStagePlayback[];
  /** Cards and stages in the order they play: D-01, D-02, stage 1, D-03, ... and the ending cards. */
  readonly beats: readonly DescentBeat[];
  readonly result: DescentResultView;
}

const card = (id: DescentCardId): DescentBeat => ({ kind: 'card', card: DESCENT_CARDS[id] });

const GUARDIANS: readonly string[] = ['unlits-breath', 'the-forgotten', 'dross-tide'];

const monsterOf = (id: string, name: string): FloorCombatant => {
  const species = id.replace(/-\d+$/, '');
  if (species === 'unlit')
    return {
      id,
      name,
      side: 'monster',
      spriteId: UNLIT_SPRITE_ID,
      portraitId: UNLIT_PORTRAIT_ID,
      start: 1,
    };
  if (GUARDIANS.includes(species))
    return {
      id,
      name,
      side: 'monster',
      spriteId: guardianSpriteId(species as GuardianId),
      portraitId: null,
      start: 1,
    };
  return {
    id,
    name,
    side: 'monster',
    spriteId: monsterSpriteId(species as MonsterId),
    portraitId: `portrait.monster.${species}`,
    start: 1,
  };
};

const stagePlayback = (n: 1 | 2 | 3, run: DescentStageRun): DescentStagePlayback => {
  const hunterOf = (f: DescentStageRun['fought'][number]): FloorCombatant => ({
    id: f.id,
    name: hunters[f.id].shortName,
    side: 'hunter',
    spriteId: hunterSpriteId(f.id),
    portraitId: `portrait.hunter.${f.id}`,
    // The front line starts as the stage's start Health says; a reserve steps in fresh.
    start:
      run.startHealth[f.id] !== undefined ? (run.startHealth[f.id] as number) / f.maxHealth : 1,
  });
  const combatants: FloorCombatant[] = [
    ...run.fought.map(hunterOf),
    ...run.monsters.map((m) => monsterOf(m.id, m.name)),
  ];
  const { steps, end } = playbackSteps(
    {
      log: run.log,
      hunters: run.fought,
      monsters: run.monsters,
    },
    combatants,
  );
  // Who is on the field: the starting front line, then each step-in batch replaces it.
  const start = new Set<string>(Object.keys(run.startHealth));
  let present = [...start, ...run.monsters.map((m) => m.id)];
  const batches = [...run.entries];
  const withPresent: DescentStep[] = steps.map((s) => {
    if (s.kind === 'rule' && s.text.includes('in from the reserve') && batches.length > 0) {
      const batch = batches.shift();
      if (batch) present = [...batch.ids, ...run.monsters.map((m) => m.id)];
    }
    return { ...s, present };
  });
  return {
    stage: n,
    floor: n,
    guardian: false,
    subtitle: DESCENT_STRINGS.stageMonsters[n - 1] ?? '',
    result: run.summary.won ? 'win' : 'loss',
    title: DESCENT_STRINGS.stages[n - 1] ?? '',
    heading: descentStageLine(n),
    banner: descentSceneId(n),
    combatants,
    steps: withPresent,
    end,
    won: run.summary.won,
    log: run.log.map((l) => ({ tick: l.tick, text: l.text })),
    logLabel: DESCENT_STRINGS.logs[n - 1] ?? '',
  };
};

/** Replays the record (logs on) and shapes it for the screen. */
export const descentPlaybackOf = (record: DescentRecord): DescentPlaybackView => {
  const run = rebuildDescentLogs(record);
  const stages = run.stages.map((s, i) => stagePlayback((i + 1) as 1 | 2 | 3, s));
  const won = run.outcome === 'win';
  const beats: DescentBeat[] = [card('D-01')];
  const intro: DescentCardId[] = ['D-02', 'D-03', 'D-04'];
  stages.forEach((s, i) => {
    beats.push(card(intro[i] as DescentCardId), { kind: 'stage', stage: s.stage });
  });
  if (won) beats.push(card('D-05'), card('D-06'));
  else beats.push(card('D-07'));
  return {
    stages,
    beats,
    result: {
      won,
      heading: won
        ? DESCENT_STRINGS.result.win
        : descentLine(DESCENT_STRINGS.result.loss, { s: run.stagesCleared + 1 }),
      summary: descentLine(DESCENT_STRINGS.result.summary, {
        a: run.standingCount,
        d: run.downedCount,
      }),
    },
  };
};

export interface LastDescentView {
  readonly playback: DescentPlaybackView;
  /** The result has not been seen yet: the card offers "View Descent result". */
  readonly unread: boolean;
}

/** The latest attempt, or null before the first. */
export const lastDescentView = (state: GameState): LastDescentView | null =>
  state.descent.last
    ? { playback: descentPlaybackOf(state.descent.last), unread: state.descent.unreadResult }
    : null;

/** Whether an unread result is waiting, without replaying anything. */
export const descentResultUnread = (state: GameState): boolean =>
  state.descent.last !== null && state.descent.unreadResult;

export interface DescentReplayView {
  /** D-01 to D-06, in order. */
  readonly cards: readonly DescentCard[];
  /** The three stage fights, with their log buttons. */
  readonly stages: readonly DescentStagePlayback[];
}

/**
 * The Library's replay (GDD §9.24): the first victory's cards and its three stage logs, rebuilt from
 * `descent.firstWin` alone, so a later attempt never changes it. Null before the first win.
 */
export const descentReplayView = (state: GameState): DescentReplayView | null => {
  const win = state.descent.firstWin;
  if (!win) return null;
  const pb = descentPlaybackOf(win);
  return {
    cards: pb.beats.flatMap((b) => (b.kind === 'card' ? [b.card] : [])),
    stages: pb.stages,
  };
};

export interface UnlitShelfEntry {
  readonly name: string;
  readonly portraitId: string;
  readonly whatItWas: string;
  readonly notebook: string;
  readonly stats: readonly string[];
  readonly weak: string;
  readonly resists: string;
  readonly abilities: readonly string[];
}

/** The Great Beasts shelf's entry for The Unlit, once Stage 3 has been reached (GDD §5.12.8). */
export const unlitShelfEntry = (state: GameState): UnlitShelfEntry | null => {
  if (!state.descent.unlitMet) return null;
  const lines = creatureLines(unlit);
  return {
    name: unlit.name,
    portraitId: UNLIT_PORTRAIT_ID,
    whatItWas: unlit.whatItWas,
    notebook: unlit.blurb,
    stats: [
      `Might ${unlit.might}`,
      `Armor ${unlit.armor}`,
      `Speed ${unlit.speed}`,
      `${unlit.attacks} ${unlit.attacks === 1 ? 'attack' : 'attacks'} an action`,
    ],
    weak: lines.weak,
    resists: lines.resists,
    abilities: lines.abilities,
  };
};
