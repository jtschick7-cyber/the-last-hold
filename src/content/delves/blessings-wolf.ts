import type { BlessingDef } from './blessing-types';

// GDD §8.8 (D255, D257): The Wolf Beneath the Hill's eight blessings, exact effects as the GDD gives them.
// `effects` and `rule` are what combat reads (T7.8); `text` is what the card shows.

export const wolfBlessings: readonly BlessingDef[] = [
  {
    id: 'long-teeth',
    patron: 'wolf',
    rarity: 'faint',
    name: 'Long Teeth',
    text: '+5 points crit chance',
    star: false,
    effects: [{ kind: 'critPoints', amount: 5 }],
  },
  {
    id: 'lean-and-grey',
    patron: 'wolf',
    rarity: 'faint',
    name: 'Lean and Grey',
    text: '+8% Might',
    star: false,
    effects: [{ kind: 'mightPct', amount: 0.08 }],
  },
  {
    id: 'hungry',
    patron: 'wolf',
    rarity: 'faint',
    name: 'Hungry',
    text: '+10% damage dealt, −1 Armor',
    star: false,
    effects: [
      { kind: 'dealtPct', amount: 0.1 },
      { kind: 'armorFlat', amount: -1 },
    ],
  },
  {
    id: 'heavy-jaw',
    patron: 'wolf',
    rarity: 'faint',
    name: 'Heavy Jaw',
    text: 'Crits deal ×1.75 instead of ×1.5 (with Cold-blooded, the higher applies)',
    star: false,
    effects: [{ kind: 'critMult', value: 1.75 }],
  },
  {
    id: 'the-pack-grows',
    patron: 'wolf',
    rarity: 'warm',
    name: 'The Pack Grows',
    text: '+3% Might (status%, stacking) for every monster the party has killed this run, up to +45%',
    star: true,
    effects: [],
    rule: { rule: 'pack-grows', params: { perKill: 0.03, max: 0.45 } },
  },
  {
    id: 'blood-in-the-snow',
    patron: 'wolf',
    rarity: 'warm',
    name: 'Blood in the Snow',
    text: 'Hunters below 50% Health get +20% Might',
    star: false,
    effects: [{ kind: 'mightPctBelowHealth', amount: 0.2, below: 0.5 }],
  },
  {
    id: 'bare-throat',
    patron: 'wolf',
    rarity: 'warm',
    name: 'Bare Throat',
    text: '+15% damage dealt, −2 Armor',
    star: false,
    effects: [
      { kind: 'dealtPct', amount: 0.15 },
      { kind: 'armorFlat', amount: -2 },
    ],
  },
  {
    id: 'the-wolfs-share',
    patron: 'wolf',
    rarity: 'bright',
    name: "The Wolf's Share",
    text: "When a hunter's crit brings a monster to 0 Health and it stays down, that hunter takes one extra action at once (at most one extra action per action)",
    star: true,
    effects: [],
    rule: { rule: 'wolfs-share', params: { extraActions: 1 } },
  },
];
