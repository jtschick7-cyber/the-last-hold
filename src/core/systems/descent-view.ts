import { DESCENT_STRINGS, descentLine } from '../../content/descent-text';
import { HUNTER_IDS, type HunterId } from '../../content/hunters';
import { learnedBonus, type ActiveDelveRelic } from './descent';
import type { DescentPreview } from './descent-odds';
import { descentAvailable } from './descent-record';
import type { Breakdown } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';
import { hunterStatus } from './hunters';

// GDD §9.24, technical design §22.4: what the Descent sheet shows, worked out here so the screen only
// draws it (CLAUDE.md: the UI never computes game rules). Every line is a GDD §9.24 string.

export interface UnavailableHunter {
  readonly id: HunterId;
  /** "On a contract" or "In a Delve". */
  readonly reason: string;
}

export interface DescentSheetView {
  readonly open: boolean;
  /** `What the hold learned: +m% Might and Health · −t% damage taken`. */
  readonly learnedLine: string;
  /** The tree the ⓘ sheet lists: the four stat lines then the relics line. */
  readonly learned: Breakdown;
  readonly relicsHeading: string;
  readonly delveRelics: readonly ActiveDelveRelic[];
  readonly unavailable: readonly UnavailableHunter[];
}

export const descentSheetView = (state: GameState): DescentSheetView => {
  const learned = learnedBonus(state);
  const unavailable: UnavailableHunter[] = [];
  for (const id of HUNTER_IDS) {
    const status = hunterStatus(state, id);
    if (status === 'on-contract') unavailable.push({ id, reason: DESCENT_STRINGS.away.contract });
    else if (status === 'in-delve') unavailable.push({ id, reason: DESCENT_STRINGS.away.delve });
  }
  return {
    open: descentAvailable(state),
    learnedLine: descentLine(DESCENT_STRINGS.learnedSummary, {
      m: learned.summary.mightPct,
      t: learned.summary.takenPct,
    }),
    learned: learned.breakdown,
    relicsHeading: learned.relicsHeading,
    delveRelics: learned.delveRelics,
    unavailable,
  };
};

export interface DescentPreviewLines {
  readonly win: string;
  readonly expected: string;
  readonly why: string;
  readonly breakdown: Breakdown;
  readonly samples: number;
}

/** The three preview lines (GDD §9.24); percents are whole numbers. */
export const descentPreviewLines = (p: DescentPreview): DescentPreviewLines => {
  const downed = { d: p.downed.median, d1: p.downed.p10, d2: p.downed.p90 };
  return {
    win: descentLine(DESCENT_STRINGS.preview.win, {
      p: Math.round(p.winChance * 100),
      m: Math.round(p.margin * 100),
    }),
    expected:
      p.outcome === 'win'
        ? descentLine(DESCENT_STRINGS.preview.victory, downed)
        : descentLine(DESCENT_STRINGS.preview.stage, { s: p.stagesCleared + 1, ...downed }),
    why: DESCENT_STRINGS.preview.why,
    breakdown: p.why,
    samples: p.samples,
  };
};
