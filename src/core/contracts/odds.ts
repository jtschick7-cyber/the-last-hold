import type { AgeId } from '../../content/ages';
import type { LocationId } from '../../content/damage';
import { hunters as hunterContent } from '../../content/hunters';
import { num } from '../balance-access';
import type { Breakdown } from '../breakdown/breakdown';
import { runFight, type HunterSnapshot, type MonsterInstance } from '../combat';
import { explainFight } from '../combat/summary';
import { seeded } from '../rng';
import type { Preparation } from '../state/game-state';
import { prepIds } from './prep';
import { oddsSeed } from './seeds';
import { bounty, trophies, xpPerHunter } from './rewards';

// GDD §5.4.2 launch step 3: the odds panel. n simulated fights (odds.samples),
// each on its own derived seed, so the preview never reveals the real roll.

export interface OddsInput {
  readonly gameSeed: string;
  readonly contractId: string;
  readonly party: readonly HunterSnapshot[];
  readonly monster: MonsterInstance;
  readonly location: LocationId;
  readonly rank: AgeId;
  /** What the party carries (GDD §5.7); absent means nothing. */
  readonly prep?: Preparation;
  /** Overrides odds.samples (Suggest's first stage uses fewer). */
  readonly samples?: number;
}

export interface HunterOdds {
  readonly id: string;
  /** Chance of ending under 30% Health without being downed. */
  readonly bruised: number;
  /** Chance of being downed. */
  readonly downed: number;
  /** Chance of dying: downed × the death chance, on Reckless contracts, never for story hunters. */
  readonly death: number;
}

export interface Odds {
  readonly samples: number;
  readonly winChance: number;
  /** ±1.96 × √(p(1−p)/n) (GDD §7.4). */
  readonly margin: number;
  readonly reckless: boolean;
  readonly hunters: readonly HunterOdds[];
  readonly expectedBounty: number;
  readonly expectedTrophies: number;
  readonly expectedXpPerHunter: number;
  readonly meanTicks: number;
  readonly why: Breakdown;
}

const marginFor = (p: number, n: number): number => 1.96 * Math.sqrt((p * (1 - p)) / n);

export const computeOdds = (input: OddsInput): Odds => {
  const n = input.samples ?? num('odds.samples');
  const ids = input.party.map((h) => h.id);
  const seedPrep = input.prep ? prepIds(input.prep) : [];
  const bruised = ids.map(() => 0);
  const downed = ids.map(() => 0);
  let wins = 0;
  let ticks = 0;
  for (let i = 0; i < n; i++) {
    const r = runFight({
      party: input.party,
      monster: input.monster,
      location: input.location,
      rolls: seeded(oddsSeed(input.gameSeed, input.contractId, ids, seedPrep, i)),
      log: false,
      prep: input.prep,
    });
    if (r.result === 'win') wins += 1;
    ticks += r.ticks;
    r.hunters.forEach((h, k) => {
      if (h.downed) downed[k] = (downed[k] ?? 0) + 1;
      else if (h.health < h.maxHealth * num('injury.bruisedBelow'))
        bruised[k] = (bruised[k] ?? 0) + 1;
    });
  }
  const winChance = wins / n;
  const reckless = winChance < num('contract.recklessBelow');
  const traits = input.party.map((h) => h.traits);
  const tier = input.monster.tier;
  const bountyValue = bounty(tier, input.rank, traits).value;
  return {
    samples: n,
    winChance,
    margin: marginFor(winChance, n),
    reckless,
    hunters: input.party.map((h, k) => {
      const d = (downed[k] ?? 0) / n;
      return {
        id: h.id,
        bruised: (bruised[k] ?? 0) / n,
        downed: d,
        death: reckless && !hunterContent[h.id].story ? d * num('injury.deathChance') : 0,
      };
    }),
    expectedBounty: winChance * bountyValue,
    expectedTrophies: winChance * trophies(tier),
    expectedXpPerHunter:
      winChance * xpPerHunter(tier, true) + (1 - winChance) * xpPerHunter(tier, false),
    meanTicks: ticks / n,
    why: explainFight(
      {
        party: input.party,
        monster: input.monster,
        location: input.location,
        rolls: seeded('why'),
        prep: input.prep,
      },
      winChance,
    ),
  };
};
