import { hunters, type HunterId } from '../../content/hunters';
import { constantAt } from '../balance-access';
import { TALENT_BRANCHES, talentById, talentsOf, type TalentDef } from '../../content/talents';
import type { GameState, HunterState } from '../state/game-state';
import { hunterStatus } from './hunters';
import { tiersOpen, unspentTalentPoints } from './ranks';

// GDD §5.11.5 (v0.8, D313, D328 (6)): talents are picked with the points a rank gives; a tier is
// open only with enough stars. Picking, respeccing and keepsakes are refused while the hunter is on
// a contract or in a Delve (the trait switch's rule), so a frozen fight is never second-guessed.

/** Why a hunter's build cannot be changed right now, or null. */
export const busyReason = (state: GameState, id: HunterId): string | null => {
  const status = hunterStatus(state, id);
  if (status === 'on-contract') return `${hunters[id].shortName} is on a contract.`;
  if (status === 'in-delve') return `${hunters[id].shortName} is in a Delve.`;
  return null;
};

/** The words for a tier that needs more stars. */
const needsStars = (tier: number, stars: number): string => {
  const tierStars = constantAt('talent.tierStars').value as readonly number[];
  return `needs ${tierStars[tier - 1]} stars (has ${stars})`;
};

/** Why this talent cannot be picked now, or null when it can. */
export const pickProblem = (state: GameState, id: HunterId, talent: TalentDef): string | null => {
  const h = state.hunters[id];
  if (!h) return 'That hunter is not on your roster.';
  const name = hunters[id].shortName;
  if (talent.role !== hunters[id].role) return `${name} cannot learn a ${talent.role}'s talent.`;
  if (h.talents.includes(talent.id)) return 'Already picked.';
  if (unspentTalentPoints(h) <= 0) return 'No talent points left. Rank up for more.';
  if (tiersOpen(h.stars) < talent.tier) return needsStars(talent.tier, h.stars);
  return null;
};

export interface TalentCell {
  readonly talent: TalentDef;
  readonly picked: boolean;
  /** Why not (the sheet shows it on the cell); null when it can be picked. */
  readonly problem: string | null;
}

export interface TalentBranchView {
  readonly id: string;
  readonly name: string;
  readonly cells: readonly TalentCell[];
}

export interface TalentSheet {
  readonly points: number;
  readonly branches: readonly TalentBranchView[];
  /** The Herbs branch does nothing in Delves (no potions there, D254); the sheet says so. */
  readonly delveNote: string;
}

/** The talent sheet of one hunter: three branches of three tiers (GDD §9.16). */
export const talentSheet = (state: GameState, id: HunterId): TalentSheet | null => {
  const h: HunterState | undefined = state.hunters[id];
  if (!h) return null;
  const role = hunters[id].role;
  const all = talentsOf(role);
  return {
    points: unspentTalentPoints(h),
    branches: TALENT_BRANCHES[role].map((b) => ({
      id: b.id,
      name: b.name,
      cells: all
        .filter((t) => t.branch === b.id)
        .sort((a, c) => a.tier - c.tier)
        .map((talent) => ({
          talent,
          picked: h.talents.includes(talent.id),
          problem: h.talents.includes(talent.id) ? null : pickProblem(state, id, talent),
        })),
    })),
    delveNote:
      role === 'mender' ? 'Herbs does nothing in a Delve: there are no potions down there.' : '',
  };
};

export const talentFor = (id: unknown): TalentDef | undefined =>
  typeof id === 'string' ? talentById(id) : undefined;
