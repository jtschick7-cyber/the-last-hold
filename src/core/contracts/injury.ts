import { traits, type TraitId } from '../../content/traits';
import { num } from '../balance-access';
import { roundHalfUp } from '../combat/build';

// GDD §5.3.7 (D07): what a fight costs each hunter.

export type InjuryKind = 'none' | 'bruised' | 'wounded' | 'grievous' | 'dead';

export interface InjuryOutcome {
  readonly kind: InjuryKind;
  /** Seconds of recovery on real time, including offline. 0 for none and dead. */
  readonly recoverySeconds: number;
}

export interface FightEnd {
  readonly health: number;
  readonly maxHealth: number;
  readonly downed: boolean;
}

export interface InjuryContext {
  readonly tier: number;
  readonly reckless: boolean;
  /** Story hunters never die: the death roll becomes Grievously Wounded. */
  readonly story: boolean;
  readonly recoveryMult: number;
  /** The death roll in [0, 1), drawn only when needed; null when none was drawn. */
  readonly deathRoll: number | null;
}

/** Hard to kill and similar: recovery times multiply together. */
export const recoveryMult = (hunterTraits: readonly TraitId[]): number => {
  let mult = 1;
  for (const t of hunterTraits) {
    const e = traits[t].effect;
    if (e.kind === 'recoveryMult') mult *= e.mult;
  }
  return mult;
};

const wounded = (tier: number, mult: number): number =>
  roundHalfUp(num('injury.woundedPerTier') * tier * mult);

/** Whether this outcome needs a death roll: downed on a Reckless contract, non-story. */
export const needsDeathRoll = (
  end: FightEnd,
  ctx: Pick<InjuryContext, 'reckless' | 'story'>,
): boolean => end.downed && ctx.reckless && !ctx.story;

export const injuryOutcome = (end: FightEnd, ctx: InjuryContext): InjuryOutcome => {
  if (end.downed) {
    if (ctx.reckless) {
      if (!ctx.story) {
        if (ctx.deathRoll === null) throw new Error('A death roll is needed for a downed hunter.');
        if (ctx.deathRoll < num('injury.deathChance')) return { kind: 'dead', recoverySeconds: 0 };
      }
      return {
        kind: 'grievous',
        recoverySeconds: roundHalfUp(
          wounded(ctx.tier, ctx.recoveryMult) * num('injury.grievousMult'),
        ),
      };
    }
    return { kind: 'wounded', recoverySeconds: wounded(ctx.tier, ctx.recoveryMult) };
  }
  if (end.health < end.maxHealth * num('injury.bruisedBelow')) {
    return {
      kind: 'bruised',
      recoverySeconds: roundHalfUp(num('injury.bruised') * ctx.recoveryMult),
    };
  }
  return { kind: 'none', recoverySeconds: 0 };
};
