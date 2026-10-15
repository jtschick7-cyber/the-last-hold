import { FAMILY_IDS, type FamilyId } from '../../content/damage';
import type { RarityId } from '../../content/delves/blessing-types';
import { RARITIES } from '../../content/delves/blessing-types';
import { blessingsOf } from '../../content/delves/blessings';
import { GUARDIAN_IDS, type GuardianId } from '../../content/delves/guardians';
import { OPEN_PATRON_IDS, type PatronId } from '../../content/delves/patrons';
import { MONSTER_IDS, monsters, type MonsterId } from '../../content/monsters';
import { balance } from '../../content/balance';
import { stream, type RollSource } from '../rng';

// GDD §5.10.3–§5.10.5 (D249, D250, D255, D256): everything a run draws from its seed. Pure and
// seeded: the same seed gives the same families, groups, doors and offers, so a paused run
// resumes exactly and every fight can be replayed (D248). Each kind of draw has its own stream,
// so adding a draw in one place never shifts another (technical design §7.2).

const pick = <T>(rolls: RollSource, list: readonly T[]): T =>
  list[Math.min(list.length - 1, Math.floor(rolls.next() * list.length))] as T;

/** The tier of a floor: 1–3 at the base, 4–6 one higher, the guardian two higher (D249). */
export const floorTier = (baseTier: number, floor: number): number =>
  floor <= 3
    ? baseTier
    : floor <= balance.delve.floors.value
      ? baseTier + balance.delve.upperTierStep.value
      : baseTier + balance.delve.guardianTierStep.value;

/** How many monsters a floor holds: 2 on floors 1–3, 3 on floors 4–6 (D250). */
export const groupSize = (floor: number): number =>
  floor <= 3 ? balance.delve.groupSize.value.floors1to3 : balance.delve.groupSize.value.floors4to6;

/** The family of a floor (D250), drawn from the five folklore and Cursed families; the Deep never appears. */
export const floorFamily = (seed: string, floor: number): FamilyId =>
  pick(stream(seed, 'family', floor), FAMILY_IDS);

/** Species of a family valid at a tier; above tier 5, those that reach tier 5 (D250). */
export const speciesAtTier = (family: FamilyId, tier: number): MonsterId[] => {
  const t = Math.min(tier, 5);
  return MONSTER_IDS.filter((id) => {
    const m = monsters[id];
    return m.family === family && m.tiers[0] <= t && t <= m.tiers[1];
  });
};

/** The species of a floor's group, repeats allowed (D250). */
export const floorSpecies = (seed: string, floor: number, baseTier: number): MonsterId[] => {
  const family = floorFamily(seed, floor);
  const pool = speciesAtTier(family, floorTier(baseTier, floor));
  const rolls = stream(seed, 'group', floor);
  return Array.from({ length: groupSize(floor) }, () => pick(rolls, pool));
};

export const guardianOf = (seed: string): GuardianId =>
  pick(stream(seed, 'guardian'), GUARDIAN_IDS);

/** The reagent a cleared floor drops: one of the drops of the family's species, by seed (D262). */
export const floorDrop = (
  seed: string,
  floor: number,
): (typeof monsters)[MonsterId]['drops'][number] => {
  const family = floorFamily(seed, floor);
  const drops = [
    ...new Set(
      MONSTER_IDS.filter((id) => monsters[id].family === family).flatMap(
        (id) => monsters[id].drops,
      ),
    ),
  ];
  return pick(stream(seed, 'drop', floor), drops);
};

const sameDoors = (a: readonly PatronId[] | null, b: readonly PatronId[]): boolean =>
  a !== null && a.length === b.length && b.every((p) => a.includes(p));

export interface Doors {
  readonly doors: [PatronId, PatronId];
  /** An Unlit door replaced one of the two (D257). */
  readonly unlit: boolean;
}

/**
 * Two different patrons, never the same pair as the floor before (D256). Once the Unlit is open
 * it replaces one door on `delve.unlitDoorChance` of floors, at most `delve.unlitDoorsPerRun` a run.
 */
export const doorsFor = (
  seed: string,
  floor: number,
  last: readonly PatronId[] | null,
  unlitOpen: boolean,
  unlitUsed: number,
): Doors => {
  const rolls = stream(seed, 'doors', floor);
  const unlitHere =
    unlitOpen &&
    unlitUsed < balance.delve.unlitDoorsPerRun.value &&
    rolls.next() < balance.delve.unlitDoorChance.value;
  for (let attempt = 0; attempt < 50; attempt++) {
    const pool = [...OPEN_PATRON_IDS];
    const a = pool.splice(
      Math.min(pool.length - 1, Math.floor(rolls.next() * pool.length)),
      1,
    )[0] as PatronId;
    const b = pool.splice(
      Math.min(pool.length - 1, Math.floor(rolls.next() * pool.length)),
      1,
    )[0] as PatronId;
    const doors: [PatronId, PatronId] = unlitHere
      ? rolls.next() < 0.5
        ? [a, 'unlit']
        : ['unlit', a]
      : [a, b];
    if (!sameDoors(last, doors)) return { doors, unlit: unlitHere };
  }
  throw new Error('No new pair of doors could be drawn.'); // 10 pairs of 5, 2 never repeat in a row
};

const weights = (): Record<RarityId, number> => balance.delve.rarityWeights.value;

/** A card's rarity by `delve.rarityWeights` (Faint 70, Warm 25, Bright 5). */
const rollRarity = (rolls: RollSource): RarityId => {
  const w = weights();
  const total = w.faint + w.warm + w.bright;
  const r = rolls.next() * total;
  return r < w.faint ? 'faint' : r < w.faint + w.warm ? 'warm' : 'bright';
};

/** The rarity tried when the asked one has nothing left: the next lower ones, then the higher (D255). */
const fallbackOrder = (r: RarityId): RarityId[] => {
  const i = RARITIES.indexOf(r);
  return [r, ...RARITIES.slice(0, i).reverse(), ...RARITIES.slice(i + 1)];
};

export interface OfferOptions {
  /** Cards to show (3, or 4 for the first offer with the Bell Clapper, D261). */
  readonly count: number;
  /** The last floor's offer holds at least one Warm or better (D255). */
  readonly lastFloor: boolean;
  /** Ids to leave out as well: what was taken this run, and (Re-roll) the cards just shown. */
  readonly exclude: readonly string[];
}

/** An offer from one patron's pool not yet taken (D255, D256). Returns blessing ids. */
export const offerFor = (
  seed: string,
  salt: string,
  floor: number,
  patron: PatronId,
  { count, lastFloor, exclude }: OfferOptions,
): string[] => {
  const rolls = stream(seed, 'offer', salt, floor);
  const cards: string[] = [];
  const draw = (rarity: RarityId): string | null => {
    for (const r of fallbackOrder(rarity)) {
      const pool = blessingsOf(patron)
        .filter((b) => b.rarity === r && !exclude.includes(b.id) && !cards.includes(b.id))
        .map((b) => b.id);
      if (pool.length > 0) return pick(rolls, pool);
    }
    return null;
  };
  for (let i = 0; i < count; i++) {
    const card = draw(rollRarity(rolls));
    if (card === null) break;
    cards.push(card);
  }
  if (lastFloor && cards.length > 0) {
    const minimum = balance.delve.lastFloorMinRarity.value as RarityId;
    const rank = (id: string): number =>
      RARITIES.indexOf(blessingsOf(patron).find((b) => b.id === id)?.rarity ?? 'faint');
    if (!cards.some((id) => rank(id) >= RARITIES.indexOf(minimum))) {
      const pool = blessingsOf(patron)
        .filter(
          (b) =>
            RARITIES.indexOf(b.rarity) >= RARITIES.indexOf(minimum) &&
            !exclude.includes(b.id) &&
            !cards.includes(b.id),
        )
        .sort((x, y) => RARITIES.indexOf(x.rarity) - RARITIES.indexOf(y.rarity))
        .map((b) => b.id);
      // Raised to Warm if any is left, else the next above (D255).
      const lowest = pool.filter((id) => rank(id) === rank(pool[0] ?? ''));
      if (lowest.length > 0) cards[cards.length - 1] = pick(rolls, lowest);
    }
  }
  return cards;
};

/** Chosen start (D259): 1 of 3 Faint blessings from a patron picked at the start. */
export const chosenStartCards = (seed: string, patron: PatronId): string[] => {
  const rolls = stream(seed, 'start', patron);
  const pool = blessingsOf(patron)
    .filter((b) => b.rarity === 'faint')
    .map((b) => b.id);
  const cards: string[] = [];
  while (cards.length < balance.delve.offers.value && pool.length > 0) {
    cards.push(
      ...pool.splice(Math.min(pool.length - 1, Math.floor(rolls.next() * pool.length)), 1),
    );
  }
  return cards;
};

/** Pechko's line after a run, picked by the run's seed (lore §29): an index into its 3 lines. */
export const pechkoLineIndex = (seed: string): number =>
  Math.floor(stream(seed, 'pechko').next() * 3);
