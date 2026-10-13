import type { AgeId } from '../../content/ages';
import type { LocationId } from '../../content/damage';
import { hunters as hunterContent } from '../../content/hunters';
import { monsters } from '../../content/monsters';
import { num } from '../balance-access';
import type { Breakdown } from '../breakdown/breakdown';
import { runFight, type HunterSnapshot, type MonsterInstance } from '../combat';
import { explainFight } from '../combat/summary';
import type { MonsterId } from '../../content/monsters';
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
  /**
   * The species, or every species it could still be (GDD §5.6.3): then the odds are the
   * equal-weight mean over them, each at its own knowledge level.
   */
  readonly monster: MonsterInstance | readonly MonsterInstance[];
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
  /** True when the odds average over several candidates ("Odds assume an unidentified monster"). */
  readonly assumesUnidentified: boolean;
  /** Each candidate's own win chance; one entry for an identified monster. */
  readonly candidates: readonly { readonly monster: MonsterId; readonly winChance: number }[];
  readonly hunters: readonly HunterOdds[];
  readonly expectedBounty: number;
  readonly expectedTrophies: number;
  readonly expectedXpPerHunter: number;
  readonly meanTicks: number;
  readonly why: Breakdown;
}

const marginFor = (p: number, n: number): number => 1.96 * Math.sqrt((p * (1 - p)) / n);

const asPool = (m: OddsInput['monster']): readonly MonsterInstance[] =>
  Array.isArray(m) ? (m as readonly MonsterInstance[]) : [m as MonsterInstance];

/** How a candidate is named in the Why tree: its name only if the player has identified the species. */
const candidateLabel = (m: MonsterInstance, k: number): string =>
  (m.knowledge ?? 0) >= 2
    ? (monsters[m.monster]?.name ?? `Candidate ${k + 1}`)
    : `Candidate ${k + 1}`;

export const computeOdds = (input: OddsInput): Odds => {
  const n = input.samples ?? num('odds.samples');
  const pool = asPool(input.monster);
  const ids = input.party.map((h) => h.id);
  const seedPrep = input.prep ? prepIds(input.prep) : [];
  const bruised = ids.map(() => 0);
  const downed = ids.map(() => 0);
  // An unidentified monster: the same fights, split equally between the candidates, so each
  // is weighted equally (GDD §5.6.3). One species keeps the single, undivided run.
  const per = pool.length === 1 ? n : Math.ceil(n / pool.length);
  const winsBy = pool.map(() => 0);
  let ticks = 0;
  pool.forEach((monster, k) => {
    for (let j = 0; j < per; j++) {
      const r = runFight({
        party: input.party,
        monster,
        location: input.location,
        rolls: seeded(oddsSeed(input.gameSeed, input.contractId, ids, seedPrep, k * per + j)),
        log: false,
        prep: input.prep,
      });
      if (r.result === 'win') winsBy[k] = (winsBy[k] ?? 0) + 1;
      ticks += r.ticks;
      r.hunters.forEach((h, i) => {
        if (h.downed) downed[i] = (downed[i] ?? 0) + 1;
        else if (h.health < h.maxHealth * num('injury.bruisedBelow'))
          bruised[i] = (bruised[i] ?? 0) + 1;
      });
    }
  });
  const total = per * pool.length;
  const candidates = pool.map((m, k) => ({
    monster: m.monster,
    winChance: (winsBy[k] ?? 0) / per,
  }));
  const winChance = winsBy.reduce((s, w) => s + w, 0) / total;
  const reckless = winChance < num('contract.recklessBelow');
  const traits = input.party.map((h) => h.traits);
  const tier = pool[0]?.tier ?? 1;
  const bountyValue = bounty(tier, input.rank, traits).value;
  const fightOf = (monster: MonsterInstance) => ({
    party: input.party,
    monster,
    location: input.location,
    rolls: seeded('why'),
    prep: input.prep,
  });
  const only = pool[0];
  return {
    samples: total,
    winChance,
    margin: marginFor(winChance, total),
    reckless,
    assumesUnidentified: pool.length > 1,
    candidates,
    hunters: input.party.map((h, k) => {
      const d = (downed[k] ?? 0) / total;
      return {
        id: h.id,
        bruised: (bruised[k] ?? 0) / total,
        downed: d,
        death: reckless && !hunterContent[h.id].story ? d * num('injury.deathChance') : 0,
      };
    }),
    expectedBounty: winChance * bountyValue,
    expectedTrophies: winChance * trophies(tier),
    expectedXpPerHunter:
      winChance * xpPerHunter(tier, true) + (1 - winChance) * xpPerHunter(tier, false),
    meanTicks: ticks / total,
    why:
      pool.length === 1 && only
        ? explainFight(fightOf(only), winChance)
        : {
            label: 'Why these odds',
            value: winChance,
            formula: `the mean over ${pool.length} candidates, each weighted equally`,
            children: pool.map((m, k) =>
              explainFight(fightOf(m), candidates[k]?.winChance ?? 0, candidateLabel(m, k)),
            ),
          },
  };
};
