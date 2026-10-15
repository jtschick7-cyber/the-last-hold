import type { FamilyId } from '../../content/damage';
import { guardians, type GuardianId } from '../../content/delves/guardians';
import { monsters, type MonsterAbility } from '../../content/monsters';
import type { DamageType } from '../../content/damage';
import type { FightMonster } from './types';

// GDD §8.3: what a fight needs to know about a species, whether it's one of the 16 contract
// species or a Deep guardian (D252). Guardians are Delve-only and fight alone.

export interface SpeciesDef {
  readonly id: string;
  readonly name: string;
  /** 'deep' for the guardians. */
  readonly family: FamilyId | 'deep';
  /** The tier its stats are written at; each tier above scales them (§7.4). */
  readonly baseTier: number;
  readonly health: number;
  readonly might: number;
  readonly armor: number;
  readonly speed: number;
  readonly attacks: number;
  readonly resist: Readonly<Record<DamageType, number>>;
  readonly abilities: readonly MonsterAbility[];
}

export const isGuardian = (m: FightMonster): m is Extract<FightMonster, { guardian: GuardianId }> =>
  'guardian' in m;

export const speciesOf = (m: FightMonster): SpeciesDef => {
  if (isGuardian(m)) {
    const g = guardians[m.guardian];
    return { ...g, baseTier: g.baseTier };
  }
  const d = monsters[m.monster];
  return { ...d, baseTier: d.tiers[0] };
};

export const speciesFamily = (m: FightMonster): FamilyId | 'deep' => speciesOf(m).family;
