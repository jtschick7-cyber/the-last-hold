import { contractsOwnSilverCheck } from './contracts-own-silver';
import { firstContractCheck } from './first-contract';
import { firstCottageCheck } from './first-cottage';
import { firstIdentifiedCheck } from './first-identified';
import { firstStudiedCheck } from './first-studied';
import { firstMineCheck } from './first-mine';
import { firstTier3Check } from './first-tier-3';
import { keepCheck } from './keep';
import { mill3Check } from './mill-3';
import { noDrySpellsCheck } from './no-dry-spells';
import { noOverflowCheck } from './no-overflow';
import { noWallsCheck } from './no-walls';
import { oddsHonestCheck } from './odds-honest';
import { preparationMattersCheck } from './preparation-matters';
import { peasants10Check } from './peasants-10';
import { provisionsMatterCheck } from './provisions-matter';
import { roster4Check } from './roster-4';
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
  // v0.2
  firstContractCheck,
  roster4Check,
  firstTier3Check,
  oddsHonestCheck,
  contractsOwnSilverCheck,
  provisionsMatterCheck,
  // v0.3
  firstIdentifiedCheck,
  firstStudiedCheck,
  preparationMattersCheck,
];
