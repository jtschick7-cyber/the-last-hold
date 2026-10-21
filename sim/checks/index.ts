import { bastionCheck } from './bastion';
import { bestLastStandCheck } from './best-last-stand';
import { citadelCheck } from './citadel';
import { contractsOwnSilverCheck } from './contracts-own-silver';
import { firstLongNightCheck } from './first-long-night';
import { laterCyclesCheck } from './later-cycles';
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
import { firstRuinCheck } from './first-ruin';
import { ribbonshadesCheck } from './ribbonshades';
import { act1Check, act2Check, act3Check, act4Check, act5Check, act6Check } from './story-acts';
import { trustMovesCheck } from './trust-moves';
import {
  arvidLetterCheck,
  firstNewBrewCheck,
  recipeBookCheck,
  skillsPaceCheck,
  skillsStartCheck,
  trustArcCheck,
} from './v06';
import { firstGuardianCheck, idleOnlyCheck } from './v07';
import { firstWrightCheck, lateLettersCheck } from './v08';
import { drossProbeCheck } from './v09';
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
  // v0.4
  citadelCheck,
  bastionCheck,
  bestLastStandCheck,
  firstLongNightCheck,
  laterCyclesCheck,
  // v0.5 (D168)
  firstRuinCheck,
  act1Check,
  act2Check,
  ribbonshadesCheck,
  trustMovesCheck,
  // v0.6 (D216)
  firstNewBrewCheck,
  recipeBookCheck,
  skillsStartCheck,
  skillsPaceCheck,
  act3Check,
  arvidLetterCheck,
  trustArcCheck,
  // v0.7 (D271)
  act4Check,
  firstGuardianCheck,
  idleOnlyCheck,
  // v0.8 (D322)
  act5Check,
  act6Check,
  drossProbeCheck,
  lateLettersCheck,
  firstWrightCheck,
];
