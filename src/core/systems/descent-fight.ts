import { CONSUMABLE_IDS, consumables, type ConsumableId } from '../../content/consumables';
import type { GuardianId } from '../../content/delves/guardians';
import { delveRelics, type DelveRelicId } from '../../content/delves/relics';
import type { HunterId } from '../../content/hunters';
import type { UseSkillId } from '../../content/use-skills';
import { num } from '../balance-access';
import { buildHunter, buildMonster, roundHalfUp } from '../combat/build';
import { K } from '../combat/constants';
import { activeEffects, boostFor, NO_RULES, type HunterBoost } from '../combat/delve';
import { emit, type Fight } from '../combat/fight-state';
import { resolveEnds, runTicks } from '../combat/fight';
import { startPotion, throwBomb } from '../combat/prep';
import { skillOf } from '../combat/skills';
import { speciesOf } from '../combat/species';
import {
  alchemyPotency,
  illLuck,
  knowledgeBonus,
  lightlessCut,
  standing,
  type FightContext,
} from '../combat/stats';
import type {
  Combatant,
  FightMonster,
  HunterSnapshot,
  LogEntry,
  UnlitInstance,
} from '../combat/types';
import { seeded } from '../rng';
import type { DescentMonsterId, DescentStageSummary, PrepSnapshot } from '../state/descent-state';
import type { Preparation } from '../state/game-state';

// GDD §5.15.10, technical design §22.3 (D558, D560, D561, D567): the Descent's three-stage relay. It
// runs only for the Descent (the command, the preview and the log rebuild), on its own random streams,
// and reuses the ordinary fight pieces without changing them, so every other fight is untouched
// (`rulesVersion` stays 5). Up to 6 hunters fight in the front line; the rest wait in the reserve and
// step in between stages, or in the middle of a stage when the whole front line is down.

/** Once-per-fight skills that, in the Descent, work once per hunter for all three stages (GDD §5.15.10). */
const ONCE_PER_DESCENT: readonly UseSkillId[] = [
  'hold-the-stair',
  'sit-the-vigil',
  'the-other-hand',
  'stopping-root',
  'rattle-the-pots',
];

export interface DescentInput {
  /** `${gameSeed}:descent:${attempt}`; the stages draw from `${seed}:stage:${n}`. */
  readonly seed: string;
  /** The marching order: the first `laststand.partyMax` start in the front line, the rest wait. */
  readonly order: readonly HunterSnapshot[];
  readonly prep: PrepSnapshot;
  /** Bomb stores at launch (up to `prep.bombSlots` are thrown at each stage). */
  readonly bombs: Readonly<Partial<Record<ConsumableId, number>>>;
  /** The frozen What the Hold Learned: Might and Health in stat%, damage taken as a positive cut in taken%. */
  readonly learned: { readonly mightAndHealth: number; readonly taken: number };
  readonly delveRelics: readonly DelveRelicId[];
  /** Frozen knowledge level of each stage monster (M3). */
  readonly knowledge: Readonly<Partial<Record<DescentMonsterId, number>>>;
  readonly stageTiers: readonly [number, number, number];
  readonly unlitBaseHealth: number;
  readonly alchemy: number;
  /** Default true. Previews pass false: same fights, no log text. */
  readonly log?: boolean;
}

export interface DescentStageRun {
  readonly summary: DescentStageSummary;
  readonly endedBy: 'monster-down' | 'party-down' | 'retreat';
  readonly bombs: readonly ConsumableId[];
  readonly log: readonly LogEntry[];
  /** Each front-line hunter's Health when the stage began (after the between-stage recovery). */
  readonly startHealth: Readonly<Partial<Record<HunterId, number>>>;
  /** The front line at the end of the stage. */
  readonly hunters: readonly { id: HunterId; health: number; maxHealth: number; downed: boolean }[];
  readonly monsters: readonly { id: string; name: string; health: number; maxHealth: number }[];
}

export interface DescentRun {
  readonly outcome: 'win' | 'loss';
  readonly stagesCleared: number;
  readonly standingCount: number;
  readonly downedCount: number;
  readonly stages: readonly DescentStageRun[];
  /** Bombs thrown over the whole attempt, for the stores to lose. */
  readonly bombsUsed: Readonly<Partial<Record<ConsumableId, number>>>;
  /** Hunters whose potion fired or was ruined, for the stores to lose. */
  readonly potionsUsed: readonly HunterId[];
}

interface Carry {
  health: number;
  coinUsed: boolean;
  knotLeft: number;
  skillUsed: boolean;
}

interface Pick {
  readonly id: ConsumableId;
  /** Index into the stage's monsters. */
  readonly target: number;
}

/**
 * The bombs thrown at a stage (S15): the weak-to ones against the front monster, then against the next
 * ones in group order, then one Saltburst, then one Poppy Smoke, up to `prep.bombSlots`. Takes from `stock`.
 */
export const stageBombs = (
  monsters: readonly FightMonster[],
  stock: Partial<Record<ConsumableId, number>>,
): Pick[] => {
  const slots = num('prep.bombSlots');
  const weakAt = num('prep.weakAt');
  const picks: Pick[] = [];
  const take = (id: ConsumableId, target: number): void => {
    picks.push({ id, target });
    stock[id] = (stock[id] ?? 0) - 1;
  };
  monsters.forEach((m, target) => {
    const resist = speciesOf(m).resist;
    for (const id of CONSUMABLE_IDS) {
      const e = consumables[id].effect;
      if (e.kind !== 'burn' && e.kind !== 'chill') continue;
      if (resist[e.damageType] < weakAt) continue;
      while (picks.length < slots && (stock[id] ?? 0) > 0) take(id, target);
    }
  });
  for (const kind of ['saltburst', 'smoke'] as const)
    for (const id of CONSUMABLE_IDS) {
      if (picks.length >= slots) break;
      if (consumables[id].effect.kind === kind && (stock[id] ?? 0) > 0) {
        take(id, 0);
        break;
      }
    }
  return picks;
};

const GUARDIAN_STAGE_ONE: readonly GuardianId[] = ['unlits-breath', 'the-forgotten'];
const CONTRACT_STAGE_TWO: readonly ('anvil-wight' | 'rimewrought')[] = [
  'anvil-wight',
  'rimewrought',
];

/** The monsters of stage `n` (1-based), at the stage's tier with the frozen knowledge and the Salt Ring (D560). */
export const stageMonsters = (input: DescentInput, n: number): FightMonster[] => {
  const tier = input.stageTiers[n - 1] ?? 0;
  const known = (id: DescentMonsterId): { knowledge: number } => ({
    knowledge: input.knowledge[id] ?? 0,
  });
  let deep = 1;
  for (const r of input.delveRelics) {
    const e = delveRelics[r].effect;
    if (e.kind === 'guardianHealthPct') deep += e.amount; // Salt Ring: Deep monsters have 10% less Health
  }
  const guardian = (id: GuardianId | 'dross-tide'): FightMonster => ({
    guardian: id,
    tier,
    healthMult: deep,
    ...known(id),
  });
  if (n === 1) return GUARDIAN_STAGE_ONE.map(guardian);
  if (n === input.stageTiers.length) {
    const unlit: UnlitInstance = {
      unlit: true,
      tier,
      baseHealth: input.unlitBaseHealth,
      healthMult: deep,
      ...known('unlit'),
    };
    return [unlit];
  }
  return [
    guardian('dross-tide'),
    ...CONTRACT_STAGE_TWO.map((monster): FightMonster => ({ monster, tier, ...known(monster) })),
  ];
};

export const runDescent = (input: DescentInput): DescentRun => {
  const partyMax = num('laststand.partyMax');
  if (input.order.length === 0) throw new Error('A Descent needs at least one hunter.');
  const active = activeEffects([], input.delveRelics);
  const boostOf = (h: HunterSnapshot): HunterBoost => {
    const b = boostFor(h, input.order, active);
    // What the Hold Learned (GDD §5.15.10): the same sum for Might and max Health, and a cut to damage taken.
    b.mightPct += input.learned.mightAndHealth;
    b.healthPct += input.learned.mightAndHealth;
    b.takenAll += input.learned.taken;
    return b;
  };
  let recover = num('laststand.recoverBetween');
  for (const r of input.delveRelics) {
    const e = delveRelics[r].effect;
    if (e.kind === 'recoveryPoints') recover += e.amount; // Rift Lantern
  }

  const snapOf = new Map(input.order.map((h) => [h.id, h]));
  const waiting = input.order.slice(partyMax);
  // The front line by slot; a hunter stays in their slot until they fall and a reserve takes it.
  let front: HunterSnapshot[] = input.order.slice(0, partyMax);
  const down = new Set<HunterId>();
  const carry = new Map<HunterId, Carry>();
  const potionsUsed = new Set<HunterId>(); // a potion fires once across the three stages (as in the Last Stand)
  const stock: Partial<Record<ConsumableId, number>> = { ...input.bombs };
  const bombsUsed: Partial<Record<ConsumableId, number>> = {};
  const potency = alchemyPotency(input.alchemy);
  const stages: DescentStageRun[] = [];

  const build = (snap: HunterSnapshot, slot: number): Combatant => {
    const potions = Object.fromEntries(
      Object.entries(input.prep.potions).filter(([id]) => !potionsUsed.has(id as HunterId)),
    );
    const prep: Preparation = { oils: input.prep.oils, potions, bombs: [] };
    const c = buildHunter(snap, slot + 1, prep, boostOf(snap));
    const kept = carry.get(snap.id);
    if (kept) {
      c.health = Math.min(c.maxHealth, kept.health);
      c.coinUsed = kept.coinUsed;
      c.knotLeft = kept.knotLeft;
      c.skillUsed = kept.skillUsed;
    }
    return c;
  };

  /** Potions that work at once and a meter-trait entry, for a hunter arriving at tick `f.tick`. */
  const enter = (f: Fight, c: Combatant): void => {
    startPotion(f, c);
    if (c.skill !== 'up-before-the-wolves') return;
    c.meter = K.meterThreshold;
    emit(f, {
      actor: c.id,
      kind: 'skill',
      text: () => `${c.name} (${skillOf(c)?.name}) is up before the wolves: his turn comes first`,
      rolls: [],
    });
  };

  for (let n = 1; n <= input.stageTiers.length; n++) {
    const steppedIn: HunterId[] = [];
    const downedHere: HunterId[] = [];
    if (n > 1) {
      // Between stages: the standing recover, and each downed slot is filled in slot order by the next reserve (D558).
      front = front.map((snap) => {
        if (!down.has(snap.id)) return snap;
        const next = waiting.shift();
        if (next) steppedIn.push(next.id);
        return next ?? snap;
      });
      front = front.filter((snap) => !down.has(snap.id));
    }
    const hunters = front.map((snap, slot) => {
      const c = build(snap, slot);
      if (n > 1 && carry.has(snap.id))
        c.health = Math.min(c.maxHealth, c.health + roundHalfUp(c.maxHealth * recover));
      return c;
    });

    const startHealth = Object.fromEntries(hunters.map((c) => [c.id, c.health]));
    const instances = stageMonsters(input, n);
    const monsterList = instances.map((m, slot) => {
      const def = speciesOf(m);
      if (instances.length === 1) return buildMonster(m);
      return buildMonster(m, 1, { slot, id: def.id, name: def.name });
    });
    const firstDef = speciesOf(instances[0] as FightMonster);
    const first = instances[0] as FightMonster;
    const ctx: FightContext = {
      location: null,
      family: firstDef.family,
      monsterId: firstDef.id,
      attacks: firstDef.attacks,
      hitCut: lightlessCut(firstDef),
      oilBonus: K.oilBonus * potency,
      ...(illLuck(firstDef) > 0 ? { critCut: illLuck(firstDef) } : {}),
    };
    const picks = stageBombs(instances, stock);
    const f: Fight = {
      tick: 0,
      hunters,
      monster: monsterList[0] as Combatant,
      monsters: monsterList,
      rolls: seeded(`${input.seed}:stage:${n}`),
      ctx,
      knowledgePct: knowledgeBonus(first.knowledge ?? 0),
      rules: NO_RULES,
      kills: 0,
      packGiven: 0,
      partyActions: 0,
      clothUsed: false,
      clothPending: null,
      vigilUsed: false,
      noted: new Set<string>(),
      tolled: new Set<string>(),
      lastCrit: false,
      knowledge: first.knowledge ?? 0,
      log: [],
      logging: input.log !== false,
      over: null,
      saltburstArmed: false,
      saltburstCancelled: false,
      monsterActing: false,
      bombs: picks.map((p) => p.id),
      volley: 0,
      potency,
      smokeHolder: null,
      torchHolder: null,
    };
    f.tick = 1;
    for (const c of hunters) enter(f, c);
    for (const p of picks) {
      throwBomb(f, p.id, monsterList[p.target] as Combatant);
      bombsUsed[p.id] = (bombsUsed[p.id] ?? 0) + 1;
    }
    resolveEnds(f);

    const everyone = [...hunters, ...monsterList];
    const stepIn = (fight: Fight): void => {
      // Mid-stage (D567 (2)): when the whole front line is down and reserves wait, up to 6 step in at once.
      if (fight.over !== 'party-down' || waiting.length === 0) return;
      for (const old of fight.hunters) {
        down.add(old.id as HunterId);
        if (!downedHere.includes(old.id as HunterId)) downedHere.push(old.id as HunterId);
      }
      const coming = waiting.splice(0, partyMax);
      const fresh = coming.map((snap, slot) => build(snap, slot));
      fight.hunters.splice(0, fight.hunters.length, ...fresh);
      everyone.push(...fresh);
      fight.over = null;
      for (const c of fresh) {
        steppedIn.push(c.id as HunterId);
        enter(fight, c);
      }
      emit(fight, {
        actor: 'party',
        kind: 'rule',
        text: () =>
          `The front line is down: ${fresh.map((c) => c.name).join(', ')} step${fresh.length === 1 ? 's' : ''} in from the reserve`,
        rolls: [],
      });
    };
    runTicks(f, everyone, stepIn);

    const endedBy = f.over ?? 'retreat';
    const won = endedBy === 'monster-down';
    for (const c of f.hunters) {
      const id = c.id as HunterId;
      if (c.health <= 0) {
        down.add(id);
        if (!downedHere.includes(id)) downedHere.push(id);
      }
      if (c.potion?.used === true) {
        potionsUsed.add(id);
      }
      carry.set(id, {
        health: c.health,
        coinUsed: c.coinUsed,
        knotLeft: c.knotLeft,
        skillUsed: c.skill !== null && ONCE_PER_DESCENT.includes(c.skill) ? c.skillUsed : false,
      });
    }
    front = f.hunters.map((c) => snapOf.get(c.id as HunterId) as HunterSnapshot);
    stages.push({
      summary: {
        stage: n as 1 | 2 | 3,
        won,
        ticks: f.tick,
        downedIds: downedHere,
        steppedInIds: steppedIn,
      },
      endedBy,
      startHealth,
      bombs: f.bombs,
      log: f.log,
      hunters: f.hunters.map((c) => ({
        id: c.id as HunterId,
        health: c.health,
        maxHealth: c.maxHealth,
        downed: !standing(c),
      })),
      monsters: monsterList.map((m) => ({
        id: m.id,
        name: m.name,
        health: m.health,
        maxHealth: m.maxHealth,
      })),
    });
    if (!won) break;
  }

  const cleared = stages.filter((s) => s.summary.won).length;
  return {
    outcome: cleared === input.stageTiers.length ? 'win' : 'loss',
    stagesCleared: cleared,
    standingCount: input.order.length - down.size,
    downedCount: down.size,
    stages,
    bombsUsed,
    potionsUsed: [...potionsUsed],
  };
};
