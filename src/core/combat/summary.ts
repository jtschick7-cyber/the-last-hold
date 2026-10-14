import { monsters } from '../../content/monsters';
import { num } from '../balance-access';
import type { Breakdown } from '../breakdown/breakdown';
import { buildHunter, buildMonster } from './build';
import {
  armorEff,
  knowledgeBonus,
  lightlessCut,
  mightEff,
  monsterFamily,
  outgoingPct,
  speedEff,
  takenReduction,
} from './stats';
import type { Combatant, FightInput } from './types';
import { alchemyPotency, type FightContext } from './stats';

// GDD §5.4.2 "Why?": the summary math behind the odds. It averages the dice
// (mean variance, crit chance, hit chance) and ignores abilities and healing, so
// it explains the odds; the odds themselves come from the simulated fights.

const PER = 100;

const mean = (a: number, b: number): number => (a + b) / 2;

const context = (input: FightInput): FightContext => ({
  location: input.location,
  family: monsterFamily(input.monster.monster),
  monsterId: input.monster.monster,
  attacks: monsters[input.monster.monster].attacks,
  hitCut: lightlessCut(input.monster.monster),
  oilBonus: num('oil.familyBonus') * alchemyPotency(input.alchemy ?? 0),
});

/** Expected damage of one direct attack, after resist, crit, Armor and taken%. */
const perAttack = (
  a: Combatant,
  d: Combatant,
  party: readonly Combatant[],
  ctx: FightContext,
  mightMult: number,
  knowledge: number,
): number => {
  const resist = d.resist ? d.resist[a.damage] : 1;
  const crit = 1 + a.critChance * (a.critMult - 1);
  const dealt =
    mightEff(a) *
    mightMult *
    mean(a.varianceLo, a.varianceHi) *
    resist *
    (1 + outgoingPct(a, a.damage, ctx)) *
    (1 + (a.side === 'hunter' ? knowledge : 0)) *
    crit;
  if (resist === 0) return 0;
  const hit = num('combat.hitChance');
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
  const hunters = input.party.map((h, i) => buildHunter(h, i + 1, input.prep));
  const monster = buildMonster(input.monster);
  const name = label ?? monster.name;
  const knowledge = knowledgeBonus(input.monster.knowledge ?? 0);
  const ctx = context(input);
  const partyRows = hunters.map((h) => {
    const mult = h.role === 'mender' ? num('mender.attackMult') : 1;
    // Speed is also the number of actions per 100 ticks (the meter threshold is 100).
    const each = perAttack(h, monster, hunters, ctx, mult, knowledge);
    return {
      label: `${h.name} (Speed ${speedEff(h)})`,
      value: each * speedEff(h),
      formula: `${speedEff(h)} actions per ${PER} ticks × ${each.toFixed(1)} per action`,
    };
  });
  const partyDamage = partyRows.reduce((s, r) => s + r.value, 0);
  const totalWeight = hunters.reduce(
    (s, h) =>
      s + (h.role === 'vanguard' ? num('target.vanguardWeight') : num('target.otherWeight')),
    0,
  );
  const monsterPerAction =
    monsters[input.monster.monster].attacks *
    hunters.reduce((s, h) => {
      const w = h.role === 'vanguard' ? num('target.vanguardWeight') : num('target.otherWeight');
      return s + (w / totalWeight) * perAttack(monster, h, hunters, ctx, 1, knowledge);
    }, 0);
  const monsterDamage = monsterPerAction * speedEff(monster);
  const partyHealth = hunters.reduce((s, h) => s + h.maxHealth, 0);
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
      {
        label: 'Ticks to bring it down',
        value: partyDamage > 0 ? (monster.maxHealth / partyDamage) * PER : Infinity,
        formula: `Health ÷ damage per ${PER} ticks × ${PER}`,
      },
      {
        label: `${name} damage per ${PER} ticks`,
        value: monsterDamage,
        formula: `${speedEff(monster)} actions × ${monsters[input.monster.monster].attacks} attack(s) × expected hit on a random target`,
      },
      { label: "Party's total Health", value: partyHealth },
      {
        label: 'Ticks until the party is down',
        value: monsterDamage > 0 ? (partyHealth / monsterDamage) * PER : Infinity,
        formula: `Health ÷ damage per ${PER} ticks × ${PER}`,
      },
    ],
  };
};
