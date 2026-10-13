import { GEAR_IDS, gear, type GearId } from '../src/content/gear';
import { HUNTER_IDS, hunters } from '../src/content/hunters';
import { MONSTER_IDS, monsters } from '../src/content/monsters';
import { runFight, type HunterSnapshot } from '../src/core/combat';
import { computeOdds } from '../src/core/contracts/odds';
import { fightSeed } from '../src/core/contracts/seeds';
import { seeded, stream } from '../src/core/rng';
import type { ContractRecord } from './run';

// GDD §6.3 #4 (technical design §13.3): the odds-honesty check needs contracts
// across the whole odds range, but a sensible player (the simulated one) never
// takes a coin-flip, and fights are so close to decided by strength that odds sit
// at 0% or 100% for nearly every random pairing. So this probe goes looking: it
// builds random parties and monsters, strengthens each party step by step (level,
// then gear), and keeps a case wherever the odds land in a bucket that still has
// room. For each kept case it asks for the 500-fight odds the launch panel would
// show, then plays the one real fight the game would play, on its own seed.

const BUCKETS = 10;
const PER_BUCKET = 40;
/** Real fights played per kept case: one fight is a coin flip, many show the true rate. */
const REAL_FIGHTS = 25;
/** Fights used only to find out which bucket a case falls in. */
const FIND_SAMPLES = 30;
const MAX_CANDIDATES = 4000;

const pick = <T>(list: readonly T[], roll: number): T =>
  list[Math.min(list.length - 1, Math.floor(roll * list.length))] as T;

const gearOfTier = (slot: 'weapon' | 'armor', tier: number): GearId | null =>
  GEAR_IDS.find((g) => gear[g].slot === slot && gear[g].tier === tier) ?? null;

/** Ten strengths for one party, from fresh recruits to veterans in good gear. */
const STRENGTHS: readonly (readonly [level: number, weapon: number, armor: number])[] = [
  [1, 0, 0],
  [2, 0, 0],
  [3, 1, 0],
  [4, 1, 1],
  [5, 1, 1],
  [6, 2, 1],
  [7, 2, 2],
  [8, 2, 2],
  [9, 3, 2],
  [10, 3, 3],
];

/** About `target` matchups, each with REAL_FIGHTS real outcomes (so `target × 25` records). */
export const honestyProbe = (target: number): ContractRecord[] => {
  const out: ContractRecord[] = [];
  const room = Array.from({ length: BUCKETS }, () => 0);
  const bucketOf = (p: number): number => Math.min(BUCKETS - 1, Math.floor(p * BUCKETS));
  let kept = 0;
  for (let i = 0; i < MAX_CANDIDATES && kept < target; i++) {
    const r = stream('honesty', 'case', i);
    const size = 2 + Math.floor(r.next() * 3);
    const pool = [...HUNTER_IDS];
    const ids = Array.from(
      { length: size },
      () => pool.splice(Math.floor(r.next() * pool.length), 1)[0],
    ).filter((id): id is (typeof HUNTER_IDS)[number] => id !== undefined);
    const monster = pick(MONSTER_IDS, r.next());
    const def = monsters[monster];
    const tier = def.tiers[0] + Math.floor(r.next() * (def.tiers[1] - def.tiers[0] + 1));
    const location = pick(def.locations, r.next());
    const partyAt = ([level, weapon, armor]: (typeof STRENGTHS)[number]): HunterSnapshot[] =>
      ids.map((id) => ({
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
    const contractId = `h${i}`;
    const order = [...STRENGTHS.keys()].sort(() => r.next() - 0.5);
    for (const s of order) {
      const party = partyAt(STRENGTHS[s] ?? [1, 0, 0]);
      const coarse = computeOdds({
        gameSeed: 'honesty-find',
        contractId,
        party,
        monster: { monster, tier },
        location,
        rank: 'keep',
        samples: FIND_SAMPLES,
      });
      if ((room[bucketOf(coarse.winChance)] ?? 0) >= PER_BUCKET) continue;
      const odds = computeOdds({
        gameSeed: 'honesty',
        contractId: `${contractId}-${s}`,
        party,
        monster: { monster, tier },
        location,
        rank: 'keep',
      });
      for (let k = 0; k < REAL_FIGHTS; k++) {
        // Each is the fight the game would play for a contract with this matchup (its own seed).
        const real = runFight({
          party,
          monster: { monster, tier },
          location,
          rolls: seeded(fightSeed('honesty', `${contractId}-${s}-real${k}`, ids)),
          log: false,
        });
        out.push({ hours: 0, tier, winChance: odds.winChance, success: real.result === 'win' });
      }
      room[bucketOf(coarse.winChance)] = (room[bucketOf(coarse.winChance)] ?? 0) + 1;
      kept += 1;
      break;
    }
  }
  return out;
};
