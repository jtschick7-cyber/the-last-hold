import { BUILDING_IDS, buildings } from '../../content/buildings';
import { CONSUMABLE_IDS, consumables, type ConsumableId } from '../../content/consumables';
import { monsters, type MonsterId } from '../../content/monsters';
import { relics, type RelicId } from '../../content/relics';
import { num } from '../balance-access';
import { runFight, type FightResult, type HunterSnapshot } from '../combat';
import { roundHalfUp } from '../combat/build';
import { seeded } from '../rng';
import type { Preparation } from '../state/game-state';
import { waveAt, type Wave } from './waves';

// GDD §5.9.3 (D107, D115): the Last Stand runs one wave at a time through the
// contract fight engine, with these differences: Health carries over and standing
// hunters recover a share between waves; downed hunters stay down; the Watchtower's
// volley and the bombs land at tick 1; Walls and the Iron Shutter reduce damage taken;
// each potion fires once in the whole stand; location traits are off. The stand ends
// when every hunter is down or a wave isn't won within the tick limit. It touches no
// game state: no injuries, no deaths. Its inputs are frozen, so every wave log can
// be rebuilt by running it again (technical design §5.3).

export interface StandInput {
  /** The stand seed: it fixes the wave list (and, unless `rolls` is set, the dice). */
  readonly seed: string;
  /** Practice stands (the preview) roll their own dice from this prefix; the wave list stays the seed's. */
  readonly rolls?: string;
  readonly threat: number;
  readonly party: readonly HunterSnapshot[];
  /** One oil and one potion per hunter for the whole stand; `bombs` is ignored. */
  readonly prep: Preparation;
  /** The bombs in the stores; thrown automatically, up to `prep.bombSlots` per wave. */
  readonly bombs: Readonly<Partial<Record<ConsumableId, number>>>;
  readonly defenses: { readonly walls: number; readonly watchtower: number };
  readonly relics: readonly RelicId[];
  readonly knowledge: Readonly<Partial<Record<MonsterId, number>>>;
  /** Default false: practice stands don't build logs. */
  readonly log?: boolean;
}

export interface WaveOutcome {
  readonly wave: Wave;
  /** Health carried into the wave; a hunter not listed starts at full. */
  readonly startHealth: Readonly<Partial<Record<string, number>>>;
  readonly bombs: readonly ConsumableId[];
  readonly fight: FightResult;
}

export interface StandResult {
  /** Waves won. */
  readonly wavesHeld: number;
  readonly waves: readonly WaveOutcome[];
  readonly endedBy: 'party-down' | 'retreat';
}

/** A runaway guard, not a game rule: tier scaling ends every stand long before this. */
const MAX_WAVES = 1_000;

/** taken% from the Walls' levels and the relics that fight in the stand (combat.takenCap applies). */
export const standTaken = (defenses: StandInput['defenses'], owned: readonly RelicId[]): number => {
  let sum = 0;
  for (const id of BUILDING_IDS) {
    for (const e of buildings[id].effects) {
      if (e.kind === 'standTaken' && (id === 'walls' || id === 'watchtower'))
        sum += defenses[id] * num(e.perLevelKey);
    }
  }
  for (const r of owned) {
    const e = relics[r].effect;
    if (e.kind === 'standTaken') sum += e.amount;
  }
  return sum;
};

/** The Watchtower's volley: Steel damage per wave at tick 1. */
export const standVolley = (defenses: StandInput['defenses']): number => {
  let sum = 0;
  for (const id of BUILDING_IDS) {
    for (const e of buildings[id].effects) {
      if (e.kind === 'standVolley' && (id === 'walls' || id === 'watchtower'))
        sum += defenses[id] * num(e.perLevelKey);
    }
  }
  return sum;
};

/**
 * The bombs for one wave (D115): those the species is weak to first, in content
 * order, then one Saltburst (a second would do nothing), up to `prep.bombSlots`.
 */
export const waveBombs = (
  monster: MonsterId,
  stock: Partial<Record<ConsumableId, number>>,
): ConsumableId[] => {
  const slots = num('prep.bombSlots');
  const weakAt = num('prep.weakAt');
  const resist = monsters[monster].resist;
  const picks: ConsumableId[] = [];
  for (const id of CONSUMABLE_IDS) {
    const e = consumables[id].effect;
    if (e.kind !== 'burn' && e.kind !== 'chill') continue;
    if (resist[e.damageType] < weakAt) continue;
    while (picks.length < slots && (stock[id] ?? 0) > 0) {
      picks.push(id);
      stock[id] = (stock[id] ?? 0) - 1;
    }
  }
  for (const id of CONSUMABLE_IDS) {
    if (picks.length >= slots) break;
    if (consumables[id].effect.kind === 'saltburst' && (stock[id] ?? 0) > 0) {
      picks.push(id);
      stock[id] = (stock[id] ?? 0) - 1;
      break;
    }
  }
  return picks;
};

export const runStand = (input: StandInput): StandResult => {
  if (input.party.length === 0 || input.party.length > num('laststand.partyMax'))
    throw new Error(`A stand needs 1 to ${num('laststand.partyMax')} hunters.`);
  const stock = { ...input.bombs };
  const health: Partial<Record<string, number>> = {};
  const down = new Set<string>();
  const potionUsed = new Set<string>();
  const strength = 1 + num('threat.waveStrengthPerPoint') * input.threat;
  const partyTaken = standTaken(input.defenses, input.relics);
  const volley = standVolley(input.defenses);
  const recover = num('laststand.recoverBetween');
  const waves: WaveOutcome[] = [];
  let wavesHeld = 0;
  let endedBy: StandResult['endedBy'] = 'party-down';
  for (let n = 1; n <= MAX_WAVES; n++) {
    const party = input.party.filter((h) => !down.has(h.id));
    if (party.length === 0) break;
    const wave = waveAt(input.seed, n);
    const bombs = waveBombs(wave.monster, stock);
    const potions = Object.fromEntries(
      Object.entries(input.prep.potions).filter(([id]) => !potionUsed.has(id)),
    );
    const fight = runFight({
      party,
      monster: {
        monster: wave.monster,
        tier: wave.tier,
        knowledge: input.knowledge[wave.monster] ?? 0,
      },
      location: null,
      rolls: seeded(`${input.rolls ?? input.seed}:wave:${n}`),
      log: input.log === true,
      prep: { oils: input.prep.oils, potions, bombs },
      stand: { health, monsterStrength: strength, partyTaken, volley },
    });
    waves.push({ wave, startHealth: { ...health }, bombs, fight });
    for (const id of fight.potionsUsed) potionUsed.add(id);
    if (fight.result !== 'win') {
      endedBy = fight.endedBy === 'retreat' ? 'retreat' : 'party-down';
      break;
    }
    wavesHeld = n;
    for (const h of fight.hunters) {
      if (h.downed) {
        down.add(h.id);
        continue;
      }
      health[h.id] = Math.min(h.maxHealth, h.health + roundHalfUp(h.maxHealth * recover));
    }
  }
  return { wavesHeld, waves, endedBy };
};
