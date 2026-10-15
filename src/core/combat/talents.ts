import {
  legendaries,
  type LegendaryDef,
  type LegendaryEffect,
  type LegendaryId,
} from '../../content/legendaries';
import { talentById } from '../../content/talents';

// GDD §5.11.5, §8.11 (v0.8, D313): the talents a hunter has picked, added up into the buckets they
// belong to (§5.0). Fights, the odds, and the stat breakdowns on the sheet all read this one
// function, so the number shown and the number fought cannot disagree. A hunter with no talents
// gets all zeros, and the fight is exactly what it was.

export interface TalentTotals {
  readonly armorFlat: number;
  readonly speedFlat: number;
  /** stat% */
  readonly mightPct: number;
  readonly maxHealthPct: number;
  /** As shares: 0.03 is 3 points. */
  readonly critPoints: number;
  readonly hitPoints: number;
  /** taken% for the holder, as a reduction (0.08 = takes 8% less). */
  readonly takenSelf: number;
  /** outgoing% */
  readonly damageDealt: number;
  /** While the holder stands, the others take this much less (a reduction). */
  readonly alliesTaken: number;
  readonly targetWeight: number | null;
  /** knowledge% extra against a Studied or Mastered species. */
  readonly damageVsKnown: number;
  /** 0 when none. */
  readonly critMult: number;
  readonly potionPower: number;
  readonly healingDone: number;
  readonly mendingBelow: number | null;
  readonly healsBelow: number | null;
  readonly attackShare: number | null;
}

export const NO_TALENTS: TalentTotals = {
  armorFlat: 0,
  speedFlat: 0,
  mightPct: 0,
  maxHealthPct: 0,
  critPoints: 0,
  hitPoints: 0,
  takenSelf: 0,
  damageDealt: 0,
  alliesTaken: 0,
  targetWeight: null,
  damageVsKnown: 0,
  critMult: 0,
  potionPower: 0,
  healingDone: 0,
  mendingBelow: null,
  healsBelow: null,
  attackShare: null,
};

/** The talents' effects added up. Unknown ids are ignored (the save guard has already dropped them). */
export const talentTotals = (ids: readonly string[] | undefined): TalentTotals => {
  if (!ids || ids.length === 0) return NO_TALENTS;
  const t = { ...NO_TALENTS } as { -readonly [K in keyof TalentTotals]: TalentTotals[K] };
  for (const id of ids) {
    const e = talentById(id)?.effect;
    if (!e) continue;
    switch (e.kind) {
      case 'armorFlat':
        t.armorFlat += e.amount;
        break;
      case 'speedFlat':
        t.speedFlat += e.amount;
        break;
      case 'mightPct':
        t.mightPct += e.amount;
        break;
      case 'maxHealthPct':
        t.maxHealthPct += e.amount;
        break;
      case 'critPoints':
        t.critPoints += e.amount;
        break;
      case 'hitChancePoints':
        t.hitPoints += e.amount;
        break;
      case 'takenPct':
        t.takenSelf += -e.amount;
        break;
      case 'damageDealtPct':
        t.damageDealt += e.amount;
        break;
      case 'alliesTakenWhileStanding':
        t.alliesTaken += -e.amount;
        break;
      case 'targetWeight':
        t.targetWeight = Math.max(t.targetWeight ?? 0, e.weight);
        break;
      case 'damageVsKnown':
        t.damageVsKnown += e.amount;
        break;
      case 'critMult':
        t.critMult = Math.max(t.critMult, e.mult);
        break;
      case 'potionPower':
        t.potionPower += e.amount;
        break;
      case 'healingDone':
        t.healingDone += e.amount;
        break;
      case 'mendingBelow':
        t.mendingBelow = Math.max(t.mendingBelow ?? 0, e.value);
        break;
      case 'healsBelow':
        t.healsBelow = Math.max(t.healsBelow ?? 0, e.value);
        break;
      case 'attackShare':
        t.attackShare = Math.max(t.attackShare ?? 0, e.value);
        break;
    }
  }
  return t;
};

/** The effect of the Legendary a hunter wears, or null. */
export const keepsakeEffect = (id: LegendaryId | undefined): LegendaryEffect | null =>
  id ? legendaries[id].effect : null;

export const keepsakeDef = (id: LegendaryId | undefined): LegendaryDef | null =>
  id ? legendaries[id] : null;
