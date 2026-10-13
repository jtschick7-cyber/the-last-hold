import { BUILDING_IDS, buildings } from '../../content/buildings';
import type { JobId } from '../../content/jobs';
import type { Explained } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';

// GDD §5.1.1: housing caps peasants; job slots come from buildings.
const sumEffect = (
  state: GameState,
  label: string,
  amountOf: (id: (typeof BUILDING_IDS)[number]) => number,
): Explained => {
  const children = BUILDING_IDS.flatMap((id) => {
    const owned = state.buildings[id];
    const each = amountOf(id);
    if (owned === 0 || each === 0) return [];
    return [
      {
        label: `${buildings[id].name} ×${owned}`,
        value: owned * each,
        formula: `${owned} × ${each}`,
      },
    ];
  });
  const value = children.reduce((s, c) => s + c.value, 0);
  return { value, breakdown: { label, value, formula: 'Σ buildings', children } };
};

export const housing = (state: GameState): Explained =>
  sumEffect(state, 'Housing', (id) =>
    buildings[id].effects.reduce((s, e) => s + (e.kind === 'housing' ? e.amount : 0), 0),
  );

export const jobSlots = (state: GameState, job: JobId): Explained =>
  sumEffect(state, 'Job slots', (id) =>
    buildings[id].effects.reduce(
      (s, e) => s + (e.kind === 'jobSlots' && e.job === job ? e.amount : 0),
      0,
    ),
  );

export const workers = (state: GameState): number =>
  Object.values(state.peasants.jobs).reduce((a, b) => a + b, 0);

export const idlePeasants = (state: GameState): number => state.peasants.total - workers(state);
