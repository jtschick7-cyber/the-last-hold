import type { HunterId } from './hunters';

// GDD §5.11.4, §8.5b (v0.8, D312, D314): one personal use-skill per hunter, unlocked at Wright,
// fired automatically on a fixed trigger. No new dice: an effect that replaces a roll still draws
// it. Core's fight engine reads `trigger` and `effect` (plan T8.8); the sheets show `triggerText`
// and `text`, which are the GDD's wording word for word. The numbers are tunable, here in content.
// Content outside the saved-state id lists until T8.5 (D171).

export const USE_SKILL_IDS = [
  'banked-smoke',
  'boathook',
  'bonesetters-hands',
  'rime-dipped',
  'stopping-root',
  'shovelful',
  'the-other-hand',
  'rattle-the-pots',
  'up-before-the-wolves',
  'shepherds-crook',
  'hold-the-stair',
] as const;
export type UseSkillId = (typeof USE_SKILL_IDS)[number];

/** When it fires. "Every Nth" counts the hunter's own actions in that fight (3rd, 6th, 9th…). */
export type UseSkillTrigger =
  | { readonly kind: 'everyNth'; readonly n: number; readonly insteadOfAttack: boolean }
  | { readonly kind: 'firstAction'; readonly insteadOfAttack: boolean }
  | { readonly kind: 'firstAttack' }
  | { readonly kind: 'firstHit' }
  | { readonly kind: 'fightStart' }
  /** Once per fight, when another hunter would be downed while the holder stands. */
  | { readonly kind: 'allyWouldBeDowned' };

export type UseSkillEffect =
  /** Until the holder's next action, every hunter takes this much less damage (taken%, inside the cap). */
  | { readonly kind: 'partyTakenUntilNextAction'; readonly amount: number }
  /** If the hit lands, the target's turn meter is lowered by this much. */
  | { readonly kind: 'knockBackOnHit'; readonly amount: number }
  /** If the holder heals on that action, the heal is multiplied. */
  | { readonly kind: 'healMultiplier'; readonly mult: number }
  /** If the hit lands, the target loses this share of Speed (status%) for its next `actions` actions. */
  | { readonly kind: 'slowOnHit'; readonly amount: number; readonly actions: number }
  /** The target takes Venom damage of `mightShare` × the holder's Might at the start of each of its next `actions` actions (ignores Armor; its Venom resistance applies). */
  | { readonly kind: 'venomOverTime'; readonly mightShare: number; readonly actions: number }
  | { readonly kind: 'ignoreArmor' }
  | { readonly kind: 'guaranteedCrit' }
  /** Every monster's turn meter is lowered by this much. */
  | { readonly kind: 'knockBackAll'; readonly amount: number }
  /** The holder's meter starts full. */
  | { readonly kind: 'meterStartsFull' }
  /** If the holder heals on that action, the healed hunter's ability effects are cleared. */
  | { readonly kind: 'clearAbilityEffects' }
  /** The holder takes the hit instead, after their own Armor and taken%. */
  | { readonly kind: 'takeHitForAlly' };

export interface UseSkillDef {
  readonly id: UseSkillId;
  readonly name: string;
  readonly hunter: HunterId;
  readonly trigger: UseSkillTrigger;
  /** The trigger as GDD §8.5b words it. */
  readonly triggerText: string;
  readonly effect: UseSkillEffect;
  /** The effect as GDD §8.5b words it. */
  readonly text: string;
}

export const useSkills: Readonly<Record<UseSkillId, UseSkillDef>> = {
  'banked-smoke': {
    id: 'banked-smoke',
    name: 'Banked Smoke',
    hunter: 'halvar',
    trigger: { kind: 'everyNth', n: 3, insteadOfAttack: true },
    triggerText: 'Every 3rd action, instead of attacking',
    effect: { kind: 'partyTakenUntilNextAction', amount: -0.2 },
    text: 'Until his next action, every hunter takes −20% damage (taken%, inside the 75% cap)',
  },
  boathook: {
    id: 'boathook',
    name: 'Boathook',
    hunter: 'zora',
    trigger: { kind: 'everyNth', n: 3, insteadOfAttack: false },
    triggerText: 'Every 3rd action',
    effect: { kind: 'knockBackOnHit', amount: 30 },
    text: "If the hit lands, it knocks the target's meter back 30",
  },
  'bonesetters-hands': {
    id: 'bonesetters-hands',
    name: "Bonesetter's Hands",
    hunter: 'ostap',
    trigger: { kind: 'everyNth', n: 4, insteadOfAttack: false },
    triggerText: 'Every 4th action',
    effect: { kind: 'healMultiplier', mult: 2 },
    text: 'If he heals on that action, the heal is doubled',
  },
  'rime-dipped': {
    id: 'rime-dipped',
    name: 'Rime-Dipped',
    hunter: 'bjarna',
    trigger: { kind: 'everyNth', n: 3, insteadOfAttack: false },
    triggerText: 'Every 3rd action',
    effect: { kind: 'slowOnHit', amount: 0.25, actions: 2 },
    text: 'If the hit lands, the target is −25% Speed for its next 2 actions (status%)',
  },
  'stopping-root': {
    id: 'stopping-root',
    name: 'Stopping Root',
    hunter: 'vesna',
    trigger: { kind: 'firstAttack' },
    triggerText: 'Her first attack in a fight',
    effect: { kind: 'venomOverTime', mightShare: 1, actions: 3 },
    text: 'The target takes Venom damage equal to her Might at the start of each of its next 3 actions (ignores Armor; uses its Venom resistance)',
  },
  shovelful: {
    id: 'shovelful',
    name: 'Shovelful',
    hunter: 'radek',
    trigger: { kind: 'everyNth', n: 3, insteadOfAttack: false },
    triggerText: 'Every 3rd action',
    effect: { kind: 'ignoreArmor' },
    text: 'That attack ignores Armor',
  },
  'the-other-hand': {
    id: 'the-other-hand',
    name: 'The Other Hand',
    hunter: 'sigrun',
    trigger: { kind: 'firstHit' },
    triggerText: 'Her first hit in a fight',
    effect: { kind: 'guaranteedCrit' },
    text: 'It is a crit',
  },
  'rattle-the-pots': {
    id: 'rattle-the-pots',
    name: 'Rattle the Pots',
    hunter: 'toma',
    trigger: { kind: 'firstAction', insteadOfAttack: true },
    triggerText: 'His first action, instead of attacking',
    effect: { kind: 'knockBackAll', amount: 40 },
    text: "Every monster's meter is knocked back 40",
  },
  'up-before-the-wolves': {
    id: 'up-before-the-wolves',
    name: 'Up Before the Wolves',
    hunter: 'stanko',
    trigger: { kind: 'fightStart' },
    triggerText: 'Start of each fight',
    effect: { kind: 'meterStartsFull' },
    text: 'His meter starts full, so he acts at tick 1',
  },
  'shepherds-crook': {
    id: 'shepherds-crook',
    name: "Shepherd's Crook",
    hunter: 'herdis',
    trigger: { kind: 'everyNth', n: 3, insteadOfAttack: false },
    triggerText: 'Every 3rd action',
    effect: { kind: 'clearAbilityEffects' },
    text: "If she heals on that action, she also clears the healed hunter's ability effects: slowed (Hamstring), held, charmed, Chill",
  },
  'hold-the-stair': {
    id: 'hold-the-stair',
    name: 'Hold the Stair',
    hunter: 'arvid',
    trigger: { kind: 'allyWouldBeDowned' },
    triggerText: 'Once per fight, when another hunter would be downed while Arvid stands',
    effect: { kind: 'takeHitForAlly' },
    text: 'Arvid takes that hit instead, after his own Armor and taken% (it can down him)',
  },
};

/** Each hunter's one use-skill. */
export const useSkillOf = (hunter: HunterId): UseSkillDef => {
  const found = USE_SKILL_IDS.map((id) => useSkills[id]).find((u) => u.hunter === hunter);
  if (!found) throw new Error(`No use-skill for ${hunter}`);
  return found;
};
