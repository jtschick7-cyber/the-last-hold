import { cyrb128 } from './cyrb128';
import { sfc32 } from './sfc32';

// Technical design §7.3: game code receives a RollSource and never builds one.
export interface RollSource {
  /** The next roll in [0, 1). */
  next(): number;
}

// The first outputs of a freshly seeded sfc32 are weakly mixed for some seeds;
// discarding a few is the generator author's recommendation [JC, D42].
const WARM_UP = 15;

/** A stream seeded from a string (technical design §7.2 seed strings). */
export const seeded = (seedString: string): RollSource => {
  const gen = sfc32(cyrb128(seedString));
  for (let i = 0; i < WARM_UP; i++) gen.next();
  return { next: () => gen.next() };
};

/**
 * Hashes and warms a list of seed strings once, then hands out fresh streams that
 * start exactly where `seeded(seed)` would. Suggest uses it: its first stage runs
 * the same 50 seeds against every party, so seeding them once saves most of the
 * seeding cost (GDD §6.5).
 */
export const seedBank = (seedStrings: readonly string[]): ((i: number) => RollSource) => {
  const states = seedStrings.map((seed) => {
    const gen = sfc32(cyrb128(seed));
    for (let i = 0; i < WARM_UP; i++) gen.next();
    return gen.state();
  });
  return (i) => {
    const state = states[i];
    if (!state) throw new RangeError(`No seed ${i} in this bank.`);
    const gen = sfc32(state);
    return { next: () => gen.next() };
  };
};

export interface ScriptedRollSource extends RollSource {
  /** Throws unless every scripted roll was used. Call at the end of a test. */
  assertConsumed(): void;
}

/**
 * Rolls from a fixed list, for exact tests such as the GDD §5.5.1 golden fight.
 * Throws if the list runs out, or (via assertConsumed) if any roll is left over.
 */
export const scripted = (rolls: readonly number[]): ScriptedRollSource => {
  rolls.forEach((r, i) => {
    if (!(r >= 0 && r < 1))
      throw new RangeError(`Scripted roll ${i} is ${r}; rolls must be in [0, 1).`);
  });
  let used = 0;
  return {
    next: () => {
      const r = rolls[used];
      if (r === undefined) {
        throw new Error(
          `Scripted rolls ran out: all ${rolls.length} were used and another was asked for.`,
        );
      }
      used++;
      return r;
    },
    assertConsumed: () => {
      if (used !== rolls.length) {
        throw new Error(`Scripted rolls not fully consumed: used ${used} of ${rolls.length}.`);
      }
    },
  };
};
