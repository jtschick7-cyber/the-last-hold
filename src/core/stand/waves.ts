import { guardians } from '../../content/delves/guardians';
import { MONSTER_IDS, monsters, type MonsterId } from '../../content/monsters';
import { constantAt, num } from '../balance-access';
import { seeded, streamSeed } from '../rng';
import type { GameState } from '../state/game-state';

// GDD §5.9.3 (D107, D115): the Last Stand's waves are monsters the hold knows. The
// stand seed fixes the cycle's wave list when the hold reaches Bastion; it is never
// stored, only rebuilt from the seed.

/** `${gameSeed}:stand:${cycle}` (D115). */
export const standSeed = (state: GameState): string =>
  streamSeed(state.meta.gameSeed, 'stand', state.cycle.number);

/** Wave n's tier: wave 1 at `laststand.firstTier`, one more every `laststand.wavesPerTier` waves. */
export const waveTier = (n: number): number =>
  num('laststand.firstTier') + Math.floor((n - 1) / num('laststand.wavesPerTier'));

/** The highest contract tier in any Rank; past it the tier scaling simply continues (GDD §5.9.3). */
const topTier = (): number =>
  Math.max(...Object.values(constantAt('contract.ageTierCap').value as Record<string, number>));

/** Species whose tier range includes the tier; above tier 5, those that reach tier 5 (D115). */
export const speciesForTier = (tier: number): MonsterId[] => {
  const t = Math.min(tier, topTier());
  return MONSTER_IDS.filter((id) => monsters[id].tiers[0] <= t && monsters[id].tiers[1] >= t);
};

/** The Dross-Tide, the one Deep creature a Last Stand can roll (GDD §5.9.3, D363). */
export const DROSS_TIDE = 'dross-tide' as const;

/** A stand's species pool, fixed on the cycle record (GDD §5.9.3, D363). */
export type StandPool = 'base' | 'dross';

/** A wave of the `base` pool: one of the contract species (every stand before v0.9). */
export interface BaseWave {
  readonly n: number;
  readonly tier: number;
  readonly monster: MonsterId;
}

/** A wave of either pool. */
export interface Wave {
  readonly n: number;
  readonly tier: number;
  readonly monster: MonsterId | typeof DROSS_TIDE;
}

/**
 * Wave n, from the stand seed alone (each wave has its own stream, so the list is stable).
 * The `dross` pool adds the Dross-Tide with its own roll, drawn after the species roll and from a
 * separate stream: a wave it does not take is exactly the `base` wave, so a `dross` list differs
 * only by the Dross-Tide (D393). Each species, and the Dross-Tide, then has the same chance.
 */
export function waveAt(seed: string, n: number, standPool?: 'base'): BaseWave;
export function waveAt(seed: string, n: number, standPool?: StandPool): Wave;
export function waveAt(seed: string, n: number, standPool: StandPool = 'base'): Wave {
  const tier = waveTier(n);
  const pool = speciesForTier(tier);
  const roll = seeded(`${seed}:species:${n}`).next();
  const monster = pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))] ?? MONSTER_IDS[0];
  if (standPool === 'dross' && seeded(`${seed}:dross:${n}`).next() * (pool.length + 1) < 1)
    return { n, tier, monster: DROSS_TIDE };
  return { n, tier, monster };
}

/** The first `count` waves (the stand screen shows 12, GDD §9.13). */
export function waveList(seed: string, count: number, standPool?: 'base'): BaseWave[];
export function waveList(seed: string, count: number, standPool?: StandPool): Wave[];
export function waveList(seed: string, count: number, standPool: StandPool = 'base'): Wave[] {
  return Array.from({ length: count }, (_, i) => waveAt(seed, i + 1, standPool));
}

/** The content entry of a wave's creature (name, family, resistances), whichever pool it came from. */
export const creatureOf = (monster: Wave['monster']) =>
  monster === DROSS_TIDE ? guardians[monster] : monsters[monster];
