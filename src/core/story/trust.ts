import { constantAt } from '../balance-access';
import type { Explained } from '../breakdown/breakdown';
import { TRUST_LEVELS, trustLevels, type TrustLevel } from '../../content/story/trust';
import { VILLAGE_IDS, villages, type VillageId } from '../../content/villages';
import type { GameState } from '../state/game-state';

// GDD §5.14.6 (D146, D147): village trust rises from contracts won for a village
// (trust.stepContracts per step) and from Triumphant stands (one step for every
// village, counted progress carried over). It never drops, is kept through the
// Long Night, and changes no number in v0.5.

export const trustKey = (village: VillageId, level: TrustLevel): string =>
  `trust:${village}:${level}`;

/** Contracts needed to rise from a level; null at Sworn. */
export const stepNeed = (level: TrustLevel): number | null => {
  const steps = constantAt('trust.stepContracts').value as readonly number[];
  return steps[TRUST_LEVELS.indexOf(level)] ?? null;
};

const nextLevel = (level: TrustLevel): TrustLevel | null =>
  TRUST_LEVELS[TRUST_LEVELS.indexOf(level) + 1] ?? null;

/** Rises while the counted progress covers the next step; returns a key per step. */
const settle = (state: GameState, village: VillageId): string[] => {
  const t = state.story.trust[village];
  const keys: string[] = [];
  for (;;) {
    const need = stepNeed(t.level);
    const next = nextLevel(t.level);
    if (need === null || next === null || t.progress < need) break;
    t.progress -= need;
    t.level = next;
    keys.push(trustKey(village, next));
  }
  if (nextLevel(t.level) === null) t.progress = 0; // Sworn: nothing left to count toward
  return keys;
};

/** A contract won for a village counts toward its next step. Returns a key per step risen. */
export const winForVillage = (state: GameState, village: VillageId): string[] => {
  const t = state.story.trust[village];
  t.won += 1;
  if (nextLevel(t.level) !== null) t.progress += 1;
  return settle(state, village);
};

/** A Triumphant stand raises every village one step; counted progress carries over. */
export const triumphantStand = (state: GameState): string[] => {
  const keys: string[] = [];
  for (const v of VILLAGE_IDS) {
    const t = state.story.trust[v];
    const next = nextLevel(t.level);
    if (next === null) continue;
    t.level = next;
    t.triumphs += 1;
    keys.push(trustKey(v, next), ...settle(state, v));
  }
  return keys;
};

/** The Villages panel's long-press breakdown (GDD §5.14.6): contracts toward the next step. */
export const trustBreakdown = (state: GameState, village: VillageId): Explained => {
  const t = state.story.trust[village];
  const need = stepNeed(t.level);
  const next = nextLevel(t.level);
  return {
    value: t.progress,
    breakdown: {
      label: `${villages[village].name}: ${trustLevels[t.level].label}`,
      value: t.progress,
      formula:
        need === null || next === null
          ? 'Sworn: as high as trust goes'
          : `${t.progress} of ${need} contracts toward ${trustLevels[next].label}`,
      key: 'trust.stepContracts',
      children: [
        { label: 'Contracts won for the village (from v0.5)', value: t.won },
        { label: 'Triumphant stands that raised it', value: t.triumphs },
      ],
    },
  };
};
