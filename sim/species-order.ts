// v1.0 (plan TV.11, D485 (4)): the one rule the report-only "Study all 16 species" variant adds to
// Standard. Among the contracts whose tier is within one of the tier Standard would pick, the one
// whose species is not yet Studied goes first (ties in Standard's order); otherwise Standard's
// choice stands. Outside `sim.yml`, the baseline and `sim/targets.ts`.
import type { ContractInstance, GameState } from '../src/core/state/game-state';
import { contractIdentity } from '../src/core/investigation/view';
import { levelOf } from '../src/core/investigation/knowledge';

/** GDD §5.6.2: level 3 is Studied. */
export const STUDIED_LEVEL = 3;

export type Unstudied = (s: GameState, c: ContractInstance) => boolean;

/** (A) best case: sees each contract's true species. */
export const unstudiedTrue: Unstudied = (s, c) => levelOf(s, c.monster) < STUDIED_LEVEL;

/** (B) realistic: sees only the candidate list a player sees; unstudied if any candidate is. */
export const unstudiedSeen: Unstudied = (s, c) =>
  contractIdentity(s, c).candidates.some((x) => x.level < STUDIED_LEVEL);

export const speciesOrder =
  (unstudied: Unstudied) =>
  (s: GameState, inStandardOrder: ContractInstance[]): ContractInstance[] => {
    const top = inStandardOrder[0]?.tier;
    if (top === undefined) return inStandardOrder;
    const near = (c: ContractInstance): boolean => c.tier >= top - 1 && unstudied(s, c);
    return [...inStandardOrder.filter(near), ...inStandardOrder.filter((c) => !near(c))];
  };
