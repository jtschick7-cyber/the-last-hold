import { speciesOf } from './species';
import { num } from '../balance-access';
import type { Breakdown } from '../breakdown/breakdown';
import { RULES_VERSION } from '../rules-version';
import { buildHunter, buildMonster } from './build';
import { NO_RULES } from './delve';
import type { Fight } from './fight-state';
import { cancelsAbility, startOfFight } from './prep';
import {
  alchemyPotency,
  armorEff,
  hitChance,
  illLuck,
  knowledgeBonus,
  lightlessCut,
  mightEff,
  outgoingPct,
  speedEff,
  standing,
  takenReduction,
  type FightContext,
} from './stats';
import type { Combatant, FightInput } from './types';

// GDD §5.4.2 "Why?": the summary math behind the odds. It averages the dice
// (mean variance, crit chance, hit chance) after applying start-of-fight potions,
// Alchemy potency, and tick-1 bombs so it explains the odds honestly.

const PER = 100;

const mean = (a: number, b: number): number => (a + b) / 2;

const context = (input: FightInput): FightContext => {
  const def = speciesOf(input.monster);
  const crit = illLuck(def);
  return {
    location: input.location,
    family: def.family,
    monsterId: def.id,
    attacks: def.attacks,
    hitCut: lightlessCut(def),
    oilBonus: num('oil.familyBonus') * alchemyPotency(input.alchemy ?? 0),
    ...(crit > 0 ? { critCut: crit } : {}),
  };
};

/** Expected damage of one direct attack, after resist, crit, Armor and taken%. */
const perAttack = (
  a: Combatant,
  d: Combatant,
  party: readonly Combatant[],
  ctx: FightContext,
  mightMult: number,
  knowledge: number,
  hitCut: number,
  critCut: number,
  rulesVersion: number,
): number => {
  const resist = d.resist ? d.resist[a.damage] : 1;
  if (resist === 0) return 0;
  const shroudCrit =
    rulesVersion >= 8 && a.side === 'hunter' && d.shroudedLeft > 0 ? d.shroudCritBonus : 0;
  const rawCrit =
    rulesVersion >= 8
      ? Math.max(0, a.critChance + a.critBonus + shroudCrit - (a.side === 'hunter' ? critCut : 0))
      : Math.max(0, a.critChance - (a.side === 'hunter' ? critCut : 0));
  const critChance = Math.min(1, rawCrit);
  const crit = 1 + critChance * (a.critMult - 1);
  const known = a.side === 'hunter' ? knowledge + (knowledge > 0 ? a.knownBonus : 0) : 0;
  const dealt =
    mightEff(a) *
    mightMult *
    mean(a.varianceLo, a.varianceHi) *
    resist *
    (1 + outgoingPct(a, a.damage, ctx, d.family ?? ctx.family, d)) *
    (1 + known) *
    crit;
  const hit = Math.min(
    1,
    Math.max(0, hitChance(a, party, ctx, a.side === 'hunter' ? hitCut : 0, d)),
  );
  const afterArmor = Math.max(0, dealt - armorEff(d));
  return (
    hit * Math.max(num('combat.minDamage'), afterArmor * (1 - takenReduction(d, a.damage, party)))
  );
};

/**
 * `label` replaces the monster's name in the text, for a candidate the player has not
 * identified (the name would give it away).
 */
export const explainFight = (input: FightInput, winChance: number, label?: string): Breakdown => {
  const rulesVersion = input.rulesVersion ?? RULES_VERSION;
  const potency = alchemyPotency(input.alchemy ?? 0);
  const hunters = input.party.map((h, i) =>
    buildHunter(h, i + 1, input.prep, undefined, rulesVersion),
  );
  const monster = buildMonster(
    input.monster,
    input.stand?.monsterStrength ?? 1,
    undefined,
    input.nameless ?? 0,
    rulesVersion,
  );
  const name = label ?? monster.name;
  const knowledge = knowledgeBonus(input.monster.knowledge ?? 0);
  const ctx = context(input);
  const f: Fight = {
    tick: 0,
    hunters,
    monster,
    monsters: [monster],
    rolls: input.rolls,
    ctx,
    knowledgePct: knowledge,
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
    knowledge: input.monster.knowledge ?? 0,
    log: [],
    logging: true,
    over: null,
    saltburstArmed: false,
    saltburstCancelled: false,
    monsterActing: false,
    bombs: input.prep?.bombs ?? [],
    volley: input.stand?.volley ?? 0,
    potency,
    smokeHolder: null,
    torchHolder: null,
    rulesVersion,
  };
  startOfFight(f);
  if (rulesVersion >= 8 && f.saltburstArmed && standing(monster) && monster.abilities.length > 0) {
    cancelsAbility(f, monster, monster.abilities[0]?.name ?? 'ability');
  }
  const suppressed = monster.passivesBlockable && monster.abilitiesBlocked > 0;
  const hitCut = suppressed ? 0 : ctx.hitCut;
  const critCut = suppressed ? 0 : (ctx.critCut ?? 0);
  const partyRows = hunters.map((h) => {
    const mult = h.role === 'mender' ? (h.attackShare ?? num('mender.attackMult')) : 1;
    // Speed is also the number of actions per 100 ticks (the meter threshold is 100).
    const each = perAttack(
      h,
      monster,
      hunters,
      ctx,
      mult,
      knowledge,
      hitCut,
      critCut,
      rulesVersion,
    );
    return {
      label: `${h.name} (Speed ${speedEff(h)})`,
      value: each * speedEff(h),
      formula: `${speedEff(h)} actions per ${PER} ticks × ${each.toFixed(1)} per action`,
    };
  });
  const partyDamage = partyRows.reduce((s, r) => s + r.value, 0);
  const weightOf = (h: Combatant): number =>
    h.weightOverride ??
    (h.role === 'vanguard' ? num('target.vanguardWeight') : num('target.otherWeight'));
  const totalWeight = hunters.reduce((s, h) => s + weightOf(h), 0);
  const monsterPerAction =
    totalWeight > 0
      ? speciesOf(input.monster).attacks *
        hunters.reduce(
          (s, h) =>
            s +
            (weightOf(h) / totalWeight) *
              perAttack(monster, h, hunters, ctx, 1, knowledge, hitCut, critCut, rulesVersion),
          0,
        )
      : 0;
  const monsterSpeed = speedEff(monster);
  const monsterDamage = monsterPerAction * monsterSpeed;
  const partyHealth = hunters.reduce((s, h) => s + h.maxHealth, 0);
  const bombDamage = monster.maxHealth - monster.health;
  const remainingHealth = monster.health;
  const bombRows = f.log
    .filter((e) => (e.kind === 'bomb' || e.kind === 'volley') && (e.amount ?? 0) > 0)
    .map((e) => ({ label: e.text.split(' · ')[0] ?? e.text, value: e.amount ?? 0 }));
  const ticksToBringDown =
    remainingHealth <= 0 ? 0 : partyDamage > 0 ? (remainingHealth / partyDamage) * PER : Infinity;
  const stunDelay =
    monster.lostActions > 0 && monsterSpeed > 0 ? (monster.lostActions * PER) / monsterSpeed : 0;
  const ticksUntilPartyDown =
    monsterDamage > 0 ? (partyHealth / monsterDamage) * PER + stunDelay : Infinity;
  return {
    label: 'Why these odds',
    value: winChance,
    formula: 'averages only: the odds come from simulated fights',
    children: [
      {
        label: `Party damage per ${PER} ticks`,
        value: partyDamage,
        formula: 'Σ hunters',
        children: partyRows,
      },
      { label: `${name} Health`, value: monster.maxHealth },
      ...(bombDamage > 0
        ? [
            {
              label: 'Tick-1 bomb damage',
              value: bombDamage,
              formula: 'opening bomb damage after resist',
              ...(bombRows.length > 0 ? { children: bombRows } : {}),
            },
          ]
        : []),
      {
        label: 'Ticks to bring it down',
        value: ticksToBringDown,
        formula:
          bombDamage > 0
            ? `(Health ${monster.maxHealth} − ${bombDamage} from bombs) ÷ damage per ${PER} ticks × ${PER}`
            : `Health ÷ damage per ${PER} ticks × ${PER}`,
      },
      {
        label: `${name} damage per ${PER} ticks`,
        value: monsterDamage,
        formula: `${monsterSpeed} actions × ${speciesOf(input.monster).attacks} attack(s) × expected hit on a random target`,
      },
      { label: "Party's total Health", value: partyHealth },
      {
        label: 'Ticks until the party is down',
        value: ticksUntilPartyDown,
        formula:
          stunDelay > 0
            ? `Health ÷ damage per ${PER} ticks × ${PER} + ${monster.lostActions} skipped action (${stunDelay.toFixed(1)} ticks)`
            : `Health ÷ damage per ${PER} ticks × ${PER}`,
      },
    ],
  };
};
