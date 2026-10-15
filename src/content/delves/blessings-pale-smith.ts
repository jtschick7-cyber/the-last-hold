import type { BlessingDef } from './blessing-types';

// GDD §8.8 (D255, D257): The Pale Smith's eight blessings, exact effects as the GDD gives them.
// `effects` and `rule` are what combat reads (T7.8); `text` is what the card shows.

export const paleSmithBlessings: readonly BlessingDef[] = [
  {
    id: 'true-hammer',
    patron: 'pale-smith',
    rarity: 'faint',
    name: 'True Hammer',
    text: '+2 Might per weapon tier',
    star: false,
    effects: [{ kind: 'mightPerWeaponTier', amount: 2 }],
  },
  {
    id: 'rivet-and-ring',
    patron: 'pale-smith',
    rarity: 'faint',
    name: 'Rivet and Ring',
    text: '+1 Armor per armor tier',
    star: false,
    effects: [{ kind: 'armorPerArmorTier', amount: 1 }],
  },
  {
    id: 'good-steel',
    patron: 'pale-smith',
    rarity: 'faint',
    name: 'Good Steel',
    text: '+8% Might',
    star: false,
    effects: [{ kind: 'mightPct', amount: 0.08 }],
  },
  {
    id: 'cooled-iron',
    patron: 'pale-smith',
    rarity: 'faint',
    name: 'Cooled Iron',
    text: '−10% Fire and Frost damage taken',
    star: false,
    effects: [{ kind: 'takenPct', amount: 0.1, types: ['fire', 'frost'] }],
  },
  {
    id: 'the-smiths-mark',
    patron: 'pale-smith',
    rarity: 'warm',
    name: "The Smith's Mark",
    text: "Every direct hit adds a Rune sub-hit: 0.15 × Might_eff × variance × crit × resist[Rune], no Armor, its own log line. Stacks with the Wright's Blade's sub-hits",
    star: true,
    effects: [],
    rule: { rule: 'smiths-mark', params: { subHit: 0.15 } },
  },
  {
    id: 'proud-plate',
    patron: 'pale-smith',
    rarity: 'warm',
    name: 'Proud Plate',
    text: '+3 Armor and −5% damage taken',
    star: false,
    effects: [
      { kind: 'armorFlat', amount: 3 },
      { kind: 'takenPct', amount: 0.05 },
    ],
  },
  {
    id: 'well-hafted',
    patron: 'pale-smith',
    rarity: 'warm',
    name: 'Well-Hafted',
    text: '+10% damage dealt by hunters with a weapon of tier 2 or more',
    star: false,
    effects: [{ kind: 'dealtPct', amount: 0.1, minWeaponTier: 2 }],
  },
  {
    id: 'forge-welded',
    patron: 'pale-smith',
    rarity: 'bright',
    name: 'Forge-Welded',
    text: "A hunter's Armor_eff also reduces damage from monster abilities and burns (Noon Heat, Seal-burn, Drain …), to a minimum of 1",
    star: true,
    effects: [],
    rule: { rule: 'forge-welded', params: { minimum: 1 } },
  },
];
