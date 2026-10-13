import type { LocationId } from '../../src/content/damage';
import { hunters, type HunterId } from '../../src/content/hunters';
import type { MonsterId } from '../../src/content/monsters';
import { runFight, type FightResult, type HunterSnapshot } from '../../src/core/combat';
import type { RollSource } from '../../src/core/rng';

/** Rolls that repeat a fixed list forever: for tests that don't need the exact roll sequence. */
export const cyclic = (values: readonly number[]): RollSource => {
  let i = 0;
  return {
    next: () => {
      const v = values[i % values.length] ?? 0.5;
      i += 1;
      return v;
    },
  };
};

/** A hunter straight from the content, with optional overrides. */
export const snap = (id: HunterId, over: Partial<HunterSnapshot> = {}): HunterSnapshot => {
  const h = hunters[id];
  return {
    id,
    name: h.name,
    role: h.role,
    damage: h.damage,
    level: 1,
    base: h.stats,
    traits: h.traits,
    weapon: null,
    armorGear: null,
    ...over,
  };
};

/** A sturdy hunter that deals almost no damage, so a fight runs long enough to see abilities. */
export const sponge = (id: HunterId, over: Partial<HunterSnapshot> = {}): HunterSnapshot => {
  const h = hunters[id];
  return snap(id, {
    base: { ...h.stats, health: 100000, might: 1 },
    traits: [],
    ...over,
  });
};

export const fightOf = (
  party: readonly HunterSnapshot[],
  monster: MonsterId,
  tier: number,
  rolls: RollSource,
  location: LocationId = 'field',
): FightResult => runFight({ party, monster: { monster, tier }, location, rolls });

/** Log lines of one kind, optionally for one actor. */
export const lines = (r: FightResult, kind: string, actor?: string) =>
  r.log.filter((e) => e.kind === kind && (actor === undefined || e.actor === actor));
