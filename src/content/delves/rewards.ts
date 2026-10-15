import { DELVE_RELIC_IDS } from './relics';

// GDD §4.3, §6.2 (D20, D271): the content test of the Delve-optional promise. Every reward a
// Delve gives is listed here with its idle source, or marked sidegrade, convenience or
// Delve-only (works only in Delves, or looks only). A reward with neither fails the test.

export type RewardMark = 'sidegrade' | 'convenience' | 'delve-only';

export interface DelveRewardDef {
  readonly id: string;
  /** Where else the idle path gets it. */
  readonly idleSource?: string;
  /** Or why it can't speed the idle path up. */
  readonly mark?: RewardMark;
}

export const delveRewards: readonly DelveRewardDef[] = [
  {
    id: 'reagents',
    idleSource: 'Contracts: the same reagents drop from the same monster families',
  },
  { id: 'riftglass', mark: 'delve-only' },
  {
    id: 'riftglass:late-hours',
    mark: 'convenience',
    idleSource: 'The Late Lantern warden upgrade (Embers) also raises the offline cap',
  },
  { id: 'riftglass:alternate-traits', mark: 'sidegrade' },
  { id: 'riftglass:cosmetics', mark: 'delve-only' },
  { id: 'riftglass:chosen-start', mark: 'delve-only' },
  { id: 'riftglass:reroll', mark: 'delve-only' },
  { id: 'blessings', mark: 'delve-only' },
  { id: 'ember-echoes', mark: 'delve-only' },
  { id: 'deep-bestiary', mark: 'delve-only' },
  ...DELVE_RELIC_IDS.map((id): DelveRewardDef => ({
    id: `relic:${id}`,
    idleSource:
      'Its idle source (GDD §8.10a): a bestiary family Studied, or the recipe book complete',
  })),
] as const;
