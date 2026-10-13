import { firstCottageCheck } from './first-cottage';
import { firstMineCheck } from './first-mine';
import { keepCheck } from './keep';
import { mill3Check } from './mill-3';
import { noDrySpellsCheck } from './no-dry-spells';
import { noOverflowCheck } from './no-overflow';
import { noWallsCheck } from './no-walls';
import { peasants10Check } from './peasants-10';
import { somethingToDoCheck } from './something-to-do';
import type { Check } from './types';

export type { Check, CheckResult } from './types';

/** Every check built so far; each milestone enforces those it has reached. */
export const CHECKS: readonly Check[] = [
  firstCottageCheck,
  firstMineCheck,
  mill3Check,
  peasants10Check,
  keepCheck,
  somethingToDoCheck,
  noDrySpellsCheck,
  noWallsCheck,
  noOverflowCheck,
];
