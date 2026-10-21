import type { FamilyId } from '../../content/damage';
import { guardians, type GuardianId } from '../../content/delves/guardians';
import { bosses, type BossId } from '../../content/great-beasts';
import { quarries, type QuarryId } from '../../content/hunts';
import { monsters } from '../../content/monsters';
import { num } from '../balance-access';
import type { DamageType } from '../../content/damage';
import type { EventInstance, FightAbility, FightMonster } from './types';

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
  readonly abilities: readonly FightAbility[];
}

export const isGuardian = (m: FightMonster): m is Extract<FightMonster, { guardian: GuardianId }> =>
  'guardian' in m;

export const isEvent = (m: FightMonster): m is EventInstance => 'event' in m;

/** GDD §8.13, §8.14: event creatures are written at base tier 3; a boss's Health is the pool. */
export const EVENT_BASE_TIER = 3;

export const speciesOf = (m: FightMonster): SpeciesDef => {
  if (isEvent(m)) {
    const boss = (bosses as Readonly<Record<string, (typeof bosses)[BossId]>>)[m.event];
    const c = boss ?? quarries[m.event as QuarryId];
    return {
      id: m.event,
      name: c.name,
      family: c.family,
      baseTier: EVENT_BASE_TIER,
      health: 'health' in c ? c.health : num('boss.poolBase'),
      might: c.might,
      armor: c.armor,
      speed: c.speed,
      attacks: c.attacks,
      resist: c.resist,
      abilities: c.abilities,
    };
  }
  if (isGuardian(m)) {
    const g = guardians[m.guardian];
    return { ...g, baseTier: g.baseTier };
  }
  const d = monsters[m.monster];
  return { ...d, baseTier: d.tiers[0] };
};

export const speciesFamily = (m: FightMonster): FamilyId | 'deep' => speciesOf(m).family;
