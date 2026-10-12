import { buildings, type BuildingId } from '../../content/buildings';
import { RESOURCE_IDS, type ResourceBundle, type ResourceId } from '../../content/resources';
import { num } from '../balance-access';
import type { Breakdown } from '../breakdown/breakdown';
import { geometricCost, intPow, maxAffordable } from '../math';
import type { GameState } from '../state/game-state';
import { SECONDS_PER_MINUTE } from '../time';

// GDD §5.1.2 building costs. Count buildings: base × r^n per copy, where n
// counts every copy owned, free starting ones included (A8); k copies cost
// base × r^n × (r^k − 1)/(r − 1). Level buildings: level L costs base × r^(L−1).

export interface Cost {
  readonly bundle: Record<ResourceId, number>;
  readonly breakdown: Breakdown;
}

const resourcesIn = (b: ResourceBundle): ResourceId[] =>
  RESOURCE_IDS.filter((r) => (b[r] ?? 0) > 0);

const emptyBundle = (): Record<ResourceId, number> =>
  Object.fromEntries(RESOURCE_IDS.map((r) => [r, 0])) as Record<ResourceId, number>;

/** What the next `count` copies (count buildings) or the next level cost. */
export const buildingCost = (state: GameState, id: BuildingId, count = 1): Cost => {
  const def = buildings[id];
  const bundle = emptyBundle();
  if (def.kind === 'unique') return { bundle, breakdown: { label: `${def.name} cost`, value: 0 } };
  const owned = state.buildings[id];
  const children: Breakdown[] = [];
  for (const r of resourcesIn(def.baseCost)) {
    const base = def.baseCost[r] ?? 0;
    if (def.kind === 'count') {
      const growth = num('costGrowth.count');
      const next = base * intPow(growth, owned);
      bundle[r] = geometricCost(next, growth, count);
      children.push({
        label: r,
        value: bundle[r],
        formula:
          count === 1
            ? `${base} × ${growth}^${owned}`
            : `${base} × ${growth}^${owned} × (${growth}^${count} − 1)/(${growth} − 1)`,
        key: 'costGrowth.count',
      });
    } else {
      const growth = num('costGrowth.level');
      const level = owned + 1;
      bundle[r] = base * intPow(growth, level - 1);
      children.push({
        label: r,
        value: bundle[r],
        formula: `${base} × ${growth}^(${level} − 1)`,
        key: 'costGrowth.level',
      });
    }
  }
  const what = def.kind === 'count' ? `${count} × ${def.name}` : `${def.name} level ${owned + 1}`;
  return {
    bundle,
    breakdown: { label: `${what} cost`, value: def.kind === 'count' ? count : owned + 1, children },
  };
};

/**
 * GDD §5.1.2 "Max": the most copies of a count building affordable now, the
 * smallest k across its cost resources, and never past a locked copy limit.
 */
export const maxAffordableCount = (state: GameState, id: BuildingId): number => {
  const def = buildings[id];
  if (def.kind !== 'count') return 0;
  const growth = num('costGrowth.count');
  const owned = state.buildings[id];
  let k = Number.POSITIVE_INFINITY;
  for (const r of resourcesIn(def.baseCost)) {
    const next = (def.baseCost[r] ?? 0) * intPow(growth, owned);
    k = Math.min(k, maxAffordable(next, growth, state.resources[r]));
  }
  if (def.maxCountKey) k = Math.min(k, Math.max(0, num(def.maxCountKey) - owned));
  return k === Number.POSITIVE_INFINITY ? 0 : k;
};

/** True when every resource covers the cost. Uses exact values (technical design §8). */
export const canAfford = (state: GameState, bundle: Record<ResourceId, number>): boolean =>
  RESOURCE_IDS.every((r) => state.resources[r] >= bundle[r]);

/**
 * GDD §9.2 "ready in ~1 h 20 m": seconds until every resource covers the cost at
 * current rates (0 if affordable now, null if some resource isn't produced).
 * An estimate only: it ignores what auto-settle will spend on the way.
 */
export const timeToAfford = (
  state: GameState,
  bundle: Record<ResourceId, number>,
  perMinute: (r: ResourceId) => number,
): number | null => {
  let minutes = 0;
  for (const r of RESOURCE_IDS) {
    const short = bundle[r] - state.resources[r];
    if (short <= 0) continue;
    const rate = perMinute(r);
    if (rate <= 0) return null;
    minutes = Math.max(minutes, short / rate);
  }
  return minutes * SECONDS_PER_MINUTE;
};
