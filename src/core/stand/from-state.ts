import { skillLevel } from '../skills/skills';
import { CONSUMABLE_IDS, consumables, type ConsumableId } from '../../content/consumables';
import type { HunterId } from '../../content/hunters';
import type { MonsterId } from '../../content/monsters';
import { num } from '../balance-access';
import type { GameState, Preparation } from '../state/game-state';
import { snapshotOf } from '../systems/hunters';
import { vigilLevelFor } from '../systems/vigil';
import { threatRate } from '../threat/threat';
import { MS_PER_DAY } from '../time';
import type { StandInput } from './engine';
import { previewStand, type StandPreview, type StandPreviewInput } from './preview';
import { standPoolOf } from './pool';
import { standSeed } from './waves';

// GDD §5.9.3: a stand's inputs, read from the hold as it is now. The same function
// feeds the preview, the real stand and its saved record, so they can't disagree.

const HOURS_PER_DAY = 24;

/** The bombs in the stores (oils and potions are chosen per hunter instead). */
export const bombStock = (state: GameState): Partial<Record<ConsumableId, number>> => {
  const out: Partial<Record<ConsumableId, number>> = {};
  for (const id of CONSUMABLE_IDS) {
    const k = consumables[id].effect.kind;
    if (
      (k === 'burn' || k === 'chill' || k === 'saltburst' || k === 'smoke') &&
      state.stores[id] > 0
    )
      out[id] = state.stores[id];
  }
  return out;
};

/** Each species' knowledge level now (Studied and Mastered bonuses apply in the stand). */
export const knowledgeNow = (state: GameState): Partial<Record<MonsterId, number>> =>
  Object.fromEntries(Object.entries(state.bestiary).map(([id, k]) => [id, k?.level ?? 0]));

export const standInputFor = (
  state: GameState,
  party: readonly HunterId[],
  prep: Pick<Preparation, 'oils' | 'potions'>,
): StandInput => ({
  seed: standSeed(state),
  // GDD §5.9.8: at the v0.4 arrival Threat is 0 (it starts counting afterwards).
  threat: state.arrivalDue ? 0 : state.threat,
  party: party.map((id) => snapshotOf(state, id)),
  prep: { oils: prep.oils, potions: prep.potions, bombs: [] },
  bombs: bombStock(state),
  defenses: { walls: state.buildings.walls, watchtower: state.buildings.watchtower },
  relics: state.relics.map((r) => r.id),
  knowledge: knowledgeNow(state),
  alchemy: skillLevel(state, 'alchemy'),
  // Only a `dross` pool is named, so an ordinary stand's input is exactly what it was (D363).
  ...(standPoolOf(state) === 'dross' ? { pool: 'dross' as const } : {}),
  // Level 0 adds no field, so a stand with the switch Off is exactly an ordinary stand (D542).
  ...(vigilLevelFor(state) > 0 ? { vigilLevel: vigilLevelFor(state) } : {}),
});

/** GDD §5.9.8 (D112): the arrival caps the trophies part at share × the cycle-1 median. */
export const arrivalCapValue = (): number =>
  num('longNightArrival.emberCapShare') * num('longNightArrival.cycle1MedianEmbers');

/** The trophies cap for a stand made now: only the v0.4 arrival has one. */
export const arrivalTrophyCap = (state: GameState): number | null =>
  state.arrivalDue ? arrivalCapValue() : null;

/** Days since the current cycle began. */
export const cycleDays = (state: GameState): number => {
  const record = state.cycles[state.cycles.length - 1];
  return record ? (state.time - record.startedAt) / MS_PER_DAY : 0;
};

export const previewInputFor = (
  state: GameState,
  party: readonly HunterId[],
  prep: Pick<Preparation, 'oils' | 'potions'>,
  samples = num('laststand.previewSamples'),
  trophyCap: number | null = arrivalTrophyCap(state),
): StandPreviewInput => {
  const days = cycleDays(state);
  return {
    stand: standInputFor(state, party, prep),
    samples,
    rank: state.cycle.age,
    trophies: state.stats.trophies,
    cycleDays: days,
    threatPerDay: threatRate(state).value * HOURS_PER_DAY,
    trophiesPerDay: days > 0 ? state.stats.trophies / days : 0,
    trophyCap,
  };
};

export const previewFor = (
  state: GameState,
  party: readonly HunterId[],
  prep: Pick<Preparation, 'oils' | 'potions'>,
): StandPreview => previewStand(previewInputFor(state, party, prep));
