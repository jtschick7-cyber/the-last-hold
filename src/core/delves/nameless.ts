import { guardians } from '../../content/delves/guardians';
import { MONSTER_IDS, monsters, type MonsterId } from '../../content/monsters';
import { knowledgeLevels } from '../../content/knowledge';
import type { Breakdown, Explained } from '../breakdown/breakdown';
import type { GameState } from '../state/game-state';

// GDD §8.3 (D252): the Forgotten's Nameless. +3% Might and +3% Health (stat%) for each of the
// 16 contract species the hunters have not yet Studied, up to +48%. The fight reads the count,
// the bestiary shows the breakdown, and both come from here, so they cannot disagree.

/** The contract species below Studied, in content order. */
export const unstudiedSpecies = (state: GameState): MonsterId[] =>
  MONSTER_IDS.filter((id) => (state.bestiary[id]?.level ?? 0) < knowledgeLevels.studied.number);

export interface NamelessBonus {
  readonly count: number;
  readonly might: number;
  readonly health: number;
}

export const namelessBonus = (state: GameState): Explained<NamelessBonus> => {
  const ability = guardians['the-forgotten'].abilities.find((a) => a.kind === 'nameless');
  if (!ability || ability.kind !== 'nameless') throw new Error('The Forgotten lost its Nameless.');
  const species = unstudiedSpecies(state);
  const count = species.length;
  const might = count * ability.mightPerSpecies;
  const health = count * ability.healthPerSpecies;
  const children: Breakdown[] = species.map((id) => ({
    label: `${monsters[id].name} not yet Studied`,
    value: ability.mightPerSpecies,
  }));
  return {
    value: { count, might, health },
    breakdown: {
      label: 'Nameless: more Might and Health for each species not yet Studied',
      value: might,
      formula: `${count} species × ${ability.mightPerSpecies * 100}%`,
      children,
    },
  };
};
