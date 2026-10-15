import { AGE_IDS, ages } from '../../content/ages';
import { buildings, BUILDING_IDS } from '../../content/buildings';
import { GEAR_IDS, gear, type GearDef, type GearId, type GearSlot } from '../../content/gear';
import { bonusLines, itemRarities } from '../../content/items';
import { useSkillOf } from '../../content/use-skills';
import {
  HUNTER_IDS,
  hunters,
  type HunterDef,
  type HunterId,
  type HunterUnlock,
} from '../../content/hunters';
import { knowledgeLevels } from '../../content/knowledge';
import { actNumeral } from '../../content/story/acts';
import { monsters } from '../../content/monsters';
import { alternateTraits } from '../../content/delves/alternate-traits';
import { traits, type TraitId } from '../../content/traits';
import { constantAt, num } from '../balance-access';
import type { Explained } from '../breakdown/breakdown';
import type { HunterSnapshot } from '../combat';
import { roundHalfUp } from '../combat/build';
import { othersRecoveryMult, recoveryMult } from '../contracts/injury';
import { intPow } from '../math';
import type { GameState, HunterState } from '../state/game-state';
import { MS_PER_DAY, MS_PER_SECOND } from '../time';
import { wornItem } from './items';

// GDD §5.3: the roster, each hunter's level and gear, who is free to go, and who
// can be recruited. Derived values come from here, never stored (technical design §5.2).

export const isOwned = (state: GameState, id: HunterId): boolean => state.hunters[id] !== undefined;

/** The Ranks reached so far this cycle, in order. */
const ranksReached = (state: GameState): readonly string[] =>
  AGE_IDS.slice(0, AGE_IDS.indexOf(state.cycle.age) + 1);

/**
 * Active roster cap: 3 in Hamlet, plus Barracks levels in the Keep (GDD §5.3.1, G5),
 * plus 2 at Citadel and 2 more at Bastion (`roster.ageBonus`, D106).
 */
export const rosterCap = (state: GameState): Explained => {
  const base = num('roster.hamletCap');
  let barracks = 0;
  for (const id of BUILDING_IDS) {
    for (const e of buildings[id].effects) {
      if (e.kind === 'rosterCap') barracks += state.buildings[id] * e.perLevel;
    }
  }
  const table = constantAt('roster.ageBonus').value as Readonly<Record<string, number>>;
  const rankBonus = ranksReached(state).reduce((n, age) => n + (table[age] ?? 0), 0);
  const value = base + barracks + rankBonus;
  return {
    value,
    breakdown: {
      label: 'Active roster',
      value,
      formula: `${base} + ${barracks} + ${rankBonus}`,
      children: [
        { label: 'Hearth Hall bunks', value: base, key: 'roster.hamletCap' },
        { label: 'Barracks levels', value: barracks },
        { label: 'Rank (Citadel, Bastion)', value: rankBonus, key: 'roster.ageBonus' },
      ],
    },
  };
};

/** XP to go from level L to L+1: `50 × 1.5^(L−1)` (GDD §5.3.2). */
export const xpToNext = (level: number): number =>
  num('xp.base') * intPow(num('xp.growth'), level - 1);

/** The hunter level cap for the hold's Rank: Hamlet uses the Keep's (D72); Citadel 15, Bastion 20 (D106). */
export const levelCap = (state: GameState): number => {
  const table = constantAt('hunter.levelCap').value as Readonly<Record<string, number>> & {
    readonly keep: number;
  };
  return table[state.cycle.age] ?? table.keep;
};

/**
 * Adds contract XP and levels the hunter up to the Rank's cap; returns the levels
 * reached. At the cap, XP isn't banked. A level carried above the cap (GDD §5.9.7)
 * is kept: the cap only stops new levels.
 */
export const gainXp = (
  state: GameState,
  h: Pick<HunterState, 'level' | 'xp'>,
  xp: number,
): number[] => {
  const cap = levelCap(state);
  const reached: number[] = [];
  h.xp += xp;
  while (h.level < cap && h.xp >= xpToNext(h.level)) {
    h.xp -= xpToNext(h.level);
    h.level += 1;
    reached.push(h.level);
  }
  if (h.level >= cap) h.xp = 0;
  return reached;
};

const inRecovery = (h: HunterState, now: number): boolean =>
  h.recovery !== null && h.recovery.until > now;

export type HunterStatus = 'ready' | 'on-contract' | 'in-delve' | 'recovering' | 'reserve';

/** Reserve hunters can't take contracts; active ones are ready unless busy or recovering. */
export const hunterStatus = (state: GameState, id: HunterId): HunterStatus | null => {
  const h = state.hunters[id];
  if (!h) return null;
  if (state.running.some((r) => r.party.includes(id))) return 'on-contract';
  if (state.delve.run?.party.includes(id)) return 'in-delve'; // GDD §5.10.1 (D253)
  if (inRecovery(h, state.time)) return 'recovering';
  return state.roster.active.includes(id) ? 'ready' : 'reserve';
};

/** Hunters free to take a contract right now, in roster order (the party slot order). */
export const availableHunters = (state: GameState): HunterId[] =>
  state.roster.active.filter((id) => hunterStatus(state, id) === 'ready');

/** The weapon or armor slot's current gear tier, if any. */
export const slotGear = (state: GameState, h: HunterState, slot: GearSlot): GearDef | null => {
  const item = wornItem(state, h, slot);
  return item ? gear[item.base] : null;
};

/** The next upgrade for a slot: the lowest tier above the current one. */
export const nextGear = (state: GameState, h: HunterState, slot: GearSlot): GearDef | null => {
  const current = slotGear(state, h, slot)?.tier ?? 0;
  return (
    GEAR_IDS.map((g) => gear[g])
      .filter((g) => g.slot === slot && g.tier > current)
      .sort((a, b) => a.tier - b.tier)[0] ?? null
  );
};

/** What still blocks a gear tier: the Smithy level, then a Rank (the Wright's Blade, D159); null if nothing. */
export const gearLock = (state: GameState, next: GearDef): string | null => {
  if (state.buildings[next.requires.building] < next.requires.level)
    return `needs Smithy ${next.requires.level}`;
  if (next.requiresAge && AGE_IDS.indexOf(state.cycle.age) < AGE_IDS.indexOf(next.requiresAge))
    return `needs the ${ages[next.requiresAge].name}`;
  return null;
};

/**
 * The hunter's traits as they fight now: the second one is the alternate trait when it was bought
 * and switched on (GDD §8.5a, D260); the first never changes.
 */
export const effectiveTraits = (state: GameState, id: HunterId): HunterDef['traits'] => {
  const base = hunters[id].traits;
  if (!state.delve.shop.traitsActive.includes(id)) return base;
  const alt = alternateTraits.find((a) => a.hunter === id);
  return alt ? [base[0], alt.id as TraitId] : base;
};

/** A hunter frozen for a fight (technical design §5.3). */
export const snapshotOf = (state: GameState, id: HunterId): HunterSnapshot => {
  const def = hunters[id];
  const h = state.hunters[id];
  if (!h) throw new Error(`${id} is not on the roster.`);
  const worn = [wornItem(state, h, 'weapon'), wornItem(state, h, 'armor')];
  const lines = worn.flatMap((i) => i?.lines ?? []);
  return {
    id,
    name: def.name,
    role: def.role,
    damage: def.damage,
    level: h.level,
    base: def.stats,
    traits: effectiveTraits(state, id),
    weapon: worn[0]?.base ?? null,
    armorGear: worn[1]?.base ?? null,
    // v0.8: only when an item has lines, so every old snapshot and golden stays as it was.
    ...(lines.length > 0 ? { lines } : {}),
    ...(h.stars > 0 ? { stars: h.stars } : {}),
    // v0.8 (D312): a Wright's use-skill; Apprentices have none, so their snapshots are unchanged.
    ...(h.rank !== 'apprentice' ? { skill: useSkillOf(id).id } : {}),
  };
};

/** Recovery times for one hunter of a party: their own traits, and the others' Splint and Sling (GDD §8.5a). */
export const recoveryFactor = (party: readonly (readonly TraitId[])[], index: number): number =>
  recoveryMult(party[index] ?? []) * othersRecoveryMult(party, index);

/** Whether a hunter's unlock condition is met (GDD §8.5 "Unlock"). */
export const unlockMet = (state: GameState, unlock: HunterUnlock): boolean => {
  switch (unlock.kind) {
    case 'start':
      return true;
    case 'contractSuccesses':
      return state.stats.contractsWon >= unlock.count;
    case 'successAtLocation':
      return (state.stats.winsByLocation[unlock.location] ?? 0) >= 1;
    case 'defeatMonster':
      return (state.stats.kills[unlock.monster] ?? 0) >= 1;
    case 'buildingLevel':
      return state.buildings[unlock.building] >= unlock.level;
    case 'knowledgeLevel':
      return (state.bestiary[unlock.monster]?.level ?? 0) >= knowledgeLevels[unlock.level].number;
    case 'bountySilverEarned':
      return state.stats.bountySilver >= unlock.amount;
    case 'arrivesWithIlse':
      // GDD §8.5 (D211): Arvid is never recruited. He joins the roster when Act III begins
      // (core/story/act3.ts), so he is never a candidate.
      return false;
  }
};

/** A readable form of the condition, for locked silhouettes (GDD §9.7). */
export const describeUnlock = (unlock: HunterUnlock): string => {
  switch (unlock.kind) {
    case 'start':
      return 'Starts with you';
    case 'contractSuccesses':
      return unlock.count === 1 ? 'Win your first contract' : `Win ${unlock.count} contracts`;
    case 'successAtLocation':
      return `Win a ${unlock.location} contract`;
    case 'defeatMonster':
      return `Defeat an ${unlock.monster === 'upyr' ? 'Upyr' : unlock.monster}`;
    case 'buildingLevel':
      // A level-1 building reads as "Build the Hunter's Lodge" (GDD §8.5, Herdis).
      return unlock.level === 1
        ? `Build the ${buildings[unlock.building].name}`
        : `${buildings[unlock.building].name} level ${unlock.level}`;
    case 'knowledgeLevel':
      return `${monsters[unlock.monster].name} reaches ${knowledgeLevels[unlock.level].name}`;
    case 'bountySilverEarned':
      return `Earn ${unlock.amount.toLocaleString('en-US')} silver in bounties`;
    case 'arrivesWithIlse':
      return `Arrives with Ilse when Act ${actNumeral(unlock.act)} begins`;
  }
};

/** A fallen hunter returns as a candidate this long after dying (before the Long Night, A12). */
const returnDelayMs = (): number => num('death.returnDaysBeforeLongNight') * MS_PER_DAY;

/**
 * Fallen hunters who are not back yet (GDD §5.3.7). From v0.4 a dead hunter returns at
 * the next Long Night (D110); a save still before its first Long Night keeps the v0.3
 * rule of 3 days.
 */
export const stillFallen = (state: GameState, id: HunterId): boolean =>
  state.fallen.some(
    (f) =>
      f.hunter === id &&
      (state.arrivalDue ? state.time < f.diedAt + returnDelayMs() : f.cycle >= state.cycle.number),
  );

/** The level a returning hunter comes back at (GDD §5.9.7): halved at the Long Night, else 1. */
export const returnLevel = (state: GameState, id: HunterId): number => {
  let level = 1;
  for (const f of state.fallen)
    if (f.hunter === id && f.returnLevel !== undefined) level = f.returnLevel;
  return level;
};

/** Candidates: unlocked, not owned, and not still mourned (GDD §5.3.1, §5.3.7). */
export const candidates = (state: GameState): HunterDef[] =>
  HUNTER_IDS.filter(
    (id) =>
      !isOwned(state, id) &&
      hunters[id].unlock.kind !== 'start' &&
      unlockMet(state, hunters[id].unlock) &&
      !stillFallen(state, id),
  ).map((id) => hunters[id]);

/** Hunters not yet unlocked (or still fallen), for the silhouettes at the bottom (GDD §9.7). */
export const lockedHunters = (state: GameState): HunterDef[] =>
  HUNTER_IDS.filter(
    (id) =>
      !isOwned(state, id) &&
      !candidates(state).some((c) => c.id === id) &&
      hunters[id].unlock.kind !== 'start',
  ).map((id) => hunters[id]);

export const recoveryMs = (seconds: number): number => seconds * MS_PER_SECOND;

export type { GearId };

export type StatName = 'health' | 'might' | 'armor' | 'speed';

/**
 * A hunter's displayed stat with its breakdown (GDD §5.3.2, A14): base, level
 * scaling (Health and Might only), gear, and traits. The same numbers the fight
 * uses, because the fight reads the same snapshot (core/combat/build.ts).
 */
export const hunterStat = (state: GameState, id: HunterId, stat: StatName): Explained => {
  const def = hunters[id];
  const h = state.hunters[id];
  if (!h) throw new Error(`${id} is not on the roster.`);
  const label = { health: 'Health', might: 'Might', armor: 'Armor', speed: 'Speed' }[stat];
  const base = def.stats[stat];
  const growth = num('hunter.levelStatGrowth');
  const scaled = stat === 'health' || stat === 'might';
  const starGrowth = num('star.growthPerStar') * h.stars;
  const levelScale = scaled ? 1 + growth * (h.level - 1) : 1;
  const scale = scaled ? 1 + (growth + starGrowth) * (h.level - 1) : 1;
  const children: Explained['breakdown'][] = [{ label: `Base (${def.shortName})`, value: base }];
  if (scaled) {
    children.push({
      label: `Level ${h.level}`,
      value: base * levelScale - base,
      formula: `${base} × ${growth} × (${h.level} − 1)`,
      key: 'hunter.levelStatGrowth',
    });
    // GDD §5.11.3 (D310): each star adds a point to the growth per level, so it shows here.
    if (h.stars > 0) {
      children.push({
        label: `${h.stars} ${h.stars === 1 ? 'star' : 'stars'}: +${roundHalfUp(starGrowth * 100)}% growth per level`,
        value: base * scale - base * levelScale,
        formula: `${base} × ${num('star.growthPerStar')} × ${h.stars} × (${h.level} − 1)`,
        key: 'star.growthPerStar',
      });
    }
  }
  let flat = 0;
  for (const g of [slotGear(state, h, 'weapon'), slotGear(state, h, 'armor')]) {
    if (!g) continue;
    const add = stat === 'might' ? g.might : stat === 'armor' ? g.armor : 0;
    if (add === 0) continue;
    flat += add;
    children.push({ label: g.name, value: add });
  }
  for (const t of def.traits) {
    const e = traits[t].effect;
    if (e.kind === 'speedFlat' && stat === 'speed') {
      flat += e.amount;
      children.push({ label: traits[t].name, value: e.amount });
    }
  }
  // v0.8 (D305): the bonus lines of the worn items, in the same buckets the fight puts them in.
  let pct = 0;
  const pctKind = stat === 'might' ? 'might' : stat === 'health' ? 'health' : null;
  const flatKind = stat === 'armor' ? 'armor' : stat === 'speed' ? 'speed' : null;
  const lineChildren: Explained['breakdown'][] = [];
  for (const slot of ['weapon', 'armor'] as const) {
    const item = wornItem(state, h, slot);
    if (!item) continue;
    for (const l of item.lines) {
      const from = `${itemRarities[item.rarity].name} ${gear[item.base].name}`;
      if (l.kind === flatKind) {
        flat += l.size;
        children.push({ label: `${from}: +${l.size} ${bonusLines[l.kind].label}`, value: l.size });
      } else if (l.kind === pctKind) {
        pct += l.size;
        lineChildren.push({
          label: `${from}: +${roundHalfUp(l.size * 100)}% ${bonusLines[l.kind].label}`,
          value: l.size,
          formula: `(base × level scale + gear) × ${l.size}`,
        });
      }
    }
  }
  const before = base * scale + flat;
  const raw = before * (1 + pct);
  for (const c of lineChildren) children.push({ ...c, value: before * c.value });
  const value = stat === 'health' ? roundHalfUp(raw) : raw;
  return {
    value,
    breakdown: {
      label,
      value,
      formula: 'base × level scale + gear + traits, then item lines',
      children,
    },
  };
};
