import { consumables, type ConsumableId } from '../src/content/consumables';
import { GEAR_IDS, gear, type GearId } from '../src/content/gear';
import { HUNTER_IDS, hunters } from '../src/content/hunters';
import { MONSTER_IDS, monsters } from '../src/content/monsters';
import { type HunterSnapshot } from '../src/core/combat';
import { computeOdds } from '../src/core/contracts/odds';
import { bombIsWeak, oilMatches } from '../src/core/contracts/prep';
import { stream } from '../src/core/rng';
import type { Preparation } from '../src/core/state/game-state';

// GDD §6.3 #4 (technical design §13.3): "on identified contracts at equal tier, matched
// preparation raises the odds by at least 15 percentage points over no preparation."
// Like the odds-honesty probe, it goes looking: random parties of every strength against
// random species, keeping the cases where preparation can matter (the odds without it are
// neither hopeless nor certain). For each it asks for the odds with nothing carried, and
// with matched preparation: the species' oil on every hunter, and up to two bombs it is
// weak to (a Saltburst if none is).

export interface PrepCase {
  readonly tier: number;
  readonly bare: number;
  readonly prepared: number;
}

const SAMPLES = 150;
const MAX_CANDIDATES = 1500;
const PER_TIER = 25;
/** The odds without preparation must sit in this band for preparation to have room to matter. */
const BAND = [0.1, 0.9] as const;

const STRENGTHS: readonly (readonly [number, number, number])[] = [
  [1, 0, 0],
  [3, 1, 0],
  [5, 1, 1],
  [7, 2, 2],
  [9, 3, 2],
  [10, 3, 3],
];

const gearOfTier = (slot: 'weapon' | 'armor', tier: number): GearId | null =>
  GEAR_IDS.find((g) => gear[g].slot === slot && gear[g].tier === tier) ?? null;

const pick = <T>(list: readonly T[], roll: number): T =>
  list[Math.min(list.length - 1, Math.floor(roll * list.length))] as T;

export const prepProbe = (): PrepCase[] => {
  const out: PrepCase[] = [];
  const perTier = new Map<number, number>();
  for (let i = 0; i < MAX_CANDIDATES; i++) {
    const r = stream('prep-probe', 'case', i);
    const size = 2 + Math.floor(r.next() * 3);
    const pool = [...HUNTER_IDS];
    const ids = Array.from(
      { length: size },
      () => pool.splice(Math.floor(r.next() * pool.length), 1)[0],
    ).filter((id): id is (typeof HUNTER_IDS)[number] => id !== undefined);
    const monster = pick(MONSTER_IDS, r.next());
    const def = monsters[monster];
    const tier = def.tiers[0] + Math.floor(r.next() * (def.tiers[1] - def.tiers[0] + 1));
    if ((perTier.get(tier) ?? 0) >= PER_TIER) continue;
    const location = pick(def.locations, r.next());
    const [level, weapon, armor] = pick(STRENGTHS, r.next());
    const party: HunterSnapshot[] = ids.map((id) => ({
      id,
      name: hunters[id].name,
      role: hunters[id].role,
      damage: hunters[id].damage,
      level,
      base: hunters[id].stats,
      traits: hunters[id].traits,
      weapon: gearOfTier('weapon', weapon),
      armorGear: gearOfTier('armor', armor),
    }));
    const contractId = `p${i}`;
    const base = {
      gameSeed: 'prep-probe',
      contractId,
      party,
      monster: { monster, tier, knowledge: 0 },
      location,
      rank: 'keep' as const,
      samples: SAMPLES,
    };
    const bare = computeOdds(base).winChance;
    if (bare < BAND[0] || bare > BAND[1]) continue;
    const consumableIds = Object.keys(consumables) as ConsumableId[];
    const oil = consumableIds.find((c) => consumables[c].kind === 'oil' && oilMatches(c, monster));
    const weak = (['fire-pot', 'frost-pot'] as const).filter((b) => bombIsWeak(b, monster));
    const prep: Preparation = {
      oils: oil ? Object.fromEntries(ids.map((id) => [id, oil])) : {},
      potions: {},
      bombs: weak.length > 0 ? weak : ['saltburst'],
    };
    const prepared = computeOdds({ ...base, prep }).winChance;
    out.push({ tier, bare, prepared });
    perTier.set(tier, (perTier.get(tier) ?? 0) + 1);
    if ([1, 2, 3, 4, 5].every((t) => (perTier.get(t) ?? 0) >= PER_TIER)) break;
  }
  return out;
};
