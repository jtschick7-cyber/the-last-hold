import type { ResourceId } from './resources';

// GDD §5.9.6 and §8.10 (D111): the v0.4 relics. They belong to the hold; every
// relic owned works (no slots until v0.7). Found at Last Stand wave milestones
// (`relics.waveMilestones`). Bonuses go in the relic bucket; none touches silver.
// Every value is tunable (D44). Wired in by T4.7 and T4.9.
export const RELIC_IDS = [
  'plough-share',
  'masons-plumb',
  'tally-stick',
  'bone-whistle',
  'copper-still',
  'iron-shutter',
] as const;
export type RelicId = (typeof RELIC_IDS)[number];

export type RelicEffect =
  /** +share of these resources' production (relic bucket; never silver). */
  | {
      readonly kind: 'production';
      readonly resources: readonly Exclude<ResourceId, 'silver'>[];
      readonly amount: number;
    }
  /** +share of contract XP. */
  | { readonly kind: 'contractXp'; readonly amount: number }
  /** Clues take this share less time. */
  | { readonly kind: 'clueTime'; readonly amount: number }
  /** Brewing takes this share less time. */
  | { readonly kind: 'brewTime'; readonly amount: number }
  /** In the Last Stand, the party takes this share less damage (`combat.takenCap` applies). */
  | { readonly kind: 'standTaken'; readonly amount: number };

export interface RelicDef {
  readonly id: RelicId;
  readonly name: string;
  readonly effect: RelicEffect;
}

export const relics: Readonly<Record<RelicId, RelicDef>> = {
  'plough-share': {
    id: 'plough-share',
    name: 'Plough-Share',
    effect: { kind: 'production', resources: ['food'], amount: 0.1 },
  },
  'masons-plumb': {
    id: 'masons-plumb',
    name: "Mason's Plumb",
    effect: { kind: 'production', resources: ['wood', 'iron'], amount: 0.1 },
  },
  'tally-stick': {
    id: 'tally-stick',
    name: 'Tally Stick',
    effect: { kind: 'contractXp', amount: 0.15 },
  },
  'bone-whistle': {
    id: 'bone-whistle',
    name: 'Bone Whistle',
    effect: { kind: 'clueTime', amount: 0.15 },
  },
  'copper-still': {
    id: 'copper-still',
    name: 'Copper Still',
    effect: { kind: 'brewTime', amount: 0.2 },
  },
  'iron-shutter': {
    id: 'iron-shutter',
    name: 'Iron Shutter',
    effect: { kind: 'standTaken', amount: 0.05 },
  },
};
